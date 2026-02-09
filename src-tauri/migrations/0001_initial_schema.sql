CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,        -- ULID
    provider TEXT NOT NULL UNIQUE,
    key TEXT NOT NULL
);