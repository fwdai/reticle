CREATE TABLE IF NOT EXISTS templates (
    id            TEXT PRIMARY KEY,        -- ULID
    name          TEXT NOT NULL,
    prompt        TEXT NOT NULL,
    variable_keys TEXT,                    -- JSON string
    created_at    INTEGER NOT NULL, 
    updated_at    INTEGER NOT NULL
);