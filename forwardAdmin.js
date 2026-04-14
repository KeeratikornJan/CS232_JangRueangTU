const waitingCases = [
  {
    id: "GU-5868544002",
    title: "เจ้าหน้าที่หน่วยงาน XXX พูดจาไม่สุภาพขณะติดต่อรับเอกสาร",
    category: "บุคลากร",
    tagClass: "tag-person",
    location: "อาคารสำนักงานกลาง",
    description:
      "ผู้แจ้งระบุว่าเจ้าหน้าที่ใช้คำพูดไม่เหมาะสม น้ำเสียงไม่สุภาพ และแสดงท่าทีไม่เต็มใจให้บริการระหว่างติดต่อขอเอกสาร",
    reporterName: "สมใจ แสนดี",
    reporterEmail: "somjai.s@email.com",
    reporterId: "1-4800-56181-34-5",
    reporterPhone: "081-234-5678",
    incidentDate: "25 / 04 / 2569",
    incidentTime: "22:54:40",
    department: "",
    note: "",
    image: ""
  },
  {
    id: "GU-5868544004",
    title: "ไฟส่องสว่างทางเดินหอพักหญิงขาด ทำให้ทางเปลี่ยวและอันตราย",
    category: "สถานที่",
    tagClass: "tag-place",
    location: "หอพักหญิง",
    description:
      "บริเวณทางเดินหอพักหญิงมีไฟส่องสว่างดับหลายจุดในช่วงเวลากลางคืน ทำให้พื้นที่มืดและอาจเกิดอันตรายได้",
    reporterName: "กมลชนก ใจดี",
    reporterEmail: "kamol@email.com",
    reporterId: "1-2222-33333-44-5",
    reporterPhone: "089-123-4567",
    incidentDate: "24 / 04 / 2569",
    incidentTime: "21:10:00",
    department: "",
    note: "",
    image: ""
  },
  {
    id: "GU-5868544010",
    title: "ทุนการศึกษาไม่โอนมาตามกำหนด",
    category: "อื่นๆ",
    tagClass: "tag-other",
    location: "คณะสังคม",
    description:
      "นักศึกษาระบุว่ายังไม่ได้รับทุนการศึกษาตามกำหนดเวลา จึงต้องการให้ตรวจสอบสถานะการโอนเงิน",
    reporterName: "ชลธิชา พูนทรัพย์",
    reporterEmail: "chon@email.com",
    reporterId: "1-3333-44444-55-6",
    reporterPhone: "081-555-9988",
    incidentDate: "23 / 04 / 2569",
    incidentTime: "14:35:00",
    department: "",
    note: "",
    image: ""
  },
  {
    id: "GU-5868544003",
    title: "พบสุนัขจรจัดไล่กวดนักศึกษาบริเวณโรงอาหารกลาง",
    category: "อื่นๆ",
    tagClass: "tag-other",
    location: "โรงอาหารกลาง",
    description:
      "มีสุนัขจรจัดหลายตัวบริเวณโรงอาหารกลาง และมีพฤติกรรมวิ่งไล่นักศึกษาบางคน ทำให้ผู้แจ้งรู้สึกไม่ปลอดภัย",
    reporterName: "ธนกร มั่นคง",
    reporterEmail: "thanakorn@email.com",
    reporterId: "1-4444-55555-66-7",
    reporterPhone: "082-777-1100",
    incidentDate: "23 / 04 / 2569",
    incidentTime: "11:20:00",
    department: "",
    note: "",
    image: ""
  }
];

const departments = [
  { name: "กองบริการการศึกษา", count: 8 },
  { name: "กองกลาง (งานพัสดุและโลจุ)", count: 3 },
  { name: "กองอาคารสถานที่และสิ่งแวดล้อม", count: 5 },
  { name: "ศูนย์บริหารจัดการทรัพย์สิน", count: 2 },
  { name: "สำนักงานนวัตกรรมดิจิทัล (IT)", count: 4 },
  { name: "กองจัดการความปลอดภัย (รปภ.)", count: 6 },
  { name: "หน่วยงานขนส่ง (EV Shuttle)", count: 10 },
  { name: "อื่นๆ", count: 7 }
];

