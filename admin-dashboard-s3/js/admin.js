// Shared admin utilities: status mapping, category colours, DB-to-UI translator.

const CATEGORY_COLORS = {
    "สถานที่": "#ff9800",
    "บุคลากร": "#e056f1",
    "รถโดยสาร": "#56c108",
    "ระบบ IT": "#a4b800",
    "อุปกรณ์อิเล็กทรอนิกส์": "#c438e8",
    "ร้านค้า": "#18c4c7",
    "อื่นๆ": "#ff0b67",
    "แจ้งเหตุ": "#ff0b67"
};

const CATEGORY_CLASS_MAP = {
    "สถานที่": "tag-category1",
    "บุคลากร": "tag-category2",
    "รถโดยสาร": "tag-category3",
    "ระบบ IT": "tag-category4",
    "อุปกรณ์อิเล็กทรอนิกส์": "tag-category5",
    "ร้านค้า": "tag-category6",
    "อื่นๆ": "tag-category7"
};

function formatTimestamp(ts) {
    try {
        const past = new Date(ts);
        const diffSec = Math.floor((Date.now() - past.getTime()) / 1000);
        if (isNaN(diffSec)) return "-";
        if (diffSec < 60) return "เมื่อสักครู่";
        const diffMin = Math.floor(diffSec / 60);
        if (diffMin < 60) return `${diffMin} นาที`;
        const diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24) return `${diffHr} ชม.`;
        const diffDay = Math.floor(diffHr / 24);
        if (diffDay < 30) return `${diffDay} วัน`;
        const diffMon = Math.floor(diffDay / 30);
        if (diffMon < 12) return `${diffMon} เดือน`;
        return `${Math.floor(diffDay / 365)} ปี`;
    } catch { return ts; }
}

function getStatusClass(status) {
    const s = (status || "").toLowerCase();
    if (s === "ใหม่" || s === "pending" || s === "รอดำเนินการ") return "status-new";
    if (s === "กำลังดำเนิน" || s === "in_progress" || s === "กำลังดำเนินการ") return "status-progress";
    return "status-done";
}

function getStatusLabel(status) {
    const s = (status || "").toLowerCase();
    if (s === "กำลังดำเนิน" || s === "in_progress" || s === "กำลังดำเนินการ") return "กำลัง...";
    if (s === "ใหม่" || s === "pending" || s === "รอดำเนินการ") return "ใหม่";
    if (s === "เสร็จสิ้น" || s === "resolved" || s === "completed" || s === "success") return "เสร็จสิ้น";
    return status;
}

function caseId(item) {
    return item.complaint_id || item.incident_id || "-";
}

function mapDbToUI(item) {
    const id = caseId(item);
    const isComp = window.AppAPI ? window.AppAPI.isComplaint(item) : (item.type === "complaint");
    return {
        id,
        type: isComp ? "complaint" : "incident",
        title: item.subject || "ไม่มีหัวข้อ",
        fullTitle: item.subject || "ไม่มีหัวข้อ",
        category: item.category || "อื่นๆ",
        status: item.status || "pending",
        time: item.timestamp ? formatTimestamp(item.timestamp) : "-",
        location: item.location || "-",
        description: item.details || "-",
        reporterName: item.fullname || `${item.firstname || ""} ${item.lastname || ""}`.trim() || "-",
        reporterEmail: item.email || "-",
        reporterId: item.id_card || "-",
        reporterPhone: item.phone || "-",
        incidentDate: item.event_time ? item.event_time.split("T")[0] : "-",
        incidentTime: item.event_time && item.event_time.includes("T") ? item.event_time.split("T")[1] : "-",
        image: item.image_url_presigned || item.image_url || "",
        department: item.department || "",
        note: item.note || "",
        timestamp: item.timestamp || "",
        eventTimestamp: item.event_time || item.timestamp || "",
        raw: item
    };
}

async function refreshSidebarCounts() {
    if (!window.AppAPI) return;
    try {
        const items = await window.AppAPI.loadCases();
        const incidentCount = items.filter(i => window.AppAPI.isIncident(i)).length;
        const complaintCount = items.filter(i => window.AppAPI.isComplaint(i)).length;
        const incidentBadge = document.getElementById('sidebarIncidentCount')
            || document.querySelector('a[href$="incidentAdmin.html"] .count-badge');
        const complaintBadge = document.getElementById('sidebarComplaintCount')
            || document.querySelector('a[href$="complaintsAdmin.html"] .count-badge');
        if (incidentBadge) incidentBadge.textContent = incidentCount;
        if (complaintBadge) complaintBadge.textContent = complaintCount;
    } catch (err) {
        console.error("Sidebar count refresh failed:", err);
    }
}

document.addEventListener('DOMContentLoaded', refreshSidebarCounts);
