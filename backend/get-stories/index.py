import json
import os
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p9569594_nex_gen_app')

def cors():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id',
    }

def ok(data):
    return {'statusCode': 200, 'headers': cors(), 'body': json.dumps(data, ensure_ascii=False, default=str)}

def err(msg, code=400):
    return {'statusCode': code, 'headers': cors(), 'body': json.dumps({'error': msg}, ensure_ascii=False)}

def get_user(cur, session_id):
    if not session_id:
        return None
    cur.execute(
        f"SELECT u.id, u.username, u.role, u.name_prefix, u.name_color, u.name_effect, u.custom_role FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON u.id = s.user_id WHERE s.id = %s AND s.expires_at > NOW() AND u.status = 'active'",
        (session_id,)
    )
    row = cur.fetchone()
    return {'id': row[0], 'username': row[1], 'role': row[2], 'name_prefix': row[3] or '', 'name_color': row[4] or '', 'name_effect': row[5] or '', 'custom_role': row[6] or ''} if row else None

def handler(event: dict, context) -> dict:
    """
    GET /?id=N       — одна история
    GET /            — список историй
    GET /?comments=N — комментарии к истории N
    POST /           — добавить комментарий (только admin/moderator)
    """
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors(), 'body': ''}

    headers = event.get('headers') or {}
    session_id = headers.get('X-Session-Id') or headers.get('x-session-id') or ''
    params = event.get('queryStringParameters') or {}
    method = event.get('httpMethod')

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    # POST — добавить комментарий
    if method == 'POST':
        user = get_user(cur, session_id)
        if not user:
            cur.close(); conn.close()
            return err('Необходима авторизация', 401)
        body = json.loads(event.get('body') or '{}')
        story_id = body.get('story_id')
        text = (body.get('text') or '').strip()
        if not story_id or not text:
            cur.close(); conn.close()
            return err('Укажи story_id и text')
        if len(text) > 1000:
            cur.close(); conn.close()
            return err('Комментарий слишком длинный')
        # Берём актуальный avatar_url пользователя
        cur.execute(f"SELECT avatar_url FROM {SCHEMA}.users WHERE id = %s", (user['id'],))
        av = cur.fetchone()
        avatar_url = av[0] if av and av[0] else ''
        cur.execute(
            f"INSERT INTO {SCHEMA}.comments (story_id, user_id, username, role, text, avatar_url) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id, created_at",
            (story_id, user['id'], user['username'], user['role'], text, avatar_url)
        )
        row = cur.fetchone()
        conn.commit(); cur.close(); conn.close()
        return ok({'id': row[0], 'user_id': user['id'], 'username': user['username'], 'role': user['role'], 'text': text, 'avatar_url': avatar_url, 'name_prefix': user.get('name_prefix',''), 'name_color': user.get('name_color',''), 'name_effect': user.get('name_effect',''), 'custom_role': user.get('custom_role',''), 'badge_text': '', 'badge_effect': '', 'created_at': str(row[1])})

    # GET комментарии — подтягиваем актуальный avatar_url из users
    if 'comments' in params:
        story_id = params['comments']
        cur.execute(f"""
            SELECT c.id, c.user_id, c.username, c.role, c.text, c.created_at,
                   u.avatar_url, u.name_prefix, u.name_color, u.name_effect,
                   u.badge_text, u.badge_effect, u.custom_role, u.hide_role
            FROM {SCHEMA}.comments c
            LEFT JOIN {SCHEMA}.users u ON u.id = c.user_id
            WHERE c.story_id = %s ORDER BY c.created_at ASC
        """, (story_id,))
        rows = cur.fetchall()
        cur.close(); conn.close()
        return ok([{'id': r[0], 'user_id': r[1], 'username': r[2], 'role': r[3], 'text': r[4], 'created_at': str(r[5]), 'avatar_url': r[6] or '', 'name_prefix': r[7] or '', 'name_color': r[8] or '', 'name_effect': r[9] or '', 'badge_text': r[10] or '', 'badge_effect': r[11] or '', 'custom_role': r[12] or '', 'hide_role': bool(r[13])} for r in rows])

    # GET одна история + трекинг просмотра
    story_id = params.get('id')
    if story_id:
        cur.execute(
            f"SELECT id, title, author_name, genre, text, created_at FROM {SCHEMA}.story_submissions WHERE id = %s AND status = 'approved'",
            (story_id,)
        )
        row = cur.fetchone()
        if not row:
            cur.close(); conn.close()
            return err('Не найдено', 404)
        # Записываем просмотр
        user = get_user(cur, session_id)
        user_id = user['id'] if user else None
        cur.execute(
            f"INSERT INTO {SCHEMA}.story_views (story_id, user_id) VALUES (%s, %s)",
            (story_id, user_id)
        )
        conn.commit()
        cur.close(); conn.close()
        return ok({'id': row[0], 'title': row[1], 'author_name': row[2], 'genre': row[3], 'text': row[4], 'created_at': str(row[5])})

    # GET список историй с количеством просмотров
    cur.execute(f"""
        SELECT s.id, s.title, s.author_name, s.genre, s.text, s.created_at,
               COUNT(v.id) AS views
        FROM {SCHEMA}.story_submissions s
        LEFT JOIN {SCHEMA}.story_views v ON v.story_id = s.id
        WHERE s.status = 'approved'
        GROUP BY s.id
        ORDER BY s.created_at DESC
    """)
    rows = cur.fetchall()
    cur.close(); conn.close()
    return ok([{'id': r[0], 'title': r[1], 'author_name': r[2], 'genre': r[3], 'text': r[4], 'created_at': str(r[5]), 'views': r[6]} for r in rows])