document.addEventListener('DOMContentLoaded', () => {
    const rawData = sessionStorage.getItem('userComplaintData');

    if (rawData) {
        const data = JSON.parse(rawData);

        // ดึงหมวดหมู่มาโชว์ตรงหัวข้อ
        const categoryElement = document.getElementById('view-category');
        if (categoryElement) {
            categoryElement.textContent = data.category || "ไม่ได้ระบุ";
        }

        // --- ส่วนที่ 1: ข้อมูลผู้ร้องเรียน ---

        // ดึงชื่อมาแสดง และเติมช่องว่างท้ายชื่อนิดนึงกันนามสกุลติด
        const fullName = data.firstname + " " + data.lastname;

        // ส่งค่าที่รวมแล้วไปที่ ID view-name
        const nameElement = document.getElementById('view-name');
        if (nameElement) {
            nameElement.textContent = fullName;
        }

        // ดึงอีเมล
        document.getElementById('view-email').textContent = data.email;

        // ดึงเบอร์โทร
        document.getElementById('view-phone').textContent = data.phone;

        // ดึงเลขบัตรประชาชน
        document.getElementById('view-id-card').textContent = data.id_card;


        // --- ส่วนที่ 2: ข้อมูลเรื่องร้องเรียน ---


        // หัวข้อร้องเรียน
        document.getElementById('view-subject').textContent = data.subject;

        // วันเวลาที่เกิดเหตุ (รวมวันที่และเวลาเข้าด้วยกัน)
        if (data.event_time) {
            // เปลี่ยนจาก "2026-04-11T15:57" เป็น "2026-04-11  15:57 น."
            const formatted = data.event_time.replace('T', '  ') + " น.";
            document.getElementById('view-datetime').textContent = formatted;
        } else {
            document.getElementById('view-datetime').textContent = "ไม่ได้ระบุวันเวลา";
        }

        // สถานที่
        document.getElementById('view-location').textContent = data.location;

        // รายละเอียด
        document.getElementById('view-details').textContent = data.details;

        // --- ส่วนที่ 3: จัดการไฟล์แนบ/รูปภาพ ---
        // ตัวนี้ไว้ใส่ชื่อไฟล์ (เช่น "pic.jpg")
        const fileNameElement = document.getElementById('view-filename');
        // ตัวนี้ต้องเป็นแท็ก <img> เท่านั้น
        const imgElement = document.getElementById('view-image');

        if (data.fileData) {
            // 1. ใส่ชื่อไฟล์
            if (fileNameElement) {
                fileNameElement.textContent = data.fileName;
            }

            // 2. ใส่รูปภาพ (ต้องมั่นใจว่าใน HTML เป็นแท็ก <img id="image-preview">)
            if (imgElement) {
                imgElement.src = data.fileData; // ใส่ข้อมูล Base64
                imgElement.style.display = 'block'; // สั่งให้โชว์
            }
        } else {
            if (fileNameElement) fileNameElement.textContent = "ไม่มีไฟล์แนบ";
            if (imgElement) imgElement.style.display = 'none';
        }

        const btnSubmit = document.getElementById('btn-confirm-submit'); // ชื่อ ID ปุ่มยืนยันในหน้า confirm
        const popup = document.getElementById('success-popup');
        const btnClose = document.getElementById('btn-close-popup');

        if (btnSubmit) {
            btnSubmit.addEventListener('click', function (e) {
                e.preventDefault();
                // 1. สั่งโชว์ Popup (ต้องมั่นใจว่าใน HTML มี <div id="success-popup"> นะ)
                if (popup) {
                    popup.classList.add('show')
                    // 2. สุ่มเลขรหัสคำร้อง
                    const idSpan = document.getElementById('complaint-id');
                    if (idSpan) {
                        idSpan.innerText = "GU-" + Math.floor(Math.random() * 1000000000);
                    }
                } else {
                    alert("ส่งข้อมูลสำเร็จ!"); // กรณีหา Popup ไม่เจอให้ Alert บอกก่อน
                    window.location.href = "index.html";
                }
            });
        }

        if (btnClose) {
            btnClose.addEventListener('click', () => {
                // กดตกลงแล้วให้กลับไปหน้าแรก
                window.location.href = "index.html";
            });
        }


    } else {
        // ถ้าแอบเข้าหน้านี้โดยไม่มีข้อมูล ให้เด้งกลับหน้าแรก
        alert("ไม่พบข้อมูล กรุณากรอกข้อมูลใหม่อีกครั้ง");
        window.location.href = "index.html";
    }


});
