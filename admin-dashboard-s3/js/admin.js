// Shared admin utilities: status mapping, category colours, DB-to-UI translator.

const CATEGORY_COLORS = {
    "สถานที่": "#ff9800",
    "บุคลากร": "#e056f1",
    "รถโดยสาร": "#56c108",
    "ระบบ IT": "#a4b800",
    "อุปกรณ์อิเล็กทรอนิกส์": "#c438e8",
    "ร้านค้า": "#18c4c7",
    "อื่นๆ": "#ff0b67",
    "แจ้งเหตุ": "#ff0b67"
};

const CATEGORY_CLASS_MAP = {
    "สถานที่": "tag-category1",
    "บุคลากร": "tag-category2",
    "รถโดยสาร": "tag-category3",
    "ระบบ IT": "tag-category4",
    "อุปกรณ์อิเล็กทรอนิกส์": "tag-category5",
    "ร้านค้า": "tag-category6",
    "อื่นๆ": "tag-category7"
};

function formatTimestamp(ts) {
    try {
        const past = new Date(ts);
        const diffSec = Math.floor((Date.now() - past.getTime()) / 1000);
        if (isNaN(diffSec)) return "-";
        if (diffSec < 60) return "เมื่อสักครู่";
        const diffMin = Math.floor(diffSec / 60);
        if (diffMin < 60) return `${diffMin} นาที`;
        const diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24) return `${diffHr} ชม.`;
        const diffDay = Math.floor(diffHr / 24);
        if (diffDay < 30) return `${diffDay} วัน`;
        const diffMon = Math.floor(diffDay / 30);
        if (diffMon < 12) return `${diffMon} เดือน`;
        return `${Math.floor(diffDay / 365)} ปี`;
    } catch { return ts; }
}

function getStatusClass(status) {
    const s = (status || "").toLowerCase();
    if (s === "ใหม่" || s === "pending" || s === "รอดำเนินการ") return "status-new";
    if (s === "กำลังดำเนิน" || s === "in_progress" || s === "กำลังดำเนินการ") return "status-progress";
    return "status-done";
}

function getStatusLabel(status) {
    const s = (status || "").toLowerCase();
    if (s === "กำลังดำเนิน" || s === "in_progress" || s === "กำลังดำเนินการ") return "กำลัง...";
    if (s === "ใหม่" || s === "pending" || s === "รอดำเนินการ") return "ใหม่";
    if (s === "เสร็จสิ้น" || s === "resolved" || s === "completed" || s === "success") return "เสร็จสิ้น";
    return status;
}

function caseId(item) {
    return item.complaint_id || item.incident_id || "-";
}

function mapDbToUI(item) {
    const id = caseId(item);
    const isComp = window.AppAPI ? window.AppAPI.isComplaint(item) : (item.type === "complaint");
    return {
        id,
        type: isComp ? "complaint" : "incident",
        title: item.subject || "ไม่มีหัวข้อ",
        fullTitle: item.subject || "ไม่มีหัวข้อ",
        category: item.category || "อื่นๆ",
        status: item.status || "pending",
        time: item.timestamp ? formatTimestamp(item.timestamp) : "-",
        location: item.location || "-",
        description: item.details || "-",
        reporterName: item.fullname || `${item.firstname || ""} ${item.lastname || ""}`.trim() || "-",
        reporterEmail: item.email || "-",
        reporterId: item.id_card || "-",
        reporterPhone: item.phone || "-",
        incidentDate: item.event_time ? item.event_time.split("T")[0] : "-",
        incidentTime: item.event_time && item.event_time.includes("T") ? item.event_time.split("T")[1] : "-",
        image: item.image_url_presigned || item.image_url || "",
        department: item.department || "",
        note: item.note || "",
        timestamp: item.timestamp || "",
        eventTimestamp: item.event_time || item.timestamp || "",
        raw: item
    };
}

function _sidebarBadges(kind) {
    const idEl = document.getElementById(
        kind === "incident" ? "sidebarIncidentCount" : "sidebarComplaintCount"
    );
    const linkSel = kind === "incident"
        ? 'a[href$="incidentAdmin.html"] .count-badge'
        : 'a[href$="complaintsAdmin.html"] .count-badge';
    const set = new Set(document.querySelectorAll(linkSel));
    if (idEl) set.add(idEl);
    return [...set];
}

function _writeSidebarBadge(kind, value) {
    _sidebarBadges(kind).forEach(el => { el.textContent = String(value); });
}

// Sidebar badges only surface "new" incoming work — cases still in the
// pending bucket. In-progress and resolved cases are excluded so the badge
// reflects the actionable backlog, not historical volume.
function _isPendingCase(item) {
    const s = (item && item.status ? item.status : "").toString().trim().toLowerCase();
    return s === "" || s === "pending" || s === "ใหม่" || s === "รอดำเนินการ";
}

async function refreshSidebarCounts() {
    // Always blank the static placeholders first so the stale "14" / "16" from
    // the HTML never survives a failed or slow API call. Counter variables are
    // declared fresh on every invocation — no module-level accumulators.
    _writeSidebarBadge("incident", 0);
    _writeSidebarBadge("complaint", 0);

    if (!window.AppAPI) return;

    try {
        const items = (await window.AppAPI.loadCases()) || [];
        let incidentCount = 0;
        let complaintCount = 0;
        for (const it of items) {
            if (!_isPendingCase(it)) continue;
            if (window.AppAPI.isIncident(it)) incidentCount += 1;
            else if (window.AppAPI.isComplaint(it)) complaintCount += 1;
        }
        _writeSidebarBadge("incident", incidentCount);
        _writeSidebarBadge("complaint", complaintCount);
    } catch (err) {
        console.error("Sidebar count refresh failed:", err);
        _writeSidebarBadge("incident", 0);
        _writeSidebarBadge("complaint", 0);
    }
}

