import json
import os
import hashlib
import secrets
import psycopg2
from datetime import datetime, timedelta

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p9569594_nex_gen_app')
ADMIN_KEY = os.environ.get('ADMIN_SECRET_KEY', '')

def cors():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id, X-Admin-Key',
    }

def ok(data):
    return {'statusCode': 200, 'headers': cors(), 'body': json.dumps(data, ensure_ascii=False, default=str)}

def err(msg, code=400):
    return {'statusCode': code, 'headers': cors(), 'body': json.dumps({'error': msg}, ensure_ascii=False)}

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def get_user_by_session(cur, session_id: str):
    cur.execute(
        f"SELECT u.id, u.username, u.email, u.role, u.status FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON u.id = s.user_id WHERE s.id = %s AND s.expires_at > NOW()",
        (session_id,)
    )
    row = cur.fetchone()
    if not row:
        return None
    return {'id': row[0], 'username': row[1], 'email': row[2], 'role': row[3], 'status': row[4]}

def get_user_stats(cur, user_id: int) -> dict:
    """Статистика читателя."""
    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.story_views WHERE user_id = %s", (user_id,))
    stories_read = cur.fetchone()[0]

    cur.execute(f"""
        SELECT s.genre, COUNT(*) as cnt
        FROM {SCHEMA}.story_views v
        JOIN {SCHEMA}.story_submissions s ON s.id = v.story_id
        WHERE v.user_id = %s
        GROUP BY s.genre ORDER BY cnt DESC LIMIT 1
    """, (user_id,))
    fav = cur.fetchone()
    favorite_genre = fav[0] if fav else None

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.comments WHERE user_id = %s", (user_id,))
    comments_count = cur.fetchone()[0]

    return {
        'stories_read': stories_read,
        'favorite_genre': favorite_genre,
        'comments_count': comments_count,
    }

