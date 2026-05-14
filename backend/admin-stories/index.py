import json
import os
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p9569594_nex_gen_app')
ADMIN_KEY = os.environ.get('ADMIN_SECRET_KEY', '')

def cors():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
    }

def ok(data):
    return {'statusCode': 200, 'headers': cors(), 'body': json.dumps(data, ensure_ascii=False, default=str)}

def err(msg, code=400):
    return {'statusCode': code, 'headers': cors(), 'body': json.dumps({'error': msg}, ensure_ascii=False)}

def handler(event: dict, context) -> dict:
    """Панель администратора: получение заявок и модерация историй."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors(), 'body': ''}

    headers = event.get('headers') or {}
    admin_key = headers.get('X-Admin-Key') or headers.get('x-admin-key') or ''
    if not ADMIN_KEY or admin_key != ADMIN_KEY:
        return err('Нет доступа', 401)

    method = event.get('httpMethod')
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    if method == 'GET':
        cur.execute(
            f"SELECT id, title, author_name, genre, text, status, created_at FROM {SCHEMA}.story_submissions ORDER BY created_at DESC"
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return ok([
            {'id': r[0], 'title': r[1], 'author_name': r[2], 'genre': r[3],
             'text': r[4], 'status': r[5], 'created_at': r[6]}
            for r in rows
        ])

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        submission_id = body.get('id')
        action = body.get('action')  # 'approve' | 'reject'

        if not submission_id or action not in ('approve', 'reject'):
            return err('Укажи id и action (approve/reject)')

        new_status = 'approved' if action == 'approve' else 'rejected'
        cur.execute(
            f"UPDATE {SCHEMA}.story_submissions SET status = %s WHERE id = %s RETURNING id",
            (new_status, submission_id)
        )
        if cur.rowcount == 0:
            conn.rollback()
            cur.close()
            conn.close()
            return err('Заявка не найдена', 404)

        conn.commit()
        cur.close()
        conn.close()
        return ok({'success': True, 'id': submission_id, 'status': new_status})

    return err('Method not allowed', 405)
