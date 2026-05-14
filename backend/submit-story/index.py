import json
import os
import psycopg2

def handler(event: dict, context) -> dict:
    """Принимает историю от пользователя и сохраняет на модерацию."""
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    if event.get('httpMethod') != 'POST':
        return {'statusCode': 405, 'headers': cors, 'body': json.dumps({'error': 'Method not allowed'})}

    body = json.loads(event.get('body') or '{}')
    title = (body.get('title') or '').strip()
    author_name = (body.get('author_name') or '').strip()
    genre = (body.get('genre') or '').strip()
    text = (body.get('text') or '').strip()

    allowed_genres = ['Хоррор', 'Мистика', 'Психологический триллер', 'Крипипаста']

    if not title or not author_name or not genre or not text:
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'Все поля обязательны'})}

    if genre not in allowed_genres:
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'Недопустимый жанр'})}

    if len(text) < 100:
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'История слишком короткая (минимум 100 символов)'})}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO t_p9569594_nex_gen_app.story_submissions (title, author_name, genre, text) VALUES (%s, %s, %s, %s) RETURNING id",
        (title, author_name, genre, text)
    )
    submission_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': cors,
        'body': json.dumps({'success': True, 'id': submission_id})
    }
