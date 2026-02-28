import type { Tool, ToolParameter } from "./types";

export const PARAM_TYPES = [
  "string",
  "number",
  "boolean",
  "object",
  "array",
] as const;

export function createEmptyTool(): Tool {
  return {
    id: crypto.randomUUID(),
    name: "",
    description: "",
    parameters: [],
    mockResponse: '{\n  "result": "success"\n}',
    mockMode: "json",
    isShared: true,
  };
}

export function createEmptyParam(): ToolParameter {
  return {
    id: crypto.randomUUID(),
    name: "",
    type: "string",
    description: "",
    required: true,
  };
}
