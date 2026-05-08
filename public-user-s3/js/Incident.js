document.addEventListener('DOMContentLoaded', () => {

    // --- 1. เช็คอีเมล ---
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // --- 2. การจัดการการส่งฟอร์ม ---
    const form = document.getElementById('complaintForm');

    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            const formData = new FormData(this);
            const data = Object.fromEntries(formData.entries());
            const fileInput = document.getElementById('file-input');
            const file = fileInput ? fileInput.files[0] : null;

            // --- Validation (ตรวจสอบข้อมูล) ---
            if (!data.firstname) { alert("กรุณากรอกชื่อ"); return; }
            if (!data.lastname) { alert("กรุณากรอกนามสกุล"); return; }
            if (!data.email || !validateEmail(data.email)) { alert("กรุณากรอกอีเมลให้ถูกต้อง"); return; }
            if (!data.phone) { alert("กรุณากรอกเบอร์มือถือ"); return; }
            
            const idPattern = /^[0-9]{13}$/;
            if (!idPattern.test(data.id_card)) { alert("กรุณากรอกเลขบัตรประชาชน 13 หลัก"); return; }
            if (!data.subject) { alert("กรุณาระบุหัวข้อแจ้งเหตุ"); return; }
            if (!data.event_time) { alert("กรุณาเลือกวันและเวลาที่เกิดเหตุ"); return; }
            if (!data.location) { alert("กรุณาระบุสถานที่เกิดเหตุ"); return; }
            if (!data.details || data.details.trim() === "") { alert("กรุณากรอกรายละเอียด"); return; }

            // --- ส่วนปุ่มเพื่อป้องกันการกดซ้ำ ---
            const submitBtn = document.querySelector('.btn-submit');
            const originalBtnText = submitBtn.innerText;
            submitBtn.innerText = "กำลังส่งข้อมูล...";
            submitBtn.disabled = true;

            // --- ฟังก์ชันส่งข้อมูลไป AWS ---
            const proceed = async (base64Image = null) => {
                const finalData = {
                    category: "แจ้งเหตุ",
                    firstname: data.firstname,
                    lastname: data.lastname,
                    email: data.email,
                    phone: data.phone,
                    id_card: data.id_card,
                    subject: data.subject,
                    location: data.location,
                    details: data.details,
                    event_time: data.event_time,
                    fileData: base64Image, // ตรงกับ data.get('fileData') ใน incident.py
                    fileName: file ? file.name : "" // ตรงกับ data.get('fileName') ใน incident.py
                };

                // ใส่ URL ของ API Gateway ที่คุณสร้างจากไฟล์ incident.py
                const apiUrl = "https://xw9ox0faec.execute-api.us-east-1.amazonaws.com/prod/Incident-submit"; 

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

                        // เก็บข้อมูลลง Session เผื่อหน้า Confirm จะใช้แสดงผล
                        sessionStorage.setItem('userComplaintData', JSON.stringify(finalData));
                        
                        // ไปหน้ายืนยัน
                        window.location.href = "confirmIncident.html";
                    } else {
                        const errorData = await response.json();
                        throw new Error(errorData.error || `Server error: ${response.status}`);
                    }

                } catch (error) {
                    console.error("เกิดข้อผิดพลาด:", error);
                    alert("ไม่สามารถส่งข้อมูลได้: " + error.message);
                    
                    // คืนค่าปุ่ม
                    submitBtn.innerText = originalBtnText;
                    submitBtn.disabled = false;
                }
            };

            // --- เริ่มต้นการอ่านไฟล์ภาพ ---
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => proceed(event.target.result);
                reader.readAsDataURL(file);
            } else {
                proceed();
            }
        });
    }

    // --- ส่วนแสดงตัวอย่างรูปภาพ (Preview) ---
    const fileInput = document.getElementById('file-input');
    const previewContainer = document.getElementById('preview-container');
    const imagePreview = document.getElementById('image-preview');
    const btnRemoveFile = document.getElementById('btn-remove-file');

    if (fileInput) {
        fileInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    imagePreview.src = e.target.result;
                    previewContainer.style.display = 'inline-block';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (btnRemoveFile) {
        btnRemoveFile.addEventListener('click', () => {
            fileInput.value = "";
            previewContainer.style.display = 'none';
            imagePreview.src = "";
        });
    }
});