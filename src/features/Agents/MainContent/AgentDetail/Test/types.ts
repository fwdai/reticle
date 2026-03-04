/** Agent eval assertion types (extends scenario types with agent-specific ones) */
export type AssertionType =
  | "exact_match"
  | "contains"
  | "json_schema"
  | "llm_judge"
  | "tool_called"
  | "tool_not_called"
  | "tool_sequence"
  | "loop_count"
  | "guardrail";

export interface Assertion {
  id: string;
  type: AssertionType;
  target: string;
  description: string;
  expectedParams?: string;
  expectedReturn?: string;
}

export interface TestCase {
  id: string;
  task: string;
  assertions: Assertion[];
}

export interface AssertionResult {
  assertion: Assertion;
  passed: boolean;
  actual: string;
}

export interface TestResult {
  caseId: string;
  task: string;
  assertions: AssertionResult[];
  loops: number;
  tokens: number;
  cost: number;
  latency: number;
  passed: boolean;
}
