CREATE TABLE IF NOT EXISTS attachments (
  id                TEXT PRIMARY KEY,        -- UUID from client
  scenario_id       TEXT NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,

  name              TEXT NOT NULL,
  size              INTEGER NOT NULL,
  type              TEXT NOT NULL DEFAULT 'application/octet-stream',

  -- Path to file on disk (for upload to LLM APIs)
  path              TEXT,

  -- Ordering within scenario (matches Files UI order)
  sort_order        INTEGER NOT NULL DEFAULT 0,

  created_at        INTEGER NOT NULL,
  updated_at        INTEGER NOT NULL
);

CREATE INDEX idx_attachments_scenario_id ON attachments(scenario_id);
