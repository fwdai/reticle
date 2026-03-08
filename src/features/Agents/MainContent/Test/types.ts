import type { AgentAssertionType, AgentAssertion, AgentAssertionResult } from "@/lib/evals";

/** Re-exported from @/lib/evals under the feature-local names. */
export type AssertionType = AgentAssertionType;
export type Assertion = AgentAssertion;
export type AssertionResult = AgentAssertionResult;

export interface TestCase {
  id: string;
  task: string;
  assertions: Assertion[];
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
