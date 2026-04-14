const pieData = [
  { label: "สถานที่", percent: 23, color: "#ff9800" },
  { label: "บุคลากร", percent: 15, color: "#e056f1" },
  { label: "ร้านค้า", percent: 7, color: "#18c4c7" },
  { label: "ระบบ IT", percent: 17, color: "#a4b800" },
  { label: "อุปกรณ์อิเล็กทรอนิกส์", percent: 10, color: "#c438e8" },
  { label: "อื่นๆ", percent: 8, color: "#ff0b67" },
  { label: "รถโดยสาร", percent: 20, color: "#56c108" }
];

const categories = [
  { name: "สถานที่", percent: 23, color: "#ff9800" },
  { name: "บุคลากร", percent: 15, color: "#e056f1" },
  { name: "รถโดยสาร EV..", percent: 20, color: "#2fb50f" },
  { name: "ระบบ IT", percent: 17, color: "#a4b800" },
  { name: "อุปกรณ์อิเล็ก..", percent: 10, color: "#c438e8" },
  { name: "ร้านค้า", percent: 7, color: "#18c4c7" },
  { name: "อื่นๆ", percent: 8, color: "#ff0b67" }
];

const summaries = [
  { label: "ทั้งหมด", value: 50, icon: "", bg: "bg-blue" },
  { label: "รอดำเนินการ", value: 17, icon: "✳", bg: "bg-red" },
  { label: "กำลังดำเนินการ", value: 33, icon: "🔧", bg: "bg-yellow" },
  { label: "เสร็จสิ้น", value: 29, icon: "✓", bg: "bg-green" }
];

const feeds = [
  {
    title: "เครื่องปรับอากาศในห้องสมุดเสียงดังและไม่เย็นมา 1 สัปดาห์",
    code: "GU-5868544001",
    sideColor: "side-green",
    tags: [
      { text: "อุปกรณ์อิเล็กทรอนิกส์", cls: "tag-purple" },
      { text: "⚠ พบเคสซ้ำ 5", cls: "tag-warning" }
    ],
    alert: true,
    time: "4 นาที"
  },
  {
    title: "พบสุนัขจรจัดไล่กวดนักศึกษาบริเวณโรงอาหารกลาง",
    code: "GU-5868544002",
    sideColor: "side-green",
    tags: [
      { text: "อื่นๆ", cls: "tag-pink" }
    ],
    alert: false,
    time: "10 นาที"
  },
  {
    title: "ท่อประปาแตกบริเวณหน้าอาคารเรียนรวม น้ำไหลท่วมทางเดิน",
    code: "EMG-2471900",
    sideColor: "side-red",
    tags: [
      { text: "เหตุฉุกเฉิน", cls: "tag-pink" }
    ],
    alert: false,
    time: "21 นาที"
  },
  {
    title: "ลิฟต์ค้างชั้น 4 อาคารวิศวกรรม มีนักศึกษาติดอยู่ข้างใน 2 คน",
    code: "EMG-2471901",
    sideColor: "side-red",
    tags: [
      { text: "เหตุฉุกเฉิน", cls: "tag-pink" }
    ],
    alert: false,
    time: "1 วัน"
  },
  {
    title: "เจ้าหน้าที่หน่วยงาน XXX พูดจาไม่สุภาพขณะขอติดต่อรับเอกสาร",
    code: "GU-5868544003",
    sideColor: "side-green",
    tags: [
      { text: "บุคลากร", cls: "tag-purple" },
      { text: "⚠ พบเคสซ้ำ 5", cls: "tag-warning" }
    ],
    alert: true,
    time: "2 วัน"
  },
  {
    title: "ไฟส่องสว่างทางเดินหอพักหญิงขาด ทำให้ทางเปลี่ยวและอันตราย",
    code: "GU-5868544004",
    sideColor: "side-green",
    tags: [
      { text: "อุปกรณ์อิเล็กทรอนิกส์", cls: "tag-purple" },
      { text: "⚠ พบเคสซ้ำ 5", cls: "tag-warning" }
    ],
    alert: true,
    time: "2 วัน"
  },
  {
    title: "พบงูเหลือมขนาดใหญ่บริเวณพุ่มไม้ข้างสนามฟุตบอล",
    code: "EMG-2471902",
    sideColor: "side-red",
    tags: [
      { text: "เหตุฉุกเฉิน", cls: "tag-pink" }
    ],
    alert: false,
    time: "3 วัน"
  }
];

const similarCaseData = {
  total: 5,
  category: "หมวดหมู่ สถานที่",
  location: "📍 ห้องสมุดกลาง ชั้น 2",
  month: "เดือน มีนาคม ปี 2569",
  caseNumber: 1,
  caseId: "GU-5868544001",
  title: "เครื่องปรับอากาศในห้องสมุดเสียงดังและไม่เย็นมา 1 สัปดาห์",
  status: "ร้องเรียน",
  time: "4 นาที",
  topic: "เครื่องปรับอากาศในห้องสมุดเสียงดังและไม่เย็นมา 1 สัปดาห์",
  detail:
    "พบเครื่องปรับอากาศบริเวณโซนที่นั่งอ่านหนังสือ ชั้น 2 ห้องสมุดกลาง ส่งเสียงดังรบกวนสมาธิ และมีน้ำหยดลงบนโต๊ะอ่านหนังสือมา 3 วันแล้วครับ",
  reporterName: "สมใจ แสนดี",
  reporterEmail: "somjai.s@email.com",
  reporterCitizenId: "1-4800-56181-34-5",
  reporterPhone: "081-234-5678",
  incidentDate: "25/04/2569",
  incidentTime: "22:54:40"
};

