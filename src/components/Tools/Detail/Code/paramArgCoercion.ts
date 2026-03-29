import type { ToolParameter } from "../../types";

/** Hint text only — fields stay empty until the user types. */
export function paramArgPlaceholder(type: ToolParameter["type"]): string {
  switch (type) {
    case "string":
      return "Text";
    case "number":
      return "42";
    case "boolean":
      return "true or false";
    case "object":
      return '{"key": "value"}';
    case "array":
      return "[1, 2, 3]";
    default:
      return "";
  }
}

export type CoerceParamResult =
  | { ok: true; value: unknown }
  | { ok: false; error: string };

/**
 * Maps raw input to the schema type. Strings are the literal field text (no JSON quotes).
 * Empty trimmed fields become null for non-string types; string stays "" when empty.
 */
export function coerceParamArgInput(
  raw: string,
  type: ToolParameter["type"],
): CoerceParamResult {
  const trimmed = raw.trim();

  switch (type) {
    case "string":
      return { ok: true, value: raw };

    case "number": {
      if (trimmed === "") return { ok: true, value: null };
      const n = Number(trimmed);
      if (Number.isNaN(n)) {
        return { ok: false, error: `"${trimmed}" is not a valid number` };
      }
      return { ok: true, value: n };
    }

    case "boolean": {
      if (trimmed === "") return { ok: true, value: null };
      const low = trimmed.toLowerCase();
      if (["true", "1", "yes", "y"].includes(low)) {
        return { ok: true, value: true };
      }
      if (["false", "0", "no", "n"].includes(low)) {
        return { ok: true, value: false };
      }
      return {
        ok: false,
        error: `Use true or false (got "${trimmed}")`,
      };
    }

    case "object": {
      if (trimmed === "") return { ok: true, value: null };
      try {
        const v = JSON.parse(trimmed) as unknown;
        if (typeof v !== "object" || v === null || Array.isArray(v)) {
          return {
            ok: false,
            error: "Object parameters must be JSON like {\"a\": 1}",
          };
        }
        return { ok: true, value: v };
      } catch {
        return { ok: false, error: "Invalid JSON object" };
      }
    }

    case "array": {
      if (trimmed === "") return { ok: true, value: null };
      try {
        const v = JSON.parse(trimmed) as unknown;
        if (!Array.isArray(v)) {
          return { ok: false, error: "Array parameters must be JSON like [1, 2]" };
        }
        return { ok: true, value: v };
      } catch {
        return { ok: false, error: "Invalid JSON array" };
      }
    }

    default:
      return { ok: true, value: raw };
  }
}
