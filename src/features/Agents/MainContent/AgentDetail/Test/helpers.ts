import Ajv from "ajv";
import { generateText } from "ai";
import { createModel } from "@/lib/gateway";
import type { EvalTestCase } from "@/types";
import type { Assertion, AssertionType, AssertionResult, TestCase } from "./types";
import { parseAgentTestCases } from "@/lib/evalIO";

/** Extract JSON from a string that may be plain JSON or wrapped in a markdown code fence. */
function extractJson(text: string): unknown | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1].trim() : text.trim();
  try { return JSON.parse(candidate); } catch { return null; }
}

/** Default judge model when user hasn't selected one. */
const DEFAULT_JUDGE_PROVIDER = "openai" as const;
const DEFAULT_JUDGE_MODEL = "gpt-4o-mini" as const;

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

async function evaluateLlmJudgeAssertion(
  assertion: Assertion,
  task: string,
  finalText: string,
): Promise<AssertionResult> {
  const criteria = assertion.target.trim() || assertion.description;
  if (!criteria) {
    return {
      assertion,
      passed: false,
      actual: "LLM Judge requires criteria in the target field (e.g. 'Output is helpful and concise')",
    };
  }

  const systemPrompt = `You are a judge evaluating whether an AI agent's output meets given criteria. Respond with ONLY "PASS" or "FAIL" on the first line, followed by a brief reason on the next line. Be strict but fair.`;

  const userPrompt = `Task given to the agent: ${task}

Agent output:
${finalText}

Criteria to evaluate: ${criteria}

Respond with PASS or FAIL on the first line, then a brief reason.`;

  const provider = assertion.judgeModel?.provider ?? DEFAULT_JUDGE_PROVIDER;
  const model = assertion.judgeModel?.model ?? DEFAULT_JUDGE_MODEL;

  try {
    const { text } = await generateText({
      model: createModel({ provider, model }),
      system: systemPrompt,
      prompt: userPrompt,
      maxOutputTokens: 150,
      temperature: 0,
    });

    const trimmed = text.trim().toUpperCase();
    const passed = trimmed.startsWith("PASS");
    const actual = text.trim().slice(0, 200);

    return { assertion, passed, actual };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      assertion,
      passed: false,
      actual: `LLM Judge error: ${msg}`,
    };
  }
}

export async function evaluateAgentAssertion(
  assertion: Assertion,
  finalText: string,
  calledToolNames: string[],
  loopCount: number,
  task?: string,
): Promise<AssertionResult> {
  const target = assertion.target.trim();

  let passed: boolean;
  let actual: string;

  switch (assertion.type) {
    case "contains":
      passed = finalText.toLowerCase().includes(target.toLowerCase());
      actual = passed ? `Output contains "${target}"` : `Output does not contain "${target}"`;
      break;

    case "exact_match":
      passed = finalText.trim() === target;
      actual = passed ? "Exact match" : `Got: ${finalText.slice(0, 120)}`;
      break;

    case "tool_called":
      passed = calledToolNames.includes(target);
      actual = passed
        ? `${target} was called`
        : `${target} was not called. Called: [${calledToolNames.join(", ") || "none"}]`;
      break;

    case "tool_not_called":
      passed = !calledToolNames.includes(target);
      actual = passed ? `${target} was not called` : `${target} was called`;
      break;

    case "loop_count": {
      const maxLoops = parseInt(target, 10);
      passed = !isNaN(maxLoops) && loopCount <= maxLoops;
      actual = passed
        ? `${loopCount} loop${loopCount !== 1 ? "s" : ""} (≤ ${maxLoops})`
        : `${loopCount} loops exceeded max of ${maxLoops}`;
      break;
    }

    case "tool_sequence": {
      const sequence = target.split("→").map((s) => s.trim()).filter(Boolean);
      let lastIdx = -1;
      passed = sequence.every((toolName) => {
        const idx = calledToolNames.findIndex((t, i) => i > lastIdx && t === toolName);
        if (idx === -1) return false;
        lastIdx = idx;
        return true;
      });
      actual = passed
        ? `Sequence matched: ${target}`
        : `Sequence not matched. Called: [${calledToolNames.join(", ") || "none"}]`;
      break;
    }

    case "llm_judge":
      return evaluateLlmJudgeAssertion(assertion, task ?? "", finalText);

    case "json_schema": {
      let schema: unknown;
      try { schema = JSON.parse(target); }
      catch { return { assertion, passed: false, actual: "Invalid JSON Schema in target field" }; }

      const json = extractJson(finalText);
      if (json === null) return { assertion, passed: false, actual: "Agent output contains no valid JSON" };

      const ajv = new Ajv({ allErrors: true });
      const valid = ajv.validate(schema as object, json);
      passed = valid;
      actual = passed ? "Output matches schema" : (ajv.errorsText() ?? "Schema validation failed");
      break;
    }

    case "guardrail":
      passed = false;
      actual = "guardrail evaluation not yet implemented — skipped";
      break;

    default:
      passed = false;
      actual = "Unknown assertion type";
  }

  return { assertion, passed, actual };
}
