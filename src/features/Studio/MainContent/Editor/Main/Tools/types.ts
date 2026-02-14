export interface ToolParameter {
  id: string; // a unique ID, e.g., UUID
  name: string;
  type: 'string' | 'number' | 'boolean' | 'enum';
  description: string;
  required: boolean;
  enumValues?: string[]; // Only for 'enum' type
}

export interface Tool {
  id: string; // a unique ID, e.g., UUID
  name: string;
  developerDescription: string;
  llmDescription: string;
  parameters: ToolParameter[];
  mockResponse: string; // Stored as a JSON string
  enabled: boolean;
}
