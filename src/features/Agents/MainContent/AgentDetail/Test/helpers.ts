import type { Assertion, TestCase } from "./types";

export function createEmptyCase(): TestCase {
  return {
    id: crypto.randomUUID(),
    task: "",
    assertions: [],
  };
}

export function createEmptyAssertion(): Assertion {
  return {
    id: `a-${Date.now()}`,
    type: "contains",
    target: "",
    description: "",
  };
}