const pieSvg = document.getElementById("pieSvg");
const categoryList = document.getElementById("categoryList");
const summaryCards = document.getElementById("summaryCards");
const feedList = document.getElementById("feedList");

const similarCasesOverlay = document.getElementById("similarCasesOverlay");
const similarCaseDetail = document.getElementById("similarCaseDetail");
const closeSimilarCasesBtn = document.getElementById("closeSimilarCasesBtn");
const toggleSimilarDetailBtn = document.getElementById("toggleSimilarDetailBtn");
const bottomToggleSimilarBtn = document.getElementById("bottomToggleSimilarBtn");

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg - 90) * Math.PI / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad)
  };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    "Z"
  ].join(" ");
}

function renderPieChart() {
  const cx = 255;
  const cy = 176;
  const r = 110;

  let currentAngle = 0;

  const slices = [];
  const labels = [];

  pieData.forEach((item) => {
    const angle = (item.percent / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    const middleAngle = startAngle + angle / 2;

    const path = describeArc(cx, cy, r, startAngle, endAngle);
    slices.push(
      `<path class="pie-slice" d="${path}" fill="${item.color}"></path>`
    );

    const labelPoint = polarToCartesian(cx, cy, r * 0.62, middleAngle);
    labels.push(
      `<text class="pie-percent" x="${labelPoint.x}" y="${labelPoint.y}">${item.percent}%</text>`
    );

    currentAngle = endAngle;
  });

  pieSvg.innerHTML = `
    ${slices.join("")}
    ${labels.join("")}
  `;
}

function renderCategories() {
  categoryList.innerHTML = categories
    .map((item) => {
      return `
        <div class="category-item">
          <div class="category-name">${item.name}</div>
          <div class="progress-track">
            <div class="progress-fill" style="width:${item.percent}%; background:${item.color};"></div>
          </div>
          <div class="category-percent">${item.percent}%</div>
        </div>
      `;
    })
    .join("");
}

function renderSummaries() {
  summaryCards.innerHTML = summaries
    .map((item) => {
      return `
        <div class="summary-card ${item.bg}">
          <div class="summary-left">
            <div class="summary-label">${item.label}</div>
            <div class="summary-value">${item.value}</div>
          </div>
          <div class="summary-icon">${item.icon}</div>
        </div>
      `;
    })
    .join("");
}

function renderFeeds() {
  feedList.innerHTML = feeds
    .map((item) => {
      const tagsHtml = item.tags
        .map((tag) => `<span class="feed-tag ${tag.cls}">${tag.text}</span>`)
        .join("");

      return `
        <div class="feed-row">
          <div class="feed-side ${item.sideColor}"></div>

          <div class="feed-main">
            <div class="feed-title">${item.title}</div>
            <div class="feed-code">${item.code}</div>
            <div class="feed-tags">${tagsHtml}</div>
          </div>

          <div class="feed-alert">
            ${
              item.alert
                ? `<button type="button" class="alert-chip" onclick="openSimilarCases()">
                    <span class="alert-icon">⚠</span>
                    <span>พบเคสซ้ำ</span>
                    <span class="alert-badge">5</span>
                  </button>`
                : ``
            }
          </div>

          <div class="feed-time">${item.time}</div>
        </div>
      `;
    })
    .join("");
}

function openSimilarCases() {
  if (!similarCasesOverlay) return;
  similarCasesOverlay.classList.remove("hidden");
}

function closeSimilarCases() {
  if (!similarCasesOverlay) return;
  similarCasesOverlay.classList.add("hidden");
}

function setToggleSymbol() {
  if (!similarCaseDetail || !toggleSimilarDetailBtn || !bottomToggleSimilarBtn) return;

  const isHidden = similarCaseDetail.classList.contains("collapsed");
  const symbol = isHidden ? "˅" : "˄";

  toggleSimilarDetailBtn.textContent = symbol;
  bottomToggleSimilarBtn.textContent = symbol;
}

function toggleSimilarDetail() {
  if (!similarCaseDetail) return;
  similarCaseDetail.classList.toggle("collapsed");
  setToggleSymbol();
}

if (closeSimilarCasesBtn) {
  closeSimilarCasesBtn.addEventListener("click", closeSimilarCases);
}

if (toggleSimilarDetailBtn) {
  toggleSimilarDetailBtn.addEventListener("click", toggleSimilarDetail);
}

if (bottomToggleSimilarBtn) {
  bottomToggleSimilarBtn.addEventListener("click", toggleSimilarDetail);
}

if (similarCasesOverlay) {
  similarCasesOverlay.addEventListener("click", function (event) {
    if (event.target === similarCasesOverlay) {
      closeSimilarCases();
    }
  });
}

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeSimilarCases();
  }
});

renderPieChart();
renderCategories();
renderSummaries();
renderFeeds();
setToggleSymbol();