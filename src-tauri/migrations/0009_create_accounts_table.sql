CREATE TABLE IF NOT EXISTS accounts (
    id              TEXT PRIMARY KEY,        -- ULID
    first_name      TEXT,
    last_name       TEXT,
    avatar          TEXT,
    role            TEXT,
    use_case        TEXT,
    timezone        TEXT,
    usage_context   TEXT,                    -- 'work' | 'personal' | 'education' | 'other'

    created_at      INTEGER NOT NULL,
    updated_at      INTEGER NOT NULL
);
