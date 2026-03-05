import type { Assertion, AssertionType, TestCase } from "./types";

export function createEmptyCase(): TestCase {
  return {
    id: crypto.randomUUID(),
    task: "",
    assertions: [],
  };
}

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

export function parseAgentImport(content: string, filename: string): TestCase[] {
  const ext = filename.split(".").pop()?.toLowerCase();
  const cases: TestCase[] = [];

  if (ext === "csv") {
    const lines = content.trim().split("\n").filter(Boolean);
    if (lines.length < 2) return cases;
    const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase());
    const taskIdx = headers.indexOf("task");
    const typeIdx = headers.indexOf("assertion_type");
    const targetIdx = headers.indexOf("assertion_target");
    for (let i = 1; i < lines.length; i++) {
      const vals = parseCSVLine(lines[i]);
      cases.push({
        id: crypto.randomUUID(),
        task: vals[taskIdx] ?? "",
        assertions: typeIdx >= 0 && vals[typeIdx] ? [{
          id: `a-${Date.now()}-${i}`,
          type: (vals[typeIdx] as AssertionType) ?? "contains",
          target: vals[targetIdx] ?? "",
          description: "",
        }] : [],
      });
    }
    return cases;
  }

  // JSON array or JSONL
  type RawAssertion = { type?: string; target?: string; description?: string; expectedParams?: string; expectedReturn?: string };
  type RawItem = { task?: string; assertions?: RawAssertion[] };
  const toCase = (item: RawItem): TestCase => ({
    id: crypto.randomUUID(),
    task: item.task ?? "",
    assertions: (item.assertions ?? []).map((a, i) => ({
      id: `a-${Date.now()}-${i}`,
      type: (a.type as AssertionType) ?? "contains",
      target: a.target ?? "",
      description: a.description ?? "",
      ...(a.expectedParams ? { expectedParams: a.expectedParams } : {}),
      ...(a.expectedReturn ? { expectedReturn: a.expectedReturn } : {}),
    })),
  });

  const trimmed = content.trim();
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

export function createEmptyAssertion(): Assertion {
  return {
    id: `a-${Date.now()}`,
    type: "contains",
    target: "",
    description: "",
  };
}
