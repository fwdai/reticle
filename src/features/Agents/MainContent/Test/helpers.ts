import type { EvalTestCase } from "@/types";
import type { Assertion, AssertionType, TestCase } from "./types";
import { parseAgentTestCases } from "@/lib/evals";

export { evaluateAgentAssertion } from "@/lib/evals";

export function dbCaseToAgentCase(dbCase: EvalTestCase): TestCase {
  let task = "";
  try {
    const inputs = JSON.parse(dbCase.inputs_json) as Record<string, string>;
    task = inputs.task ?? "";
  } catch { /* leave empty */ }

  let assertions: Assertion[] = [];
  try {
    assertions = (JSON.parse(dbCase.assertions_json) as Assertion[]).map((a) => ({
      id: a.id ?? crypto.randomUUID(),
      type: (a.type as AssertionType) ?? "contains",
      target: a.target ?? "",
      description: a.description ?? "",
      ...(a.expectedParams ? { expectedParams: a.expectedParams } : {}),
      ...(a.expectedReturn ? { expectedReturn: a.expectedReturn } : {}),
      ...(a.judgeModel ? { judgeModel: a.judgeModel } : {}),
    }));
  } catch { /* leave empty */ }

  return { id: dbCase.id!, task, assertions };
}

export function agentCaseToDbRow(tc: TestCase): { id: string } & Pick<EvalTestCase, "inputs_json" | "assertions_json"> {
  return {
    id: tc.id,
    inputs_json: JSON.stringify({ task: tc.task }),
    assertions_json: JSON.stringify(tc.assertions),
  };
}

export function createEmptyCase(): TestCase {
  return {
    id: crypto.randomUUID(),
    task: "",
    assertions: [],
  };
}

export function parseAgentImport(content: string, filename: string): TestCase[] {
  return parseAgentTestCases(content, filename) as TestCase[];
}

export function createEmptyAssertion(): Assertion {
  return {
    id: `a-${Date.now()}`,
    type: "contains",
    target: "",
    description: "",
  };
}
