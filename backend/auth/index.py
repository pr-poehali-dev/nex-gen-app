import json
import os
import hashlib
import secrets
import base64
import psycopg2
import boto3
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
        cur.execute(f"SELECT bio, favorite_genre, created_at, avatar_url, name_prefix, name_color, name_effect FROM {SCHEMA}.users WHERE id = %s", (user['id'],))
        row = cur.fetchone()
        cur.close(); conn.close()
        return ok({**user, 'bio': row[0] or '', 'favorite_genre': row[1] or '', 'created_at': str(row[2]), 'avatar_url': row[3] or '', 'name_prefix': row[4] or '', 'name_color': row[5] or '', 'name_effect': row[6] or '', **stats})

    # GET публичный профиль по username
    if method == 'GET' and action == 'profile':
        username = params.get('username', '')
        if not username:
            cur.close(); conn.close()
            return err('Укажи username')
        cur.execute(f"SELECT id, username, role, bio, favorite_genre, created_at, avatar_url, name_prefix, name_color, name_effect FROM {SCHEMA}.users WHERE username = %s AND status = 'active'", (username,))
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
            'created_at': str(row[5]), 'avatar_url': row[6] or '',
            'name_prefix': row[7] or '', 'name_color': row[8] or '', 'name_effect': row[9] or '',
            **stats
        })

    # GET список диалогов
    if method == 'GET' and action == 'messages_list':
        user = get_user_by_session(cur, session_id) if session_id else None
        if not user:
            cur.close(); conn.close()
            return err('Необходима авторизация', 401)
        uid = user['id']
        cur.execute(f"""
            SELECT
                CASE WHEN m.from_user_id = %s THEN m.to_user_id ELSE m.from_user_id END AS partner_id,
                u.username AS partner_username,
                u.avatar_url AS partner_avatar,
                u.name_color, u.name_effect,
                MAX(m.created_at) AS last_at,
                (SELECT text FROM {SCHEMA}.messages
                 WHERE (from_user_id = %s AND to_user_id = partner_id)
                    OR (from_user_id = partner_id AND to_user_id = %s)
                 ORDER BY created_at DESC LIMIT 1) AS last_text,
                COUNT(CASE WHEN m.to_user_id = %s AND m.is_read = FALSE THEN 1 END) AS unread
            FROM {SCHEMA}.messages m
            JOIN {SCHEMA}.users u ON u.id = CASE WHEN m.from_user_id = %s THEN m.to_user_id ELSE m.from_user_id END
            WHERE m.from_user_id = %s OR m.to_user_id = %s
            GROUP BY partner_id, u.username, u.avatar_url, u.name_color, u.name_effect
            ORDER BY last_at DESC
        """, (uid, uid, uid, uid, uid, uid, uid))
        rows = cur.fetchall()
        cur.close(); conn.close()
        return ok([{
            'partner_id': r[0], 'partner_username': r[1], 'partner_avatar': r[2] or '',
            'name_color': r[3] or '', 'name_effect': r[4] or '',
            'last_at': str(r[5]), 'last_text': r[6] or '', 'unread': r[7]
        } for r in rows])

    # GET сообщения с конкретным пользователем
    if method == 'GET' and action == 'messages_chat':
        user = get_user_by_session(cur, session_id) if session_id else None
        if not user:
            cur.close(); conn.close()
            return err('Необходима авторизация', 401)
        with_id = params.get('with')
        if not with_id:
            cur.close(); conn.close()
            return err('Укажи with')
        uid = user['id']
        cur.execute(f"""
            SELECT id, from_user_id, to_user_id, text, is_read, created_at
            FROM {SCHEMA}.messages
            WHERE (from_user_id = %s AND to_user_id = %s)
               OR (from_user_id = %s AND to_user_id = %s)
            ORDER BY created_at ASC
        """, (uid, with_id, with_id, uid))
        rows = cur.fetchall()
        # Получаем инфо о собеседнике
        cur.execute(f"SELECT id, username, avatar_url, role, name_color, name_effect FROM {SCHEMA}.users WHERE id = %s", (with_id,))
        p = cur.fetchone()
        cur.close(); conn.close()
        if not p:
            return err('Пользователь не найден', 404)
        return ok({
            'partner': {'id': p[0], 'username': p[1], 'avatar_url': p[2] or '', 'role': p[3], 'name_color': p[4] or '', 'name_effect': p[5] or ''},
            'messages': [{'id': r[0], 'from_user_id': r[1], 'to_user_id': r[2], 'text': r[3], 'is_read': r[4], 'created_at': str(r[5])} for r in rows]
        })

    # GET список пользователей (только admin)
    if method == 'GET' and action == 'users':
        user = get_user_by_session(cur, session_id) if session_id else None
        is_admin_key = ADMIN_KEY and admin_key == ADMIN_KEY
        if not is_admin_key and (not user or user['role'] != 'admin'):
            cur.close(); conn.close()
            return err('Нет доступа', 403)
        cur.execute(f"SELECT id, username, email, role, status, created_at, name_color, name_effect FROM {SCHEMA}.users ORDER BY created_at DESC")
        rows = cur.fetchall()
        cur.close(); conn.close()
        return ok([{'id': r[0], 'username': r[1], 'email': r[2], 'role': r[3], 'status': r[4], 'created_at': r[5], 'name_color': r[6] or '', 'name_effect': r[7] or ''} for r in rows])

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

        # Обновить профиль (bio, favorite_genre, кастомизация ника для стаффа)
        if action == 'update_profile':
            user = get_user_by_session(cur, session_id) if session_id else None
            if not user:
                cur.close(); conn.close()
                return err('Нет доступа', 401)
            bio = (body.get('bio') or '')[:300]
            favorite_genre = (body.get('favorite_genre') or '')[:50]

            # Кастомизация ника — только для стаффа
            STAFF_COLORS = ['#cc0000','#ff3333','#ff6600','#cc6600','#9900cc','#0066cc','#00cc66','#cccc00','#ff66cc','#aaaaaa','#ffffff']
            STAFF_EFFECTS = ['glow-red','glow-orange','glow-purple','glow-gold','pulse','flicker','rainbow','none']
            STAFF_PREFIXES = ['👁','🕯','💀','🩸','👁‍🗨','⛧','🔮','🕸','🦇','👻','🌑','⚰️','🗡','🔥','❄️','']

            if user['role'] in ('admin', 'moderator'):
                name_prefix = body.get('name_prefix', None)
                name_color = body.get('name_color', None)
                name_effect = body.get('name_effect', None)
                if name_prefix is not None and name_prefix in STAFF_PREFIXES:
                    cur.execute(f"UPDATE {SCHEMA}.users SET name_prefix = %s WHERE id = %s", (name_prefix, user['id']))
                if name_color is not None and name_color in STAFF_COLORS:
                    cur.execute(f"UPDATE {SCHEMA}.users SET name_color = %s WHERE id = %s", (name_color, user['id']))
                if name_effect is not None and name_effect in STAFF_EFFECTS:
                    cur.execute(f"UPDATE {SCHEMA}.users SET name_effect = %s WHERE id = %s", (name_effect, user['id']))

            cur.execute(f"UPDATE {SCHEMA}.users SET bio = %s, favorite_genre = %s WHERE id = %s", (bio, favorite_genre, user['id']))
            conn.commit(); cur.close(); conn.close()
            return ok({'success': True})

        # Загрузка аватара
        if action == 'upload_avatar':
            user = get_user_by_session(cur, session_id) if session_id else None
            if not user:
                cur.close(); conn.close()
                return err('Нет доступа', 401)
            image_b64 = body.get('image')
            mime = body.get('mime', 'image/jpeg')
            if not image_b64:
                cur.close(); conn.close()
                return err('Нет изображения')
            # Декодируем base64
            try:
                image_data = base64.b64decode(image_b64)
            except Exception:
                cur.close(); conn.close()
                return err('Неверный формат изображения')
            if len(image_data) > 2 * 1024 * 1024:
                cur.close(); conn.close()
                return err('Файл слишком большой (макс. 2MB)')
            ext = 'jpg' if 'jpeg' in mime else mime.split('/')[-1]
            key = f"avatars/{user['id']}.{ext}"
            s3 = boto3.client(
                's3',
                endpoint_url='https://bucket.poehali.dev',
                aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
            )
            s3.put_object(Bucket='files', Key=key, Body=image_data, ContentType=mime)
            avatar_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}?t={int(datetime.now().timestamp())}"
            cur.execute(f"UPDATE {SCHEMA}.users SET avatar_url = %s WHERE id = %s", (avatar_url, user['id']))
            conn.commit(); cur.close(); conn.close()
            return ok({'success': True, 'avatar_url': avatar_url})

        # Отправить ЛС
        if action == 'messages_send':
            user = get_user_by_session(cur, session_id) if session_id else None
            if not user:
                cur.close(); conn.close()
                return err('Необходима авторизация', 401)
            to_user_id = body.get('to_user_id')
            text = (body.get('text') or '').strip()
            if not to_user_id or not text:
                cur.close(); conn.close()
                return err('Укажи to_user_id и text')
            if len(text) > 2000:
                cur.close(); conn.close()
                return err('Сообщение слишком длинное')
            if int(to_user_id) == user['id']:
                cur.close(); conn.close()
                return err('Нельзя написать самому себе')
            # Проверяем что получатель существует
            cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE id = %s AND status = 'active'", (to_user_id,))
            if not cur.fetchone():
                cur.close(); conn.close()
                return err('Пользователь не найден', 404)
            cur.execute(
                f"INSERT INTO {SCHEMA}.messages (from_user_id, to_user_id, text) VALUES (%s, %s, %s) RETURNING id, created_at",
                (user['id'], to_user_id, text)
            )
            row = cur.fetchone()
            conn.commit(); cur.close(); conn.close()
            return ok({'id': row[0], 'from_user_id': user['id'], 'to_user_id': to_user_id, 'text': text, 'is_read': False, 'created_at': str(row[1])})

        # Пометить прочитанными
        if action == 'messages_read':
            user = get_user_by_session(cur, session_id) if session_id else None
            if not user:
                cur.close(); conn.close()
                return err('Необходима авторизация', 401)
            from_user_id = body.get('from_user_id')
            cur.execute(
                f"UPDATE {SCHEMA}.messages SET is_read = TRUE WHERE to_user_id = %s AND from_user_id = %s",
                (user['id'], from_user_id)
            )
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
            new_color = body.get('name_color')  # None = не менять, '' = сбросить
            new_effect = body.get('name_effect')

            ALLOWED_COLORS = ['#cc0000','#ff3333','#ff6600','#cc6600','#9900cc','#6600ff','#0066cc','#00cc66','#cccc00','#ff66cc','#aaaaaa','#ffffff','']
            ALLOWED_EFFECTS = ['','glow-red','glow-orange','glow-purple','glow-blue','glow-gold','glow-green','pulse','flicker','shake','rainbow','ghost','blood-drip']

            if new_status and new_status in ('active', 'pending', 'rejected'):
                cur.execute(f"UPDATE {SCHEMA}.users SET status = %s WHERE id = %s", (new_status, target_id))
            if new_role and new_role in ('user', 'moderator', 'admin'):
                cur.execute(f"UPDATE {SCHEMA}.users SET role = %s WHERE id = %s", (new_role, target_id))
            if new_color is not None and new_color in ALLOWED_COLORS:
                cur.execute(f"UPDATE {SCHEMA}.users SET name_color = %s WHERE id = %s", (new_color, target_id))
            if new_effect is not None and new_effect in ALLOWED_EFFECTS:
                cur.execute(f"UPDATE {SCHEMA}.users SET name_effect = %s WHERE id = %s", (new_effect, target_id))
            conn.commit()
            # Возвращаем обновлённые данные пользователя
            cur.execute(f"SELECT name_color, name_effect FROM {SCHEMA}.users WHERE id = %s", (target_id,))
            row = cur.fetchone()
            cur.close(); conn.close()
            return ok({'success': True, 'name_color': row[0] or '' if row else '', 'name_effect': row[1] or '' if row else ''})

        # Отправить сообщение в общий чат
        if action == 'chat_send':
            user = get_user_by_session(cur, session_id) if session_id else None
            if not user:
                cur.close(); conn.close()
                return err('Необходима авторизация', 401)
            text = (body.get('text') or '').strip()
            if not text:
                cur.close(); conn.close()
                return err('Пустое сообщение')
            if len(text) > 500:
                cur.close(); conn.close()
                return err('Слишком длинное сообщение (макс. 500 символов)')
            cur.execute(
                f"INSERT INTO {SCHEMA}.chat_messages (user_id, text) VALUES (%s, %s) RETURNING id, created_at",
                (user['id'], text)
            )
            row = cur.fetchone()
            conn.commit()
            cur.execute(f"SELECT avatar_url, name_color, name_effect FROM {SCHEMA}.users WHERE id = %s", (user['id'],))
            urow = cur.fetchone()
            cur.close(); conn.close()
            return ok({
                'id': row[0], 'text': text, 'created_at': str(row[1]),
                'username': user['username'], 'role': user['role'],
                'avatar_url': urow[0] or '' if urow else '',
                'name_color': urow[1] or '' if urow else '',
                'name_effect': urow[2] or '' if urow else '',
            })

    # GET общий чат
    if method == 'GET' and action == 'chat_get':
        cur.execute(f"""
            SELECT m.id, m.text, m.created_at, u.username, u.avatar_url, u.name_color, u.name_effect, u.role
            FROM {SCHEMA}.chat_messages m
            JOIN {SCHEMA}.users u ON u.id = m.user_id
            ORDER BY m.created_at DESC
            LIMIT 80
        """)
        rows = cur.fetchall()
        cur.close(); conn.close()
        return ok({'messages': [
            {'id': r[0], 'text': r[1], 'created_at': str(r[2]), 'username': r[3],
             'avatar_url': r[4] or '', 'name_color': r[5] or '', 'name_effect': r[6] or '', 'role': r[7]}
            for r in reversed(rows)
        ]})

    cur.close(); conn.close()
    return err('Неверный запрос', 400)

# ─── Обработчик ЛС (вызывается из handler через action=messages_*) ────────────
# GET ?action=messages_list  — список диалогов
# GET ?action=messages_chat&with=USER_ID — сообщения с пользователем
# POST action=messages_send  — отправить сообщение
# POST action=messages_read  — пометить как прочитанные