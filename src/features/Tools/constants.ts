import type { Tool } from "./types";

export { PARAM_TYPES, createEmptyParam } from "@/components/Tools/constants";

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
