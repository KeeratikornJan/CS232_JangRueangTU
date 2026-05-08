const API_URL = ""; // ใส่ API endpoint จริงที่นี่

const incidentGrid = document.getElementById("incidentGrid");
const sortSelect   = document.getElementById("sortSelect");

let popupOverlay, incidentPopup, popupCloseBtn, popupCancelBtn, popupSaveBtn;
let popupCaseId, popupLocation, popupTitle, popupDescription;
let popupReporterName, popupReporterEmail, popupReporterId, popupReporterPhone;
let popupIncidentDate, popupIncidentTime, popupImage, popupImagePlaceholder;
let popupDepartmentSelect, popupNote;

let incidents = [];
let currentSelectedIncident = null;

async function fetchIncidentsData() {
    try {
        let rawData;
        if (API_URL) {
            const response = await fetch(API_URL);
            rawData = await response.json();
        } else {
            rawData = MOCK_INCIDENTS_API;
        }
        incidents = rawData.filter(item => item.incident_id).map(item => mapDbToUI(item));
        sortIncidents();
    } catch (error) {
        console.error("Error fetching incidents:", error);
        incidents = MOCK_INCIDENTS_API.map(item => mapDbToUI(item));
        sortIncidents();
    }
}

function renderIncidents(data) {
    incidentGrid.innerHTML = data.map(item => `
        <article class="incident-card" data-id="${item.id}" style="cursor:pointer;">
          <div class="incident-card-header">
            ${item.id} : ${item.title}
          </div>
          <div class="incident-card-body">
            <div class="location-line">
              <span class="location-pin">📍</span>${item.location}
            </div>
            <div class="incident-desc">${item.description}</div>

            <div class="info-title">ข้อมูลผู้แจ้งเหตุ</div>
            <div class="info-line"><span class="info-label">ชื่อ-สกุล :</span> ${item.reporterName}</div>
            <div class="info-line"><span class="info-label">หมายเลขบัตรประชาชน :</span> ${item.reporterId}</div>
            <div class="info-line"><span class="info-label">เบอร์มือถือ :</span> ${item.reporterPhone}</div>

            <hr class="card-divider">

            <div class="info-title">ข้อมูลแจ้งเหตุ</div>
            <div class="info-line"><span class="info-label">วันที่เกิดเหตุ :</span> ${item.incidentDate}</div>
            <div class="info-line"><span class="info-label">เวลาที่เกิดเหตุ :</span> ${item.incidentTime}</div>

            <div class="image-box">
              <div class="image-icon">🖼️</div>
            </div>

            <div class="card-action">
              <button class="receive-btn" type="button" data-id="${item.id}">รับเรื่อง</button>
            </div>
          </div>
        </article>
    `).join("");
    attachCardEvents();
}

function attachCardEvents() {
    document.querySelectorAll(".incident-card").forEach(card => {
        card.addEventListener("click", (e) => {
            if (e.target.closest(".receive-btn")) return;
            const item = incidents.find(i => i.id === card.dataset.id);
            if (item) openPopup(item);
        });
    });
    document.querySelectorAll(".receive-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const item = incidents.find(i => i.id === btn.dataset.id);
            if (item) openPopup(item);
        });
    });
}

function openPopup(item) {
    currentSelectedIncident        = item;
    popupCaseId.textContent        = item.id;
    popupLocation.textContent      = item.location      || "-";
    popupTitle.textContent         = item.title         || "-";
    popupDescription.textContent   = item.description   || "-";
    popupReporterName.textContent  = item.reporterName  || "-";
    popupReporterEmail.textContent = item.reporterEmail || "-";
    popupReporterId.textContent    = item.reporterId    || "-";
    popupReporterPhone.textContent = item.reporterPhone || "-";
    popupIncidentDate.textContent  = item.incidentDate  || "-";
    popupIncidentTime.textContent  = item.incidentTime  || "-";
    popupDepartmentSelect.value    = item.department    || "";
    popupNote.value                = item.note          || "";
    if (item.image && item.image.trim() !== "") {
        popupImage.src = item.image;
        popupImage.style.display = "block";
        popupImagePlaceholder.style.display = "none";
    } else {
        popupImage.src = "";
        popupImage.style.display = "none";
        popupImagePlaceholder.style.display = "flex";
    }
    incidentPopup.classList.add("show");
    popupOverlay.classList.add("show");
    incidentPopup.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
}

