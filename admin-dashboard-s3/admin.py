import json
import boto3
import os
import uuid
from boto3.dynamodb.conditions import Key

# --- 1. ตั้งค่าพื้นฐาน (เพิ่มส่วนนี้เข้าไป) ---
S3_BUCKET_NAME = 'cs232-complaint-images-99' 
REGION = 'us-east-1'  # กำหนด Region ให้ชัดเจน

# --- 2. สร้าง Connection (เพิ่ม 2 บรรทัดนี้) ---
dynamodb = boto3.resource('dynamodb', region_name=REGION)
s3_client = boto3.client('s3', region_name=REGION)

# --- 3. ระบุตาราง ---
TABLE_INCIDENTS = dynamodb.Table('Incidents')
TABLE_COMPLAINTS = dynamodb.Table('Complaints')

def lambda_handler(event, context):
    path = event.get('path', '')
    method = event.get('httpMethod', '')
    
    # สำหรับจัดการ CORS
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    }

    if method == 'OPTIONS':
        return create_response(200, "OK", headers)

    try:
       # แก้ไขในส่วน if 'Admin/dashboard' in path:
        if 'Admin/dashboard' in path and method == 'GET':
            inc_items = TABLE_INCIDENTS.scan().get('Items', [])
            comp_items = TABLE_COMPLAINTS.scan().get('Items', [])
            all_items = inc_items + comp_items

            # 1. จัดการหมวดหมู่และสีสำหรับกราฟ
            cat_counts = {}
            preset_colors = ["#FF6B6B", "#4D96FF", "#FFD93D", "#6BCB77", "#9575DE"]
            for item in all_items:
                c = item.get('category', 'อื่นๆ')
                cat_counts[c] = cat_counts.get(c, 0) + 1
            
            categories = []
            for i, (name, count) in enumerate(cat_counts.items()):
                categories.append({
                    "name": name, 
                    "count": count, 
                    "color": preset_colors[i % len(preset_colors)]
                })

            # 2. จัดการรายการล่าสุด (ตรวจสอบว่าฟิลด์ชื่อ subject และ incident_id/complaint_id)
            # เราจะใช้ process_items ที่คุณมีอยู่แล้ว แต่ต้องมั่นใจว่ามันส่ง list ออกมา
            processed_latest = process_items(all_items)[:10]

            data = {
                "stats": {
                    "incident_count": len(inc_items),
                    "complaint_count": len(comp_items),
                    "pending_cases": len([i for i in all_items if i.get('status') == 'pending'])
                },
                "categories": categories,
                "latest_cases": processed_latest
            }
            return create_response(200, data, headers)
        
        # 2. หน้า Login (Hardcoded ง่ายๆ สำหรับส่งงาน)
        elif 'Admin/login' in path and method == 'POST':
            body = json.loads(event.get('body', '{}'))
            if body.get('email') == "admin@tu.ac.th" and body.get('password') == "123456":
                return create_response(200, {"status": "success", "token": "admin-key"}, headers)
            return create_response(401, {"message": "Email หรือ Password ไม่ถูกต้อง"}, headers)

        # 3. อัปเดตสถานะ (ต้องเช็ก Key ให้ถูกตาราง)
        elif 'Admin/update-status' in path and method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            item_id = body.get('id')
            new_status = body.get('status')
            table_type = body.get('type') # 'incident' หรือ 'complaint'

            if table_type == 'incident':
                TABLE_INCIDENTS.update_item(
                    Key={'incident_id': item_id}, # แก้ชื่อ Key ให้ตรง
                    UpdateExpression="set #st = :s",
                    ExpressionAttributeNames={'#st': 'status'},
                    ExpressionAttributeValues={':s': new_status}
                )
            else:
                TABLE_COMPLAINTS.update_item(
                    Key={'complaint_id': item_id}, # แก้ชื่อ Key ให้ตรง
                    UpdateExpression="set #st = :s",
                    ExpressionAttributeNames={'#st': 'status'},
                    ExpressionAttributeValues={':s': new_status}
                )
            return create_response(200, {"message": "บันทึกสถานะเรียบร้อย"}, headers)

        return create_response(404, {"message": "ไม่พบ Path ที่ระบุ"}, headers)

    except Exception as e:
        print(f"Error: {str(e)}")
        return create_response(500, {"error": str(e)}, headers)

def process_items(items):
    # ฟังก์ชันช่วยจัดการรูปภาพและเรียงลำดับเวลา
    for item in items:
        # เปลี่ยน 'image_url' เป็นชื่อฟิลด์ที่คุณใช้ใน DB
        img_field = item.get('image_url') 
        if img_field and 's3.amazonaws.com/' in img_field:
            # ดึงเฉพาะ Key ออกมา (เช่น complaints/abc.jpg)
            s3_key = img_field.split('s3.amazonaws.com/')[-1]
            item['image_url_presigned'] = s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': S3_BUCKET_NAME, 'Key': s3_key},
                ExpiresIn=3600
            )
    # เรียงจากใหม่ไปเก่า (ถ้ามี timestamp)
    return sorted(items, key=lambda x: x.get('timestamp', ''), reverse=True)

def create_response(status, data, headers):
    return {
        'statusCode': status,
        'headers': headers,
        'body': json.dumps(data, ensure_ascii=False)
    }