import json
import boto3
import uuid
import base64
from datetime import datetime

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

S3_BUCKET_NAME = 'cs232-complaint-images-99'
TABLE_NAME = 'Complaints'
table = dynamodb.Table(TABLE_NAME)

def lambda_handler(event, context):
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    }
    
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps('OK')}

    try:
        data = json.loads(event['body'])
        complaint_id = str(uuid.uuid4())
        
        file_url = ""
        file_content = data.get('fileData') 
        file_name = data.get('fileName')

        # การจัดการไฟล์ภาพ
        if file_content and file_name:
            if "," in file_content:
                encoded_data = file_content.split(",")[1]
            else:
                encoded_data = file_content
            
            image_binary = base64.b64decode(encoded_data)
            file_extension = file_name.split('.')[-1].lower()
            s3_file_path = f"complaints/{complaint_id}.{file_extension}"
            
            s3.put_object(
                Bucket=S3_BUCKET_NAME,
                Key=s3_file_path,
                Body=image_binary,
                ContentType=f"image/png"
            )
            file_url = f"https://{S3_BUCKET_NAME}.s3.amazonaws.com/{s3_file_path}"

        # บันทึกลง DynamoDB พร้อมสถานะ pending
        item = {
            'complaint_id': complaint_id,
            'timestamp': datetime.now().isoformat(),
            'status': 'pending', # เพิ่มเพื่อให้ระบบ Admin มองเห็น
            'category': data.get('category'),
            'fullname': f"{data.get('firstname')} {data.get('lastname')}",
            'email': data.get('email'),
            'phone': data.get('phone'),
            'id_card': data.get('id_card'),
            'subject': data.get('subject'),
            'location': data.get('location'),
            'details': data.get('details'),
            'image_url': file_url   # เก็บเป็น URL แทนรูปภาพจริง
        }
        table.put_item(Item=item)

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'status': 'success', 'complaint_id': complaint_id})
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }