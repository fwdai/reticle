-- Add tool_calls_json to executions (array of PersistedToolCall: id, name, arguments, result?, elapsed_ms?, duration_ms?)
ALTER TABLE executions ADD COLUMN tool_calls_json TEXT;
