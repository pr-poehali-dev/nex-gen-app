import json
import os
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p9569594_nex_gen_app')

def handler(event: dict, context) -> dict:
    """Возвращает опубликованные истории из БД. GET / — список, GET /?id=N — одна история."""
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors, 'body': ''}

    params = event.get('queryStringParameters') or {}
    story_id = params.get('id')

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    if story_id:
        cur.execute(
            f"SELECT id, title, author_name, genre, text, created_at FROM {SCHEMA}.story_submissions WHERE id = %s AND status = 'approved'",
            (story_id,)
        )
        row = cur.fetchone()
        cur.close()
        conn.close()
        if not row:
            return {'statusCode': 404, 'headers': cors, 'body': json.dumps({'error': 'Не найдено'})}
        return {
            'statusCode': 200, 'headers': cors,
            'body': json.dumps({
                'id': row[0], 'title': row[1], 'author_name': row[2],
                'genre': row[3], 'text': row[4], 'created_at': str(row[5])
            }, ensure_ascii=False)
        }

    cur.execute(
        f"SELECT id, title, author_name, genre, text, created_at FROM {SCHEMA}.story_submissions WHERE status = 'approved' ORDER BY created_at DESC"
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()

    stories = [
        {'id': r[0], 'title': r[1], 'author_name': r[2], 'genre': r[3], 'text': r[4], 'created_at': str(r[5])}
        for r in rows
    ]
    return {'statusCode': 200, 'headers': cors, 'body': json.dumps(stories, ensure_ascii=False)}
