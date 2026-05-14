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

def get_role(cur, session_id, admin_key):
    """Возвращает роль: 'admin', 'moderator' или None."""
    if ADMIN_KEY and admin_key == ADMIN_KEY:
        return 'admin'
    if session_id:
        cur.execute(
            f"SELECT u.role FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON u.id = s.user_id WHERE s.id = %s AND s.expires_at > NOW() AND u.status = 'active'",
            (session_id,)
        )
        row = cur.fetchone()
        if row and row[0] in ('admin', 'moderator'):
            return row[0]
    return None

def handler(event: dict, context) -> dict:
    """Панель: истории — GET список, POST модерация/удаление. Удаление только для admin."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors(), 'body': ''}

    headers = event.get('headers') or {}
    session_id = headers.get('X-Session-Id') or headers.get('x-session-id') or ''
    admin_key = headers.get('X-Admin-Key') or headers.get('x-admin-key') or ''

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    role = get_role(cur, session_id, admin_key)
    if not role:
        cur.close(); conn.close()
        return err('Нет доступа', 401)

    method = event.get('httpMethod')

    if method == 'GET':
        cur.execute(f"SELECT id, title, author_name, genre, text, status, created_at FROM {SCHEMA}.story_submissions ORDER BY created_at DESC")
        rows = cur.fetchall()
        cur.close(); conn.close()
        return ok([{'id': r[0], 'title': r[1], 'author_name': r[2], 'genre': r[3], 'text': r[4], 'status': r[5], 'created_at': r[6]} for r in rows])

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        submission_id = body.get('id')
        action = body.get('action')

        allowed = ('approve', 'reject', 'delete') if role == 'admin' else ('approve', 'reject')
        if not submission_id or action not in allowed:
            cur.close(); conn.close()
            return err('Недопустимое действие или нет прав')

        if action == 'delete':
            cur.execute(f"UPDATE {SCHEMA}.story_submissions SET status = 'deleted' WHERE id = %s RETURNING id", (submission_id,))
            if cur.rowcount == 0:
                conn.rollback(); cur.close(); conn.close()
                return err('История не найдена', 404)
            conn.commit(); cur.close(); conn.close()
            return ok({'success': True, 'id': submission_id, 'deleted': True})

        new_status = 'approved' if action == 'approve' else 'rejected'
        cur.execute(f"UPDATE {SCHEMA}.story_submissions SET status = %s WHERE id = %s RETURNING id", (new_status, submission_id))
        if cur.rowcount == 0:
            conn.rollback(); cur.close(); conn.close()
            return err('История не найдена', 404)
        conn.commit(); cur.close(); conn.close()
        return ok({'success': True, 'id': submission_id, 'status': new_status})

    cur.close(); conn.close()
    return err('Method not allowed', 405)
