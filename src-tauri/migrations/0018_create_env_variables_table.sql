CREATE TABLE env_variables (
  id         TEXT    PRIMARY KEY,
  key        TEXT    NOT NULL UNIQUE,
  value      TEXT    NOT NULL DEFAULT '',
  is_secret  INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
