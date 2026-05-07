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

            // 2. ดึงข้อมูลจากฟอร์ม
            const formData = new FormData(this);
            const data = Object.fromEntries(formData.entries());

            // 3. จัดการเรื่องไฟล์
            const fileInput = document.getElementById('file-input');
            const file = fileInput ? fileInput.files[0] : null;

            // --- การตรวจสอบข้อมูล (Validation) ---
            if (!data.firstname) { alert("กรุณากรอกชื่อ"); return; }
            if (!data.lastname) { alert("กรุณากรอกนามสกุล"); return; }
            if (!data.email) { alert("กรุณากรอกอีเมล"); return; }
            if (!data.phone) { alert("กรุณากรอกเบอร์มือถือ"); return; }
            if (!validateEmail(data.email)) { alert("รูปแบบอีเมลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง"); return; }
            
            const idPattern = /^[0-9]{13}$/;
            if (!idPattern.test(data.id_card)) { alert("กรุณากรอกเลขบัตรประชาชนเป็นตัวเลข 13 หลัก"); return; }
            if (!data.subject) { alert("กรุณาระบุหัวข้อร้องเรียน"); return; }
            if (!data.event_time) { alert("กรุณาเลือกวันและเวลาที่เกิดเหตุ"); return; }
            if (!data.location) { alert("กรุณาระบุสถานที่เกิดเหตุ"); return; }
            if (!data.details || data.details.trim() === "") { alert("กรุณากรอกรายละเอียดการร้องเรียน"); return; }

            console.log("กำลังเตรียมส่งข้อมูล...");

            // --- ส่วนปุ่มเพื่อป้องกันการกดซ้ำ ---
            const submitBtn = document.querySelector('.btn-submit');
            const originalBtnText = submitBtn.innerText;
            submitBtn.innerText = "กำลังส่งข้อมูล...";
            submitBtn.disabled = true;

            // --- ฟังก์ชันหลักในการส่งข้อมูลไป AWS ---
            const proceed = async (base64Image = null) => {
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

                const apiUrl = "https://xw9ox0faec.execute-api.us-east-1.amazonaws.com/prod/submit"; 

                try {
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(finalData)
                    });

                    if (response.ok) {
                        const responseData = await response.json();
                        console.log("ส่งข้อมูลสำเร็จ:", responseData);
                        sessionStorage.setItem('userComplaintData', JSON.stringify(finalData));
                        window.location.href = "views/confirm.html";
                    } else {
                        throw new Error(`Server responded with status: ${response.status}`);
                    }

                } catch (error) {
                    console.error("เกิดข้อผิดพลาด:", error);
                    alert("ไม่สามารถส่งข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
                    submitBtn.innerText = originalBtnText;
                    submitBtn.disabled = false;
                }
            };

            // --- ส่วนสั่งการให้อ่านไฟล์ ---
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => proceed(event.target.result); // แปลงเป็น Base64 แล้วส่ง
                reader.readAsDataURL(file);
            } else {
                proceed(); // ถ้าไม่มีไฟล์ก็ส่งเลย
            }
        });
    }

    // --- ส่วนแสดงตัวอย่างรูปภาพ ---
    const fileInput = document.getElementById('file-input');
    const previewContainer = document.getElementById('preview-container'); 
    const imagePreview = document.getElementById('image-preview');         
    const btnRemoveFile = document.getElementById('btn-remove-file');     

    if (fileInput) {
        fileInput.addEventListener('change', function () {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    imagePreview.src = e.target.result;
                    previewContainer.style.display = 'inline-block';
                }
                reader.readAsDataURL(file);
            }
        });
    }

    if (btnRemoveFile) {
        btnRemoveFile.addEventListener('click', function () {
            fileInput.value = ""; 
            previewContainer.style.display = 'none'; 
        });
    }
});