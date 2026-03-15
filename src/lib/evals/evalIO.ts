/**
 * evalIO — import/export logic for scenario and agent test cases.
 * All parsing and serialisation lives here; UI components import from this module.
 */

/* ------------------------------------------------------------------ */
/*  Shared types                                                       */
/* ------------------------------------------------------------------ */

export interface ScenarioTestCase {
  id: string;
  inputs: Record<string, string>;
  expected: string;
  assertion: string;
}

interface AgentTestAssertion {
  id: string;
  type: string;
  target: string;
  description: string;
  expectedParams?: string;
  expectedReturn?: string;
}

export interface AgentTestCase {
  id: string;
  task: string;
  assertions: AgentTestAssertion[];
}

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Scenario — parse                                                   */
/* ------------------------------------------------------------------ */

export function parseScenarioTestCases(content: string, filename: string): ScenarioTestCase[] {
  const ext = filename.split(".").pop()?.toLowerCase();
  const cases: ScenarioTestCase[] = [];

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
        assertion: vals[assertionIdx] ?? "contains",
      });
    }
    return cases;
  }

  type RawItem = { inputs?: { input?: string }; expected?: string; assertion?: string };
  const toCase = (item: RawItem): ScenarioTestCase => ({
    id: crypto.randomUUID(),
    inputs: { input: item.inputs?.input ?? "" },
    expected: item.expected ?? "",
    assertion: item.assertion ?? "contains",
  });

  const trimmed = content.trim();
  if (trimmed.startsWith("[")) {
    try { (JSON.parse(trimmed) as RawItem[]).forEach((item) => cases.push(toCase(item))); } catch { /* skip */ }
  } else {
    trimmed.split("\n").forEach((line) => {
      const l = line.trim();
      if (!l) return;
      try { cases.push(toCase(JSON.parse(l) as RawItem)); } catch { /* skip */ }
    });
  }

  return cases;
}

/* ------------------------------------------------------------------ */
/*  Scenario — export                                                  */
/* ------------------------------------------------------------------ */

export function exportScenarioTestCasesAsJSON(cases: ScenarioTestCase[]): string {
  return JSON.stringify(
    cases.map((c) => ({ inputs: c.inputs, expected: c.expected, assertion: c.assertion })),
    null,
    2
  );
}

export function exportScenarioTestCasesAsCSV(cases: ScenarioTestCase[]): string {
  const header = "input,expected,assertion";
  const rows = cases.map((c) => {
    const cols = [c.inputs.input ?? "", c.expected, c.assertion];
    return cols.map((v) => (v.includes(",") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v)).join(",");
  });
  return [header, ...rows].join("\n");
}

/* ------------------------------------------------------------------ */
/*  Agent — parse                                                      */
/* ------------------------------------------------------------------ */

export function parseAgentTestCases(content: string, filename: string): AgentTestCase[] {
  const ext = filename.split(".").pop()?.toLowerCase();
  const cases: AgentTestCase[] = [];

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
          type: vals[typeIdx],
          target: vals[targetIdx] ?? "",
          description: "",
        }] : [],
      });
    }
    return cases;
  }

  type RawAssertion = { type?: string; target?: string; description?: string; expectedParams?: string; expectedReturn?: string };
  type RawItem = { task?: string; assertions?: RawAssertion[] };
  const toCase = (item: RawItem): AgentTestCase => ({
    id: crypto.randomUUID(),
    task: item.task ?? "",
    assertions: (item.assertions ?? []).map((a, i) => ({
      id: `a-${Date.now()}-${i}`,
      type: a.type ?? "contains",
      target: a.target ?? "",
      description: a.description ?? "",
      ...(a.expectedParams ? { expectedParams: a.expectedParams } : {}),
      ...(a.expectedReturn ? { expectedReturn: a.expectedReturn } : {}),
    })),
  });

  const trimmed = content.trim();
  if (trimmed.startsWith("[")) {
    try { (JSON.parse(trimmed) as RawItem[]).forEach((item) => cases.push(toCase(item))); } catch { /* skip */ }
  } else {
    trimmed.split("\n").forEach((line) => {
      const l = line.trim();
      if (!l) return;
      try { cases.push(toCase(JSON.parse(l) as RawItem)); } catch { /* skip */ }
    });
  }

  return cases;
}

/* ------------------------------------------------------------------ */
/*  Agent — export                                                     */
/* ------------------------------------------------------------------ */

export function exportAgentTestCasesAsJSON(cases: AgentTestCase[]): string {
  return JSON.stringify(
    cases.map((c) => ({
      task: c.task,
      assertions: c.assertions.map((a) => {
        const base: Record<string, string> = { type: a.type, target: a.target, description: a.description };
        if (a.expectedParams) base.expectedParams = a.expectedParams;
        if (a.expectedReturn) base.expectedReturn = a.expectedReturn;
        return base;
      }),
    })),
    null,
    2
  );
}

