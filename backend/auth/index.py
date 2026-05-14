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

def handler(event: dict, context) -> dict:
    """Аутентификация: register, login, logout, me, list_users, update_user."""
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

    # GET /me — проверка сессии
    if method == 'GET' and action == 'me':
        if not session_id:
            cur.close(); conn.close()
            return err('Нет сессии', 401)
        user = get_user_by_session(cur, session_id)
        cur.close(); conn.close()
        if not user:
            return err('Сессия истекла', 401)
        return ok(user)

    # GET /users — список пользователей (только администратор)
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
            reason = (body.get('reason') or '').strip()
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
            pw_hash = hash_password(password)
            cur.execute(
                f"INSERT INTO {SCHEMA}.users (username, email, password_hash, role, status) VALUES (%s, %s, %s, 'user', 'pending') RETURNING id",
                (username, email, pw_hash)
            )
            conn.commit(); cur.close(); conn.close()
            return ok({'success': True, 'message': 'Заявка отправлена. Ожидай одобрения.'})

        # Вход
        if action == 'login':
            login = (body.get('login') or '').strip()
            password = body.get('password') or ''
            if not login or not password:
                cur.close(); conn.close()
                return err('Заполни все поля')
            pw_hash = hash_password(password)
            cur.execute(
                f"SELECT id, username, email, role, status FROM {SCHEMA}.users WHERE (username = %s OR email = %s) AND password_hash = %s",
                (login, login, pw_hash)
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
            session_id = secrets.token_hex(32)
            expires_at = datetime.now() + timedelta(days=30)
            cur.execute(
                f"INSERT INTO {SCHEMA}.sessions (id, user_id, expires_at) VALUES (%s, %s, %s)",
                (session_id, user_id, expires_at)
            )
            conn.commit(); cur.close(); conn.close()
            return ok({'session_id': session_id, 'user': {'id': user_id, 'username': username, 'email': email, 'role': role}})

        # Выход
        if action == 'logout':
            if session_id:
                cur.execute(f"UPDATE {SCHEMA}.sessions SET expires_at = NOW() WHERE id = %s", (session_id,))
                conn.commit()
            cur.close(); conn.close()
            return ok({'success': True})

        # Обновить пользователя (только администратор)
        if action == 'update_user':
            user = get_user_by_session(cur, session_id) if session_id else None
            is_admin_key = ADMIN_KEY and admin_key == ADMIN_KEY
            if not is_admin_key and (not user or user['role'] != 'admin'):
                cur.close(); conn.close()
                return err('Нет доступа', 403)
            target_id = body.get('id')
            new_status = body.get('status')
            new_role = body.get('role')
            if not target_id:
                cur.close(); conn.close()
                return err('Укажи id пользователя')
            if new_status and new_status in ('active', 'pending', 'rejected'):
                cur.execute(f"UPDATE {SCHEMA}.users SET status = %s WHERE id = %s", (new_status, target_id))
            if new_role and new_role in ('user', 'moderator', 'admin'):
                cur.execute(f"UPDATE {SCHEMA}.users SET role = %s WHERE id = %s", (new_role, target_id))
            conn.commit(); cur.close(); conn.close()
            return ok({'success': True})

    cur.close(); conn.close()
    return err('Неверный запрос', 400)
