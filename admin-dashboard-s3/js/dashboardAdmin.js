const API_URL = ""; // ใส่ API endpoint จริงที่นี่

document.addEventListener('DOMContentLoaded', () => {
    createCaseDetailPopup();
    fetchDashboardData();
});

function computeDashboardData(rawItems) {
    const complaints = rawItems.filter(i => i.complaint_id);
    const incidents = rawItems.filter(i => i.incident_id);
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
        let data;
        if (API_URL) {
            const response = await fetch(API_URL);
            const rawItems = await response.json();
            data = computeDashboardData(rawItems);
        } else {
            data = MOCK_DASHBOARD_DATA;
        }

        if (data.stats) {
            updateStatsUI(data.stats);
            renderSummaryCards(data.stats);
        }

        if (data.categories && data.categories.length) {
            const categoriesWithColor = data.categories.map(cat => ({
                name: cat.name,
                count: cat.count,
                color: CATEGORY_COLORS[cat.name] || "#999999"
            }));
            renderCategoryList(categoriesWithColor);
            drawPieChart(categoriesWithColor);
        }

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

    const totalCases = (stats.incident_count || 0) + (stats.complaint_count || 0);
    const pendingCases = stats.pending_cases || 0;
    const cards = [
        { label: "ทั้งหมด", count: totalCases, icon: "", bg: "#3f79d0" },
        { label: "รอดำเนินการ", count: pendingCases, icon: "✳", bg: "#e53d39" },
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

// ---------- Category List ----------
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

// ---------- Pie Chart ----------
function drawPieChart(categories) {
    const svg = document.getElementById('pieSvg');
    if (!svg) return;

    const CX = 170, CY = 170, R = 130;
    svg.setAttribute('viewBox', '0 0 340 340');
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
    const categoryClassMap = {
        "สถานที่": "tag-category1",
        "บุคลากร": "tag-category2",
        "รถโดยสาร": "tag-category3",
        "ระบบ IT": "tag-category4",
        "อุปกรณ์อิเล็กทรอนิกส์": "tag-category5",
        "ร้านค้า": "tag-category6",
        "อื่นๆ": "tag-category7"
    };

    feedList.innerHTML = cases.map(item => {
        const id      = item.incident_id || item.complaint_id || '-';
        const subject = item.subject || 'แจ้งเหตุ / ร้องเรียน';
        const cat     = item.category || '';
        const rawStatus = item.status || '';
        const ts      = item.timestamp ? formatTimestamp(item.timestamp) : '';
        let displayStatus = rawStatus;
        
        //กำหนดสีตามสถานะ
        let sideColor = "side-gray";
        if (rawStatus.toLowerCase() === "pending" || rawStatus === "รอดำเนินการ") {
            displayStatus = "รอดำเนินการ";
            sideColor = "side-red";
        } 
        else if (rawStatus.toLowerCase() === "in_progress" || rawStatus === "กำลังดำเนินการ") {
            displayStatus = "กำลังดำเนินการ";
            sideColor = "side-yellow";
        } 
        else if (rawStatus.toLowerCase() === "resolved" || rawStatus === "success" || rawStatus === "เสร็จสิ้น") {
            displayStatus = "เสร็จสิ้น";
            sideColor = "side-green";
        }

        //สร้าง Tags แสดงหมวดหมู่
        //ถ้าไม่เจอในเงื่อนไข ให้ใช้ tag-category7 เป็นค่าเริ่มต้น
        const tagCssClass = categoryClassMap[cat] || "tag-category7";
        const tagsHtml = `<span class="feed-tag ${tagCssClass}">${cat}</span>`;


        // ตรวจสอบว่ามีเคสซ้ำหรือไม่ item.is_duplicate (ดึงจาก API อันนี้ mock ไว้ก่อน)
        const hasAlert = item.is_duplicate === true || id === "GU-5868544001"; 

        return `
        <div class="feed-row" style="cursor: pointer;" onclick="viewDetail('${id}')">
          <div class="feed-side ${sideColor}"></div>

          <div class="feed-main">
            <div class="feed-title">${subject}</div>
            <div class="feed-code">${id}</div>
            <div class="feed-tags">${tagsHtml}</div>
          </div>

          <div class="feed-alert">
            ${
              hasAlert
                ? `<button type="button" class="alert-chip" onclick="event.stopPropagation(); openSimilarCases('${id}')">
                    <span class="alert-icon">⚠</span>
                    <span>พบเคสซ้ำ</span>
                    <span class="alert-badge">5</span>
                  </button>`
                : ``
            }
          </div>

          <div class="feed-time">${ts}</div>
        </div>`;
    }).join('');
}

// ---------- Case Detail Popup ----------

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
            <img id="caseDetailImage" class="popup-image" src="" alt="case image" />
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
    const item = MOCK_API.find(i => (i.complaint_id || i.incident_id) === id);
    if (!item) return;

    document.getElementById('caseDetailId').textContent       = item.complaint_id || item.incident_id;
    document.getElementById('caseDetailLocation').textContent = item.location || '-';
    document.getElementById('caseDetailTitle').textContent    = item.subject || '-';
    document.getElementById('caseDetailDesc').textContent     = item.details || '-';
    document.getElementById('caseDetailName').textContent     = `${item.firstname || ''} ${item.lastname || ''}`.trim() || '-';
    document.getElementById('caseDetailEmail').textContent    = item.email || '-';
    document.getElementById('caseDetailIdCard').textContent   = item.id_card || '-';
    document.getElementById('caseDetailPhone').textContent    = item.phone || '-';
    document.getElementById('caseDetailDate').textContent     = item.event_time ? item.event_time.split('T')[0] : '-';
    document.getElementById('caseDetailTime').textContent     = item.event_time && item.event_time.includes('T') ? item.event_time.split('T')[1] : '-';

    const img = document.getElementById('caseDetailImage');
    const ph  = document.getElementById('caseDetailImgPlaceholder');
    if (item.image_url_presigned && item.image_url_presigned.trim()) {
        img.src = item.image_url_presigned;
        img.style.display = 'block';
        ph.style.display  = 'none';
    } else {
        img.src = '';
        img.style.display = 'none';
        ph.style.display  = 'flex';
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

// ---------- Similar Cases Overlay ----------

function formatThaiMonthYear(ts) {
    if (!ts) return '-';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '-';
    const months = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
                    'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
    return `เดือน ${months[d.getMonth()]} ปี ${d.getFullYear() + 543}`;
}

function closeSimilarCases() {
    document.getElementById('similarCasesOverlay').classList.add('hidden');
}

function openSimilarCases(id) {
    const panel   = document.getElementById('similarCasesPanel');
    const overlay = document.getElementById('similarCasesOverlay');
    if (!panel || !overlay) return;

    const thisCase = MOCK_API.find(i => (i.complaint_id || i.incident_id) === id);
    if (!thisCase) return;

    if (!overlay._closeSetup) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeSimilarCases();
            }
        });
        overlay._closeSetup = true;
    }

    const similar  = MOCK_API.filter(i =>
        i.category === thisCase.category && (i.complaint_id || i.incident_id) !== id
    );
    const allCases = [thisCase, ...similar];
    let currentIndex = 0;

    function renderPanel(item) {
        const caseId  = item.complaint_id || item.incident_id;
        const type    = item.complaint_id ? 'ร้องเรียน' : 'แจ้งเหตุ';
        const dateStr = item.event_time ? item.event_time.split('T')[0] : '-';
        const timeStr = item.event_time && item.event_time.includes('T') ? item.event_time.split('T')[1] : '-';

        panel.innerHTML = `
          <div class="similar-cases-header">
            <h2 class="similar-cases-title">รวมเคสใกล้เคียง</h2>
            <div class="similar-cases-summary">
              <div class="summary-item summary-item-count">
                <div class="summary-circle">${allCases.length}</div>
                <div class="summary-text">จำนวนที่พบเคสอาจซ้ำซ้อน</div>
              </div>
              <div class="summary-item">
                <div class="summary-text">หมวดหมู่ ${thisCase.category || '-'}</div>
              </div>
              <div class="summary-item">
                <div class="summary-text">📍 ${thisCase.location || '-'}</div>
              </div>
              <div class="summary-item">
                <div class="summary-text">${formatThaiMonthYear(thisCase.timestamp)}</div>
              </div>
            </div>
          </div>

          <div class="similar-case-card">
            <div class="similar-case-top">
              <div class="similar-case-left">
                <div class="similar-case-id">${caseId}</div>
                <div class="similar-case-main-title">${item.subject || '-'}</div>
                <div class="similar-case-tags">
                  <span class="similar-tag similar-tag-green">${type}</span>
                  <span class="similar-tag similar-tag-pink"></span>
                </div>
              </div>
              <div class="similar-case-right">
                <div class="similar-case-number">${currentIndex + 1}</div>
                <div class="similar-case-time">${formatTimestamp(item.timestamp)}</div>
              </div>
            </div>

            <div id="similarCaseDetail" class="similar-case-detail">
              <div class="similar-detail-left">
                <div class="detail-group">
                  <div class="detail-label">หัวข้อ</div>
                  <div class="detail-value detail-value-bold">${item.subject || '-'}</div>
                </div>
                <div class="detail-group">
                  <div class="detail-label">รายละเอียด</div>
                  <div class="detail-value">${item.details || '-'}</div>
                </div>
                <div class="detail-group">
                  <div class="detail-label">ผู้แจ้ง</div>
                  <div class="detail-value">
                    ชื่อ-สกุล : ${item.firstname || ''} ${item.lastname || ''}<br>
                    Email : ${item.email || '-'}<br>
                    หมายเลขบัตรประชาชน : ${item.id_card || '-'}<br>
                    เบอร์มือถือ : ${item.phone || '-'}
                  </div>
                </div>
              </div>
              <div class="similar-detail-right">
                <div class="detail-group">
                  <div class="detail-label">ข้อมูลแจ้งเหตุ</div>
                  <div class="detail-value">
                    วันที่เกิดเหตุ : ${dateStr}<br>
                    เวลาที่เกิดเหตุ : ${timeStr}
                  </div>
                </div>
                <div class="similar-image-box">
                  <span class="material-symbols-outlined similar-image-icon">image</span>
                </div>
              </div>
            </div>
          </div>

          <div class="similar-cases-footer">
            <div class="similar-pagination">
              <button type="button" class="pagination-arrow" id="prevCaseBtn"><span class="material-symbols-outlined">keyboard_arrow_left</span></button>
              <div class="pagination-dots">
                ${allCases.map((_, i) => `<span class="pagination-dot${i === currentIndex ? ' active' : ''}"></span>`).join('')}
              </div>
              <button type="button" class="pagination-arrow" id="nextCaseBtn"><span class="material-symbols-outlined">keyboard_arrow_right</span></button>
            </div>
            <button type="button" class="similar-bottom-toggle" id="bottomToggleSimilarBtn">
              <span class="material-symbols-outlined">expand_less</span>
            </button>
          </div>
        `;

        const detailEl     = document.getElementById('similarCaseDetail');
        const bottomToggle = document.getElementById('bottomToggleSimilarBtn');

        bottomToggle.addEventListener('click', () => {
            const collapsed = detailEl.classList.toggle('collapsed');
            bottomToggle.innerHTML = collapsed
                ? '<span class="material-symbols-outlined">expand_more</span>'
                : '<span class="material-symbols-outlined">expand_less</span>';
        });

        document.getElementById('prevCaseBtn').addEventListener('click', () => {
            if (currentIndex > 0) { currentIndex--; renderPanel(allCases[currentIndex]); }
        });
        document.getElementById('nextCaseBtn').addEventListener('click', () => {
            if (currentIndex < allCases.length - 1) { currentIndex++; renderPanel(allCases[currentIndex]); }
        });
    }

    renderPanel(allCases[currentIndex]);
    overlay.classList.remove('hidden');
}