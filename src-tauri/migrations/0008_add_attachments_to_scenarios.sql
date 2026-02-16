-- Add attachments_json to scenarios (array of {id, name, size, type} metadata)
ALTER TABLE scenarios ADD COLUMN attachments_json TEXT;