function closePopup() {
    incidentPopup.classList.remove("show");
    popupOverlay.classList.remove("show");
    incidentPopup.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
}

function savePopupData() {
    if (!currentSelectedIncident) return;
    currentSelectedIncident.department = popupDepartmentSelect.value;
    currentSelectedIncident.note       = popupNote.value;
    alert("บันทึกการเปลี่ยนแปลงเรียบร้อย");
    closePopup();
}

function toMs(ts) {
    if (!ts) return 0;
    const t = new Date(ts).getTime();
    return isNaN(t) ? 0 : t;
}

function sortIncidents() {
    const oldest = sortSelect.value === "oldest";
    const sorted = [...incidents].sort((a, b) => {
        const tA = toMs(a.eventTimestamp || a.timestamp);
        const tB = toMs(b.eventTimestamp || b.timestamp);
        return oldest ? tA - tB : tB - tA;
    });
    renderIncidents(sorted);
}

sortSelect.addEventListener("change", sortIncidents);

function createPopup() {
    const DEPT_OPTIONS = `
        <option value="" disabled selected hidden>กรุณาเลือกหน่วยงาน</option>
        <option value="กองบริการการศึกษา">กองบริการการศึกษา</option>
        <option value="ฝ่ายบุคคล">ฝ่ายบุคคล</option>
        <option value="กองกลาง (งานพัสดุและโสตฯ)">กองกลาง (งานพัสดุและโสตฯ)</option>
        <option value="กองอาคารสถานที่">กองอาคารสถานที่</option>
        <option value="ศูนย์บริหารจัดการทรัพย์สิน">ศูนย์บริหารจัดการทรัพย์สิน</option>
        <option value="สำนักงานนวัตกรรมดิจิทัล (IT)">สำนักงานนวัตกรรมดิจิทัล (IT)</option>
        <option value="กองจัดการความปลอดภัย (รปภ.)">กองจัดการความปลอดภัย (รปภ.)</option>
        <option value="หน่วยงานขนส่ง (EV Shuttle)">หน่วยงานขนส่ง (EV Shuttle)</option>
        <option value="อื่นๆ">อื่นๆ</option>`;

    const overlay = document.createElement("div");
    overlay.className = "popup-overlay";
    overlay.id = "popupOverlay";

    const popup = document.createElement("aside");
    popup.className = "complaint-popup";
    popup.id = "incidentPopup";
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
            <img id="popupImage" class="popup-image" src="" alt="incident image" />
            <div class="popup-image-placeholder" id="popupImagePlaceholder">
              <span class="popup-image-icon">🖼️</span>
            </div>
          </div>
          <div class="popup-form-card">
            <label class="popup-form-label" for="popupDepartmentSelect">มอบหมายหน่วยงาน</label>
            <select id="popupDepartmentSelect" class="popup-select">${DEPT_OPTIONS}</select>
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

    popupOverlay          = overlay;
    incidentPopup         = popup;
    popupCloseBtn         = document.getElementById("popupCloseBtn");
    popupCancelBtn        = document.getElementById("popupCancelBtn");
    popupSaveBtn          = document.getElementById("popupSaveBtn");
    popupCaseId           = document.getElementById("popupCaseId");
    popupLocation         = document.getElementById("popupLocation");
    popupTitle            = document.getElementById("popupTitle");
    popupDescription      = document.getElementById("popupDescription");
    popupReporterName     = document.getElementById("popupReporterName");
    popupReporterEmail    = document.getElementById("popupReporterEmail");
    popupReporterId       = document.getElementById("popupReporterId");
    popupReporterPhone    = document.getElementById("popupReporterPhone");
    popupIncidentDate     = document.getElementById("popupIncidentDate");
    popupIncidentTime     = document.getElementById("popupIncidentTime");
    popupImage            = document.getElementById("popupImage");
    popupImagePlaceholder = document.getElementById("popupImagePlaceholder");
    popupDepartmentSelect = document.getElementById("popupDepartmentSelect");
    popupNote             = document.getElementById("popupNote");

    popupCloseBtn.addEventListener("click", closePopup);
    popupCancelBtn.addEventListener("click", closePopup);
    overlay.addEventListener("click", closePopup);
    popupSaveBtn.addEventListener("click", savePopupData);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePopup(); });
}

createPopup();
fetchIncidentsData();
