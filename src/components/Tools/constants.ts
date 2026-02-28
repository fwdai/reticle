import type { Tool, ToolParameter } from "./types";

export const PARAM_TYPES = ["string", "number", "boolean", "object", "array"] as const;

export const DEFAULT_MOCK = `{
  "result": "success",
  "data": {}
}`;

export function createEmptyTool(): Tool {
  return {
    id: crypto.randomUUID(),
    name: "",
    description: "",
    parameters: [],
    mockResponse: DEFAULT_MOCK,
    mockMode: "json",
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

export const panelBase =
  "max-w-4xl mx-auto bg-white border border-border-light rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] flex flex-col";
export const panelHeader =
  "h-10 px-5 border-b border-border-light bg-sidebar-light/50 flex justify-between items-center";
export const panelTitle =
  "text-[10px] font-bold text-text-muted uppercase tracking-widest";
export const inputBase =
  "w-full rounded-lg border border-border-light bg-white px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-all";
