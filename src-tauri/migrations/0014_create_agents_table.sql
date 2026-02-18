-- Agents table: stores AI agent configurations for the Agent editing UI.
-- Aligns with executions.type = 'agent' and runnable_id references agents(id).

CREATE TABLE IF NOT EXISTS agents (
  id                   TEXT PRIMARY KEY,        -- ULID

  -- Identity
  name                 TEXT NOT NULL,
  description          TEXT,

  -- Model selection (matches scenarios pattern)
  provider             TEXT NOT NULL,           -- openai|anthropic|google|local
  model                TEXT NOT NULL,           -- exact model id, e.g. gpt-4.1, claude-3.5-sonnet

  -- Model params (LLM inference): JSON (temperature, top_p, top_k, max_tokens, seed...)
  params_json          TEXT NOT NULL DEFAULT '{"temperature":0.4,"top_p":0.95,"max_tokens":4096}',

  -- Spec: goal and instructions
  agent_goal           TEXT,
  system_instructions  TEXT,

  -- Tools: JSON array of tool IDs, e.g. ["web-search", "api-call", "db-query"]
  tools_json           TEXT NOT NULL DEFAULT '[]',

  -- Runtime / loop controls
  max_iterations       INTEGER NOT NULL DEFAULT 10,
  timeout_seconds      INTEGER NOT NULL DEFAULT 60,
  retry_policy         TEXT NOT NULL DEFAULT 'exponential'
    CHECK (retry_policy IN ('none', 'fixed', 'exponential')),
  tool_call_strategy   TEXT NOT NULL DEFAULT 'auto'
    CHECK (tool_call_strategy IN ('auto', 'forced', 'restricted')),

  -- Memory
  memory_enabled       INTEGER NOT NULL DEFAULT 0 CHECK (memory_enabled IN (0, 1)),
  memory_source        TEXT NOT NULL DEFAULT 'local'
    CHECK (memory_source IN ('local', 'file', 'vector')),

  -- Version for execution snapshots (like scenarios)
  version              INTEGER NOT NULL DEFAULT 1,

  created_at           INTEGER NOT NULL,
  updated_at           INTEGER NOT NULL,
  archived_at          INTEGER
);

CREATE INDEX IF NOT EXISTS idx_agents_updated_at ON agents(updated_at);
CREATE INDEX IF NOT EXISTS idx_agents_provider_model ON agents(provider, model);
