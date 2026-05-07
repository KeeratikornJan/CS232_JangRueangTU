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

        # --- ส่วนจัดการรูปภาพ: บันทึกลง S3 ---
        if file_content:
            # ตัดส่วนหัวของ Base64 ออก (เช่น data:image/png;base64,)
            header, encoded = data.get('fileData').split(",", 1)
            file_extension = header.split('/')[1].split(';')[0] # ดึงนามสกุลไฟล์ (.png, .jpg)
            
            file_content = base64.b64decode(encoded)
            file_name = f"incidents/{incident_id}.{file_extension}"
            
            # อัปโหลดไฟล์ไปที่ S3
            s3.put_object(
                Bucket=S3_BUCKET_NAME,
                Key=file_name,
                Body=file_content,
                ContentType=f'image/{file_extension}'
            )
            
            # สร้าง URL ของรูปภาพ
            image_url = f"https://{S3_BUCKET_NAME}.s3.amazonaws.com/{file_name}"

        # --- ส่วนจัดการข้อมูล: บันทึกลง DynamoDB ---
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
            'status': 'pending'
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