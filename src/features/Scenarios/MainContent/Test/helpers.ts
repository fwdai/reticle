import type { EvalTestCase } from "@/types";
import type { AssertionType, TestCase } from "./types";

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
