CREATE TABLE t_p9569594_nex_gen_app.messages (
  id SERIAL PRIMARY KEY,
  from_user_id INTEGER NOT NULL REFERENCES t_p9569594_nex_gen_app.users(id),
  to_user_id INTEGER NOT NULL REFERENCES t_p9569594_nex_gen_app.users(id),
  text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);