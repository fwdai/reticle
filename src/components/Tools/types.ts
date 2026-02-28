export interface ToolParameter {
  id: string;
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  description: string;
  required: boolean;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  parameters: ToolParameter[];
  mockResponse: string;
  mockMode?: "json" | "code";
  code?: string;
  isShared?: boolean;
}

/** Normalize tools from DB (may have legacy llmDescription/developerDescription format) */
export function normalizeToolFromDb(raw: unknown): Tool | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id : crypto.randomUUID();
  const name = typeof o.name === "string" ? o.name : "";
  const description =
    typeof o.description === "string"
      ? o.description
      : typeof o.llmDescription === "string"
        ? o.llmDescription
        : "";
  const paramsRaw = Array.isArray(o.parameters) ? o.parameters : Array.isArray(o.params) ? o.params : [];
  const parameters: ToolParameter[] = paramsRaw
    .filter((p): p is Record<string, unknown> => p && typeof p === "object")
    .map((p) => ({
      id: typeof p.id === "string" ? p.id : crypto.randomUUID(),
      name: typeof p.name === "string" ? p.name : "",
      type: ["string", "number", "boolean", "object", "array"].includes(String(p.type))
        ? (p.type as ToolParameter["type"])
        : "string",
      description: typeof p.description === "string" ? p.description : "",
      required: p.required === true,
    }));
  const mockResponse =
    typeof o.mockResponse === "string"
      ? o.mockResponse
      : typeof o.mockOutput === "string"
        ? o.mockOutput
        : "{}";
  const mockMode =
    o.mockMode === "code" || o.mockMode === "json" ? o.mockMode : "json";
  const code = typeof o.code === "string" ? o.code : undefined;
  const isShared = o.isShared === true || o.is_global === 1;

  return {
    id,
    name,
    description,
    parameters,
    mockResponse,
    mockMode,
    code,
    isShared,
  };
}
