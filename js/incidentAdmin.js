const incidents = [
  {
    code: "EMG-2471512",
    title: "อุบัติเหตุรถจักรยานยนต์เฉี่ยวชนนักศึกษาเดินเท้า",
    location: "ถนนหน้าอาคารเรียนรวม 2 (มธ.2)",
    description:
      "เกิดอุบัติเหตุรถจักรยานยนต์เฉี่ยวชนนักศึกษาที่กำลังเดินข้ามถนนบริเวณทางม้าลายหน้าตึก มธ.2 ทำให้นักศึกษามีแผลถลอก...",
    reporter: {
      name: "กิตติศักดิ์",
      surname: "บายอะ",
      citizenId: "1-4800-56181-34-5",
      phone: "081-234-5678"
    },
    date: "26/ 04 /2569",
    time: "16:44:40"
  },
  {
    code: "EMG-2471893",
    title: "คนบาดเจ็บ / หมดสติ",
    location: "ลานจอดรถข้าง มธ.2",
    description:
      "พบนักศึกษาล้มหมดสติ ต้องการความช่วยเหลือด่วน",
    reporter: {
      name: "สมชาย",
      surname: "ใจดี",
      citizenId: "1-4800-56181-34-5",
      phone: "081-234-5678"
    },
    date: "25/ 04 /2569",
    time: "22:54:40"
  },
  {
    code: "EMG-2471512",
    title: "อุบัติเหตุรถจักรยานยนต์เฉี่ยวชนนักศึกษาเดินเท้า",
    location: "ถนนหน้าอาคารเรียนรวม 2 (มธ.2)",
    description:
      "เกิดอุบัติเหตุรถจักรยานยนต์เฉี่ยวชนนักศึกษาที่กำลังเดินข้ามถนนบริเวณทางม้าลายหน้าตึก มธ.2 ทำให้นักศึกษามีแผลถลอก...",
    reporter: {
      name: "กิตติศักดิ์",
      surname: "บายอะ",
      citizenId: "1-4800-56181-34-5",
      phone: "081-234-5678"
    },
    date: "26/ 04 /2569",
    time: "16:44:40"
  },
  {
    code: "EMG-2471512",
    title: "อุบัติเหตุรถจักรยานยนต์เฉี่ยวชนนักศึกษาเดินเท้า",
    location: "ถนนหน้าอาคารเรียนรวม 2 (มธ.2)",
    description:
      "เกิดอุบัติเหตุรถจักรยานยนต์เฉี่ยวชนนักศึกษาที่กำลังเดินข้ามถนนบริเวณทางม้าลายหน้าตึก มธ.2 ทำให้นักศึกษามีแผลถลอก...",
    reporter: {
      name: "กิตติศักดิ์",
      surname: "บายอะ",
      citizenId: "1-4800-56181-34-5",
      phone: "081-234-5678"
    },
    date: "26/ 04 /2569",
    time: "16:44:40"
  }
];

const incidentGrid = document.getElementById("incidentGrid");
const sortSelect = document.getElementById("sortSelect");

function renderIncidents(data) {
  incidentGrid.innerHTML = data
    .map((item) => {
      return `
        <article class="incident-card">
          <div class="incident-card-header">
            ${item.code} : ${item.title}
          </div>

          <div class="incident-card-body">
            <div class="location-line">
              <span class="location-pin">📍</span>${item.location}
            </div>

            <div class="incident-desc">
              ${item.description}
            </div>

            <div class="info-title">ข้อมูลผู้แจ้งเหตุ</div>
            <div class="info-line"><span class="info-label">ชื่อ-สกุล :</span> ${item.reporter.name} ${item.reporter.surname}</div>
            <div class="info-line"><span class="info-label">หมายเลขบัตรประชาชน :</span> ${item.reporter.citizenId}</div>
            <div class="info-line"><span class="info-label">เบอร์มือถือ :</span> ${item.reporter.phone}</div>

            <hr class="card-divider">

            <div class="info-title">ข้อมูลแจ้งเหตุ</div>
            <div class="info-line"><span class="info-label">วันที่เกิดเหตุ :</span> ${item.date}</div>
            <div class="info-line"><span class="info-label">เวลาที่เกิดเหตุ :</span> ${item.time}</div>

            <div class="image-box">
              <div class="image-icon">🖼️</div>
            </div>

            <div class="card-action">
              <button class="receive-btn" type="button">รับเรื่อง</button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function sortIncidents() {
  const sorted = [...incidents];

  if (sortSelect.value === "oldest") {
    sorted.reverse();
  }

  renderIncidents(sorted);
}

sortSelect.addEventListener("change", sortIncidents);

sortIncidents();