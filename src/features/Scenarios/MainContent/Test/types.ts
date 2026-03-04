import type { EvalAssertionType } from "@/types";

// Scenario evals only use single-assertion types. Agent-specific types
// (tool_called, tool_not_called, loop_count) live in the agent eval UI.
export type AssertionType = Extract<
  EvalAssertionType,
  "contains" | "equals" | "not_contains"
>;

export interface TestCase {
  id: string;
  inputs: Record<string, string>;
  expected: string;
  assertion: AssertionType;
}

export interface TestResult {
  caseId: string;
  passed: boolean;
  actual: string;
  latency: number; // seconds
}

export const ASSERTION_LABELS: Record<AssertionType, string> = {
  contains: "Contains",
  equals: "Exact Match",
  not_contains: "Does Not Contain",
};
