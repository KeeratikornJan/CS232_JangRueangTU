// =============================================
// SOURCE OF TRUTH: ข้อมูลจำลองทั้งหมด (complaints + incidents)
// =============================================
const MOCK_API = [
    {
        complaint_id: "GU-5868544001",
        subject: "เครื่องปรับอากาศในห้องสมุดเสียงดังและไม่เย็นมา 1 สัปดาห์",
        category: "สถานที่",
        status: "pending",
        timestamp: "2026-05-08T10:00:00Z",
        location: "ห้องสมุดกลาง ชั้น 2",
        details: "พบเครื่องปรับอากาศบริเวณโซนนั่งอ่านหนังสือ ชั้น 2 ห้องสมุดกลาง ส่งเสียงดังรบกวนสมาธิ และอุณหภูมิไม่เย็นเหมือนปกติ ต่อเนื่องมาประมาณ 1 สัปดาห์แล้ว",
        firstname: "สมใจ", lastname: "แสนดี",
        email: "somjai.s@email.com", phone: "081-234-5678",
        id_card: "1-4800-56181-34-5",
        event_time: "2026-04-25T22:54:40",
        image_url_presigned: "", department: "", note: ""
    },
    {
        complaint_id: "GU-5868544002",
        subject: "เจ้าหน้าที่หน่วยงาน XXX พูดจาไม่สุภาพขณะให้บริการ",
        category: "บุคลากร",
        status: "in_progress",
        timestamp: "2026-05-07T14:15:00Z",
        location: "อาคารสำนักงานกลาง",
        details: "ขณะติดต่อขอเอกสาร เจ้าหน้าที่มีน้ำเสียงไม่สุภาพ และแสดงอารมณ์ไม่เหมาะสมกับผู้มาติดต่อ ทำให้รู้สึกไม่สบายใจในการรับบริการ",
        firstname: "พิมพ์ชนก", lastname: "สุขใจ",
        email: "pimchanok@email.com", phone: "086-000-9876",
        id_card: "1-5555-44444-33-2",
        event_time: "2026-04-23T10:15:22",
        image_url_presigned: "", department: "ฝ่ายบุคคล", note: "กำลังตรวจสอบกล้องวงจรปิด"
    },
    {
        complaint_id: "GU-5868544004",
        subject: "ไฟส่องสว่างทางเดินหอพักหญิงขาด ทำให้แสงไม่เพียงพอ",
        category: "สถานที่",
        status: "resolved",
        timestamp: "2026-05-06T09:00:00Z",
        location: "หอพักหญิง",
        details: "บริเวณทางเดินด้านข้างหอพักหญิงมีไฟดับหลายดวงในช่วงเวลากลางคืน ทำให้พื้นที่ค่อนข้างมืด และอาจก่อให้เกิดอันตรายได้",
        firstname: "นภัสสร", lastname: "ภูมิใจ",
        email: "napatsorn@email.com", phone: "082-765-8888",
        id_card: "1-2222-33333-44-5",
        event_time: "2026-04-22T20:40:15",
        image_url_presigned: "", department: "กองอาคารสถานที่", note: "เปลี่ยนหลอดไฟเรียบร้อยแล้วเมื่อวาน"
    },
    {
        incident_id: "EMG-2471900",
        subject: "ท่อประปาแตกบริเวณหน้าอาคารเรียนรวม น้ำไหลท่วมทางเดิน",
        category: "สถานที่",
        status: "in_progress",
        timestamp: "2026-05-08T09:30:00Z",
        location: "หน้าอาคารเรียนรวม",
        details: "ท่อประปาหลักแตก น้ำไหลเจิ่งนองเต็มพื้นที่ทางเดิน ขวางทางสัญจรของนักศึกษา",
        firstname: "กิตติภพ", lastname: "ใจดี",
        email: "kittipob@email.com", phone: "089-111-2233",
        id_card: "1-1234-56789-00-1",
        event_time: "2026-05-08T09:00:00",
        image_url_presigned: "", department: "กองอาคารสถานที่", note: "ช่างประปากำลังลงพื้นที่ซ่อมแซม"
    },
    {
        incident_id: "EMG-2471901",
        subject: "พบสุนัขจรจัดไล่กวดนักศึกษาบริเวณโรงอาหารกลาง",
        category: "อื่นๆ",
        status: "pending",
        timestamp: "2026-05-08T11:20:00Z",
        location: "โรงอาหารกลาง",
        details: "มีสุนัขจรจัดหลายตัวบริเวณโรงอาหารกลาง และมีพฤติกรรมวิ่งไล่นักศึกษาบางคน ทำให้รู้สึกไม่ปลอดภัย และควรมีการเข้าตรวจสอบโดยด่วน",
        firstname: "วิชัย", lastname: "รักสงบ",
        email: "wichai@email.com", phone: "081-999-8888",
        id_card: "1-9876-54321-00-9",
        event_time: "2026-05-08T11:15:00",
        image_url_presigned: "", department: "", note: ""
    }
];

// =============================================
// DERIVED: แยกตามประเภท (ใช้ใน complaintsAdmin, incidentAdmin)
// =============================================
const MOCK_COMPLAINTS_API = MOCK_API.filter(i => i.complaint_id);
const MOCK_INCIDENTS_API  = MOCK_API.filter(i => i.incident_id);