export function exportAgentTestCasesAsCSV(cases: AgentTestCase[]): string {
  const header = "task,assertion_type,assertion_target";
  const rows = cases.flatMap((c) => {
    if (c.assertions.length === 0) {
      return [c.task.includes(",") ? `"${c.task}"` : c.task + ",,"];
    }
    return c.assertions.map((a) => {
      const cols = [c.task, a.type, a.target];
      return cols.map((v) => (v.includes(",") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v)).join(",");
    });
  });
  return [header, ...rows].join("\n");
}

/* ------------------------------------------------------------------ */
/*  Scenario config export                                             */
/* ------------------------------------------------------------------ */

export interface ScenarioConfigExport {
  name: string;
  configuration: {
    provider: string;
    model: string;
    temperature: number;
    topP: number;
    maxTokens: number;
  };
  systemPrompt: string;
  userPrompt: string;
  systemVariables: { key: string; value: string }[];
  userVariables: { key: string; value: string }[];
}

export function exportScenarioAsJSON(scenario: ScenarioConfigExport): string {
  return JSON.stringify(scenario, null, 2);
}

export function parseScenarioConfig(content: string): ScenarioConfigExport | null {
  try {
    const data = JSON.parse(content) as Partial<ScenarioConfigExport>;
    if (typeof data.name !== 'string' || typeof data.systemPrompt !== 'string') return null;
    return {
      name: data.name,
      configuration: {
        provider: data.configuration?.provider ?? 'openai',
        model: data.configuration?.model ?? 'gpt-4o-2024-05-13',
        temperature: data.configuration?.temperature ?? 0.7,
        topP: data.configuration?.topP ?? 1.0,
        maxTokens: data.configuration?.maxTokens ?? 2048,
      },
      systemPrompt: data.systemPrompt,
      userPrompt: data.userPrompt ?? '',
      systemVariables: Array.isArray(data.systemVariables) ? data.systemVariables : [],
      userVariables: Array.isArray(data.userVariables) ? data.userVariables : [],
    };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Agent config export                                                */
/* ------------------------------------------------------------------ */

export interface AgentConfigExport {
  name: string;
  description: string | null;
  configuration: {
    provider: string;
    model: string;
    temperature: number;
    topP: number;
    maxTokens: number;
    seed?: string;
  };
  agentGoal: string | null;
  systemInstructions: string | null;
  maxIterations: number;
  timeoutSeconds: number;
  retryPolicy: string;
  toolCallStrategy: string;
  memoryEnabled: boolean;
  memorySource: string;
}

export function exportAgentAsJSON(agent: AgentConfigExport): string {
  return JSON.stringify(agent, null, 2);
}

export function parseAgentConfig(content: string): AgentConfigExport | null {
  try {
    const data = JSON.parse(content) as Partial<AgentConfigExport>;
    if (typeof data.name !== 'string') return null;
    return {
      name: data.name,
      description: data.description ?? null,
      configuration: {
        provider: data.configuration?.provider ?? 'openai',
        model: data.configuration?.model ?? 'gpt-4o',
        temperature: data.configuration?.temperature ?? 0.7,
        topP: data.configuration?.topP ?? 1.0,
        maxTokens: data.configuration?.maxTokens ?? 2048,
        ...(data.configuration?.seed ? { seed: data.configuration.seed } : {}),
      },
      agentGoal: data.agentGoal ?? null,
      systemInstructions: data.systemInstructions ?? null,
      maxIterations: data.maxIterations ?? 10,
      timeoutSeconds: data.timeoutSeconds ?? 60,
      retryPolicy: data.retryPolicy ?? 'none',
      toolCallStrategy: data.toolCallStrategy ?? 'auto',
      memoryEnabled: data.memoryEnabled ?? false,
      memorySource: data.memorySource ?? 'local',
    };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Download helper                                                    */
/* ------------------------------------------------------------------ */

function downloadFileBlob(filename: string, content: string, mimeType = "text/plain"): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Saves content to a file. In Tauri: opens native save dialog and writes via backend.
 * In browser: falls back to blob download.
 */
export async function saveFileWithDialog(
  filename: string,
  content: string,
  mimeType = "text/plain"
): Promise<void> {
  try {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const { invoke } = await import("@tauri-apps/api/core");
    const path = await save({
      defaultPath: filename,
      filters: [{ name: "JSON", extensions: ["json"] }],
    });
    if (path) {
      await invoke("write_export_file", { path, content });
    }
  } catch {
    downloadFileBlob(filename, content, mimeType);
  }
}

export function downloadFile(filename: string, content: string, mimeType = "text/plain"): void {
  downloadFileBlob(filename, content, mimeType);
}

/**
 * Opens a native file picker and returns the path + content.
 * In Tauri: uses plugin-dialog open() + read_import_file Rust command.
 * Returns null if cancelled or unavailable.
 */
export async function openFileWithDialog(
  filters: { name: string; extensions: string[] }[]
): Promise<{ path: string; content: string } | null> {
  try {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const { invoke } = await import("@tauri-apps/api/core");
    const path = await open({ multiple: false, filters });
    if (!path || typeof path !== "string") return null;
    const content = await invoke<string>("read_import_file", { path });
    return { path, content };
  } catch {
    return null;
  }
}
