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

def get_role_and_user(cur, session_id, admin_key):
    """Возвращает (role, user_id) или (None, None)."""
    if ADMIN_KEY and admin_key == ADMIN_KEY:
        return 'admin', None
    if session_id:
        cur.execute(
            f"SELECT u.role, u.id FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON u.id = s.user_id WHERE s.id = %s AND s.expires_at > NOW() AND u.status = 'active'",
            (session_id,)
        )
        row = cur.fetchone()
        if row and row[0] in ('admin', 'moderator'):
            return row[0], row[1]
    return None, None

def handler(event: dict, context) -> dict:
    """Панель: истории — CRUD с модерацией, комментариями, редактированием и статистикой."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors(), 'body': ''}

    headers = event.get('headers') or {}
    session_id = headers.get('X-Session-Id') or headers.get('x-session-id') or ''
    admin_key = headers.get('X-Admin-Key') or headers.get('x-admin-key') or ''
    params = event.get('queryStringParameters') or {}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    role, mod_user_id = get_role_and_user(cur, session_id, admin_key)
    if not role:
        cur.close(); conn.close()
        return err('Нет доступа', 401)

    method = event.get('httpMethod')

    # GET — список историй или статистика
    if method == 'GET':
        action = params.get('action', '')

        if action == 'stats':
            cur.execute(f"""
                SELECT
                    COUNT(*) FILTER (WHERE status = 'pending') AS pending,
                    COUNT(*) FILTER (WHERE status = 'approved') AS approved,
                    COUNT(*) FILTER (WHERE status = 'rejected') AS rejected,
                    COUNT(*) FILTER (WHERE status = 'deleted') AS deleted,
                    COUNT(*) AS total
                FROM {SCHEMA}.story_submissions
            """)
            row = cur.fetchone()
            totals = {'pending': row[0], 'approved': row[1], 'rejected': row[2], 'deleted': row[3], 'total': row[4]}

            cur.execute(f"""
                SELECT u.username, u.role,
                    COUNT(*) FILTER (WHERE s.status = 'approved') AS approved,
                    COUNT(*) FILTER (WHERE s.status = 'rejected') AS rejected,
                    MAX(s.moderated_at) AS last_action
                FROM {SCHEMA}.story_submissions s
                JOIN {SCHEMA}.users u ON u.id = s.moderated_by
                WHERE s.moderated_by IS NOT NULL
                GROUP BY u.username, u.role
                ORDER BY (COUNT(*) FILTER (WHERE s.status = 'approved') + COUNT(*) FILTER (WHERE s.status = 'rejected')) DESC
            """)
            rows = cur.fetchall()
            moderators = [{'username': r[0], 'role': r[1], 'approved': r[2], 'rejected': r[3], 'last_action': str(r[4]) if r[4] else None} for r in rows]

            cur.execute(f"""
                SELECT DATE(created_at), COUNT(*) FROM {SCHEMA}.story_submissions
                WHERE created_at > NOW() - INTERVAL '30 days'
                GROUP BY DATE(created_at) ORDER BY DATE(created_at)
            """)
            by_day = [{'date': str(r[0]), 'count': r[1]} for r in cur.fetchall()]

            cur.close(); conn.close()
            return ok({'totals': totals, 'moderators': moderators, 'by_day': by_day})

        cur.execute(f"""
            SELECT s.id, s.title, s.author_name, s.genre, s.text, s.status,
                   s.created_at, s.moderator_comment, s.moderated_at,
                   u.username AS moderated_by_username
            FROM {SCHEMA}.story_submissions s
            LEFT JOIN {SCHEMA}.users u ON u.id = s.moderated_by
            ORDER BY s.created_at DESC
        """)
        rows = cur.fetchall()
        cur.close(); conn.close()
        return ok([{
            'id': r[0], 'title': r[1], 'author_name': r[2], 'genre': r[3], 'text': r[4],
            'status': r[5], 'created_at': str(r[6]), 'moderator_comment': r[7] or '',
            'moderated_at': str(r[8]) if r[8] else None, 'moderated_by': r[9] or ''
        } for r in rows])

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        action = body.get('action')
        submission_id = body.get('id')

        # Редактирование истории
        if action == 'edit':
            if not submission_id:
                cur.close(); conn.close()
                return err('Укажи id')
            title = (body.get('title') or '').strip()
            text = (body.get('text') or '').strip()
            genre = (body.get('genre') or '').strip()
            if not title or not text:
                cur.close(); conn.close()
                return err('Заголовок и текст обязательны')
            cur.execute(
                f"UPDATE {SCHEMA}.story_submissions SET title = %s, text = %s, genre = %s WHERE id = %s RETURNING id",
                (title, text, genre, submission_id)
            )
            if cur.rowcount == 0:
                conn.rollback(); cur.close(); conn.close()
                return err('История не найдена', 404)
            conn.commit(); cur.close(); conn.close()
            return ok({'success': True})

        # Модерация (одобрить/отклонить/удалить)
        comment = (body.get('comment') or '').strip()
        allowed = ('approve', 'reject', 'delete') if role == 'admin' else ('approve', 'reject')
        if not submission_id or action not in allowed:
            cur.close(); conn.close()
            return err('Недопустимое действие или нет прав')

        if action == 'delete':
            cur.execute(
                f"UPDATE {SCHEMA}.story_submissions SET status = 'deleted', moderator_comment = %s, moderated_by = %s, moderated_at = NOW() WHERE id = %s RETURNING id",
                (comment or None, mod_user_id, submission_id)
            )
            if cur.rowcount == 0:
                conn.rollback(); cur.close(); conn.close()
                return err('История не найдена', 404)
            conn.commit(); cur.close(); conn.close()
            return ok({'success': True, 'id': submission_id, 'deleted': True})

        new_status = 'approved' if action == 'approve' else 'rejected'
        cur.execute(
            f"UPDATE {SCHEMA}.story_submissions SET status = %s, moderator_comment = %s, moderated_by = %s, moderated_at = NOW() WHERE id = %s RETURNING id",
            (new_status, comment or None, mod_user_id, submission_id)
        )
        if cur.rowcount == 0:
            conn.rollback(); cur.close(); conn.close()
            return err('История не найдена', 404)
        conn.commit(); cur.close(); conn.close()
        return ok({'success': True, 'id': submission_id, 'status': new_status})

    cur.close(); conn.close()
    return err('Method not allowed', 405)
