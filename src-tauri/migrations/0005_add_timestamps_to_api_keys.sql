-- Add created_at and updated_at to api_keys (unix ms, same convention as other tables)
-- SQLite requires constant DEFAULT for ALTER TABLE ADD COLUMN, so we use 0 then backfill
ALTER TABLE api_keys ADD COLUMN created_at INTEGER NOT NULL DEFAULT 0;
ALTER TABLE api_keys ADD COLUMN updated_at INTEGER NOT NULL DEFAULT 0;
UPDATE api_keys SET
  created_at = cast((julianday('now') - 2440587.5) * 86400000 as integer),
  updated_at = cast((julianday('now') - 2440587.5) * 86400000 as integer)
WHERE created_at = 0;
