/*const API_URL = "https://xw9ox0faec.execute-api.us-east-1.amazonaws.com/prod/Admin/dashboard";

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
*/
document.addEventListener('DOMContentLoaded', fetchDashboardData);
async function fetchDashboardData() {
    try {
        // ⬇️ Mock Data จำลองโครงสร้างข้อมูลจาก Database
        const data = {
            stats: {
                incident_count: 16,
                complaint_count: 14,
                pending_cases: 5
            },
            categories: [
                { name: "สถานที่", count: 23, color: "#ff9800" },
                { name: "บุคลากร", count: 15, color: "#e056f1" },
                { name: "รถโดยสาร", count: 20, color: "#56c108" },
                { name: "ระบบ IT", count: 17, color: "#a4b800" },
                { name: "อุปกรณ์อิเล็กทรอนิกส์", count: 10, color: "#c438e8" },
                { name: "ร้านค้า", count: 7, color: "#18c4c7" },
                { name: "อื่นๆ", count: 8, color: "#ff0b67" }
            ],
            latest_cases: [
                {
                    incident_id: "GU-5868544001",
                    subject: "เครื่องปรับอากาศในห้องสมุดเสียงดังและไม่เย็นมา 1 สัปดาห์",
                    category: "อุปกรณ์อิเล็กทรอนิกส์",
                    status: "รอดำเนินการ",
                    timestamp: "2026-05-08T10:00:00Z"
                },
                {
                    incident_id: "EMG-2471900",
                    subject: "ท่อประปาแตกบริเวณหน้าอาคารเรียนรวม น้ำไหลท่วมทางเดิน",
                    category: "สถานที่",
                    status: "กำลังดำเนินการ",
                    timestamp: "2026-05-08T09:30:00Z"
                },
                {
                    incident_id: "GU-5868544002",
                    subject: "เจ้าหน้าที่พูดจาไม่สุภาพขณะขอติดต่อรับเอกสาร",
                    category: "บุคลากร",
                    status: "เสร็จสิ้น",
                    timestamp: "2026-05-07T14:15:00Z"
                }
            ]
        };

        if (data.stats) {
            updateStatsUI(data.stats);
            renderSummaryCards(data.stats);
        }
        
        if (data.categories && data.categories.length) { 
            renderCategoryList(data.categories); 
            drawPieChart(data.categories); 
        }

        renderLatestCases(data.latest_cases || []);

        console.log("โหลดข้อมูลและแสดงผลสำเร็จ");

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
        { label: "กำลังดำเนินการ", count: 33, icon: "🔧", bg: "#efc84b" },
        { label: "เสร็จสิ้น", count: 29, icon: "✓", bg: "#4d7f4f" },
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
    
    listEl.innerHTML = categories.map(cat => `
        <div class="category-item" style="display: flex; align-items: center; margin-bottom: 8px;">
            <span class="dot" style="background-color:${cat.color}; width: 12px; height: 12px; border-radius: 50%; display: inline-block; margin-right: 8px;"></span>
            <span class="name" style="flex: 1;">${cat.name}</span>
            <span class="percent" style="font-weight: bold;">${cat.count} รายการ</span>
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

// ---------- Similar Cases Overlay ----------
const overlay         = document.getElementById('similarCasesOverlay');
const closeBtn        = document.getElementById('closeSimilarCasesBtn');
const toggleDetailBtn = document.getElementById('toggleSimilarDetailBtn');
const bottomToggleBtn = document.getElementById('bottomToggleSimilarBtn');
const detailPanel     = document.getElementById('similarCaseDetail');

if (closeBtn && overlay) {
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