def handler(event: dict, context) -> dict:
    """Аутентификация: register, login, logout, me, profile, list_users, update_user, update_profile."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors(), 'body': ''}

    method = event.get('httpMethod')
    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')
    headers = event.get('headers') or {}
    session_id = headers.get('X-Session-Id') or headers.get('x-session-id') or ''
    admin_key = headers.get('X-Admin-Key') or headers.get('x-admin-key') or ''

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    # GET me
    if method == 'GET' and action == 'me':
        if not session_id:
            cur.close(); conn.close()
            return err('Нет сессии', 401)
        user = get_user_by_session(cur, session_id)
        if not user:
            cur.close(); conn.close()
            return err('Сессия истекла', 401)
        stats = get_user_stats(cur, user['id'])
        cur.execute(f"SELECT bio, favorite_genre, created_at FROM {SCHEMA}.users WHERE id = %s", (user['id'],))
        row = cur.fetchone()
        cur.close(); conn.close()
        return ok({**user, 'bio': row[0] or '', 'favorite_genre': row[1] or '', 'created_at': str(row[2]), **stats})

    # GET публичный профиль по username
    if method == 'GET' and action == 'profile':
        username = params.get('username', '')
        if not username:
            cur.close(); conn.close()
            return err('Укажи username')
        cur.execute(f"SELECT id, username, role, bio, favorite_genre, created_at FROM {SCHEMA}.users WHERE username = %s AND status = 'active'", (username,))
        row = cur.fetchone()
        if not row:
            cur.close(); conn.close()
            return err('Пользователь не найден', 404)
        uid = row[0]
        stats = get_user_stats(cur, uid)
        cur.close(); conn.close()
        return ok({
            'id': uid, 'username': row[1], 'role': row[2],
            'bio': row[3] or '', 'favorite_genre': row[4] or '',
            'created_at': str(row[5]), **stats
        })

    # GET список пользователей (только admin)
    if method == 'GET' and action == 'users':
        user = get_user_by_session(cur, session_id) if session_id else None
        is_admin_key = ADMIN_KEY and admin_key == ADMIN_KEY
        if not is_admin_key and (not user or user['role'] != 'admin'):
            cur.close(); conn.close()
            return err('Нет доступа', 403)
        cur.execute(f"SELECT id, username, email, role, status, created_at FROM {SCHEMA}.users ORDER BY created_at DESC")
        rows = cur.fetchall()
        cur.close(); conn.close()
        return ok([{'id': r[0], 'username': r[1], 'email': r[2], 'role': r[3], 'status': r[4], 'created_at': r[5]} for r in rows])

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')

        # Регистрация
        if action == 'register':
            username = (body.get('username') or '').strip()
            email = (body.get('email') or '').strip()
            password = body.get('password') or ''
            if not username or not email or not password:
                cur.close(); conn.close()
                return err('Заполни все поля')
            if len(password) < 6:
                cur.close(); conn.close()
                return err('Пароль минимум 6 символов')
            cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE username = %s OR email = %s", (username, email))
            if cur.fetchone():
                cur.close(); conn.close()
                return err('Такой пользователь уже существует')
            cur.execute(
                f"INSERT INTO {SCHEMA}.users (username, email, password_hash, role, status) VALUES (%s, %s, %s, 'user', 'pending') RETURNING id",
                (username, email, hash_password(password))
            )
            conn.commit(); cur.close(); conn.close()
            return ok({'success': True})

        # Вход
        if action == 'login':
            login = (body.get('login') or '').strip()
            password = body.get('password') or ''
            if not login or not password:
                cur.close(); conn.close()
                return err('Заполни все поля')
            cur.execute(
                f"SELECT id, username, email, role, status FROM {SCHEMA}.users WHERE (username = %s OR email = %s) AND password_hash = %s",
                (login, login, hash_password(password))
            )
            row = cur.fetchone()
            if not row:
                cur.close(); conn.close()
                return err('Неверный логин или пароль')
            user_id, username, email, role, status = row
            if status == 'pending':
                cur.close(); conn.close()
                return err('Заявка ещё не одобрена администратором')
            if status == 'rejected':
                cur.close(); conn.close()
                return err('Твоя заявка была отклонена')
            sid = secrets.token_hex(32)
            cur.execute(f"INSERT INTO {SCHEMA}.sessions (id, user_id, expires_at) VALUES (%s, %s, %s)", (sid, user_id, datetime.now() + timedelta(days=30)))
            conn.commit(); cur.close(); conn.close()
            return ok({'session_id': sid, 'user': {'id': user_id, 'username': username, 'email': email, 'role': role}})

        # Выход
        if action == 'logout':
            if session_id:
                cur.execute(f"UPDATE {SCHEMA}.sessions SET expires_at = NOW() WHERE id = %s", (session_id,))
                conn.commit()
            cur.close(); conn.close()
            return ok({'success': True})

        # Обновить профиль (bio, favorite_genre)
        if action == 'update_profile':
            user = get_user_by_session(cur, session_id) if session_id else None
            if not user:
                cur.close(); conn.close()
                return err('Нет доступа', 401)
            bio = (body.get('bio') or '')[:300]
            favorite_genre = (body.get('favorite_genre') or '')[:50]
            cur.execute(f"UPDATE {SCHEMA}.users SET bio = %s, favorite_genre = %s WHERE id = %s", (bio, favorite_genre, user['id']))
            conn.commit(); cur.close(); conn.close()
            return ok({'success': True})

        # Обновить пользователя (только admin)
        if action == 'update_user':
            user = get_user_by_session(cur, session_id) if session_id else None
            is_admin_key = ADMIN_KEY and admin_key == ADMIN_KEY
            if not is_admin_key and (not user or user['role'] != 'admin'):
                cur.close(); conn.close()
                return err('Нет доступа', 403)
            target_id = body.get('id')
            if not target_id:
                cur.close(); conn.close()
                return err('Укажи id пользователя')
            new_status = body.get('status')
            new_role = body.get('role')
            if new_status and new_status in ('active', 'pending', 'rejected'):
                cur.execute(f"UPDATE {SCHEMA}.users SET status = %s WHERE id = %s", (new_status, target_id))
            if new_role and new_role in ('user', 'moderator', 'admin'):
                cur.execute(f"UPDATE {SCHEMA}.users SET role = %s WHERE id = %s", (new_role, target_id))
            conn.commit(); cur.close(); conn.close()
            return ok({'success': True})

    cur.close(); conn.close()
    return err('Неверный запрос', 400)
