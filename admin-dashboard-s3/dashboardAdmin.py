import json
import boto3
from boto3.dynamodb.conditions import Key

# เชื่อมต่อกับ DynamoDB
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Complaints')
table = dynamodb.Table('Incidents')

def lambda_handler(event, context):
    path = event.get('rawPath', event.get('path'))
    method = event.get('requestContext', {}).get('http', {}).get('method', 'GET')

    if path == "/stats" and method == "GET":
        try:
            # ดึงข้อมูลจากตาราง Complaints
            res_complaints = table_complaints.scan(ProjectionExpression="current_status")
            items_complaints = res_complaints.get('Items', [])

            # ดึงข้อมูลจากตาราง Incidents
            res_incidents = table_incidents.scan(ProjectionExpression="current_status")
            items_incidents = res_incidents.get('Items', [])

            # รวม List ของทั้งสองตารางเข้าด้วยกัน
            all_items = items_complaints + items_incidents

            # ตั้งตัวแปรสำหรับการนับ
            total = len(all_items)
            pending = 0
            processing = 0
            completed = 0

            # วนลูปนับจากรายการที่รวมกันแล้ว
            for item in all_items:
                status = item.get('current_status')
                if status == 'pending':
                    pending += 1
                elif status == 'processing':
                    processing += 1
                elif status == 'completed':
                    completed += 1

            # จัด Format ส่งกลับไปที่ Dashboard
            stats = {
                "summaries": [
                    {"label": "ทั้งหมด", "value": total, "icon": "", "bg": "bg-blue"},
                    {"label": "รอดำเนินการ", "value": pending, "icon": "✳", "bg": "bg-red"},
                    {"label": "กำลังดำเนินการ", "value": processing, "icon": "🔧", "bg": "bg-yellow"},
                    {"label": "เสร็จสิ้น", "value": completed, "icon": "✓", "bg": "bg-green"}
                ]
            }

            return create_response(200, stats)

        except Exception as e:
            return create_response(500, {"error": str(e)})
            
    # ดึง Feed ทั้งหมด เอาข้อมูลจาก 2 ตารางมาเรียงต่อกัน
    elif path == "/feeds" and method == "GET":
        try:
            res_c = table_complaints.scan()
            res_i = table_incidents.scan()
            
            # รวมกันแล้วส่งกลับไปแสดงผลในหน้า Feed
            all_feeds = res_c.get('Items', []) + res_i.get('Items', [])
            
            # Sort ข้อมูลตามเวลาที่นี่ก่อนส่งกลับ
            return create_response(200, all_feeds)
        except Exception as e:
            return create_response(500, {"error": str(e)})

    return create_response(404, {"message": "Not Found"})

def create_response(status_code, data):
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        },
        'body': json.dumps(data, ensure_ascii=False)
    }