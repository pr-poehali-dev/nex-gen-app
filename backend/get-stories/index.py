import json
import os
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p9569594_nex_gen_app')

def cors():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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
    GET /                — список историй
    GET /?id=N           — одна история (+ лайки/закладки если авторизован)
    GET /?comments=N     — комментарии к истории
    GET /?bookmarks=1    — закладки пользователя
    GET /?leaderboard=1  — рейтинг авторов
    POST / action=like          — лайкнуть/убрать лайк
    POST / action=bookmark      — добавить/убрать закладку
    POST / action=comment       — добавить комментарий
    POST / action=delete_comment — удалить свой комментарий
    POST / action=report_comment — пожаловаться на комментарий
    """
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors(), 'body': ''}

    headers = event.get('headers') or {}
    session_id = headers.get('X-Session-Id') or headers.get('x-session-id') or ''
    params = event.get('queryStringParameters') or {}
    method = event.get('httpMethod')

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    # POST
    if method == 'POST':
        user = get_user(cur, session_id)
        if not user:
            cur.close(); conn.close()
            return err('Необходима авторизация', 401)

        body = json.loads(event.get('body') or '{}')
        action = body.get('action', 'comment')

        # Лайк / убрать лайк
        if action == 'like':
            story_id = body.get('story_id')
            if not story_id:
                cur.close(); conn.close()
                return err('Укажи story_id')
            cur.execute(f"SELECT id FROM {SCHEMA}.story_likes WHERE story_id = %s AND user_id = %s", (story_id, user['id']))
            if cur.fetchone():
                cur.execute(f"DELETE FROM {SCHEMA}.story_likes WHERE story_id = %s AND user_id = %s", (story_id, user['id']))
                liked = False
            else:
                cur.execute(f"INSERT INTO {SCHEMA}.story_likes (story_id, user_id) VALUES (%s, %s)", (story_id, user['id']))
                liked = True
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.story_likes WHERE story_id = %s", (story_id,))
            count = cur.fetchone()[0]
            conn.commit(); cur.close(); conn.close()
            return ok({'liked': liked, 'count': count})

        # Закладка / убрать закладку
        if action == 'bookmark':
            story_id = body.get('story_id')
            if not story_id:
                cur.close(); conn.close()
                return err('Укажи story_id')
            cur.execute(f"SELECT id FROM {SCHEMA}.story_bookmarks WHERE story_id = %s AND user_id = %s", (story_id, user['id']))
            if cur.fetchone():
                cur.execute(f"DELETE FROM {SCHEMA}.story_bookmarks WHERE story_id = %s AND user_id = %s", (story_id, user['id']))
                bookmarked = False
            else:
                cur.execute(f"INSERT INTO {SCHEMA}.story_bookmarks (story_id, user_id) VALUES (%s, %s)", (story_id, user['id']))
                bookmarked = True
            conn.commit(); cur.close(); conn.close()
            return ok({'bookmarked': bookmarked})

        # Удалить свой комментарий
        if action == 'delete_comment':
            comment_id = body.get('comment_id')
            if not comment_id:
                cur.close(); conn.close()
                return err('Укажи comment_id')
            cur.execute(f"SELECT user_id FROM {SCHEMA}.comments WHERE id = %s", (comment_id,))
            row = cur.fetchone()
            if not row:
                cur.close(); conn.close()
                return err('Комментарий не найден', 404)
            if row[0] != user['id'] and user['role'] not in ('admin', 'moderator'):
                cur.close(); conn.close()
                return err('Нет доступа', 403)
            cur.execute(f"DELETE FROM {SCHEMA}.comments WHERE id = %s", (comment_id,))
            conn.commit(); cur.close(); conn.close()
            return ok({'success': True})

        # Пожаловаться на комментарий
        if action == 'report_comment':
            comment_id = body.get('comment_id')
            reason = (body.get('reason') or '').strip()[:200]
            if not comment_id:
                cur.close(); conn.close()
                return err('Укажи comment_id')
            cur.execute(f"SELECT id FROM {SCHEMA}.comment_reports WHERE comment_id = %s AND user_id = %s", (comment_id, user['id']))
            if cur.fetchone():
                cur.close(); conn.close()
                return err('Ты уже жаловался на этот комментарий')
            cur.execute(f"INSERT INTO {SCHEMA}.comment_reports (comment_id, user_id, reason) VALUES (%s, %s, %s)", (comment_id, user['id'], reason or None))
            conn.commit(); cur.close(); conn.close()
            return ok({'success': True})

        # Добавить комментарий
        story_id = body.get('story_id')
        text = (body.get('text') or '').strip()
        if not story_id or not text:
            cur.close(); conn.close()
            return err('Укажи story_id и text')
        if len(text) > 1000:
            cur.close(); conn.close()
            return err('Комментарий слишком длинный')
        cur.execute(f"SELECT avatar_url FROM {SCHEMA}.users WHERE id = %s", (user['id'],))
        av = cur.fetchone()
        avatar_url = av[0] if av and av[0] else ''
        cur.execute(
            f"INSERT INTO {SCHEMA}.comments (story_id, user_id, username, role, text, avatar_url) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id, created_at",
            (story_id, user['id'], user['username'], user['role'], text, avatar_url)
        )
        row = cur.fetchone()
        conn.commit(); cur.close(); conn.close()
        return ok({'id': row[0], 'user_id': user['id'], 'username': user['username'], 'role': user['role'], 'text': text, 'avatar_url': avatar_url, 'name_prefix': user.get('name_prefix',''), 'name_color': user.get('name_color',''), 'name_effect': user.get('name_effect',''), 'custom_role': user.get('custom_role',''), 'badge_text': '', 'badge_effect': '', 'hide_role': False, 'created_at': str(row[1])})

    # GET закладки пользователя
    if 'bookmarks' in params:
        user = get_user(cur, session_id)
        if not user:
            cur.close(); conn.close()
            return err('Необходима авторизация', 401)
        cur.execute(f"""
            SELECT s.id, s.title, s.author_name, s.genre, s.text, s.created_at,
                   COUNT(v.id) AS views,
                   b.created_at AS bookmarked_at
            FROM {SCHEMA}.story_bookmarks b
            JOIN {SCHEMA}.story_submissions s ON s.id = b.story_id
            LEFT JOIN {SCHEMA}.story_views v ON v.story_id = s.id
            WHERE b.user_id = %s AND s.status = 'approved'
            GROUP BY s.id, b.created_at
            ORDER BY b.created_at DESC
        """, (user['id'],))
        rows = cur.fetchall()
        cur.close(); conn.close()
        return ok([{'id': r[0], 'title': r[1], 'author_name': r[2], 'genre': r[3], 'text': r[4], 'created_at': str(r[5]), 'views': r[6], 'bookmarked_at': str(r[7])} for r in rows])

    # GET рейтинг авторов
    if 'leaderboard' in params:
        cur.execute(f"""
            SELECT
                s.author_name,
                COUNT(DISTINCT s.id) AS stories_count,
                COALESCE(SUM(v.view_count), 0) AS total_views,
                COALESCE(SUM(l.like_count), 0) AS total_likes
            FROM {SCHEMA}.story_submissions s
            LEFT JOIN (
                SELECT story_id, COUNT(*) AS view_count FROM {SCHEMA}.story_views GROUP BY story_id
            ) v ON v.story_id = s.id
            LEFT JOIN (
                SELECT story_id, COUNT(*) AS like_count FROM {SCHEMA}.story_likes GROUP BY story_id
            ) l ON l.story_id = s.id
            WHERE s.status = 'approved'
            GROUP BY s.author_name
            ORDER BY total_likes DESC, total_views DESC
            LIMIT 20
        """)
        rows = cur.fetchall()
        cur.close(); conn.close()
        return ok([{'author_name': r[0], 'stories_count': r[1], 'total_views': r[2], 'total_likes': r[3]} for r in rows])

    # GET комментарии
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

    # GET одна история + лайки + закладка
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
        user = get_user(cur, session_id)
        user_id = user['id'] if user else None
        cur.execute(f"INSERT INTO {SCHEMA}.story_views (story_id, user_id) VALUES (%s, %s)", (story_id, user_id))
        cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.story_likes WHERE story_id = %s", (story_id,))
        likes_count = cur.fetchone()[0]
        liked = False
        bookmarked = False
        if user_id:
            cur.execute(f"SELECT id FROM {SCHEMA}.story_likes WHERE story_id = %s AND user_id = %s", (story_id, user_id))
            liked = cur.fetchone() is not None
            cur.execute(f"SELECT id FROM {SCHEMA}.story_bookmarks WHERE story_id = %s AND user_id = %s", (story_id, user_id))
            bookmarked = cur.fetchone() is not None
        conn.commit()
        cur.close(); conn.close()
        return ok({'id': row[0], 'title': row[1], 'author_name': row[2], 'genre': row[3], 'text': row[4], 'created_at': str(row[5]), 'likes_count': likes_count, 'liked': liked, 'bookmarked': bookmarked})

    # GET список историй
    cur.execute(f"""
        SELECT s.id, s.title, s.author_name, s.genre, s.text, s.created_at,
               COUNT(DISTINCT v.id) AS views,
               COUNT(DISTINCT l.id) AS likes
        FROM {SCHEMA}.story_submissions s
        LEFT JOIN {SCHEMA}.story_views v ON v.story_id = s.id
        LEFT JOIN {SCHEMA}.story_likes l ON l.story_id = s.id
        WHERE s.status = 'approved'
        GROUP BY s.id
        ORDER BY s.created_at DESC
    """)
    rows = cur.fetchall()
    cur.close(); conn.close()
    return ok([{'id': r[0], 'title': r[1], 'author_name': r[2], 'genre': r[3], 'text': r[4], 'created_at': str(r[5]), 'views': r[6], 'likes': r[7]} for r in rows])
