const API_URL = "https://xw9ox0faec.execute-api.us-east-1.amazonaws.com/prod/Admin/dashboard";

document.addEventListener('DOMContentLoaded', fetchDashboardData);

async function fetchDashboardData() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        if (data.stats)                                 updateStatsUI(data.stats);
        if (data.categories && data.categories.length) { renderCategoryList(data.categories); drawPieChart(data.categories); }
        if (data.stats)                                 renderSummaryCards(data.stats);
        renderLatestCases(data.latest_cases || []);

    } catch (error) {
        console.error("Error fetching dashboard data:", error);
    }
}

// ---------- Stats / Sidebar ----------
function updateStatsUI(stats) {
    const sideIncidents  = document.querySelector('a[href="views/incidentAdmin.html"] .count-badge');
    const sideComplaints = document.querySelector('a[href="views/complaintsAdmin.html"] .count-badge');
    if (sideIncidents)  sideIncidents.textContent  = stats.incident_count  || 0;
    if (sideComplaints) sideComplaints.textContent = stats.complaint_count || 0;
}

// ---------- Summary Cards ----------
function renderSummaryCards(stats) {
    const container = document.getElementById('summaryCards');
    if (!container) return;
    const cards = [
        { label: 'แจ้งเหตุทั้งหมด', value: stats.incident_count  || 0, color: '#4D96FF' },
        { label: 'ร้องเรียนทั้งหมด', value: stats.complaint_count || 0, color: '#FF6B6B' },
        { label: 'รอดำเนินการ',       value: stats.pending_cases   || 0, color: '#FFD93D' },
    ];
    container.innerHTML = cards.map(card => `
        <div class="summary-card">
            <div class="summary-card-value" style="color:${card.color}">${card.value}</div>
            <div class="summary-card-label">${card.label}</div>
        </div>`).join('');
}

// ---------- Category List ----------
function renderCategoryList(categories) {
    const listEl = document.getElementById('categoryList');
    if (!listEl) return;
    listEl.innerHTML = categories.map(cat => `
        <div class="category-item">
            <span class="dot" style="background-color:${cat.color}"></span>
            <span class="name">${cat.name}</span>
            <span class="percent">${cat.count} รายการ</span>
        </div>`).join('');
}

// ---------- Pie Chart ----------
function drawPieChart(categories) {
    const svg = document.getElementById('pieSvg');
    if (!svg) return;

    // viewBox is "0 0 520 340" — draw pie centred at cx=170, cy=170, r=130
    const CX = 170, CY = 170, R = 130;
    const total = categories.reduce((sum, c) => sum + c.count, 0);
    let cumulative = 0;
    svg.innerHTML = '';

    categories.forEach(cat => {
        const safePercent = Math.min(cat.count / total, 0.9999);
        const [sx, sy] = getCoords(cumulative, CX, CY, R);
        cumulative += safePercent;
        const [ex, ey] = getCoords(cumulative, CX, CY, R);
        const largeArc = safePercent > 0.5 ? 1 : 0;

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${CX} ${CY} L ${sx} ${sy} A ${R} ${R} 0 ${largeArc} 1 ${ex} ${ey} Z`);
        path.setAttribute('fill', cat.color);
        path.setAttribute('class', 'pie-slice');
        svg.appendChild(path);
    });
}

function getCoords(percent, cx, cy, r) {
    const a = 2 * Math.PI * percent - Math.PI / 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

// ---------- Feed ----------
function renderLatestCases(cases) {
    const feedList = document.getElementById('feedList');
    if (!feedList) return;
    if (!cases.length) {
        feedList.innerHTML = '<p style="text-align:center;padding:20px;">ไม่มีรายการใหม่</p>';
        return;
    }
    feedList.innerHTML = cases.map(item => {
        const id      = item.incident_id || item.complaint_id || '-';
        const subject = item.subject || 'แจ้งเหตุ / ร้องเรียน';
        const cat     = item.category || '';
        const status  = item.status   || '';
        const ts      = item.timestamp ? formatTimestamp(item.timestamp) : '';
        return `
        <div class="feed-item">
            <div class="feed-info">
                <div class="feed-subject">${subject}</div>
                <div class="feed-meta">
                    <span class="feed-id">ID: ${id}</span>
                    ${cat    ? `<span class="feed-category">${cat}</span>`    : ''}
                    ${status ? `<span class="feed-status">${status}</span>`   : ''}
                    ${ts     ? `<span class="feed-time">${ts}</span>`         : ''}
                </div>
            </div>
            <button class="view-btn" type="button" onclick="viewDetail('${id}')">ดูรายละเอียด</button>
        </div>`;
    }).join('');
}

// ---------- Helpers ----------
function formatTimestamp(ts) {
    try {
        return new Date(ts).toLocaleString('th-TH', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch { return ts; }
}

function viewDetail(id) {
    window.location.href = `views/caseDetail.html?id=${id}`;
}

// ---------- Similar Cases Overlay (original UI) ----------
const overlay         = document.getElementById('similarCasesOverlay');
const closeBtn        = document.getElementById('closeSimilarCasesBtn');
const toggleDetailBtn = document.getElementById('toggleSimilarDetailBtn');
const bottomToggleBtn = document.getElementById('bottomToggleSimilarBtn');
const detailPanel     = document.getElementById('similarCaseDetail');

if (closeBtn) {
    closeBtn.addEventListener('click', () => overlay.classList.add('hidden'));
}
if (toggleDetailBtn && detailPanel) {
    toggleDetailBtn.addEventListener('click', () => {
        const isOpen = !detailPanel.classList.contains('hidden');
        detailPanel.classList.toggle('hidden', isOpen);
        toggleDetailBtn.textContent = isOpen ? '˅' : '˄';
    });
}
if (bottomToggleBtn && overlay) {
    bottomToggleBtn.addEventListener('click', () => {
        overlay.classList.toggle('collapsed');
        bottomToggleBtn.textContent = overlay.classList.contains('collapsed') ? '˅' : '˄';
    });
}