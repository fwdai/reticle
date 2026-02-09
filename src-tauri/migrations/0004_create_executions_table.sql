CREATE TABLE IF NOT EXISTS executions (
  id               TEXT PRIMARY KEY,      -- ULID
  type             TEXT NOT NULL,         -- 'scenario'|'agent'|'mcp'
  runnable_id      TEXT NOT NULL,         -- ULID in scenarios/agents/mcps (app-enforced)
  runnable_version INTEGER,               -- scenario.version at run time, etc.

  snapshot_json    TEXT NOT NULL,         -- frozen config/state of the runnable(JSON TEXT)
  input_json       TEXT,                  -- resolved vars etc.
  request_json     TEXT,                  -- normalized provider request payload (optional)
  result_json      TEXT,                  -- final result of the execution (optional)

  status           TEXT NOT NULL,         -- queued|running|succeeded|failed|canceled
  started_at       INTEGER,
  ended_at         INTEGER,

  usage_json       TEXT,                  -- tokens, cost, latencies (optional)
  error_json       TEXT                   -- normalized error (optional)
);

CREATE INDEX IF NOT EXISTS idx_exec_type_runnable_time
  ON executions(type, runnable_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_exec_type_status_time
  ON executions(type, status, started_at DESC);