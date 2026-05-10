// Admin dashboard – stats, pie chart, latest cases feed (live data only).
let DASHBOARD_CASES = [];
let feedCases     = [];
let feedSortOrder = 'latest';

let _similarCases = [];
let _similarCarouselIdx = 0;
let _simDetailExpanded = true;
let _simSlideDir = 0; // -1 = prev (slide from left), 1 = next (slide from right)

const THAI_MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
                     'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];

document.addEventListener('DOMContentLoaded', () => {
    createCaseDetailPopup();
    createSimilarCasesModal();
    fetchDashboardData();

    document.getElementById('feedSortBtn').addEventListener('click', () => {
        feedSortOrder = feedSortOrder === 'latest' ? 'oldest' : 'latest';
        const btn = document.getElementById('feedSortBtn');
        btn.innerHTML = feedSortOrder === 'latest'
            ? '⇅ <span>ล่าสุด</span>'
            : '⇅ <span>เก่าสุด</span>';
        sortAndRenderFeed();
    });
});

function computeDashboardData(rawItems) {
    const isPending = i => ['', 'pending', 'รอดำเนินการ', 'ใหม่'].includes((i.status || '').toLowerCase());
    const complaints = rawItems.filter(i => window.AppAPI.isComplaint(i));
    const incidents = rawItems.filter(i => window.AppAPI.isIncident(i));
    // Sidebar badges should reflect *pending* work only — the same definition
    // used by refreshSidebarCounts in admin.js.
    const pendingComplaints = complaints.filter(isPending).length;
    const pendingIncidents = incidents.filter(isPending).length;
    const pending = rawItems.filter(isPending).length;
    const inProgress = rawItems.filter(i =>
        ['in_progress', 'กำลังดำเนินการ', 'กำลังดำเนิน'].includes((i.status || '').toLowerCase())
    ).length;
    const resolved = rawItems.filter(i =>
        ['resolved', 'completed', 'success', 'เสร็จสิ้น'].includes((i.status || '').toLowerCase())
    ).length;

    const categoryCounts = {};
    rawItems.forEach(item => {
        const cat = item.category || 'อื่นๆ';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    const categories = Object.entries(categoryCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    const latestCases = [...rawItems]
        .filter(i => i.timestamp)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);

    return {
        stats: {
            incident_count: incidents.length,
            complaint_count: complaints.length,
            sidebar_incident_count: pendingIncidents,
            sidebar_complaint_count: pendingComplaints,
            pending_cases: pending,
            in_progress_cases: inProgress,
            resolved_cases: resolved
        },
        categories,
        latest_cases: latestCases
    };
}

async function fetchDashboardData() {
    try {
        const rawItems = await window.AppAPI.loadCases();
        DASHBOARD_CASES = rawItems;
        const data = computeDashboardData(rawItems);

        updateStatsUI(data.stats);
        renderSummaryCards(data.stats);

        const categoriesWithColor = data.categories.map(cat => ({
            name: cat.name,
            count: cat.count,
            color: CATEGORY_COLORS[cat.name] || "#999999"
        }));
        renderCategoryList(categoriesWithColor);
        drawPieChart(categoriesWithColor);
        feedCases = rawItems.filter(i => i.timestamp);
        sortAndRenderFeed();
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        const feed = document.getElementById('feedList');
        if (feed) feed.innerHTML = `<p style="text-align:center;padding:20px;color:#c00;">โหลดข้อมูลไม่สำเร็จ: ${error.message}</p>`;
    }
}

function updateStatsUI(stats) {
    // Sidebar badges count *pending only* — must match admin.js logic.
    const incidentBadges = document.querySelectorAll('a[href$="incidentAdmin.html"] .count-badge, #sidebarIncidentCount');
    const complaintBadges = document.querySelectorAll('a[href$="complaintsAdmin.html"] .count-badge, #sidebarComplaintCount');
    incidentBadges.forEach(el => { el.textContent = stats.sidebar_incident_count || 0; });
    complaintBadges.forEach(el => { el.textContent = stats.sidebar_complaint_count || 0; });
}

function renderSummaryCards(stats) {
    const container = document.getElementById('summaryCards');
    if (!container) return;
    const totalCases = (stats.incident_count || 0) + (stats.complaint_count || 0);
    const cards = [
        { label: "ทั้งหมด", count: totalCases, icon: "", bg: "#3f79d0" },
        { label: "รอดำเนินการ", count: stats.pending_cases || 0, icon: "✳", bg: "#e53d39" },
        { label: "กำลังดำเนินการ", count: stats.in_progress_cases || 0, icon: "🔧", bg: "#efc84b" },
        { label: "เสร็จสิ้น", count: stats.resolved_cases || 0, icon: "✓", bg: "#4d7f4f" },
    ];
    container.innerHTML = cards.map(card => `
        <div class="summary-card" style="background-color: ${card.bg};">
          <div class="summary-left">
            <div class="summary-label">${card.label}</div>
            <div class="summary-value">${card.count}</div>
          </div>
          <div class="summary-icon">${card.icon}</div>
        </div>`).join('');
}

function renderCategoryList(categories) {
    const listEl = document.getElementById('categoryList');
    if (!listEl) return;
    const total = categories.reduce((sum, c) => sum + c.count, 0);
    listEl.innerHTML = categories.map(cat => {
        const pct = total > 0 ? Math.round((cat.count / total) * 100) : 0;
        return `
        <div class="category-item">
            <span class="category-name">${cat.name}</span>
            <div class="progress-track">
                <div class="progress-fill" style="width:${pct}%;background-color:${cat.color};"></div>
            </div>
            <span class="category-percent">${pct}%</span>
        </div>`;
    }).join('');
}

function drawPieChart(categories) {
    const svg = document.getElementById('pieSvg');
    if (!svg) return;
    const CX = 170, CY = 170, R = 130;
    svg.setAttribute('viewBox', '0 0 340 340');
    const total = categories.reduce((sum, c) => sum + c.count, 0);
    if (total === 0) { svg.innerHTML = ''; return; }
    let cumulative = 0;
    svg.innerHTML = '';
    categories.forEach(cat => {
        const safePercent = Math.min(cat.count / total, 0.9999);
        const [sx, sy] = pieCoords(cumulative, CX, CY, R);
        cumulative += safePercent;
        const [ex, ey] = pieCoords(cumulative, CX, CY, R);
        const largeArc = safePercent > 0.5 ? 1 : 0;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${CX} ${CY} L ${sx} ${sy} A ${R} ${R} 0 ${largeArc} 1 ${ex} ${ey} Z`);
        path.setAttribute('fill', cat.color);
        path.setAttribute('class', 'pie-slice');
        svg.appendChild(path);
    });
}

function pieCoords(percent, cx, cy, r) {
    const a = 2 * Math.PI * percent - Math.PI / 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function eventDate(item) {
    const raw = item.event_time || '';
    const d = raw.split('T')[0];
    return d.length >= 8 ? d : null;
}

function isSimilarRaw(source, other) {
    if (source === other) return false;
    const srcId = caseId(source);
    const othId = caseId(other);
    if (srcId === othId) return false;

    const cat = source.category || 'อื่นๆ';
    const loc = source.location || '-';
    const catOk = cat !== 'อื่นๆ' && cat !== '';
    const locOk = loc !== '-' && loc !== '';

    const otherCat = other.category || 'อื่นๆ';
    const otherLoc = other.location || '-';
    const sameCat  = catOk && otherCat === cat;
    const sameLoc  = locOk && otherLoc !== '-' && otherLoc === loc;

    const dA = eventDate(source);
    const dB = eventDate(other);
    const sameDate = !dA || !dB || dA === dB;

    return sameCat && sameLoc && sameDate;
}

function countSimilarRaw(rawItem, allRaw) {
    return allRaw.filter(other => other !== rawItem && isSimilarRaw(rawItem, other)).length;
}

function renderLatestCases(cases) {
    const feedList = document.getElementById('feedList');
    if (!feedList) return;
    if (!cases.length) {
        feedList.innerHTML = '<p style="text-align:center;padding:20px;">ไม่มีรายการใหม่</p>';
        return;
    }
    feedList.innerHTML = cases.map(item => {
        const id = caseId(item);
        const subject = item.subject || 'แจ้งเหตุ / ร้องเรียน';
        const cat = item.category || '';
        const rawStatus = (item.status || '').toLowerCase();
        const ts = item.timestamp ? formatTimestamp(item.timestamp) : '';

        let displayStatus, sideColor;
        if (rawStatus === "pending" || rawStatus === "รอดำเนินการ") { displayStatus = "รอดำเนินการ"; sideColor = "side-red"; }
        else if (rawStatus === "in_progress" || rawStatus === "กำลังดำเนินการ") { displayStatus = "กำลังดำเนินการ"; sideColor = "side-yellow"; }
        else if (rawStatus === "resolved" || rawStatus === "success" || rawStatus === "เสร็จสิ้น") { displayStatus = "เสร็จสิ้น"; sideColor = "side-green"; }
        else { displayStatus = rawStatus; sideColor = "side-gray"; }

        const tagCssClass = CATEGORY_CLASS_MAP[cat] || "tag-category7";
        const tagsHtml = `<span class="feed-tag ${tagCssClass}">${cat}</span>`;

        const similarCount = countSimilarRaw(item, DASHBOARD_CASES);
        const alertHtml = similarCount > 0
            ? `<span class="alert-chip" onclick="event.stopPropagation();openSimilarCasesModal('${id}')"><span class="alert-icon">⚠</span>พบเคสซ้ำ<span class="alert-badge">${similarCount}</span></span>`
            : '';

        return `
        <div class="feed-row" style="cursor: pointer;" onclick="viewDetail('${id}')">
          <div class="feed-side ${sideColor}"></div>
          <div class="feed-main">
            <div class="feed-title">${subject}</div>
            <div class="feed-code">${id}</div>
            <div class="feed-tags">${tagsHtml}</div>
          </div>
          <div class="feed-alert">${alertHtml}</div>
          <div class="feed-time">${ts}</div>
        </div>`;
    }).join('');
}

function sortAndRenderFeed() {
    const sorted = [...feedCases]
        .sort((a, b) => {
            const diff = new Date(b.timestamp) - new Date(a.timestamp);
            return feedSortOrder === 'latest' ? diff : -diff;
        })
        .slice(0, 10);
    renderLatestCases(sorted);
}

function createCaseDetailPopup() {
    const overlay = document.createElement('div');
    overlay.className = 'case-detail-overlay';
    overlay.id = 'caseDetailOverlay';

    const popup = document.createElement('aside');
    popup.className = 'case-detail-popup';
    popup.id = 'caseDetailPopup';
    popup.setAttribute('aria-hidden', 'true');
    popup.innerHTML = `
        <div class="case-detail-header">
          <div class="case-detail-id" id="caseDetailId">-</div>
          <button class="case-detail-close" id="caseDetailCloseBtn" type="button">×</button>
        </div>
        <div class="case-detail-body">
          <div class="popup-top-row">
            <div class="popup-section-label">รายละเอียดเคส</div>
            <div class="popup-location">
              <span>📍</span>
              <span id="caseDetailLocation">-</span>
            </div>
          </div>
          <div class="popup-divider"></div>
          <div class="popup-section">
            <div class="popup-section-label">หัวข้อ</div>
            <div class="popup-section-text popup-strong" id="caseDetailTitle">-</div>
          </div>
          <div class="popup-section">
            <div class="popup-section-label">รายละเอียด</div>
            <div class="popup-section-text" id="caseDetailDesc">-</div>
          </div>
          <div class="popup-section">
            <div class="popup-section-label">ผู้แจ้ง</div>
            <div class="popup-section-text">
              <div><span class="popup-strong">ชื่อ-สกุล :</span> <span id="caseDetailName">-</span></div>
              <div><span class="popup-strong">Email :</span> <span id="caseDetailEmail">-</span></div>
              <div><span class="popup-strong">หมายเลขบัตรประชาชน :</span> <span id="caseDetailIdCard">-</span></div>
              <div><span class="popup-strong">เบอร์มือถือ :</span> <span id="caseDetailPhone">-</span></div>
            </div>
          </div>
          <div class="popup-section">
            <div class="popup-section-label">ข้อมูลแจ้งเหตุ</div>
            <div class="popup-section-text">
              <div><span class="popup-strong">วันที่เกิดเหตุ :</span> <span id="caseDetailDate">-</span></div>
              <div><span class="popup-strong">เวลาที่เกิดเหตุ :</span> <span id="caseDetailTime">-</span></div>
            </div>
          </div>
          <div class="popup-image-box">
            <img id="caseDetailImage" class="popup-image" src="" alt="case image" crossorigin="anonymous" referrerpolicy="no-referrer" />
            <div class="popup-image-placeholder" id="caseDetailImgPlaceholder">🖼️</div>
          </div>
        </div>`;

    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    document.getElementById('caseDetailCloseBtn').addEventListener('click', closeCaseDetail);
    overlay.addEventListener('click', closeCaseDetail);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCaseDetail(); });
}

function viewDetail(id) {
    const item = DASHBOARD_CASES.find(i => caseId(i) === id);
    if (!item) return;
    document.getElementById('caseDetailId').textContent = caseId(item);
    document.getElementById('caseDetailLocation').textContent = item.location || '-';
    document.getElementById('caseDetailTitle').textContent = item.subject || '-';
    document.getElementById('caseDetailDesc').textContent = item.details || '-';
    document.getElementById('caseDetailName').textContent = item.fullname || `${item.firstname || ''} ${item.lastname || ''}`.trim() || '-';
    document.getElementById('caseDetailEmail').textContent = item.email || '-';
    document.getElementById('caseDetailIdCard').textContent = item.id_card || '-';
    document.getElementById('caseDetailPhone').textContent = item.phone || '-';
    document.getElementById('caseDetailDate').textContent = item.event_time ? item.event_time.split('T')[0] : '-';
    document.getElementById('caseDetailTime').textContent = item.event_time && item.event_time.includes('T') ? item.event_time.split('T')[1] : '-';

    const img = document.getElementById('caseDetailImage');
    const ph = document.getElementById('caseDetailImgPlaceholder');
    const url = item.image_url_presigned || item.image_url || '';
    if (url) {
        setCaseImage(img, url);
        img.style.display = 'block';
        ph.style.display = 'none';
    } else {
        setCaseImage(img, '');
        img.style.display = 'none';
        ph.style.display = 'flex';
    }

    document.getElementById('caseDetailPopup').classList.add('show');
    document.getElementById('caseDetailOverlay').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeCaseDetail() {
    document.getElementById('caseDetailPopup').classList.remove('show');
    document.getElementById('caseDetailOverlay').classList.remove('show');
    document.body.style.overflow = '';
}

// ─── Similar Cases Modal ───────────────────────────────────────────────────

function createSimilarCasesModal() {
    const overlay = document.createElement('div');
    overlay.id = 'similarCasesModal';
    overlay.className = 'sim-modal-overlay';
    overlay.innerHTML = `
        <div class="sim-modal" id="simModalBox">
            <div class="sim-modal-header">
                <div class="sim-modal-title">รวมเคสใกล้เคียง</div>
                <button class="sim-close-btn" onclick="closeSimilarCasesModal()">&#215;</button>
            </div>
            <div class="sim-summary-bar" id="simSummaryBar"></div>
            <div class="sim-content-area">
                <button class="sim-nav-btn" id="simPrevBtn" onclick="navigateSimilarCarousel(-1)"><span class="material-symbols-outlined">chevron_left</span></button>
                <div class="sim-center-col">
                    <div class="sim-source-row" id="simSourceRow"></div>
                    <div class="sim-carousel-wrap" id="simCarouselWrap">
                        <div class="sim-carousel-track" id="simCarouselTrack"></div>
                    </div>
                </div>
                <button class="sim-nav-btn" id="simNextBtn" onclick="navigateSimilarCarousel(1)"><span class="material-symbols-outlined">chevron_right</span></button>
            </div>
            <div class="sim-dots-row" id="simDotsRow"></div>
<<<<<<< HEAD
            <button class="sim-collapse-btn" id="simCollapseBtn" onclick="toggleSimilarDetail()">&#8744;</button>
=======
            <button class="sim-collapse-btn" id="simCollapseBtn" onclick="toggleSimilarDetail()"><span class="material-symbols-outlined">expand_more</span></button>
>>>>>>> dev
        </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeSimilarCasesModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSimilarCasesModal(); });
}

function openSimilarCasesModal(sourceId) {
    const source = DASHBOARD_CASES.find(i => caseId(i) === sourceId);
    if (!source) return;

    const matched = DASHBOARD_CASES
        .filter(other => other !== source && isSimilarRaw(source, other))
        .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

    if (!matched.length) return;

    _similarCases = [source, ...matched];

    _similarCarouselIdx = 0;
    _simSlideDir = 0;

    const cat = source.category || 'อื่นๆ';
    const loc = source.location || '-';
    const monthYear = (() => {
        const d = new Date((source.timestamp || '').split('.')[0]);
        if (isNaN(d.getTime())) return '-';
        return `เดือน ${THAI_MONTHS[d.getMonth()]} ปี ${d.getFullYear() + 543}`;
    })();

    document.getElementById('simSummaryBar').innerHTML = `
        <div class="sim-count-circle">${_similarCases.length}</div>
        <span class="sim-bar-label">จำนวนที่พบเคสอาจซ้ำซ้อน</span>
        <span class="sim-bar-cat">หมวดหมู่ ${cat}</span>
        <span class="sim-bar-loc">📍 ${loc}</span>
        <span class="sim-bar-month">${monthYear}</span>`;

    _simDetailExpanded = true;
    document.getElementById('simCarouselWrap').classList.add('expanded');
<<<<<<< HEAD
    document.getElementById('simCollapseBtn').innerHTML = '&#8744;';
=======
    document.getElementById('simCollapseBtn').innerHTML = '<span class="material-symbols-outlined">expand_more</span>';
>>>>>>> dev
    renderSimilarCarousel();
    document.getElementById('similarCasesModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function toggleSimilarDetail() {
    _simDetailExpanded = !_simDetailExpanded;
    const wrap = document.getElementById('simCarouselWrap');
    const btn  = document.getElementById('simCollapseBtn');
    if (_simDetailExpanded) {
        wrap.classList.add('expanded');
<<<<<<< HEAD
        btn.innerHTML = '&#8744;';
    } else {
        wrap.classList.remove('expanded');
        btn.innerHTML = '&#8743;';
=======
        btn.innerHTML = '<span class="material-symbols-outlined">expand_more</span>';
    } else {
        wrap.classList.remove('expanded');
        btn.innerHTML = '<span class="material-symbols-outlined">expand_less</span>';
>>>>>>> dev
    }
}

function closeSimilarCasesModal() {
    document.getElementById('similarCasesModal').style.display = 'none';
    document.body.style.overflow = '';
}

function navigateSimilarCarousel(dir) {
    const next = _similarCarouselIdx + dir;
    if (next >= 0 && next < _similarCases.length) {
        _simSlideDir = dir > 0 ? 1 : -1;
        _similarCarouselIdx = next;
        renderSimilarCarousel();
    }
}

function goToSimilarCase(idx) {
    _simSlideDir = idx > _similarCarouselIdx ? 1 : -1;
    _similarCarouselIdx = idx;
    if (!_simDetailExpanded) toggleSimilarDetail();
    renderSimilarCarousel();
}

function renderSimilarCarousel() {
    const track = document.getElementById('simCarouselTrack');
    const dots  = document.getElementById('simDotsRow');
    const prev  = document.getElementById('simPrevBtn');
    const next  = document.getElementById('simNextBtn');

    if (!_similarCases.length) {
        track.innerHTML = '<div class="sim-empty">ไม่พบเคสที่เกี่ยวข้อง</div>';
        dots.innerHTML = '';
        prev.style.visibility = next.style.visibility = 'hidden';
        return;
    }

    const item = _similarCases[_similarCarouselIdx];
    const incidentDate = item.event_time ? item.event_time.split('T')[0] : '-';
    const incidentTime = item.event_time && item.event_time.includes('T') ? item.event_time.split('T')[1] : '-';
    const name = item.fullname || `${item.firstname || ''} ${item.lastname || ''}`.trim() || '-';
    const imageUrl = item.image_url_presigned || item.image_url || '';

    track.innerHTML = `
        <div class="sim-case-card">
            <div class="sim-card-left">
                <div class="sim-card-group">
                    <div class="sim-card-label">หัวข้อ</div>
                    <div class="sim-card-value sim-bold">${item.subject || '-'}</div>
                </div>
                <div class="sim-card-group">
                    <div class="sim-card-label">รายละเอียด</div>
                    <div class="sim-card-value">${item.details || '-'}</div>
                </div>
                <div class="sim-card-group">
                    <div class="sim-card-label">ผู้แจ้ง</div>
                    <div class="sim-card-value">
                        <div><span class="sim-strong">ชื่อ-สกุล :</span> ${name}</div>
                        <div><span class="sim-strong">Email :</span> ${item.email || '-'}</div>
                        <div><span class="sim-strong">หมายเลขบัตรประชาชน :</span> ${item.id_card || '-'}</div>
                        <div><span class="sim-strong">เบอร์มือถือ :</span> ${item.phone || '-'}</div>
                    </div>
                </div>
            </div>
            <div class="sim-card-right">
                <div class="sim-card-group">
                    <div class="sim-card-label">ข้อมูลแจ้งเหตุ</div>
                    <div class="sim-card-value">
                        <div><span class="sim-strong">วันที่เกิดเหตุ :</span> ${incidentDate}</div>
                        <div><span class="sim-strong">เวลาที่เกิดเหตุ :</span> ${incidentTime}</div>
                    </div>
                </div>
                <div class="sim-img-box">
                    ${imageUrl
                        ? `<img src="${imageUrl}" class="sim-img" crossorigin="anonymous" referrerpolicy="no-referrer" alt="case image" />`
                        : `<div class="sim-img-placeholder">🖼️</div>`}
                </div>
            </div>
        </div>`;

    dots.innerHTML = _similarCases.map((_, i) =>
        `<button class="sim-dot${i === _similarCarouselIdx ? ' active' : ''}" onclick="goToSimilarCase(${i})"></button>`
    ).join('');

    prev.style.visibility = _similarCarouselIdx > 0 ? 'visible' : 'hidden';
    next.style.visibility = _similarCarouselIdx < _similarCases.length - 1 ? 'visible' : 'hidden';

    const sourceRow = document.getElementById('simSourceRow');
    if (sourceRow) {
        const sStatus = (item.status || '').toLowerCase();
        const sSide = ['pending','รอดำเนินการ','ใหม่',''].includes(sStatus) ? 'side-red'
            : ['in_progress','กำลังดำเนินการ'].includes(sStatus) ? 'side-yellow' : 'side-green';
        const sTag = CATEGORY_CLASS_MAP[item.category || ''] || 'tag-category7';
        const sTs  = item.timestamp ? formatTimestamp(item.timestamp) : '';
        sourceRow.innerHTML = `
            <div class="feed-row sim-source-feed">
                <div class="feed-side ${sSide}"></div>
                <div class="feed-main">
                    <div class="feed-title">${item.subject || '-'}</div>
                    <div class="feed-code">${caseId(item)}</div>
                    <div class="feed-tags"><span class="feed-tag ${sTag}">${item.category || ''}</span></div>
                </div>
                <div class="feed-alert"></div>
                <div class="feed-time">${sTs}</div>
            </div>`;
    }

    if (_simSlideDir !== 0) {
        const slideClass = _simSlideDir > 0 ? 'sim-slide-right' : 'sim-slide-left';
        track.classList.remove('sim-slide-left', 'sim-slide-right');
        if (sourceRow) sourceRow.classList.remove('sim-slide-left', 'sim-slide-right');
        void track.offsetWidth;
        track.classList.add(slideClass);
        if (sourceRow) sourceRow.classList.add(slideClass);
        _simSlideDir = 0;
    }
}
