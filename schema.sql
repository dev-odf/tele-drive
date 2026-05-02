CREATE TABLE files (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    size INTEGER NOT NULL,
    mime_type TEXT,
    tg_msg_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);[cite: 1]
