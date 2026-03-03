import type { TestCase } from "./types";

export const SEED_CASES: TestCase[] = [
  {
    id: "s1",
    inputs: { message: "I was charged twice for my subscription", user_id: "usr_301" },
    expected: "billing",
    assertion: "contains",
  },
  {
    id: "s2",
    inputs: { message: "API returns 500 on POST /users", user_id: "usr_402" },
    expected: "technical",
    assertion: "exact",
  },
  {
    id: "s3",
    inputs: { message: "How do I reset my password?", user_id: "usr_108" },
    expected: "account",
    assertion: "contains",
  },
  {
    id: "s4",
    inputs: { message: "Your product changed my life, thank you!", user_id: "usr_055" },
    expected: "feedback",
    assertion: "llm_judge",
  },
];

export function createEmptyCase(variables: string[]): TestCase {
  return {
    id: crypto.randomUUID(),
    inputs: Object.fromEntries(variables.map((v) => [v, ""])),
    expected: "",
    assertion: "contains",
  };
}
