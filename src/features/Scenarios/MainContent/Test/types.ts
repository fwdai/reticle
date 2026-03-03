export type AssertionType = "exact" | "contains" | "json_schema" | "llm_judge";

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
  cost: number;
}

export const ASSERTION_LABELS: Record<AssertionType, string> = {
  exact: "Exact Match",
  contains: "Contains",
  json_schema: "JSON Schema",
  llm_judge: "LLM Judge",
};

export const DEFAULT_VARIABLES = ["message", "user_id"];
