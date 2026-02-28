-- 1. New tools table (no scenario_id, adds is_global)
CREATE TABLE tools_new (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  description      TEXT,
  parameters_json  TEXT NOT NULL DEFAULT '[]',
  mock_response    TEXT,
  mock_mode        TEXT NOT NULL DEFAULT 'json' CHECK (mock_mode IN ('json', 'code')),
  code             TEXT,
  is_enabled       INTEGER NOT NULL DEFAULT 1,
  is_global        INTEGER NOT NULL DEFAULT 0,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       INTEGER NOT NULL,
  updated_at       INTEGER NOT NULL,
  archived_at      INTEGER
);

-- 2. Polymorphic join table — handles both local and global tool associations
CREATE TABLE tool_links (
  id            TEXT PRIMARY KEY,
  tool_id       TEXT NOT NULL REFERENCES tools_new(id) ON DELETE CASCADE,
  toolable_id   TEXT NOT NULL,
  toolable_type TEXT NOT NULL CHECK (toolable_type IN ('scenario', 'agent')),
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL,
  UNIQUE (tool_id, toolable_id, toolable_type)
);

-- 3. Migrate existing tools (drop scenario_id column)
INSERT INTO tools_new
  SELECT id, name, description, parameters_json, mock_response, mock_mode,
         code, is_enabled, 0, sort_order, created_at, updated_at, archived_at
  FROM tools;

-- 4. Migrate existing tool-scenario associations into tool_links
INSERT INTO tool_links (id, tool_id, toolable_id, toolable_type, created_at, updated_at)
  SELECT lower(hex(randomblob(16))), id, scenario_id, 'scenario', created_at, updated_at
  FROM tools
  WHERE scenario_id IS NOT NULL;

-- 5. Swap tables
DROP TABLE tools;
ALTER TABLE tools_new RENAME TO tools;

-- 6. Indexes
CREATE INDEX idx_tools_is_global         ON tools(is_global);
CREATE INDEX idx_tool_links_tool_id      ON tool_links(tool_id);
CREATE INDEX idx_tool_links_toolable     ON tool_links(toolable_id, toolable_type);