// =============================================
// FORWARD PAGE: เคสที่ยังไม่ได้รับมอบหมายหน่วยงาน
// =============================================
const _FORWARD_TAG = {
    "สถานที่": "tag-place", "บุคลากร": "tag-person",
    "รถโดยสาร": "tag-bus", "ระบบ IT": "tag-it",
    "อุปกรณ์อิเล็กทรอนิกส์": "tag-electronic",
    "ร้านค้า": "tag-shop", "อื่นๆ": "tag-other"
};
const MOCK_FORWARD_CASES = MOCK_API
    .filter(i => !i.department)
    .map(i => ({
        id: i.complaint_id || i.incident_id,
        title: i.subject,
        category: i.category,
        tagClass: _FORWARD_TAG[i.category] || "tag-other",
        location: i.location,
        description: i.details,
        reporterName: `${i.firstname} ${i.lastname}`.trim(),
        reporterEmail: i.email,
        reporterId: i.id_card,
        reporterPhone: i.phone,
        incidentDate: i.event_time ? i.event_time.split("T")[0] : "-",
        incidentTime: i.event_time && i.event_time.includes("T") ? i.event_time.split("T")[1] : "-",
        department: "", note: "",
        image: i.image_url_presigned || ""
    }));

const MOCK_DEPARTMENTS = [
    { name: "กองบริการการศึกษา",              count: 8  },
    { name: "กองกลาง (งานพัสดุและโลจุ)",      count: 3  },
    { name: "กองอาคารสถานที่",  count: 5  },
    { name: "ศูนย์บริหารจัดการทรัพย์สิน",     count: 2  },
    { name: "สำนักงานนวัตกรรมดิจิทัล (IT)",   count: 4  },
    { name: "กองจัดการความปลอดภัย (รปภ.)",    count: 6  },
    { name: "หน่วยงานขนส่ง (EV Shuttle)",      count: 10 },
    { name: "อื่นๆ",                           count: 7  }
];

// =============================================
// HISTORY PAGE: ประวัติการแจ้งเหตุที่เสร็จสิ้น
// =============================================
const MOCK_INCIDENT_HISTORY = [
    {
        code: "EMG-2471620",
        subject: "ไฟไหม้เล็กน้อย ห้องLab มธ.2 107",
        date: "23 /04 /2569", time: "18:54:40",
        receivedAgo: "2 วันที่แล้ว",
        location: "ห้อง Lab มธ.2 107",
        title: "ไฟไหม้เล็กน้อย ห้องLab มธ.2 107",
        description: "พบเหตุไฟไหม้เล็กน้อยบริเวณปลั๊กไฟภายในห้องปฏิบัติการ มีควันออกจากมุมห้องและมีกลิ่นไหม้ ควรเร่งเข้าตรวจสอบเพื่อป้องกันความเสียหายเพิ่มเติม",
        reporterName: "นายสมชาย ใจดี", reporterEmail: "somchai@example.com",
        reporterId: "1-1111-22222-33-4", reporterPhone: "081-111-2222",
        incidentDate: "23 / 04 / 2569", incidentTime: "18:40:12",
        image: "", department: "", note: ""
    },
    {
        code: "EMG-2471902",
        subject: "พบงูเหลือมขนาดใหญ่บริเวณพุ่มไม้ข้างสนามฟุตบอล",
        date: "20 /04 /2569", time: "14:20:22",
        receivedAgo: "5 วันที่แล้ว",
        location: "สนามฟุตบอล 1",
        title: "พบงูเหลือมขนาดใหญ่บริเวณพุ่มไม้ข้างสนามฟุตบอล",
        description: "แจ้งเหตุด่วน พบงูเหลือมความยาวประมาณ 3 เมตร ขดตัวอยู่บริเวณพุ่มไม้ทึบข้างสนามฟุตบอล 1 ฝั่งอัฒจันทร์ สร้างความเสี่ยงต่อผู้ที่ใช้งานพื้นที่และนักศึกษาในบริเวณใกล้เคียง",
        reporterName: "นายก้องภพ แสงดาว", reporterEmail: "kongphop.s@email.com",
        reporterId: "1-4800-56181-34-5", reporterPhone: "089-765-4321",
        incidentDate: "25 / 04 / 2569", incidentTime: "17:15:30",
        image: "", department: "", note: ""
    }
];

// =============================================
// DASHBOARD PAGE: ข้อมูลสรุปภาพรวม
// =============================================
const _mockCatMap = {};
MOCK_API.forEach(item => {
    const cat = item.category || 'อื่นๆ';
    _mockCatMap[cat] = (_mockCatMap[cat] || 0) + 1;
});

const MOCK_DASHBOARD_DATA = {
    stats: {
        incident_count: MOCK_INCIDENTS_API.length,
        complaint_count: MOCK_COMPLAINTS_API.length,
        pending_cases:     MOCK_API.filter(i => i.status === 'pending').length,
        in_progress_cases: MOCK_API.filter(i => i.status === 'in_progress').length,
        resolved_cases:    MOCK_API.filter(i => i.status === 'resolved').length
    },
    categories: Object.entries(_mockCatMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
    latest_cases: [...MOCK_API].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
};
