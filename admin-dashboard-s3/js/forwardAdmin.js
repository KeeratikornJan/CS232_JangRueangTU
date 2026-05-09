// Admin – หน้าส่งต่อหน่วยงาน (live data: cases without department).
const FORWARD_TAG = {
    "สถานที่": "tag-place", "บุคลากร": "tag-person",
    "รถโดยสาร": "tag-bus", "ระบบ IT": "tag-it",
    "อุปกรณ์อิเล็กทรอนิกส์": "tag-electronic",
    "ร้านค้า": "tag-shop", "อื่นๆ": "tag-other"
};

let waitingCases = [];
let currentSelectedCase = null;

const waitingList = document.getElementById("waitingList");
const departmentGrid = document.getElementById("departmentGrid");
const waitingCount = document.getElementById("waitingCount");

let popupOverlay, complaintPopup, popupCloseBtn, popupCancelBtn, popupSaveBtn;
let popupCaseId, popupLocation, popupTitle, popupDescription;
let popupReporterName, popupReporterEmail, popupReporterId, popupReporterPhone;
let popupIncidentDate, popupIncidentTime, popupImage, popupImagePlaceholder;
let popupDepartmentSelect, popupNote;

async function fetchForwardData() {
    try {
        const rawData = await window.AppAPI.loadCases();
        waitingCases = rawData
            .filter(item => !item.department)
            .map(mapDbToUI)
            .map(ui => ({ ...ui, tagClass: FORWARD_TAG[ui.category] || "tag-other" }));
        renderWaitingCases();
        renderDepartments(rawData);
    } catch (error) {
        console.error("Error fetching forward data:", error);
        if (waitingList) waitingList.innerHTML = `<p style="color:#c00;padding:24px;">โหลดข้อมูลไม่สำเร็จ: ${error.message}</p>`;
    }
}

function renderWaitingCases() {
    if (!waitingList || !waitingCount) return;
    waitingCount.textContent = `${waitingCases.length} เคส`;
    if (!waitingCases.length) {
        waitingList.innerHTML = `<p style="text-align:center;padding:24px;">ไม่มีเคสรอมอบหมาย</p>`;
        return;
    }
    waitingList.innerHTML = waitingCases.map(item => `
        <div class="waiting-item" data-id="${item.id}">
          <div class="waiting-bar"></div>
          <div class="waiting-content">
            <div class="waiting-title">${item.title}</div>
            <div class="tag-pill ${item.tagClass}">${item.category}</div>
          </div>
        </div>`).join("");
    document.querySelectorAll(".waiting-item").forEach(el => {
        el.addEventListener("click", () => {
            const item = waitingCases.find(c => c.id === el.dataset.id);
            if (item) openPopup(item);
        });
    });
}

function renderDepartments(rawData) {
    if (!departmentGrid) return;
    const counts = {};
    (window.DEPARTMENT_OPTIONS || []).forEach(name => { counts[name] = 0; });
    rawData.forEach(item => {
        const dept = item.department;
        if (dept) counts[dept] = (counts[dept] || 0) + 1;
    });
    departmentGrid.innerHTML = Object.entries(counts).map(([name, count]) => `
        <div class="department-card">
          <div class="department-name">${name}</div>
          <div class="department-count">${count}</div>
          <div class="department-subtext">เคสที่รับอยู่</div>
        </div>`).join("");
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
    if (item.image && item.image.trim()) {
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

async function savePopupData() {
    if (!currentSelectedCase) return;
    const dept = popupDepartmentSelect.value || "";
    if (!dept) { alert("กรุณาเลือกหน่วยงาน"); return; }
    const payload = {
        complaint_id: currentSelectedCase.id,
        department: dept,
        note: popupNote.value || "",
        status: "in_progress"
    };
    popupSaveBtn.disabled = true;
    try {
        await window.AppAPI.updateCase(payload);
        alert("ส่งต่อหน่วยงานเรียบร้อย");
        closePopup();
        window.AppAPI.invalidate();
        fetchForwardData();
    } catch (err) {
        alert("บันทึกไม่สำเร็จ: " + err.message);
    } finally {
        popupSaveBtn.disabled = false;
    }
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
            <div class="popup-location"><span class="popup-location-icon">📍</span><span id="popupLocation">-</span></div>
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
            <img id="popupImage" class="popup-image" src="" alt="complaint image" />
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
fetchForwardData();
