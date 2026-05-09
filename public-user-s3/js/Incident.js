// Public user – หน้าแจ้งเหตุ (incident form).
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('complaintForm');
    if (!form) return;

    const fileInput = document.getElementById('file-input');
    const previewContainer = document.getElementById('preview-container');
    const imagePreview = document.getElementById('image-preview');
    const btnRemoveFile = document.getElementById('btn-remove-file');

    if (fileInput) {
        fileInput.addEventListener('change', function () {
            const file = this.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                previewContainer.style.display = 'inline-block';
            };
            reader.readAsDataURL(file);
        });
    }
    if (btnRemoveFile) {
        btnRemoveFile.addEventListener('click', () => {
            fileInput.value = "";
            previewContainer.style.display = 'none';
            imagePreview.src = "";
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = Object.fromEntries(new FormData(form).entries());
        const file = fileInput ? fileInput.files[0] : null;

        if (!data.firstname) return alert("กรุณากรอกชื่อ");
        if (!data.lastname) return alert("กรุณากรอกนามสกุล");
        if (!validateEmail(data.email)) return alert("รูปแบบอีเมลไม่ถูกต้อง");
        if (!data.phone) return alert("กรุณากรอกเบอร์มือถือ");
        if (!/^[0-9]{13}$/.test(data.id_card || "")) return alert("กรุณากรอกเลขบัตรประชาชน 13 หลัก");
        if (!data.subject) return alert("กรุณาระบุหัวข้อแจ้งเหตุ");
        if (!data.event_time) return alert("กรุณาเลือกวันและเวลาที่เกิดเหตุ");
        if (!data.location) return alert("กรุณาระบุสถานที่เกิดเหตุ");
        if (!data.details || !data.details.trim()) return alert("กรุณากรอกรายละเอียด");

        const submitBtn = form.querySelector('.btn-submit');
        const originalText = submitBtn.innerText;
        submitBtn.innerText = "กำลังส่งข้อมูล...";
        submitBtn.disabled = true;

        try {
            const base64Image = file ? await readFileAsBase64(file) : null;

            const payload = {
                type: "incident",
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
                fileName: file ? file.name : "",
                fileData: base64Image,
            };

            console.log("[Incident] POST", window.APP_CONFIG.API_URL, payload);
            let response;
            try {
                response = await fetch(window.APP_CONFIG.API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
            } catch (networkErr) {
                console.error("[Incident] Network/CORS error:", networkErr);
                throw new Error("ติดต่อเซิร์ฟเวอร์ไม่ได้ – ตรวจสอบ CORS / Invoke URL ใน Console");
            }
            const text = await response.text();
            console.log("[Incident] status=", response.status, "body=", text.slice(0, 200));
            if (!response.ok) {
                let parsed = {}; try { parsed = JSON.parse(text); } catch {}
                throw new Error(parsed.error || `Server error ${response.status}: ${text}`);
            }
            const result = text ? JSON.parse(text) : {};
            sessionStorage.setItem('userComplaintData', JSON.stringify({
                ...payload,
                complaint_id: result.complaint_id,
                image_url: result.image_url,
            }));
            window.location.href = "confirmIncident.html";
        } catch (error) {
            console.error("ส่งข้อมูลล้มเหลว:", error);
            alert("ไม่สามารถส่งข้อมูลได้: " + error.message);
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }
    });
});

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "");
}

function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function safeJson(response) {
    try { return await response.json(); } catch { return {}; }
}
