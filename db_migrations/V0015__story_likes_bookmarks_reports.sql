CREATE TABLE t_p9569594_nex_gen_app.story_likes (
    id SERIAL PRIMARY KEY,
    story_id INTEGER NOT NULL REFERENCES t_p9569594_nex_gen_app.story_submissions(id),
    user_id INTEGER NOT NULL REFERENCES t_p9569594_nex_gen_app.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(story_id, user_id)
);

CREATE TABLE t_p9569594_nex_gen_app.story_bookmarks (
    id SERIAL PRIMARY KEY,
    story_id INTEGER NOT NULL REFERENCES t_p9569594_nex_gen_app.story_submissions(id),
    user_id INTEGER NOT NULL REFERENCES t_p9569594_nex_gen_app.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(story_id, user_id)
);

CREATE TABLE t_p9569594_nex_gen_app.comment_reports (
    id SERIAL PRIMARY KEY,
    comment_id INTEGER NOT NULL REFERENCES t_p9569594_nex_gen_app.comments(id),
    user_id INTEGER NOT NULL REFERENCES t_p9569594_nex_gen_app.users(id),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

CREATE INDEX idx_story_likes_story ON t_p9569594_nex_gen_app.story_likes(story_id);
CREATE INDEX idx_story_bookmarks_user ON t_p9569594_nex_gen_app.story_bookmarks(user_id);
