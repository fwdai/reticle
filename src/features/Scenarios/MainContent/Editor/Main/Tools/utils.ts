import type { Tool } from "./types";

export function getToolSchema(tool: Tool) {
  return {
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: "object",
        properties: Object.fromEntries(
          tool.parameters.map((p) => [
            p.name,
            { type: p.type, description: p.description },
          ])
        ),
        required: tool.parameters.filter((p) => p.required).map((p) => p.name),
      },
    },
  };
}

export function copyToolSchema(tool: Tool) {
  navigator.clipboard.writeText(JSON.stringify(getToolSchema(tool), null, 2));
}

/** Schema with fallbacks for display in the preview panel */
export function getToolSchemaForPreview(tool: Tool) {
  return {
    type: "function",
    function: {
      name: tool.name || "function_name",
      description: tool.description || "...",
      parameters: {
        type: "object",
        properties: Object.fromEntries(
          tool.parameters.map((p) => [
            p.name || "param",
            { type: p.type, description: p.description },
          ])
        ),
        required: tool.parameters
          .filter((p) => p.required)
          .map((p) => p.name || "param"),
      },
    },
  };
}
