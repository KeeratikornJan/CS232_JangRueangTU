### Deployment Note: ระบบแจ้งเรื่อง (JangRueang) 
เอกสารฉบับนี้รวบรวมขั้นตอนการตั้งค่าโครงสร้างพื้นฐาน (Infrastructure) บน AWS สำหรับระบบ JangRueang เพื่อให้สามารถ Deploy ระบบขึ้นใช้งานจริงได้อย่างถูกต้อง (ใช้AI สำหรับการช่วยเขียน Deployment_Note ชิ้นนี้)

### 🏗 ภาพรวมสถาปัตยกรรม (Architecture Stack)
Frontend: Amazon S3 (Static Website Hosting)

Authentication: Amazon Cognito

Backend: AWS Lambda (Python 3.x) + Amazon API Gateway

Database: Amazon DynamoDB

Notification: Amazon SNS (พร้อมระบบจำลองการส่งเมลหาผู้แจ้งผ่าน CloudWatch Logs)

### 🛠 ขั้นตอนการตั้งค่า (Setup Guide)
1. Amazon DynamoDB (ฐานข้อมูล)
Table Name: ComplaintsTable (หรือชื่อที่คุณตั้งจริง)

Partition Key: id (String)

ตั้งค่าเพิ่มเติม: ใช้ Default settings ทั้งหมด

2. Amazon Cognito (ระบบ Auth)
User Pool: สร้าง User Pool ใหม่สำหรับแอดมิน

App Client:

สร้าง App Client โดย ไม่ใช้ Generate client secret (เพื่อให้ใช้กับ JavaScript ฝั่ง Frontend ได้)

ตั้งค่า Authentication flows ให้รองรับ ALLOW_USER_PASSWORD_AUTH

การนำไปใช้: นำ User Pool ID และ Client ID ไปใส่ในไฟล์ js/login.js

3. Amazon SNS (ระบบแจ้งเตือนแอดมิน)
Topic: สร้าง Standard Topic ชื่อ AdminComplaintAlerts

Subscription: แอดอีเมลของ Admin เข้าไป และให้ Admin กด Confirm Subscription ในอีเมล

⚠️ ข้อจำกัดระบบ (Learner Lab): * เนื่องจาก AWS Academy Learner Lab ไม่รองรับการใช้งาน Amazon SES เราจึงใช้ SNS สำหรับแจ้งเตือนแอดมินเท่านั้น

สำหรับอีเมลยืนยันการรับเรื่องของผู้แจ้ง (User) เราได้ออกแบบให้ใช้การ จำลองสถานะ (Simulated Queue) โดยบันทึก Log ลงใน CloudWatch แทน และแสดงผล Success Modal ที่หน้าเว็บ (Frontend) เพื่อความสมบูรณ์ของ UX

4. AWS Lambda (ประมวลผลหลัก)
Runtime: Python 3.x

IAM Role Permissions: เพิ่ม Policy ต่อไปนี้ให้กับ Lambda Execution Role

AmazonDynamoDBFullAccess

AmazonSNSFullAccess

CloudWatchLogsFullAccess (สำหรับบันทึก Log การส่งอีเมลจำลอง)

Environment Variables:

TABLE_NAME = ชื่อตาราง DynamoDB

SNS_TOPIC_ARN = ARN ของ SNS Topic ที่สร้างไว้

โค้ดหลัก: อัปโหลดไฟล์ handler.py ที่มี Logic ทั้งการเขียนลง DB, ยิง SNS และจำลองส่งเมล

5. Amazon API Gateway (เชื่อม Web กับ API)
Type: REST API

Resources & Methods:

สร้าง Resource /complaints

สร้าง Method POST (สำหรับหน้าแจ้งเหตุ) และ GET (สำหรับหน้า Admin Dashboard)

Integration: ตั้งค่าแบบ Lambda Proxy Integration ชี้ไปที่ฟังก์ชัน Lambda ที่สร้างไว้

🔥 ข้อควรระวัง (CORS):

ทำการกด Enable CORS ที่ระดับ Resource

ใน Method Response และ Integration Response ต้องมั่นใจว่ามีการส่ง Headers Access-Control-Allow-Origin: '*' กลับไป เพื่อไม่ให้ Frontend ถูกบล็อก

6. Amazon S3 (โฮสต์หน้าเว็บ)
Bucket Settings:

ปิด Block all public access

เพิ่ม Bucket Policy เพื่ออนุญาตสิทธิ์ s3:GetObject ให้ทุกคนเข้าถึงไฟล์ได้ (Principal: "*")

Static Website Hosting:

เปิดใช้งาน Static website hosting

Index Document: ตั้งค่าเป็น LoginPage.html (หลังจากย้ายไฟล์นี้ออกมาไว้ที่ Root Directory ตามข้อจำกัดของ S3 ที่ไม่รองรับ Path ในช่องนี้)

Security & Route Guard:

ใส่ JavaScript ตรวจสอบ sessionStorage.getItem('id_token') ไว้ที่ส่วน <head> ของไฟล์ dashboardAdmin.html เพื่อป้องกันไม่ให้คนที่ไม่ผ่านหน้า Login (ไม่มี Token) แอบเข้าใช้งาน

Prepared by: นายกันตณัฐ สุพัฒนานนท์