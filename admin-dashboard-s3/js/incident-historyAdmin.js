// Admin – ประวัติแจ้งเหตุ (resolved incidents only).
let historyItems = [];
let currentSelectedHistory = null;

const historyList = document.getElementById("historyList");

let popupOverlay, incidentPopup, popupCloseBtn, popupCancelBtn, popupSaveBtn;
let popupCaseId, popupLocation, popupTitle, popupDescription;
let popupReporterName, popupReporterEmail, popupReporterId, popupReporterPhone;
let popupIncidentDate, popupIncidentTime, popupImage, popupImagePlaceholder;
let popupDepartmentSelect, popupNote;

async function fetchHistoryData() {
    try {
        const rawData = await window.AppAPI.loadCases();
        historyItems = rawData
            .filter(item => window.AppAPI.isIncident(item))
            .filter(item => {
                const s = (item.status || "").toLowerCase();
                return s === "resolved" || s === "completed" || s === "success" || s === "เสร็จสิ้น";
            })
            .map(mapDbToUI)
            .map(toHistoryRow);
        renderHistoryRows(historyItems);
    } catch (error) {
        console.error("Error fetching incident history:", error);
        if (historyList) historyList.innerHTML = `<p style="color:#c00;padding:24px;">โหลดข้อมูลไม่สำเร็จ: ${error.message}</p>`;
    }
}

function toHistoryRow(ui) {
    const date = ui.eventTimestamp ? ui.eventTimestamp.split("T")[0] : "-";
    const time = ui.eventTimestamp && ui.eventTimestamp.includes("T") ? ui.eventTimestamp.split("T")[1].slice(0, 8) : "-";
    return {
        ...ui,
        code: ui.id,
        subject: ui.title,
        date,
        time,
        receivedAgo: ui.timestamp ? formatTimestamp(ui.timestamp) : "-"
    };
}

function renderHistoryRows(data) {
    if (!historyList) return;
    if (!data.length) {
        historyList.innerHTML = `<p style="text-align:center;padding:24px;">ยังไม่มีประวัติเคสที่ปิดแล้ว</p>`;
        return;
    }
    historyList.innerHTML = data.map((item, index) => `
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
        </div>`).join("");
    document.querySelectorAll(".history-row").forEach(row => {
        row.addEventListener("click", () => openPopup(historyItems[row.dataset.index]));
    });
}

function openPopup(item) {
    if (!item) return;
    currentSelectedHistory = item;
    popupCaseId.textContent = item.code;
    popupLocation.textContent = item.location || "-";
    popupTitle.textContent = item.title || item.subject || "-";
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

async function savePopupData() {
    if (!currentSelectedHistory) return;
    const payload = {
        complaint_id: currentSelectedHistory.code,
        department: popupDepartmentSelect.value || "",
        note: popupNote.value || ""
    };
    popupSaveBtn.disabled = true;
    try {
        await window.AppAPI.updateCase(payload);
        currentSelectedHistory.department = payload.department;
        currentSelectedHistory.note = payload.note;
        alert("บันทึกการเปลี่ยนแปลงเรียบร้อย");
        closePopup();
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
    popup.className = "incident-popup";
    popup.id = "incidentPopup";
    popup.setAttribute("aria-hidden", "true");
    popup.innerHTML = `
        <div class="incident-popup-header">
          <div class="incident-popup-id" id="popupCaseId">-</div>
          <button class="incident-popup-close" id="popupCloseBtn" type="button" aria-label="ปิด">×</button>
        </div>
        <div class="incident-popup-body">
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
            <img id="popupImage" class="popup-image" src="" alt="incident image" />
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
    incidentPopup = popup;
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
fetchHistoryData();
