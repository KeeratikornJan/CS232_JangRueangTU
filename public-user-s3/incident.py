import json
import boto3
import uuid
import base64
import os

# เรียกใช้ Service (Lambda มี boto3 ให้แล้ว)
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

# ตั้งชื่อ Bucket และ Table
S3_BUCKET_NAME = 'your-bucket-name' # เปลี่ยนชื่อ bucket
TABLE_NAME = 'Incidents'
table = dynamodb.Table(TABLE_NAME)

def lambda_handler(event, context):

    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    }

    try:
        data = json.loads(event['body'])
        incident_id = str(uuid.uuid4())

        image_url = ""

        file_content = data.get('fileData') 
        file_name = data.get('fileName')

        # ส่วนจัดการรูปภาพ: บันทึกลง S3
        if file_content and file_name:
            # แยก Header ของ Base64 ออก (เช่น data:image/png;base64,...)
            # เราต้องการแค่ข้อมูลหลังเครื่องหมายคอมม่า (,)
            if "," in file_content:
                encoded_data = file_content.split(",")[1]
            else:
                encoded_data = file_content
            
            # แปลง Base64 เป็น Binary
            image_binary = base64.b64decode(encoded_data)
            
            # กำหนดชื่อไฟล์ที่จะเก็บใน S3 (ใช้ ID เพื่อไม่ให้ชื่อซ้ำ)
            file_extension = file_name.split('.')[-1]
            s3_file_path = f"incident/{incident_id}.{file_extension}"
            
            # อัปโหลดไฟล์ไปที่ S3
            s3.put_object(
                Bucket=S3_BUCKET_NAME,
                Key=s3_file_path,
                Body=image_binary,
                ContentType=f"image/{file_extension}"
            )
            
            # สร้าง URL ของรูปภาพ
            file_url = f"https://{S3_BUCKET_NAME}.s3.amazonaws.com/{s3_file_path}"

        # ส่วนจัดการข้อมูล: บันทึกลง DynamoDB
        item = {
            'incident_id': incident_id,
            'category': data.get('category'),
            'firstname': data.get('firstname'),
            'lastname': data.get('lastname'),
            'email': data.get('email'),
            'phone': data.get('phone'),
            'subject': data.get('subject'),
            'location': data.get('location'),
            'details': data.get('details'),
            'event_time': data.get('event_time'),
            'image_url': image_url, # เก็บ Link แทนการเก็บตัวรูป
        }
        
        table.put_item(Item=item)

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'status': 'success', 'incident_id': incident_id})
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }