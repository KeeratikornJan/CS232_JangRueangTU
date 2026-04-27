document.addEventListener('DOMContentLoaded', () => {

    // --- 1. จัดการปุ่มหมวดหมู่ (Category Tabs) ---
    const tabs = document.querySelectorAll('.tab');
    const categoryInput = document.getElementById('selected-category');

    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            // ลบคลาส active ออกจากทุกปุ่ม
            tabs.forEach(t => t.classList.remove('active'));

            // เติมคลาส active ให้ปุ่มที่ถูกกด
            this.classList.add('active');

            // เอาชื่อบนปุ่มไปใส่ใน Input ลับ
            categoryInput.value = this.innerText;

            console.log("หมวดหมู่: ", categoryInput.value);
        });
    });

    //เช็คอีเมล//
    function validateEmail(email) {
        // สูตร Regex สำหรับเช็คโครงสร้างอีเมล
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // --- 2. ในส่วนการจัดการการส่งฟอร์ม ---
    const form = document.getElementById('complaintForm');

    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            // 2. ดึงข้อมูลจากฟอร์ม (เขียนรอบเดียวพอครับ)
            const formData = new FormData(this);
            const data = Object.fromEntries(formData.entries());

            // 3. จัดการเรื่องไฟล์
            const fileInput = document.getElementById('file-input');
            const file = fileInput ? fileInput.files[0] : null;

            // เช็คชื่อ-นามสกุล
            if (!data.firstname) {
                alert("กรุณากรอกชื่อ");
                return;
            }

            if (!data.lastname) {
                alert("กรุณากรอกนามสกุล");
                return;
            }


            // เช็คอีเมล
            if (!data.email) {
                alert("กรุณากรอกอีเมล");
                return;
            }

            // เช็คเบอร์ 
            if (!data.phone) {
                alert("กรุณากรอกเบอร์มือถือ");
                return;
            }

            if (!validateEmail(data.email)) {
                alert("รูปแบบอีเมลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง");
                return;
            }

            //เช็คเลขบัตรปชช
            const idPattern = /^[0-9]{13}$/;

            if (!idPattern.test(data.id_card)) {
                alert("กรุณากรอกเลขบัตรประชาชนเป็นตัวเลข 13 หลัก");
                return;
            }

            // เช็คหัวข้อ
            if (!data.subject) {
                alert("กรุณาระบุหัวข้อร้องเรียน");
                return;
            }

            // เช็ควันเวลาที่เกิดเหตุ (สำคัญ!)
            if (!data.event_time) {
                alert("กรุณาเลือกวันและเวลาที่เกิดเหตุ");
                return;
            }

            // เช็คสถานที่เกิดเหตุ
            if (!data.location) {
                alert("กรุณาระบุสถานที่เกิดเหตุ");
                return;
            }

            // เช็ครายละเอียด
            if (!data.details || data.details.trim() === "") {
                alert("กรุณากรอกรายละเอียดการร้องเรียน");
                return;
            }

            console.log("กำลังส่งข้อมูล...", data);

            // --- ส่วนท้ายของฟังก์ชัน Submit ---


            const proceed = (base64Image = null) => {
                const finalData = {
                    category: document.getElementById('selected-category').value,
                    firstname: data.firstname,
                    lastname: data.lastname,
                    email: data.email,
                    phone: data.phone,
                    id_card: data.id_card,
                    subject: data.subject,
                    location: data.location,
                    details: data.details,
                    event_time: data.event_time,
                    fileData: base64Image,
                    fileName: file ? file.name : ""
                };

                // บันทึกเข้า Session (อันนี้ข้อมูลจะไม่ไปโผล่ที่ URL)
                sessionStorage.setItem('userComplaintData', JSON.stringify(finalData));

                // เปลี่ยนหน้าไปแบบสะอาดๆ
                window.location.href = "views/confirm.html";
            };

            // --- ส่วนสั่งการให้อ่านไฟล์ ---
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => proceed(event.target.result);
                reader.readAsDataURL(file);
            } else {
                proceed();
            }
        });
    }




    const fileInput = document.getElementById('file-input');
    const previewContainer = document.getElementById('preview-container'); // ตัวแม่ที่ครอบรูป+ปุ่ม
    const imagePreview = document.getElementById('image-preview');         // ตัวรูป <img>
    const btnRemoveFile = document.getElementById('btn-remove-file');     // ปุ่มกากบาท

    fileInput.addEventListener('change', function () {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                imagePreview.src = e.target.result;

                // --- บรรทัดสำคัญ: ต้องสั่งให้ Container ที่ซ่อนอยู่แสดงตัวออกมา ---
                previewContainer.style.display = 'inline-block';
            }
            reader.readAsDataURL(file);
        }
    });

    // ส่วนปุ่มกากบาท
    btnRemoveFile.addEventListener('click', function () {
        fileInput.value = ""; // ล้างค่าไฟล์
        previewContainer.style.display = 'none'; // สั่งซ่อนกลับไปเหมือนเดิม
    });
});
