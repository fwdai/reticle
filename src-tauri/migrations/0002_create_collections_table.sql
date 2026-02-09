CREATE TABLE collections (
  id            TEXT PRIMARY KEY,        -- ULID
  name          TEXT NOT NULL,
  description   TEXT,
  created_at    INTEGER NOT NULL,         -- unix ms
  updated_at    INTEGER NOT NULL,
  archived_at   INTEGER
);

CREATE INDEX idx_collections_updated_at ON collections(updated_at);