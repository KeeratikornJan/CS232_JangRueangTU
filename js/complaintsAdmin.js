const complaints = [
  {
    id: "GU-5868544001",
    title: "เครื่องปรับอากาศในห้องสมุดเสียงดังและไม่เย็น...",
    category: "สถานที่",
    status: "ใหม่",
    time: "1 ชม.",
    location: "ห้องสมุดกลาง ชั้น 2",
    fullTitle: "เครื่องปรับอากาศในห้องสมุดเสียงดังและไม่เย็นมา 1 สัปดาห์",
    description:
      "พบเครื่องปรับอากาศบริเวณโซนนั่งอ่านหนังสือ ชั้น 2 ห้องสมุดกลาง ส่งเสียงดังรบกวนสมาธิ และอุณหภูมิไม่เย็นเหมือนปกติ ต่อเนื่องมาประมาณ 1 สัปดาห์แล้ว",
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
    id: "GU-5868544003",
    title: "พบสุนัขจรจัดไล่กวดนักศึกษาบริเวณโรงอาหาร...",
    category: "อื่นๆ",
    status: "ใหม่",
    time: "2 ชม.",
    location: "โรงอาหารกลาง",
    fullTitle: "พบสุนัขจรจัดไล่กวดนักศึกษาบริเวณโรงอาหารกลาง",
    description:
      "มีสุนัขจรจัดหลายตัวบริเวณโรงอาหารกลาง และมีพฤติกรรมวิ่งไล่นักศึกษาบางคน ทำให้รู้สึกไม่ปลอดภัย และควรมีการเข้าตรวจสอบโดยด่วน",
    reporterName: "กิตติภพ ใจดี",
    reporterEmail: "kittipob@email.com",
    reporterId: "1-1234-56789-00-1",
    reporterPhone: "089-111-2233",
    incidentDate: "24 / 04 / 2569",
    incidentTime: "18:20:00",
    department: "",
    note: "",
    image: ""
  },
  {
    id: "GU-5868544002",
    title: "เจ้าหน้าที่หน่วยงาน XXX พูดจาไม่สุภาพขณะ...",
    category: "บุคลากร",
    status: "กำลังดำเนิน",
    time: "5 ชม.",
    location: "อาคารสำนักงานกลาง",
    fullTitle: "เจ้าหน้าที่หน่วยงาน XXX พูดจาไม่สุภาพขณะให้บริการ",
    description:
      "ขณะติดต่อขอเอกสาร เจ้าหน้าที่มีน้ำเสียงไม่สุภาพ และแสดงอารมณ์ไม่เหมาะสมกับผู้มาติดต่อ ทำให้รู้สึกไม่สบายใจในการรับบริการ",
    reporterName: "พิมพ์ชนก สุขใจ",
    reporterEmail: "pimchanok@email.com",
    reporterId: "1-5555-44444-33-2",
    reporterPhone: "086-000-9876",
    incidentDate: "23 / 04 / 2569",
    incidentTime: "10:15:22",
    department: "",
    note: "",
    image: ""
  },
  {
    id: "GU-5868544004",
    title: "ไฟส่องสว่างทางเดินหอพักหญิงขาด ทำให้...",
    category: "สถานที่",
    status: "เสร็จสิ้น",
    time: "18 ชม.",
    location: "หอพักหญิง",
    fullTitle: "ไฟส่องสว่างทางเดินหอพักหญิงขาด ทำให้แสงไม่เพียงพอ",
    description:
      "บริเวณทางเดินด้านข้างหอพักหญิงมีไฟดับหลายดวงในช่วงเวลากลางคืน ทำให้พื้นที่ค่อนข้างมืด และอาจก่อให้เกิดอันตรายได้",
    reporterName: "นภัสสร ภูมิใจ",
    reporterEmail: "napatsorn@email.com",
    reporterId: "1-2222-33333-44-5",
    reporterPhone: "082-765-8888",
    incidentDate: "22 / 04 / 2569",
    incidentTime: "20:40:15",
    department: "",
    note: "",
    image: ""
  },
  {
    id: "GU-5868544005",
    title: "สัญญาณ Wi-Fi บริเวณโดมชั้น 1 ติด เรียนรวม...",
    category: "ระบบ IT",
    status: "เสร็จสิ้น",
    time: "1 วัน",
    location: "โดมชั้น 1 ตึกเรียนรวม",
    fullTitle: "สัญญาณ Wi-Fi บริเวณโดมชั้น 1 ตึกเรียนรวมใช้งานไม่ได้",
    description:
      "สัญญาณอินเทอร์เน็ตไร้สายบริเวณโดมชั้น 1 ตึกเรียนรวม ขาดหายเป็นระยะ และในบางช่วงไม่สามารถเชื่อมต่อได้เลย",
    reporterName: "ธนพล ตั้งใจ",
    reporterEmail: "tanapon@email.com",
    reporterId: "1-9999-88888-77-6",
    reporterPhone: "095-456-1200",
    incidentDate: "21 / 04 / 2569",
    incidentTime: "13:11:09",
    department: "",
    note: "",
    image: ""
  },
  {
    id: "GU-5868544006",
    title: "รถโดยสาร EV ทิ้งช่วงนานเกินไปใน รถโดยสาร...",
    category: "รถโดยสาร",
    status: "กำลังดำเนิน",
    time: "2 วัน",
    location: "จุดรับส่งหน้าอาคารเรียน",
    fullTitle: "รถโดยสาร EV ทิ้งช่วงนานเกินไปในช่วงเวลาเร่งด่วน",
    description:
      "รถ EV Shuttle ช่วงเวลาบ่ายมีจำนวนรอบไม่เพียงพอ ทำให้นักศึกษารอรถเป็นเวลานาน และเกิดความแออัดบริเวณจุดจอด",
    reporterName: "มนัสวี ตั้งตระกูล",
    reporterEmail: "manasvee@email.com",
    reporterId: "1-2345-67890-12-3",
    reporterPhone: "081-876-8899",
    incidentDate: "20 / 04 / 2569",
    incidentTime: "15:35:10",
    department: "",
    note: "",
    image: ""
  },
  {
    id: "GU-5868544007",
    title: "ไมโครโฟนในห้องบรรยาย 4201 อุปกรณ์อิเล็ก...",
    category: "อุปกรณ์อิเล็กทรอนิกส์",
    status: "เสร็จสิ้น",
    time: "3 วัน",
    location: "ห้องบรรยาย 4201",
    fullTitle: "ไมโครโฟนในห้องบรรยาย 4201 อุปกรณ์มีปัญหาเสียงขาด ๆ หาย ๆ",
    description:
      "ไมโครโฟนที่ใช้ในการสอนมีปัญหาเสียงขาดหาย และมีเสียงรบกวน ทำให้เรียนไม่ต่อเนื่องและผู้เรียนได้ยินไม่ชัด",
    reporterName: "รวิภา สุขสันต์",
    reporterEmail: "rawipa@email.com",
    reporterId: "1-1010-20202-30-4",
    reporterPhone: "084-321-4321",
    incidentDate: "19 / 04 / 2569",
    incidentTime: "09:05:48",
    department: "",
    note: "",
    image: ""
  },
  {
    id: "GU-5868544008",
    title: "ร้านค้าในโรงอาหารกลางขายอาหาร ร้านค้า...",
    category: "ร้านค้า",
    status: "กำลังดำเนิน",
    time: "3 วัน",
    location: "โรงอาหารกลาง",
    fullTitle: "ร้านค้าในโรงอาหารกลางขายอาหารราคาไม่ตรงป้าย",
    description:
      "พบว่าราคาที่คิดเงินจริงไม่ตรงกับป้ายหน้าร้านในบางเมนู จึงอยากให้มีการตรวจสอบเพื่อความเป็นธรรมแก่ผู้ใช้บริการ",
    reporterName: "ศิริลักษณ์ ทองดี",
    reporterEmail: "siriluck@email.com",
    reporterId: "1-4000-12345-67-8",
    reporterPhone: "080-123-9876",
    incidentDate: "18 / 04 / 2569",
    incidentTime: "12:10:33",
    department: "",
    note: "",
    image: ""
  },
  {
    id: "GU-5868544009",
    title: "พบขยะตกค้างบริเวณถังขยะหน้าคณะ สถานที่...",
    category: "สถานที่",
    status: "เสร็จสิ้น",
    time: "4 วัน",
    location: "หน้าคณะ",
    fullTitle: "พบขยะตกค้างบริเวณถังขยะหน้าคณะ สภาพไม่สะอาด",
    description:
      "มีขยะล้นและตกค้างรอบถังขยะหน้าคณะหลายจุด ส่งกลิ่นรบกวน และดูไม่เรียบร้อย ควรมีเจ้าหน้าที่เข้ามาจัดการ",
    reporterName: "อภิญญา รัตน์งาม",
    reporterEmail: "apinya@email.com",
    reporterId: "1-8765-54321-09-8",
    reporterPhone: "083-654-2222",
    incidentDate: "17 / 04 / 2569",
    incidentTime: "07:45:00",
    department: "",
    note: "",
    image: ""
  }
];

