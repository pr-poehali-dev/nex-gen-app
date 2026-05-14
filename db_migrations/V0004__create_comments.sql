CREATE TABLE t_p9569594_nex_gen_app.comments (
  id SERIAL PRIMARY KEY,
  story_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL REFERENCES t_p9569594_nex_gen_app.users(id),
  username TEXT NOT NULL,
  role TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);