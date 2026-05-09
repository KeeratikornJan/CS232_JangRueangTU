"""
JANGRUEANG TU – Single AWS Lambda handler.

Routes (single API Gateway resource, ANY /cases):
    OPTIONS  -> CORS pre-flight
    GET      -> list all cases (optional ?type=complaint|incident, ?complaint_id=...)
    POST     -> create a complaint or incident; uploads embedded image to S3
    PUT      -> update status / department / note for a case

Storage:
    DynamoDB table : CS232ProjectData          (PK: complaint_id, type STRING)
    S3 bucket      : cs232-complaint-images-10 (objects under complaints/* or incidents/*)

Notifications:
    SNS topic      : SNS_TOPIC_ARN (env var or constant). On every successful
                     POST the admin subscriber list receives an email with the
                     case subject, location, and user email. Publish failures
                     are logged and swallowed so DDB writes always succeed.

Runtime configuration is read from environment variables so the same artefact
can be deployed to multiple stages without touching code.
"""

import base64
import json
import os
import re
import uuid
from datetime import datetime, timezone

import boto3
from boto3.dynamodb.conditions import Attr
from botocore.client import Config as BotoConfig

REGION = os.environ.get("AWS_REGION", "us-east-1")
TABLE_NAME = os.environ.get("DDB_TABLE", "CS232ProjectData")
S3_BUCKET = os.environ.get("S3_BUCKET", "cs232-complaint-images-10")
PRESIGN_EXPIRES = int(os.environ.get("PRESIGN_EXPIRES", "3600"))

# --- SNS ----------------------------------------------------------------------
# Drop the actual Topic ARN here (or set the SNS_TOPIC_ARN env var on the
# Lambda). When the env var is present it always wins, so production deploys
# don't need a code change.
SNS_TOPIC_ARN = os.environ.get(
    "SNS_TOPIC_ARN",
    "arn:aws:sns:us-east-1:770235943170:CS232ComplaintNotification",
)

dynamodb = boto3.resource("dynamodb", region_name=REGION)
table = dynamodb.Table(TABLE_NAME)
# signature_version='s3v4' is required for presigned GETs in most regions.
s3 = boto3.client("s3", region_name=REGION, config=BotoConfig(signature_version="s3v4"))
sns = boto3.client("sns", region_name=REGION)

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token",
    "Access-Control-Max-Age": "3600",
    "Content-Type": "application/json; charset=utf-8",
}

ALLOWED_IMAGE_EXT = {"jpg", "jpeg", "png", "gif", "webp"}
MIME_BY_EXT = {
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
    "gif": "image/gif",
    "webp": "image/webp",
}


def lambda_handler(event, context):
    method = (
        event.get("httpMethod")
        or event.get("requestContext", {}).get("http", {}).get("method")
        or ""
    ).upper()

    print(f"[lambda_handler] method={method} path={event.get('path') or event.get('rawPath')} qs={event.get('queryStringParameters')}")

    # Always answer the pre-flight, regardless of any other state.
    if method == "OPTIONS":
        return _respond(200, {"message": "OK"})

    try:
        if method == "GET":
            return _handle_get(event)
        if method == "POST":
            return _handle_post(event)
        if method == "PUT":
            return _handle_put(event)
        return _respond(405, {"message": f"Method '{method}' not allowed"})
    except Exception as exc:  # noqa: BLE001 – Lambda boundary
        import traceback
        traceback.print_exc()
        print(f"[lambda_handler] error: {exc}")
        # CORS headers are baked into _respond, so even 500s won't trip the browser.
        return _respond(500, {"error": str(exc)})


