import type { EvalTestCase } from "@/types";
import type { AssertionType, TestCase } from "./types";
import { parseScenarioTestCases } from "@/lib/evals";
import { evaluateScenarioAssertion } from "@/lib/evals";

export function parseScenarioImport(content: string, filename: string): TestCase[] {
  return parseScenarioTestCases(content, filename) as TestCase[];
}

/** @deprecated Import evaluateScenarioAssertion from @/lib/evals directly. */
export function evaluateAssertion(assertion: AssertionType, actual: string, expected: string): boolean {
  return evaluateScenarioAssertion(assertion, actual, expected);
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

/** Convert a UI TestCase into the shape expected by syncEvalTestCases. */
export function uiCaseToDbRow(tc: TestCase): { id: string } & Pick<EvalTestCase, "inputs_json" | "assertions_json"> {
  return {
    id: tc.id,
    inputs_json: JSON.stringify(tc.inputs),
    assertions_json: JSON.stringify([{ type: tc.assertion, value: tc.expected }]),
  };
}
