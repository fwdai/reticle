CREATE TABLE IF NOT EXISTS tools (
  id                TEXT PRIMARY KEY,        -- ULID
  scenario_id       TEXT NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,

  name              TEXT NOT NULL,           -- function name, e.g. get_weather, search_docs
  description       TEXT,                   -- what the tool does; LLM uses this to decide when to call

  -- Input schema: JSON array of { id, name, type, description, required }
  -- type: string | number | boolean | object | array
  -- Maps to OpenAI function parameters schema
  parameters_json   TEXT NOT NULL DEFAULT '[]',

  -- Mock/test output
  mock_response     TEXT,                   -- JSON string or code snippet
  mock_mode         TEXT NOT NULL DEFAULT 'json' CHECK (mock_mode IN ('json', 'code')),

  -- Code to execute when the tool is called
  code              TEXT,

  -- Enabled status
  is_enabled        INTEGER NOT NULL DEFAULT 1 CHECK (is_enabled IN (0, 1)),

  -- Ordering within scenario
  sort_order        INTEGER NOT NULL DEFAULT 0,

  created_at        INTEGER NOT NULL,
  updated_at        INTEGER NOT NULL,
  archived_at       INTEGER
);

CREATE INDEX idx_tools_scenario_id ON tools(scenario_id);
CREATE INDEX idx_tools_scenario_name ON tools(scenario_id, name);