def _handle_get(event):
    qs = event.get("queryStringParameters") or {}
    complaint_id = qs.get("complaint_id") or qs.get("id")
    filter_type = (qs.get("type") or "").lower().strip()

    if complaint_id:
        item = table.get_item(Key={"complaint_id": complaint_id}).get("Item")
        if item:
            _attach_presigned_url(item)
        return _respond(200, item or {})

    scan_kwargs = {}
    if filter_type in ("complaint", "incident"):
        scan_kwargs["FilterExpression"] = Attr("type").eq(filter_type)

    items = []
    response = table.scan(**scan_kwargs)
    items.extend(response.get("Items", []))
    while "LastEvaluatedKey" in response:
        scan_kwargs["ExclusiveStartKey"] = response["LastEvaluatedKey"]
        response = table.scan(**scan_kwargs)
        items.extend(response.get("Items", []))

    items.sort(key=lambda it: it.get("timestamp", ""), reverse=True)
    for it in items:
        _attach_presigned_url(it)
    return _respond(200, items)


def _handle_post(event):
    body = _parse_body(event)
    if not body:
        return _respond(400, {"message": "Request body is required"})

    raw_type = (body.get("type") or "").lower().strip()
    if raw_type not in ("complaint", "incident"):
        raw_type = "incident" if (body.get("category") or "").strip() == "แจ้งเหตุ" else "complaint"

    prefix = "EMG" if raw_type == "incident" else "GU"
    complaint_id = f"{prefix}-{uuid.uuid4().hex[:10].upper()}"

    image_url = ""
    file_data = body.get("fileData")
    file_name = body.get("fileName") or ""
    if file_data:
        image_url = _upload_image(complaint_id, file_data, file_name, raw_type)

    firstname = (body.get("firstname") or "").strip()
    lastname = (body.get("lastname") or "").strip()

    item = {
        "complaint_id": complaint_id,
        "type": raw_type,
        "status": "pending",
        "category": body.get("category") or "อื่นๆ",
        "subject": body.get("subject") or "",
        "location": body.get("location") or "",
        "details": body.get("details") or "",
        "event_time": body.get("event_time") or "",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "firstname": firstname,
        "lastname": lastname,
        "fullname": f"{firstname} {lastname}".strip(),
        "email": body.get("email") or "",
        "phone": body.get("phone") or "",
        "id_card": body.get("id_card") or "",
        "image_url": image_url,
        "department": body.get("department") or "",
        "note": body.get("note") or "",
    }

    table.put_item(Item=item)

    # Fire the admin notification AFTER the DDB write succeeds. Any failure here
    # must not break the user-facing 200 response — the case is already saved.
    sns_published = _publish_new_case_notification(item)

    return _respond(
        200,
        {
            "status": "success",
            "complaint_id": complaint_id,
            "type": raw_type,
            "image_url": image_url,
            "notification_sent": sns_published,
        },
    )


def _handle_put(event):
    body = _parse_body(event)
    complaint_id = body.get("complaint_id") or body.get("id")
    if not complaint_id:
        return _respond(400, {"message": "complaint_id is required"})

    update_fields = {k: body[k] for k in ("status", "department", "note") if k in body and body[k] is not None}
    if not update_fields:
        return _respond(400, {"message": "No updatable fields supplied"})

    expr_names = {f"#{k}": k for k in update_fields}
    expr_values = {f":{k}": v for k, v in update_fields.items()}
    update_expr = "SET " + ", ".join(f"#{k} = :{k}" for k in update_fields)

    table.update_item(
        Key={"complaint_id": complaint_id},
        UpdateExpression=update_expr,
        ExpressionAttributeNames=expr_names,
        ExpressionAttributeValues=expr_values,
    )
    return _respond(200, {"status": "success", "complaint_id": complaint_id, "updated": list(update_fields.keys())})


def _upload_image(complaint_id, file_data, file_name, kind):
    encoded = file_data.split(",", 1)[1] if "," in file_data else file_data
    binary = base64.b64decode(encoded)

    ext = (file_name.rsplit(".", 1)[-1] if "." in file_name else "png").lower()
    ext = re.sub(r"[^a-z0-9]", "", ext) or "png"
    if ext not in ALLOWED_IMAGE_EXT:
        ext = "png"

    folder = "incidents" if kind == "incident" else "complaints"
    key = f"{folder}/{complaint_id}.{ext}"

    s3.put_object(
        Bucket=S3_BUCKET,
        Key=key,
        Body=binary,
        ContentType=MIME_BY_EXT.get(ext, "image/png"),
        ContentDisposition="inline",
        CacheControl="public, max-age=31536000",
    )
    return f"https://{S3_BUCKET}.s3.{REGION}.amazonaws.com/{key}"


