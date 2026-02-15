CREATE TABLE IF NOT EXISTS prompt_templates (
  id              TEXT PRIMARY KEY,        -- ULID
  type            TEXT NOT NULL,           -- 'system' | 'user'
  name            TEXT NOT NULL,
  description     TEXT,
  content         TEXT NOT NULL,           -- template text (may have {{variable}} placeholders)
  variables_json  TEXT,                    -- optional metadata about variables
  last_used_at    INTEGER,
  is_pinned       INTEGER NOT NULL DEFAULT 0,

  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL,
  archived_at     INTEGER
);

CREATE INDEX idx_prompt_templates_type ON prompt_templates(type);
CREATE INDEX idx_prompt_templates_last_used ON prompt_templates(last_used_at);