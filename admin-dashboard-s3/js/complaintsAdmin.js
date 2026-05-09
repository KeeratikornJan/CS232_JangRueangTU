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

// Lower number = higher priority. "รอดำเนินการ" / pending must always lead.
function statusPriority(status) {
    const s = (status || "").toLowerCase();
    if (s === "ใหม่" || s === "pending" || s === "รอดำเนินการ") return 0;
    if (s === "กำลังดำเนิน" || s === "in_progress" || s === "กำลังดำเนินการ") return 1;
    if (s === "เสร็จสิ้น" || s === "resolved" || s === "completed" || s === "success") return 2;
    return 3;
}

// The DB `timestamp` is the canonical recency signal — set by the Lambda when
// the record is created. It arrives as ISO-8601 with microseconds and an
// offset, e.g. "2026-05-09T06:21:33.653229+00:00". Older Safari / embedded
// WebViews reject 6-digit fractional seconds and produce `Invalid Date`,
// silently breaking the sort. Strip everything after the first dot, drop a
// trailing "Z" if present, and Date can parse the remainder everywhere.
const parseTime = (item) => {
    const dateStr = (item && (item.timestamp || item.event_time || item.eventTimestamp)) || 0;
    if (!dateStr) return 0;
    // Strip everything after the dot to handle microseconds
    const cleanStr = dateStr.toString().split('.')[0].replace('Z', '');
    const ts = new Date(cleanStr).getTime();
    return isNaN(ts) ? 0 : ts;
};

function filterComplaints() {
    const filtered = complaints.filter(item => {
        const s = (item.status || "").toLowerCase();
        let normalized = item.status;
        if (s === "ใหม่" || s === "pending" || s === "รอดำเนินการ") normalized = "ใหม่";
        else if (s === "กำลังดำเนิน" || s === "in_progress" || s === "กำลังดำเนินการ") normalized = "กำลังดำเนิน";
        else if (s === "เสร็จสิ้น" || s === "resolved" || s === "completed" || s === "success") normalized = "เสร็จสิ้น";
        const matchStatus = currentStatusFilter === "ทั้งหมด" || normalized === currentStatusFilter;
        const matchCategory = currentCategoryFilter === "ทั้งหมด" || item.category === currentCategoryFilter;
        return matchStatus && matchCategory;
    });

    // Verification: log the subject + computed timestamp for each item so the
    // sort key can be inspected in the browser console.
    console.groupCollapsed("[complaintsAdmin] sort keys");
    filtered.forEach(item => {
        console.log(
            `subject="${item.title || item.subject || ""}"`,
            "status=", item.status,
            "parseTime=", parseTime(item),
            "(", new Date(parseTime(item)).toISOString(), ")"
        );
    });
    console.groupEnd();

    return filtered.sort((a, b) => {
        // 1st Criteria: status (Pending = 1, In Progress = 2, Resolved = 3).
        const pa = statusPriority(a.status);
        const pb = statusPriority(b.status);
        if (pa !== pb) return pa - pb;
        // 2nd Criteria: parseTime(item) descending — newest first.
        return parseTime(b) - parseTime(a);
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
    const dept = popupDepartmentSelect.value || "";
    if (!dept) { alert("กรุณาเลือกหน่วยงาน"); return; }
    // Assigning a department implicitly transitions the case to "in_progress".
    const payload = {
        complaint_id: currentSelectedComplaint.id,
        department: dept,
        note: popupNote.value || "",
        status: "in_progress"
    };
    popupSaveBtn.disabled = true;
    try {
        await window.AppAPI.updateCase(payload);
        currentSelectedComplaint.department = payload.department;
        currentSelectedComplaint.note = payload.note;
        currentSelectedComplaint.status = payload.status;
        if (currentSelectedComplaint.raw) {
            currentSelectedComplaint.raw.department = payload.department;
            currentSelectedComplaint.raw.note = payload.note;
            currentSelectedComplaint.raw.status = payload.status;
        }
        alert("บันทึกการเปลี่ยนแปลงเรียบร้อย");
        closePopup();
        updateView();
        if (window.AppAPI && window.AppAPI.invalidate) window.AppAPI.invalidate();
        if (typeof refreshSidebarCounts === "function") refreshSidebarCounts();
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
