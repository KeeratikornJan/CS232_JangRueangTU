// Admin – หน้าร้องเรียน (live data table).
let complaints = [];
let currentStatusFilter = "ทั้งหมด";
let currentCategoryFilter = "ทั้งหมด";
let currentSelectedComplaint = null;

const tableBody = document.getElementById("complaintTableBody");
const filterButtons = document.querySelectorAll(".filter-btn");
const categoryFilter = document.getElementById("categoryFilter");

let popupOverlay, complaintPopup, popupCloseBtn, popupCancelBtn, popupSaveBtn;
let popupCaseId, popupLocation, popupTitle, popupDescription;
let popupReporterName, popupReporterEmail, popupReporterId, popupReporterPhone;
let popupIncidentDate, popupIncidentTime, popupImage, popupImagePlaceholder;
let popupDepartmentSelect, popupNote;

async function fetchComplaintsData() {
    try {
        const rawData = await window.AppAPI.loadCases();
        complaints = rawData.filter(item => window.AppAPI.isComplaint(item)).map(mapDbToUI);
        updateView();
    } catch (error) {
        console.error("Error fetching complaints:", error);
        if (tableBody) tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#c00;padding:24px;">โหลดข้อมูลไม่สำเร็จ: ${error.message}</td></tr>`;
    }
}

function filterComplaints() {
    return complaints.filter(item => {
        const s = (item.status || "").toLowerCase();
        let normalized = item.status;
        if (s === "ใหม่" || s === "pending" || s === "รอดำเนินการ") normalized = "ใหม่";
        else if (s === "กำลังดำเนิน" || s === "in_progress" || s === "กำลังดำเนินการ") normalized = "กำลังดำเนิน";
        else if (s === "เสร็จสิ้น" || s === "resolved" || s === "completed") normalized = "เสร็จสิ้น";
        const matchStatus = currentStatusFilter === "ทั้งหมด" || normalized === currentStatusFilter;
        const matchCategory = currentCategoryFilter === "ทั้งหมด" || item.category === currentCategoryFilter;
        return matchStatus && matchCategory;
    }).sort((a, b) => {
        const toMs = ts => { if (!ts) return 0; const t = new Date(ts).getTime(); return isNaN(t) ? 0 : t; };
        return toMs(b.eventTimestamp || b.timestamp) - toMs(a.eventTimestamp || a.timestamp);
    });
}

function renderComplaints(data) {
    if (!tableBody) return;
    if (!data.length) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px;">ไม่พบรายการ</td></tr>`;
        return;
    }
    tableBody.innerHTML = data.map(item => `
        <tr class="complaint-row" data-id="${item.id}">
          <td>${item.id}</td>
          <td><span class="title-text">${item.title}</span></td>
          <td>${item.category}</td>
          <td><span class="status-pill ${getStatusClass(item.status)}">${getStatusLabel(item.status)}</span></td>
          <td><span class="time-text">${item.time}</span></td>
        </tr>`).join("");
    addRowClickEvents();
}

function addRowClickEvents() {
    document.querySelectorAll(".complaint-row").forEach(row => {
        row.addEventListener("click", () => {
            const selected = complaints.find(item => item.id === row.dataset.id);
            if (selected) openPopup(selected);
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
    if (item.image && item.image.trim()) {
        setCaseImage(popupImage, item.image);
        popupImage.style.display = "block";
        popupImagePlaceholder.style.display = "none";
    } else {
        setCaseImage(popupImage, "");
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

async function savePopupData() {
    if (!currentSelectedComplaint) return;
    const payload = {
        complaint_id: currentSelectedComplaint.id,
        department: popupDepartmentSelect.value || "",
        note: popupNote.value || ""
    };
    popupSaveBtn.disabled = true;
    try {
        await window.AppAPI.updateCase(payload);
        currentSelectedComplaint.department = payload.department;
        currentSelectedComplaint.note = payload.note;
        alert("บันทึกการเปลี่ยนแปลงเรียบร้อย");
        closePopup();
    } catch (err) {
        alert("บันทึกไม่สำเร็จ: " + err.message);
    } finally {
        popupSaveBtn.disabled = false;
    }
}

function updateView() { renderComplaints(filterComplaints()); }

filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        currentStatusFilter = button.dataset.filter;
        filterButtons.forEach(btn => btn.classList.remove("active-filter"));
        button.classList.add("active-filter");
        updateView();
    });
});

if (categoryFilter) {
    categoryFilter.addEventListener("change", e => {
        currentCategoryFilter = e.target.value;
        updateView();
    });
}

function deptOptionsHtml() {
    return `<option value="" disabled selected hidden>กรุณาเลือกหน่วยงาน</option>`
        + (window.DEPARTMENT_OPTIONS || []).map(d => `<option value="${d}">${d}</option>`).join("");
}

function createPopup() {
    const overlay = document.createElement("div");
    overlay.className = "popup-overlay";
    overlay.id = "popupOverlay";

    const popup = document.createElement("aside");
    popup.className = "complaint-popup";
    popup.id = "complaintPopup";
    popup.setAttribute("aria-hidden", "true");
    popup.innerHTML = `
        <div class="complaint-popup-header">
          <div class="complaint-popup-id" id="popupCaseId">-</div>
          <button class="complaint-popup-close" id="popupCloseBtn" type="button" aria-label="ปิด">×</button>
        </div>
        <div class="complaint-popup-body">
          <div class="popup-top-row">
            <div class="popup-section-label">รายละเอียดเคส</div>
            <div class="popup-location">
              <span class="popup-location-icon">📍</span>
              <span id="popupLocation">-</span>
            </div>
          </div>
          <div class="popup-divider"></div>
          <div class="popup-section">
            <div class="popup-section-label">หัวข้อ</div>
            <div class="popup-section-text popup-strong" id="popupTitle">-</div>
          </div>
          <div class="popup-section">
            <div class="popup-section-label">รายละเอียด</div>
            <div class="popup-section-text" id="popupDescription">-</div>
          </div>
          <div class="popup-section">
            <div class="popup-section-label">ผู้แจ้ง</div>
            <div class="popup-section-text popup-reporter-info">
              <div><span class="popup-strong">ชื่อ-สกุล :</span> <span id="popupReporterName">-</span></div>
              <div><span class="popup-strong">Email :</span> <span id="popupReporterEmail">-</span></div>
              <div><span class="popup-strong">หมายเลขบัตรประชาชน :</span> <span id="popupReporterId">-</span></div>
              <div><span class="popup-strong">เบอร์มือถือ :</span> <span id="popupReporterPhone">-</span></div>
            </div>
          </div>
          <div class="popup-section">
            <div class="popup-section-label">ข้อมูลแจ้งเหตุ</div>
            <div class="popup-section-text popup-incident-info">
              <div><span class="popup-strong">วันที่เกิดเหตุ :</span> <span id="popupIncidentDate">-</span></div>
              <div><span class="popup-strong">เวลาที่เกิดเหตุ :</span> <span id="popupIncidentTime">-</span></div>
            </div>
          </div>
          <div class="popup-image-box">
            <img id="popupImage" class="popup-image" src="" alt="complaint image" crossorigin="anonymous" referrerpolicy="no-referrer" />
            <div class="popup-image-placeholder" id="popupImagePlaceholder"><span class="popup-image-icon">🖼️</span></div>
          </div>
          <div class="popup-form-card">
            <label class="popup-form-label" for="popupDepartmentSelect">มอบหมายหน่วยงาน</label>
            <select id="popupDepartmentSelect" class="popup-select">${deptOptionsHtml()}</select>
          </div>
          <div class="popup-form-card">
            <label class="popup-form-label" for="popupNote">บันทึกเพิ่มเติม (ไม่บังคับ)</label>
            <textarea id="popupNote" class="popup-textarea" placeholder="เช่น ติดต่อหน่วยงานแล้ว รอการตอบกลับ......"></textarea>
          </div>
          <div class="popup-actions">
            <button class="popup-btn popup-btn-success" type="button" id="popupSaveBtn">บันทึกการเปลี่ยนแปลง</button>
            <button class="popup-btn popup-btn-danger"  type="button" id="popupCancelBtn">ยกเลิก</button>
          </div>
        </div>`;

    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    popupOverlay = overlay;
    complaintPopup = popup;
    popupCloseBtn = document.getElementById("popupCloseBtn");
    popupCancelBtn = document.getElementById("popupCancelBtn");
    popupSaveBtn = document.getElementById("popupSaveBtn");
    popupCaseId = document.getElementById("popupCaseId");
    popupLocation = document.getElementById("popupLocation");
    popupTitle = document.getElementById("popupTitle");
    popupDescription = document.getElementById("popupDescription");
    popupReporterName = document.getElementById("popupReporterName");
    popupReporterEmail = document.getElementById("popupReporterEmail");
    popupReporterId = document.getElementById("popupReporterId");
    popupReporterPhone = document.getElementById("popupReporterPhone");
    popupIncidentDate = document.getElementById("popupIncidentDate");
    popupIncidentTime = document.getElementById("popupIncidentTime");
    popupImage = document.getElementById("popupImage");
    popupImagePlaceholder = document.getElementById("popupImagePlaceholder");
    popupDepartmentSelect = document.getElementById("popupDepartmentSelect");
    popupNote = document.getElementById("popupNote");

    popupCloseBtn.addEventListener("click", closePopup);
    popupCancelBtn.addEventListener("click", closePopup);
    overlay.addEventListener("click", closePopup);
    popupSaveBtn.addEventListener("click", savePopupData);
    document.addEventListener("keydown", e => { if (e.key === "Escape") closePopup(); });
}

createPopup();
fetchComplaintsData();
