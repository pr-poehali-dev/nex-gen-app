import json
import os
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p9569594_nex_gen_app')
ADMIN_KEY = os.environ.get('ADMIN_SECRET_KEY', '')

def cors():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key, X-Session-Id',
    }

def ok(data):
    return {'statusCode': 200, 'headers': cors(), 'body': json.dumps(data, ensure_ascii=False, default=str)}

def err(msg, code=400):
    return {'statusCode': code, 'headers': cors(), 'body': json.dumps({'error': msg}, ensure_ascii=False)}

def is_admin(cur, session_id, admin_key):
    if ADMIN_KEY and admin_key == ADMIN_KEY:
        return True
    if session_id:
        cur.execute(
            f"SELECT u.role FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON u.id = s.user_id WHERE s.id = %s AND s.expires_at > NOW() AND u.status = 'active' AND u.role = 'admin'",
            (session_id,)
        )
        return cur.fetchone() is not None
    return False

def handler(event: dict, context) -> dict:
    """Заявки в модераторы: POST — подать, GET — список (только admin), POST action — решение (только admin)."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors(), 'body': ''}

    headers = event.get('headers') or {}
    session_id = headers.get('X-Session-Id') or headers.get('x-session-id') or ''
    admin_key = headers.get('X-Admin-Key') or headers.get('x-admin-key') or ''
    method = event.get('httpMethod')

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    if method == 'GET':
        if not is_admin(cur, session_id, admin_key):
            cur.close(); conn.close()
            return err('Нет доступа', 401)
        cur.execute(f"SELECT id, name, contact, reason, status, created_at FROM {SCHEMA}.moderator_applications ORDER BY created_at DESC")
        rows = cur.fetchall()
        cur.close(); conn.close()
        return ok([{'id': r[0], 'name': r[1], 'contact': r[2], 'reason': r[3], 'status': r[4], 'created_at': r[5]} for r in rows])

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')

        if 'action' in body:
            if not is_admin(cur, session_id, admin_key):
                cur.close(); conn.close()
                return err('Нет доступа', 401)
            app_id = body.get('id')
            action = body.get('action')
            if not app_id or action not in ('approve', 'reject'):
                cur.close(); conn.close()
                return err('Укажи id и action')
            new_status = 'approved' if action == 'approve' else 'rejected'
            cur.execute(f"UPDATE {SCHEMA}.moderator_applications SET status = %s WHERE id = %s RETURNING id", (new_status, app_id))
            if cur.rowcount == 0:
                conn.rollback(); cur.close(); conn.close()
                return err('Заявка не найдена', 404)
            conn.commit(); cur.close(); conn.close()
            return ok({'success': True, 'status': new_status})

        name = (body.get('name') or '').strip()
        contact = (body.get('contact') or '').strip()
        reason = (body.get('reason') or '').strip()
        if not name or not contact or not reason:
            cur.close(); conn.close()
            return err('Заполни все поля')
        if len(reason) < 30:
            cur.close(); conn.close()
            return err('Расскажи подробнее — минимум 30 символов')
        cur.execute(f"INSERT INTO {SCHEMA}.moderator_applications (name, contact, reason) VALUES (%s, %s, %s) RETURNING id", (name, contact, reason))
        app_id = cur.fetchone()[0]
        conn.commit(); cur.close(); conn.close()
        return ok({'success': True, 'id': app_id})

    cur.close(); conn.close()
    return err('Method not allowed', 405)
