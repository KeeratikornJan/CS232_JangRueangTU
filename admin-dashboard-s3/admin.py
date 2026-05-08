import json
import boto3
import os
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

S3_BUCKET_NAME = 'your-bucket-name'

dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3', region_name=REGION)

TABLE_INCIDENTS = dynamodb.Table('Incidents')
TABLE_COMPLAINTS = dynamodb.Table('Complaints')

def lambda_handler(event, context):
    path = event.get('path', '')
    method = event.get('httpMethod', '')
    
    try:
        # Dashboard
        if '/dashboard' in path and method == 'GET':
            inc_items = TABLE_INCIDENTS.scan().get('Items', [])
            comp_items = TABLE_COMPLAINTS.scan().get('Items', [])
            
            # สร้างสถิติและดึงรายการล่าสุด
            data = {
                "stats": {
                    "incident_count": len(inc_items),
                    "complaint_count": len(comp_items),
                    "pending_incidents": len([i for i in inc_items if i.get('status') == 'pending'])
                },
                "latest_cases": process_items(inc_items + comp_items)[:5]
            }
            return create_response(200, data)

        # หน้าแจ้งเหตุ (incidents)
        elif '/incidents' in path:
            if method == 'GET':
                items = TABLE_INCIDENTS.scan().get('Items', [])
                return create_response(200, process_items(items))
            
            elif method == 'POST':
                body = json.loads(event.get('body', '{}'))
                TABLE_INCIDENTS.update_item(
                    Key={'code': body.get('code')},
                    UpdateExpression="set #s = :val",
                    ExpressionAttributeNames={'#s': 'status'},
                    ExpressionAttributeValues={':val': 'received'}
                )
                return create_response(200, {"message": "Success"})

        # หน้าเรื่องร้องเรียน & ส่งต่อ
        elif '/complaints' in path:
            if method == 'GET':
                items = TABLE_COMPLAINTS.scan().get('Items', [])
                return create_response(200, process_items(items))
            
            elif method == 'POST':
                body = json.loads(event.get('body', '{}'))
                TABLE_COMPLAINTS.update_item(
                    Key={'id': body.get('id')},
                    UpdateExpression="set department = :d, note = :n, #s = :s",
                    ExpressionAttributeNames={'#s': 'status'},
                    ExpressionAttributeValues={
                        ':d': body.get('department'),
                        ':n': body.get('note'),
                        ':s': 'forwarded'
                    }
                )
                return create_response(200, {"message": "Updated"})

        # หน้า Login
        elif '/login' in path and method == 'POST':
            body = json.loads(event.get('body', '{}'))
            if body.get('email') == "admin@tu.ac.th" and body.get('password') == "123456":
                return create_response(200, {"status": "success", "token": "admin-key"})
            return create_response(401, {"message": "Unauthorized"})

        return create_response(404, {"message": "Not Found"})

    except Exception as e:
        print(f"Error: {e}")
        return create_response(500, {"error": str(e)})

def process_items(items):
    for item in items:
        if 'image' in item and item['image'] and not item['image'].startswith('http'):
            item['image'] = s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': S3_BUCKET_NAME, 'Key': item['image']},
                ExpiresIn=3600
            )
    return items

def create_response(status, data):
    return {
        'statusCode': status,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
        },
        'body': json.dumps(data)
    }