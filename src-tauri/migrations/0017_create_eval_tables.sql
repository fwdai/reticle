-- Test case definitions — owned by either a scenario or an agent (polymorphic)
-- inputs_json for scenarios: { "variable": "value" }
-- inputs_json for agents:    { "task": "..." }  (extensible — can add files etc. later)
-- assertions_json: [{ "type": "contains"|"equals"|"not_contains"|"tool_called"|"tool_not_called"|"loop_count", "value": "..." }]
CREATE TABLE eval_test_cases (
  id              TEXT    PRIMARY KEY,
  runnable_id     TEXT    NOT NULL,
  runnable_type   TEXT    NOT NULL CHECK (runnable_type IN ('scenario', 'agent')),
  sort_order      INTEGER NOT NULL DEFAULT 0,
  inputs_json     TEXT    NOT NULL DEFAULT '{}',
  assertions_json TEXT    NOT NULL DEFAULT '[]',
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);

CREATE INDEX idx_eval_test_cases_runnable ON eval_test_cases(runnable_id, runnable_type, sort_order);

-- One row per eval suite execution
CREATE TABLE eval_runs (
  id              TEXT    PRIMARY KEY,
  runnable_id     TEXT    NOT NULL,
  runnable_type   TEXT    NOT NULL CHECK (runnable_type IN ('scenario', 'agent')),
  snapshot_json   TEXT    NOT NULL DEFAULT '{}',
  status          TEXT    NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  started_at      INTEGER,
  ended_at        INTEGER,
  pass_count      INTEGER NOT NULL DEFAULT 0,
  fail_count      INTEGER NOT NULL DEFAULT 0,
  error_count     INTEGER NOT NULL DEFAULT 0,
  total_cost_usd  REAL,
  avg_latency_ms  REAL,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);

CREATE INDEX idx_eval_runs_runnable ON eval_runs(runnable_id, runnable_type, created_at DESC);

-- One row per test case per eval run
-- assertions_json: snapshot of test case assertions at time of run (immutable record)
-- assertions_result_json: [{ "type", "value", "passed": true|false }] — per-assertion outcomes
CREATE TABLE eval_results (
  id                     TEXT    PRIMARY KEY,
  eval_run_id            TEXT    NOT NULL REFERENCES eval_runs(id) ON DELETE CASCADE,
  test_case_id           TEXT    REFERENCES eval_test_cases(id) ON DELETE SET NULL,
  sort_order             INTEGER NOT NULL DEFAULT 0,
  inputs_json            TEXT    NOT NULL DEFAULT '{}',
  assertions_json        TEXT    NOT NULL DEFAULT '[]',
  status                 TEXT    NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'passed', 'failed', 'error')),
  actual_output          TEXT,
  assertions_result_json TEXT,
  passed                 INTEGER,
  latency_ms             INTEGER,
  cost_usd               REAL,
  usage_json             TEXT,
  error                  TEXT,
  created_at             INTEGER NOT NULL,
  updated_at             INTEGER NOT NULL
);

CREATE INDEX idx_eval_results_run       ON eval_results(eval_run_id, sort_order);
CREATE INDEX idx_eval_results_test_case ON eval_results(test_case_id);