const tableBody = document.getElementById("complaintTableBody");
const filterButtons = document.querySelectorAll(".filter-btn");
const categoryFilter = document.getElementById("categoryFilter");

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

let currentStatusFilter = "ทั้งหมด";
let currentCategoryFilter = "ทั้งหมด";
let currentSelectedComplaint = null;

function getStatusClass(status) {
  if (status === "ใหม่") return "status-new";
  if (status === "กำลังดำเนิน") return "status-progress";
  return "status-done";
}

function getStatusLabel(status) {
  if (status === "กำลังดำเนิน") {
    return "กำลัง...";
  }
  return status;
}

function filterComplaints() {
  return complaints.filter((item) => {
    const matchStatus =
      currentStatusFilter === "ทั้งหมด" || item.status === currentStatusFilter;

    const matchCategory =
      currentCategoryFilter === "ทั้งหมด" || item.category === currentCategoryFilter;

    return matchStatus && matchCategory;
  });
}

function renderComplaints(data) {
  tableBody.innerHTML = data
    .map((item) => {
      return `
        <tr class="complaint-row" data-id="${item.id}">
          <td>${item.id}</td>
          <td><span class="title-text">${item.title}</span></td>
          <td>${item.category}</td>
          <td>
            <span class="status-pill ${getStatusClass(item.status)}">
              ${getStatusLabel(item.status)}
            </span>
          </td>
          <td><span class="time-text">${item.time}</span></td>
        </tr>
      `;
    })
    .join("");

  addRowClickEvents();
}

function addRowClickEvents() {
  const rows = document.querySelectorAll(".complaint-row");

  rows.forEach((row) => {
    row.addEventListener("click", () => {
      const complaintId = row.dataset.id;
      const selectedComplaint = complaints.find((item) => item.id === complaintId);

      if (selectedComplaint) {
        openPopup(selectedComplaint);
      }
    });
  });
}

function openPopup(item) {
  currentSelectedComplaint = item;

  popupCaseId.textContent = item.id;
  popupLocation.textContent = item.location || "-";
  popupTitle.textContent = item.fullTitle || item.title;
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
  if (!currentSelectedComplaint) return;

  currentSelectedComplaint.department = popupDepartmentSelect.value;
  currentSelectedComplaint.note = popupNote.value;

  alert("บันทึกการเปลี่ยนแปลงเรียบร้อย");
  closePopup();
}

function updateView() {
  const filteredData = filterComplaints();
  renderComplaints(filteredData);
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentStatusFilter = button.dataset.filter;

    filterButtons.forEach((btn) => btn.classList.remove("active-filter"));
    button.classList.add("active-filter");

    updateView();
  });
});

categoryFilter.addEventListener("change", (event) => {
  currentCategoryFilter = event.target.value;
  updateView();
});

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

updateView();