const waitingList = document.getElementById("waitingList");
const departmentGrid = document.getElementById("departmentGrid");
const waitingCount = document.getElementById("waitingCount");

const popupOverlay = document.getElementById("popupOverlay");
const complaintPopup = document.getElementById("complaintPopup");
const popupCloseBtn = document.getElementById("popupCloseBtn");
const popupCancelBtn = document.getElementById("popupCancelBtn");
const popupSaveBtn = document.getElementById("popupSaveBtn");

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
const popupDepartmentSelect = document.getElementById("popupDepartmentSelect");
const popupNote = document.getElementById("popupNote");

let currentSelectedCase = null;

function renderWaitingCases() {
  waitingCount.textContent = `${waitingCases.length + 1} เคส`;

  waitingList.innerHTML = waitingCases
    .map((item) => {
      return `
        <div class="waiting-item" data-id="${item.id}">
          <div class="waiting-bar"></div>

          <div class="waiting-content">
            <div class="waiting-title">${item.title}</div>
            <div class="tag-pill ${item.tagClass}">${item.category}</div>
          </div>
        </div>
      `;
    })
    .join("");

  addWaitingItemEvents();
}

function renderDepartments() {
  departmentGrid.innerHTML = departments
    .map((item) => {
      return `
        <div class="department-card">
          <div class="department-name">${item.name}</div>
          <div class="department-count">${item.count}</div>
          <div class="department-subtext">เคสที่รับอยู่</div>
        </div>
      `;
    })
    .join("");
}

function addWaitingItemEvents() {
  const waitingItems = document.querySelectorAll(".waiting-item");

  waitingItems.forEach((itemEl) => {
    itemEl.addEventListener("click", () => {
      const caseId = itemEl.dataset.id;
      const selectedCase = waitingCases.find((item) => item.id === caseId);

      if (selectedCase) {
        openPopup(selectedCase);
      }
    });
  });
}

function openPopup(item) {
  currentSelectedCase = item;

  popupCaseId.textContent = item.id || "-";
  popupLocation.textContent = item.location || "-";
  popupTitle.textContent = item.title || "-";
  popupDescription.textContent = item.description || "-";
  popupReporterName.textContent = item.reporterName || "-";
  popupReporterEmail.textContent = item.reporterEmail || "-";
  popupReporterId.textContent = item.reporterId || "-";
  popupReporterPhone.textContent = item.reporterPhone || "-";
  popupIncidentDate.textContent = item.incidentDate || "-";
  popupIncidentTime.textContent = item.incidentTime || "-";
  popupDepartmentSelect.value = item.department || "";
  popupNote.value = item.note || "";

  if (item.image && item.image.trim() !== "") {
    popupImage.src = item.image;
    popupImage.style.display = "block";
    popupImagePlaceholder.style.display = "none";
  } else {
    popupImage.src = "";
    popupImage.style.display = "none";
    popupImagePlaceholder.style.display = "flex";
  }

  complaintPopup.classList.add("show");
  popupOverlay.classList.add("show");
  complaintPopup.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closePopup() {
  complaintPopup.classList.remove("show");
  popupOverlay.classList.remove("show");
  complaintPopup.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function savePopupData() {
  if (!currentSelectedCase) return;

  currentSelectedCase.department = popupDepartmentSelect.value;
  currentSelectedCase.note = popupNote.value;

  alert("บันทึกการเปลี่ยนแปลงเรียบร้อย");
  closePopup();
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

if (popupSaveBtn) {
  popupSaveBtn.addEventListener("click", savePopupData);
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closePopup();
  }
});

renderWaitingCases();
renderDepartments();