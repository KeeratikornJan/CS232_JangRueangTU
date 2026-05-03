import json
import boto3
import uuid
from datetime import datetime

# เชื่อมต่อ DynamoDB
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('CS232ProjectData')

def lambda_handler(event, context):
    # 1. ตั้งค่า CORS (เพิ่ม GET เข้าไปใน Methods)
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization" # เพิ่ม Authorization สำหรับ Cognito
    }
    
    method = event.get('httpMethod')

    # จัดการ OPTIONS (Pre-flight)
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps('OK')}

    # ----------------------------------------------------
    # ส่วนของ ADMIN: ดึงข้อมูล (GET)
    # ----------------------------------------------------
    if method == 'GET':
        try:
            # ดึงข้อมูลทั้งหมดจาก DynamoDB
            response = table.scan()
            items = response.get('Items', [])
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps(items)
            }
        except Exception as e:
            return {'statusCode': 500, 'headers': headers, 'body': json.dumps({'error': str(e)})}

    # ----------------------------------------------------
    # ส่วนของ USER: บันทึกข้อมูล (POST)
    # ----------------------------------------------------
    elif method == 'POST':
        try:
            if not event.get('body'):
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'message': 'ไม่มีข้อมูล'})}

            data = json.loads(event['body'])
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
                'fileData': data.get('fileData')
            }

            table.put_item(Item=item)
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'status': 'success', 'id': complaint_id})
            }
        except Exception as e:
            return {'statusCode': 500, 'headers': headers, 'body': json.dumps({'error': 'Internal Error'})}

    return {'statusCode': 405, 'headers': headers, 'body': json.dumps({'message': 'Method Not Allowed'})}