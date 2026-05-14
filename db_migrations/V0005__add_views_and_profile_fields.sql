-- Таблица просмотров историй (по сессии или анонимно)
CREATE TABLE t_p9569594_nex_gen_app.story_views (
  id SERIAL PRIMARY KEY,
  story_id INTEGER NOT NULL,
  user_id INTEGER REFERENCES t_p9569594_nex_gen_app.users(id),
  viewed_at TIMESTAMP DEFAULT NOW()
);

-- Поле bio для публичного профиля
ALTER TABLE t_p9569594_nex_gen_app.users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';
ALTER TABLE t_p9569594_nex_gen_app.users ADD COLUMN IF NOT EXISTS favorite_genre TEXT DEFAULT '';