-- Telemetry events table: persists frontend OpenTelemetry event snapshots.
-- Attributes are stored as JSON string in attributes_json.

CREATE TABLE IF NOT EXISTS telemetry_events (
  id              TEXT PRIMARY KEY,  -- ULID
  name            TEXT NOT NULL,
  attributes_json TEXT NOT NULL DEFAULT '{}',
  trace_id        TEXT,
  span_id         TEXT,
  occurred_at     INTEGER NOT NULL,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_telemetry_events_occurred_at
  ON telemetry_events(occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_telemetry_events_name_occurred_at
  ON telemetry_events(name, occurred_at DESC);
