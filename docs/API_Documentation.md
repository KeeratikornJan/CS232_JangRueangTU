### รายละเอียด API (API Documentation) (ใช้AI ช่วยสำหรับการเขียนเอกสารนี้)

เอกสารส่วนนี้อธิบายรายละเอียดของ API Endpoints ที่ใช้ในระบบ โดยเชื่อมต่อผ่าน AWS API Gateway และประมวลผลด้วย AWS Lambda

**Base URL:** `https://<api-id>.execute-api.<region>.amazonaws.com/prod`

---

### 🟢 1. OPTIONS `/submit`
ใช้สำหรับ Preflight Request (CORS) เพื่อเช็คสิทธิ์ก่อนที่ Browser จะส่ง Request จริง
* **Headers Required:**
  * `Origin`: `http://<your-s3-website-url>`
  * `Access-Control-Request-Method`: `POST, GET, OPTIONS, PUT, PATCH`
* **Success Response (200 OK):**
  * **Headers:** `Access-Control-Allow-Origin: *`

---

### 📝 2. POST `/submit`
ใช้สำหรับ **สร้างรายการร้องเรียนใหม่** (เรียกใช้จากหน้าเว็บของผู้ใช้งานทั่วไป)
* **Headers:**
  * `Content-Type: application/json`
* **Request Body:**
  ```json
  {
    "subject": "ไฟถนนเสียหน้าตึก A",
    "description": "หลอดไฟกะพริบมา 3 วันแล้วครับ รบกวนซ่อมด้วย",
    "email": "user@example.com"
  }

### 🔍 3. GET `/submit`
ใช้สำหรับ **ดึงข้อมูลเรื่องร้องเรียนทั้งหมด** ไปแสดงบนหน้า Admin Dashboard
**Headers**:

Authorization: Bearer <ID_TOKEN> (ได้จากการ Login ผ่าน Cognito)

**Success Response** (200 OK):

JSON
[
  {
    "id": "123e4567-e89b",
    "subject": "ไฟถนนเสียหน้าตึก A",
    "status": "pending",
    "timestamp": "2026-05-10T10:00:00Z"
  }
]

### 🔄 4. PUT /submit/{id}
ใช้สำหรับ **อัปเดตข้อมูลทั้งชุด** ของเรื่องร้องเรียนนั้นๆ (Replace)

Path Parameter: id (รหัสเรื่องร้องเรียน)

**Headers**:

Authorization: Bearer <ID_TOKEN>

Content-Type: application/json
**Request Body**:

JSON
{
  "subject": "ไฟถนนเสียหน้าตึก A (แก้ไข)",
  "description": "อัปเดต: ตอนนี้ดับสนิทแล้วครับ",
  "email": "user@example.com",
  "status": "pending"
}
**Success Response** (200 OK):

JSON
{
  "message": "Complaint updated successfully"
}

### ✏️ 5. PATCH /submit/{id} 
ใช้สำหรับ อัปเดตข้อมูลบางส่วน เช่น การเปลี่ยนสถานะ (Status) โดย Admin

Path Parameter: id (รหัสเรื่องร้องเรียน)

**Headers**:

Authorization: Bearer <ID_TOKEN>

Content-Type: application/json

**Request Body**:

JSON
{
  "status": "resolved"
}
**Success Response** (200 OK):

JSON
{
  "message": "Complaint status updated to resolved"
}

### ❌ Error Responses (รหัสข้อผิดพลาด) :
400 Bad Request: ข้อมูลใน Request Body ไม่ครบถ้วนหรือไม่ถูกต้องตามรูปแบบ

401 Unauthorized: ไม่ได้แนบ Token ของ Admin หรือ Token หมดอายุ

403 Forbidden: ไม่มีสิทธิ์เข้าถึง หรือติดปัญหา Policy / CORS

500 Internal Server Error: เกิดข้อผิดพลาดที่ระบบหลังบ้าน (Lambda หรือ DynamoDB)