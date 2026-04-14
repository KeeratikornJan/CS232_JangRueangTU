const incidentHistoryData = [
  {
    code: "EMG - 2471620",
    subject: "ไฟไหม้เล็กน้อย ห้องLab มธ.2 107",
    date: "23 /04 /2569",
    time: "18:54:40",
    receivedAgo: "2 วันที่แล้ว",

    location: "ห้อง Lab มธ.2 107",
    title: "ไฟไหม้เล็กน้อย ห้องLab มธ.2 107",
    description:
      "พบเหตุไฟไหม้เล็กน้อยบริเวณปลั๊กไฟภายในห้องปฏิบัติการ มีควันออกจากมุมห้องและมีกลิ่นไหม้ ควรเร่งเข้าตรวจสอบเพื่อป้องกันความเสียหายเพิ่มเติม",
    reporterName: "นายสมชาย ใจดี",
    reporterEmail: "somchai@example.com",
    reporterId: "1-1111-22222-33-4",
    reporterPhone: "081-111-2222",
    incidentDate: "23 / 04 / 2569",
    incidentTime: "18:40:12",
    image: ""
  },
  {
    code: "EMG-2471902",
    subject: "พบงูเหลือมขนาดใหญ่บริเวณพุ่มไม้ข้างสนามฟุตบอล",
    date: "20 /04 /2569",
    time: "14:20:22",
    receivedAgo: "5 วันที่แล้ว",

    location: "สนามฟุตบอล 1",
    title: "พบงูเหลือมขนาดใหญ่บริเวณพุ่มไม้ข้างสนามฟุตบอล",
    description:
      "แจ้งเหตุด่วน พบงูเหลือมความยาวประมาณ 3 เมตร ขดตัวอยู่บริเวณพุ่มไม้ทึบข้างสนามฟุตบอล 1 ฝั่งอัฒจันทร์ สร้างความเสี่ยงต่อผู้ที่ใช้งานพื้นที่และนักศึกษาในบริเวณใกล้เคียง กรุณาเร่งประสานเจ้าหน้าที่เข้าตรวจสอบและจับออกจากพื้นที่โดยเร็ว",
    reporterName: "นายก้องภพ แสงดาว",
    reporterEmail: "kongphop.s@email.com",
    reporterId: "1-4800-56181-34-5",
    reporterPhone: "089-765-4321",
    incidentDate: "25 / 04 / 2569",
    incidentTime: "17:15:30",
    image: ""
  }
];

const historyList = document.getElementById("historyList");

const popupOverlay = document.getElementById("popupOverlay");
const incidentPopup = document.getElementById("incidentPopup");
const popupCloseBtn = document.getElementById("popupCloseBtn");
const popupCancelBtn = document.getElementById("popupCancelBtn");

const popupCaseId = document.getElementById("popupCaseId");
const popupLocation = document.getElementById("popupLocation");
const popupTitle = document.getElementById("popupTitle");
const popupDescription = document.getElementById("popupDescription");
const popupReporterName = document.getElementById("popupReporterName");
const popupReporterEmail = document.getElementById("popupReporterEmail");
const popupReporterId = document.getElementById("popupReporterId");
const popupReporterPhone = document.getElementById("popupReporterPhone");
const popupIncidentDate = document.getElementById("popupIncidentDate");
const popupIncidentTime = document.getElementById("popupIncidentTime");
const popupImage = document.getElementById("popupImage");
const popupImagePlaceholder = document.getElementById("popupImagePlaceholder");

function renderHistoryRows(data) {
  historyList.innerHTML = data
    .map((item, index) => {
      return `
        <div class="history-row" data-index="${index}">
          <div class="history-left">
            <div class="history-code">${item.code}</div>
            <div class="history-subject">${item.subject}</div>
            <div class="history-date-line">
              <span class="history-date-label">วัน-เวลาที่รับเรื่อง</span>
              <span class="history-pill">${item.date}</span>
              <span class="history-pill">${item.time}</span>
            </div>
          </div>

          <div class="history-right">
            <span class="history-time-ago">${item.receivedAgo}</span>
          </div>
        </div>
      `;
    })
    .join("");

  attachRowEvents();
}

function attachRowEvents() {
  const historyRows = document.querySelectorAll(".history-row");

  historyRows.forEach((row) => {
    row.addEventListener("click", () => {
      const index = row.dataset.index;
      const item = incidentHistoryData[index];
      openPopup(item);
    });
  });
}

function openPopup(item) {
  popupCaseId.textContent = item.code;
  popupLocation.textContent = item.location;
  popupTitle.textContent = item.title;
  popupDescription.textContent = item.description;
  popupReporterName.textContent = item.reporterName;
  popupReporterEmail.textContent = item.reporterEmail;
  popupReporterId.textContent = item.reporterId;
  popupReporterPhone.textContent = item.reporterPhone;
  popupIncidentDate.textContent = item.incidentDate;
  popupIncidentTime.textContent = item.incidentTime;

  if (item.image && item.image.trim() !== "") {
    popupImage.src = item.image;
    popupImage.style.display = "block";
    popupImagePlaceholder.style.display = "none";
  } else {
    popupImage.src = "";
    popupImage.style.display = "none";
    popupImagePlaceholder.style.display = "flex";
  }

  popupOverlay.classList.add("show");
  incidentPopup.classList.add("open");
  incidentPopup.setAttribute("aria-hidden", "false");
  document.body.classList.add("popup-open");
}

function closePopup() {
  popupOverlay.classList.remove("show");
  incidentPopup.classList.remove("open");
  incidentPopup.setAttribute("aria-hidden", "true");
  document.body.classList.remove("popup-open");
}

if (popupCloseBtn) {
  popupCloseBtn.addEventListener("click", closePopup);
}

if (popupCancelBtn) {
  popupCancelBtn.addEventListener("click", closePopup);
}

if (popupOverlay) {
  popupOverlay.addEventListener("click", closePopup);
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closePopup();
  }
});

renderHistoryRows(incidentHistoryData);