// --- Cross-origin image helpers --------------------------------------------
// CORB / opaque-response issues with the public S3 bucket are sidestepped by
// (a) preferring the presigned URL the API now returns, and (b) attaching
// crossorigin/referrerpolicy hints so the browser issues a CORS GET that the
// bucket's CORS rule can answer.
function pickCaseImageUrl(item) {
    if (!item) return "";
    return item.image_url_presigned || item.image_url || item.image || "";
}

function applyImageCorsAttrs(img) {
    if (!img) return;
    img.setAttribute("crossorigin", "anonymous");
    img.setAttribute("referrerpolicy", "no-referrer");
}

function setCaseImage(img, url) {
    if (!img) return;
    applyImageCorsAttrs(img);
    img.src = url || "";
}

function findSimilarCases(currentItem, allItems) {
    const catOk  = currentItem.category && currentItem.category !== '-' && currentItem.category !== 'อื่นๆ';
    const locOk  = currentItem.location && currentItem.location !== '-';
    const dateCur = currentItem.incidentDate && currentItem.incidentDate !== '-' ? currentItem.incidentDate : null;

    return allItems
        .filter(item => {
            if (item.id === currentItem.id) return false;
            const sameCat  = catOk && item.category === currentItem.category;
            const sameLoc  = locOk && item.location && item.location !== '-' && item.location === currentItem.location;
            const dateItem = item.incidentDate && item.incidentDate !== '-' ? item.incidentDate : null;
            const sameDate = !dateCur || !dateItem || dateCur === dateItem;
            return sameCat && sameLoc && sameDate;
        })
        .sort((a, b) => {
            const tA = new Date(a.eventTimestamp || a.timestamp || 0).getTime();
            const tB = new Date(b.eventTimestamp || b.timestamp || 0).getTime();
            return tB - tA;
        })
        .slice(0, 5);
}

<<<<<<< HEAD
=======
// --- Topbar profile (avatar + name) ----------------------------------------
function _decodeJwtPayload(token) {
    try {
        const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(b64));
    } catch { return null; }
}

function _makeInitialsSvg(name) {
    const parts = name.trim().split(/\s+/);
    const initials = (parts.length >= 2
        ? parts[0][0] + parts[1][0]
        : (parts[0] || 'A')[0]
    ).toUpperCase();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48">`
        + `<circle cx="24" cy="24" r="24" fill="#5a7fc2"/>`
        + `<text x="24" y="30" text-anchor="middle" font-family="sans-serif" `
        + `font-size="17" font-weight="bold" fill="#fff">${initials}</text></svg>`;
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

function initTopbarProfile() {
    const avatarEl = document.querySelector('.admin-avatar');
    const nameEl   = document.querySelector('.admin-name');
    if (!avatarEl && !nameEl) return;

    const token = sessionStorage.getItem('id_token') || sessionStorage.getItem('idToken');
    if (!token) {
        if (avatarEl) avatarEl.style.display = 'none';
        if (nameEl)   nameEl.style.display   = 'none';
        return;
    }

    const payload = _decodeJwtPayload(token);
    if (!payload) {
        if (avatarEl) avatarEl.style.display = 'none';
        if (nameEl)   nameEl.style.display   = 'none';
        return;
    }

    const rawName = (
        payload.name
        || (payload.given_name ? `${payload.given_name} ${payload.family_name || ''}`.trim() : '')
        || payload.email
        || sessionStorage.getItem('cognitoUsername')
        || 'Admin'
    );
    const displayName = rawName.includes('@') ? rawName.split('@')[0] : rawName;

    if (nameEl) {
        nameEl.textContent  = displayName;
        nameEl.style.display = '';
    }

    if (avatarEl) {
        avatarEl.src = payload.picture || _makeInitialsSvg(displayName);
        avatarEl.style.display = '';
    }
}

document.addEventListener('DOMContentLoaded', initTopbarProfile);
>>>>>>> dev
document.addEventListener('DOMContentLoaded', refreshSidebarCounts);
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('img.popup-image, img[data-case-image]').forEach(applyImageCorsAttrs);
});

// --- Profile avatar / logo → custom LoginPage.html -------------------------
// Clicking the avatar in the topbar should always land on our self-hosted
// login form, never the Cognito Hosted UI. We clear any stored tokens first
// so the user reaches the form unauthenticated, then navigate using a path
// that works from both the dashboard root and the views/ subdirectory.
function _loginPageHref() {
    // dashboardAdmin.html lives at the dashboard root; everything else under
    // views/. Detect via the current pathname rather than hard-coding either.
    const path = (window.location.pathname || '').toLowerCase();
<<<<<<< HEAD
    return path.indexOf('/views/') >= 0 ? 'LoginPage.html' : 'views/LoginPage.html';
=======
    return path.indexOf('/views/') >= 0 ? '../LoginPage.html' : 'LoginPage.html';
>>>>>>> dev
}

function _clearAuthTokens() {
    ['id_token', 'idToken', 'accessToken', 'tokenExpiresAt', 'cognitoUsername']
        .forEach(k => { sessionStorage.removeItem(k); });
}

function goToLoginPage(event) {
    if (event) event.preventDefault();
    _clearAuthTokens();
    window.location.href = _loginPageHref();
}

document.addEventListener('DOMContentLoaded', () => {
    const target = _loginPageHref();
    document.querySelectorAll('a.topbar-left').forEach(a => {
        a.setAttribute('href', target);
        a.addEventListener('click', goToLoginPage);
    });
});
