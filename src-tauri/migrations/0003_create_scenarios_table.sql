CREATE TABLE scenarios (
  id                   TEXT PRIMARY KEY,        -- ULID
  collection_id        TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,

  title                TEXT NOT NULL,
  description          TEXT,

  provider             TEXT NOT NULL,           -- openai|anthropic|google|local
  model                TEXT NOT NULL,           -- exact model id

  -- Studio-first fields
  system_prompt        TEXT NOT NULL,
  user_prompt          TEXT NOT NULL,

  -- Optional message history (array of {role, content, ...})
  history_json         TEXT,              -- JSON string (nullable)

  -- Variables: defaults + optional metadata (see shape below)
  variables_json       TEXT,              -- JSON string (nullable)

  -- Execution config
  params_json          TEXT NOT NULL,     -- JSON (temperature, seed, max_tokens...)
  response_format_json TEXT,              -- JSON (nullable)
  tools_json           TEXT,              -- JSON (nullable)
  provider_meta_json   TEXT,              -- JSON (nullable)

  version              INTEGER NOT NULL DEFAULT 1,

  created_at           INTEGER NOT NULL,
  updated_at           INTEGER NOT NULL,
  archived_at          INTEGER
);

CREATE INDEX idx_scenarios_collection_id ON scenarios(collection_id);
CREATE INDEX idx_scenarios_updated_at ON scenarios(updated_at);
CREATE INDEX idx_scenarios_provider_model ON scenarios(provider, model);