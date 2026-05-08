const CATEGORY_COLORS = {
    "สถานที่": "#ff9800",
    "บุคลากร": "#e056f1",
    "รถโดยสาร": "#56c108",
    "ระบบ IT": "#a4b800",
    "อุปกรณ์อิเล็กทรอนิกส์": "#c438e8",
    "ร้านค้า": "#18c4c7",
    "อื่นๆ": "#ff0b67"
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
        const pastDate = new Date(ts);
        const nowDate = new Date();
        const diffInSeconds = Math.floor((nowDate - pastDate) / 1000);
        
        if (diffInSeconds <= 0 || diffInSeconds < 60) return "เมื่อสักครู่";
        
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes} นาที`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} ชม.`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 30) return `${diffInDays} วัน`;
        
        const diffInMonths = Math.floor(diffInDays / 30);
        if (diffInMonths < 12) return `${diffInMonths} เดือน`;
        
        const diffInYears = Math.floor(diffInDays / 365);
        return `${diffInYears} ปี`;
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

function updateSidebarCounts() {
    const stats = MOCK_DASHBOARD_DATA.stats;
    const incidentBadge  = document.getElementById('sidebarIncidentCount')
                        || document.querySelector('a[href$="incidentAdmin.html"] .count-badge');
    const complaintBadge = document.getElementById('sidebarComplaintCount')
                        || document.querySelector('a[href$="complaintsAdmin.html"] .count-badge');
    if (incidentBadge)  incidentBadge.textContent  = stats.incident_count;
    if (complaintBadge) complaintBadge.textContent = stats.complaint_count;
}

document.addEventListener('DOMContentLoaded', updateSidebarCounts);

function mapDbToUI(item) {
    return {
        // เช็คว่ามี ID ตัวไหน ให้ใช้ตัวนั้น
        id: item.incident_id || item.complaint_id || "-",
        // แยกประเภทให้รู้ว่าเป็น "ร้องเรียน" หรือ "แจ้งเหตุ"
        type: item.incident_id ? "incident" : "complaint", 
        title: item.subject || "ไม่มีหัวข้อ",
        fullTitle: item.subject || "ไม่มีหัวข้อ",
        category: item.category || "อื่นๆ",
        status: item.status || "pending",
        time: item.timestamp ? formatTimestamp(item.timestamp) : "-",
        location: item.location || "-",
        description: item.details || "-",
        reporterName: `${item.firstname || ''} ${item.lastname || ''}`.trim() || "-",
        reporterEmail: item.email || "-",
        reporterId: item.id_card || "-",
        reporterPhone: item.phone || "-",
        incidentDate: item.event_time ? item.event_time.split("T")[0] : "-",
        incidentTime: item.event_time && item.event_time.includes("T") ? item.event_time.split("T")[1] : "-",
        image: item.image_url_presigned || item.image_url || "",
        department: item.department || "",
        note: item.note || ""
    };
}