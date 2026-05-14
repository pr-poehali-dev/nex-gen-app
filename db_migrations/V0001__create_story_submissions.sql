CREATE TABLE t_p9569594_nex_gen_app.story_submissions (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  author_name TEXT NOT NULL,
  genre TEXT NOT NULL,
  text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);