def _publish_new_case_notification(item):
    """Send an admin email via SNS when a new case is created.

    Returns True on success, False on any failure. The exception is logged but
    swallowed — DynamoDB has already accepted the record, so a transient SNS
    issue must never propagate back to the caller.
    """
    if not SNS_TOPIC_ARN or SNS_TOPIC_ARN == "YOUR_SNS_TOPIC_ARN_HERE":
        print("[sns] SNS_TOPIC_ARN is not configured — skipping notification.")
        return False

    kind_label = "Emergency / แจ้งเหตุ" if item.get("type") == "incident" else "Complaint / ร้องเรียน"
    subject_line = f"[JANGRUEANG TU] New {kind_label}: {item.get('subject') or '(no subject)'}"
    # SNS email subjects are capped at 100 chars and must be ASCII-only.
    subject_line = "".join(ch if 32 <= ord(ch) < 127 else "?" for ch in subject_line)[:100]

    user_email = item.get("email") or "(not provided)"
    body_lines = [
        "A new case has just been submitted via JANGRUEANG TU.",
        "",
        f"Case ID    : {item.get('complaint_id', '-')}",
        f"Type       : {item.get('type', '-')}",
        f"Category   : {item.get('category', '-')}",
        f"Subject    : {item.get('subject') or '-'}",
        f"Location   : {item.get('location') or '-'}",
        f"User Email : {user_email}",
        f"Event Time : {item.get('event_time') or '-'}",
        f"Submitted  : {item.get('timestamp', '-')}",
        "",
        f"Reporter   : {item.get('fullname') or '-'} ({item.get('phone') or '-'})",
        f"Details    : {item.get('details') or '-'}",
    ]
    if item.get("image_url"):
        body_lines.append(f"Image      : {item['image_url']}")
    body_text = "\n".join(body_lines)

    try:
        response = sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=subject_line,
            Message=body_text,
            MessageAttributes={
                "case_type":   {"DataType": "String", "StringValue": item.get("type") or "complaint"},
                "case_id":     {"DataType": "String", "StringValue": item.get("complaint_id") or ""},
                "user_email":  {"DataType": "String", "StringValue": user_email},
            },
        )
        print(f"[sns] Published notification: MessageId={response.get('MessageId')}")

        # User confirmation: log-only acknowledgement. SNS itself can't email
        # an arbitrary recipient unless they're already subscribed to a topic,
        # so we keep this as an audit log line that CloudWatch can capture.
        if user_email and user_email != "(not provided)":
            print(f"[sns] Acknowledged submitter: {user_email} for case {item.get('complaint_id')}")

        return True
    except Exception as exc:  # noqa: BLE001 — never break the caller
        print(f"[sns] publish failed for case {item.get('complaint_id')}: {exc}")
        return False


def _attach_presigned_url(item):
    """Inject a short-lived presigned GET URL alongside the public S3 URL.

    Browsers occasionally block direct S3 reads with CORB even when the bucket
    policy is correct; a presigned URL is signed on the API side and the browser
    treats it as a plain authenticated GET, sidestepping the issue.
    """
    public_url = item.get("image_url")
    if not public_url or "amazonaws.com/" not in public_url:
        return
    try:
        key = public_url.split("amazonaws.com/", 1)[1]
        item["image_url_presigned"] = s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": S3_BUCKET, "Key": key},
            ExpiresIn=PRESIGN_EXPIRES,
        )
    except Exception as exc:  # noqa: BLE001
        print(f"[_attach_presigned_url] failed for {public_url}: {exc}")


def _parse_body(event):
    raw = event.get("body")
    if not raw:
        return {}
    if event.get("isBase64Encoded"):
        raw = base64.b64decode(raw).decode("utf-8")
    try:
        return json.loads(raw)
    except (TypeError, ValueError):
        return {}


def _respond(status, body):
    return {
        "statusCode": status,
        "headers": CORS_HEADERS,
        "body": json.dumps(body, ensure_ascii=False, default=str),
    }
