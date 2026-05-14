CREATE TABLE t_p9569594_nex_gen_app.chat_messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p9569594_nex_gen_app.users(id),
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_created_at ON t_p9569594_nex_gen_app.chat_messages(created_at DESC);
