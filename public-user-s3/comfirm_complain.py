import json
import boto3
import uuid
import base64
from datetime import datetime

# เรียกใช้ Service
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

# ตั้งชื่อ Bucket และ Table
S3_BUCKET_NAME = 'cs232-complaint-images-99'
TABLE_NAME = 'Complaints'
table = dynamodb.Table(TABLE_NAME)

def lambda_handler(event, context):

    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    }

    # จัดการ OPTIONS (Pre-flight)
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps('OK')}

    try:
        if not event.get('body'):
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'message': 'ไม่มีข้อมูล'})}

        data = json.loads(event['body'])
        complaint_id = 'GU-' + str(uuid.uuid4())

        file_url = ''

        file_content = data.get('fileData')
        file_name = data.get('fileName')

        # ส่วนจัดการรูปภาพและ S3
        if file_content and file_name:
            # แยก Header ของ Base64 ออก (เช่น data:image/png;base64,...)
            if ',' in file_content:
                encoded_data = file_content.split(',')[1]
            else:
                encoded_data = file_content

            # แปลง Base64 เป็น Binary
            image_binary = base64.b64decode(encoded_data)

            # กำหนดชื่อไฟล์ที่จะเก็บใน S3 (ใช้ ID เพื่อไม่ให้ชื่อซ้ำ)
            file_extension = file_name.split('.')[-1]
            s3_file_path = f'complaints/{complaint_id}.{file_extension}'

            # อัปโหลดไปที่ S3
            s3.put_object(
                Bucket=S3_BUCKET_NAME,
                Key=s3_file_path,
                Body=image_binary,
                ContentType=f'image/{file_extension}'
            )

            # สร้าง URL ของไฟล์ (แบบ Public)
            file_url = f'https://{S3_BUCKET_NAME}.s3.amazonaws.com/{s3_file_path}'

        # ส่วนบันทึกลง DynamoDB
        item = {
            'complaint_id': complaint_id,
            'status': 'ใหม่',
            'timestamp': datetime.now().isoformat(),
            'category': data.get('category'),
            'fullname': f"{data.get('firstname')} {data.get('lastname')}",
            'email': data.get('email'),
            'phone': data.get('phone'),
            'id_card': data.get('id_card'),
            'subject': data.get('subject'),
            'location': data.get('location'),
            'details': data.get('details'),
            'event_time': data.get('event_time'),
            'image_url': file_url  # เก็บเป็น URL แทนรูปภาพจริง
        }

        table.put_item(Item=item)

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'status': 'success', 'complaint_id': complaint_id})
        }

    except Exception as e:
        print(f'Error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }
