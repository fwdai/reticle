-- Add steps_json to executions (array of model steps: stepIndex, text, finishReason, usage)
-- Each step represents one LLM round-trip (e.g. "model decided to call tool" before tool execution)
ALTER TABLE executions ADD COLUMN steps_json TEXT;
