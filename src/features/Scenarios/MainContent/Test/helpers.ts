import type { EvalTestCase } from "@/types";
import type { AssertionType, TestCase } from "./types";

// ── Import parser ─────────────────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let inQuote = false;
  let current = "";
  for (const ch of line) {
    if (ch === '"') { inQuote = !inQuote; }
    else if (ch === "," && !inQuote) { result.push(current.trim()); current = ""; }
    else { current += ch; }
  }
  result.push(current.trim());
  return result;
}

export function parseScenarioImport(content: string, filename: string): TestCase[] {
  const ext = filename.split(".").pop()?.toLowerCase();
  const cases: TestCase[] = [];

  if (ext === "csv") {
    const lines = content.trim().split("\n").filter(Boolean);
    if (lines.length < 2) return cases;
    const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase());
    const inputIdx = headers.indexOf("input");
    const expectedIdx = headers.indexOf("expected");
    const assertionIdx = headers.indexOf("assertion");
    for (let i = 1; i < lines.length; i++) {
      const vals = parseCSVLine(lines[i]);
      cases.push({
        id: crypto.randomUUID(),
        inputs: { input: vals[inputIdx] ?? "" },
        expected: vals[expectedIdx] ?? "",
        assertion: (vals[assertionIdx] as AssertionType) ?? "contains",
      });
    }
    return cases;
  }

  // JSON array or JSONL
  const trimmed = content.trim();
  type RawItem = { inputs?: Record<string, string>; input?: string; expected?: string; assertion?: string };
  const toCase = (item: RawItem): TestCase => ({
    id: crypto.randomUUID(),
    inputs: item.inputs ?? { input: item.input ?? "" },
    expected: item.expected ?? "",
    assertion: (item.assertion as AssertionType) ?? "contains",
  });

  if (trimmed.startsWith("[")) {
    try {
      (JSON.parse(trimmed) as RawItem[]).forEach((item) => cases.push(toCase(item)));
    } catch { /* skip */ }
  } else {
    trimmed.split("\n").forEach((line) => {
      const l = line.trim();
      if (!l) return;
      try { cases.push(toCase(JSON.parse(l) as RawItem)); } catch { /* skip */ }
    });
  }

  return cases;
}

export function evaluateAssertion(assertion: AssertionType, actual: string, expected: string): boolean {
  const a = actual.toLowerCase();
  const e = expected.toLowerCase().trim();
  switch (assertion) {
    case "equals":      return actual.trim() === expected.trim();
    case "contains":    return a.includes(e);
    case "not_contains": return !a.includes(e);
  }
}

export function createEmptyCase(): TestCase {
  return {
    id: crypto.randomUUID(),
    inputs: { input: "" },
    expected: "",
    assertion: "contains",
  };
}

/** Convert a DB EvalTestCase row into the flat UI TestCase shape.
 *  Scenario test cases always have exactly one assertion in assertions_json. */
export function dbCaseToUiCase(dbCase: EvalTestCase): TestCase {
  let inputs: Record<string, string> = {};
  try {
    inputs = JSON.parse(dbCase.inputs_json) as Record<string, string>;
  } catch { /* leave empty */ }

  let assertion: AssertionType = "contains";
  let expected = "";
  try {
    const assertions = JSON.parse(dbCase.assertions_json) as Array<{ type: string; value: string }>;
    if (assertions.length > 0) {
      assertion = (assertions[0].type as AssertionType) ?? "contains";
      expected = assertions[0].value ?? "";
    }
  } catch { /* leave defaults */ }

  return { id: dbCase.id!, inputs, expected, assertion };
}

/** Convert a UI TestCase into the shape expected by replaceEvalTestCases. */
export function uiCaseToDbRow(tc: TestCase): Pick<EvalTestCase, "inputs_json" | "assertions_json"> {
  return {
    inputs_json: JSON.stringify(tc.inputs),
    assertions_json: JSON.stringify([{ type: tc.assertion, value: tc.expected }]),
  };
}
