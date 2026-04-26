import json
import boto3
import uuid
from datetime import datetime

# เชื่อมต่อ DynamoDB (เรียกไว้นอก Handler เพื่อความเร็วในการรันครั้งต่อไป)
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Complaints')

def lambda_handler(event, context):
    # 1. จัดการเรื่อง CORS (เพื่อให้ Browser ยอมรับ)
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    }
    
    # ถ้าเป็นคำขอแบบ OPTIONS (Pre-flight) ให้ตอบกลับทันที
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps('OK')
        }

    try:
        # 2. รับข้อมูลจาก Body (API Gateway ส่งมาเป็น String ต้องแปลงเป็น Dict)
        if event.get('body'):
            data = json.loads(event['body'])
        else:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'message': 'ไม่มีข้อมูลส่งมา'})
            }

        # 3. เตรียมข้อมูลบันทึกลง DynamoDB
        complaint_id = str(uuid.uuid4())
        item = {
            'complaint_id': complaint_id,
            'timestamp': datetime.now().isoformat(),
            'category': data.get('category'),
            'firstname': data.get('firstname'),
            'lastname': data.get('lastname'),
            'email': data.get('email'),
            'phone': data.get('phone'),
            'id_card': data.get('id_card'),
            'subject': data.get('subject'),
            'location': data.get('location'),
            'details': data.get('details'),
            'event_time': data.get('event_time'),
            'fileName': data.get('fileName'),
            'fileData': data.get('fileData') # เก็บ Base64
        }

        # 4. บันทึกลงตาราง
        table.put_item(Item=item)

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'status': 'success',
                'message': 'บันทึกข้อมูลเรียบร้อย',
                'id': complaint_id
            })
        }

    except Exception as e:
        print(f"Error: {str(e)}") # เก็บ Log ไว้ดูใน CloudWatch
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': 'เกิดข้อผิดพลาดภายในระบบ'})
        }