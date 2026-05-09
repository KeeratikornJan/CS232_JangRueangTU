// Admin dashboard – stats, pie chart, latest cases feed (live data only).
let DASHBOARD_CASES = [];

document.addEventListener('DOMContentLoaded', () => {
    createCaseDetailPopup();
    fetchDashboardData();
});

function computeDashboardData(rawItems) {
    const complaints = rawItems.filter(i => window.AppAPI.isComplaint(i));
    const incidents = rawItems.filter(i => window.AppAPI.isIncident(i));
    const pending = rawItems.filter(i =>
        ['pending', 'รอดำเนินการ', 'ใหม่'].includes((i.status || '').toLowerCase())
    ).length;
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
        renderLatestCases(data.latest_cases);
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        const feed = document.getElementById('feedList');
        if (feed) feed.innerHTML = `<p style="text-align:center;padding:20px;color:#c00;">โหลดข้อมูลไม่สำเร็จ: ${error.message}</p>`;
    }
}

function updateStatsUI(stats) {
    const sideIncidents = document.querySelector('a[href$="incidentAdmin.html"] .count-badge');
    const sideComplaints = document.querySelector('a[href$="complaintsAdmin.html"] .count-badge');
    if (sideIncidents) sideIncidents.textContent = stats.incident_count || 0;
    if (sideComplaints) sideComplaints.textContent = stats.complaint_count || 0;
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

        return `
        <div class="feed-row" style="cursor: pointer;" onclick="viewDetail('${id}')">
          <div class="feed-side ${sideColor}"></div>
          <div class="feed-main">
            <div class="feed-title">${subject}</div>
            <div class="feed-code">${id}</div>
            <div class="feed-tags">${tagsHtml}</div>
          </div>
          <div class="feed-alert"></div>
          <div class="feed-time">${ts}</div>
        </div>`;
    }).join('');
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
