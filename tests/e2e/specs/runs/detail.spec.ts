import { navigateTo } from "../../helpers/app";
import { create } from "../../helpers/factory";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SNAPSHOT = (name: string, model = "gpt-4o") =>
  JSON.stringify({ name, configuration: { provider: "openai", model } });

const INPUT = (userPrompt: string, model = "gpt-4o") =>
  JSON.stringify({
    configuration: { provider: "openai", model },
    systemPrompt: "You are a helpful assistant.",
    userPrompt,
  });

/**
 * Seeds three scenario executions:
 *   - "Multi-Step Scenario": 2 model steps with an interleaved tool_call/response pair
 *   - "Failing Scenario": status=failed, with a parseable error message
 *   - "Simple Scenario": vanilla succeeded run
 */
async function seedExecutions() {
  const [multiStep, failing, simple] = await Promise.all([
    create("scenario", { title: "Multi-Step Scenario" }),
    create("scenario", { title: "Failing Scenario" }),
    create("scenario", { title: "Simple Scenario" }),
  ]);

  const modelSteps = [
    {
      stepIndex: 0,
      text: "",
      finishReason: "tool-calls",
      usage: { prompt_tokens: 12, completion_tokens: 3, total_tokens: 15 },
      toolCalls: [{ id: "tc-1", name: "get_weather", arguments: { city: "Paris" } }],
    },
    {
      stepIndex: 1,
      text: "It's 22°C in Paris.",
      finishReason: "stop",
      usage: { prompt_tokens: 30, completion_tokens: 7, total_tokens: 37 },
    },
  ];
  const toolCalls = [
    {
      id: "tc-1",
      name: "get_weather",
      arguments: { city: "Paris" },
      stepIndex: 0,
      result: { tempC: 22 },
      duration_ms: 50,
    },
  ];

  await Promise.all([
    create("execution", {
      type: "scenario",
      runnable_id: multiStep.id,
      snapshot_json: SNAPSHOT(multiStep.title as string),
      input_json: INPUT("What's the weather in Paris?"),
      steps_json: JSON.stringify(modelSteps),
      tool_calls_json: JSON.stringify(toolCalls),
      status: "succeeded",
      started_at: Date.now() - 5000,
      ended_at: Date.now() - 4000,
    }),
    create("execution", {
      type: "scenario",
      runnable_id: failing.id,
      snapshot_json: SNAPSHOT(failing.title as string),
      input_json: INPUT("Hi"),
      error_json: JSON.stringify({ message: "Rate limit exceeded" }),
      status: "failed",
      started_at: Date.now() - 3000,
      ended_at: Date.now() - 2800,
    }),
    create("execution", {
      type: "scenario",
      runnable_id: simple.id,
      snapshot_json: SNAPSHOT(simple.title as string, "gpt-4o-mini"),
      input_json: INPUT("Hello", "gpt-4o-mini"),
      status: "succeeded",
      started_at: Date.now() - 1000,
      ended_at: Date.now() - 500,
    }),
  ]);
}

async function expectRowCount(count: number, msg: string) {
  await browser.waitUntil(
    async () => (await $$("tbody tr")).length === count,
    { timeout: 3_000, timeoutMsg: msg },
  );
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe("Run detail", () => {
  beforeEach(async () => {
    await seedExecutions();
    await navigateTo("runs");
    await expectRowCount(3, "Expected 3 seeded run rows");
  });

  it("filters to only failed runs via the Failed sidebar item", async () => {
    await $("span=Failed").click();
    await expectRowCount(1, "Expected 1 failed row");

    await expect($("span=Failing Scenario")).toBeDisplayed();
    await expect($("span=Multi-Step Scenario")).not.toBeDisplayed();
    await expect($("span=Simple Scenario")).not.toBeDisplayed();
  });

  it("shows the Run failed banner with the parsed error message", async () => {
    await $("span=Failing Scenario").click();

    await $("h2=Failing Scenario").waitForDisplayed({ timeout: 3_000 });

    await expect($("p=Run failed")).toBeDisplayed();
    await expect($("p*=Rate limit exceeded")).toBeDisplayed();

    // A failed scenario run also appends an explicit Error step at the end of the timeline.
    await expect($("span=Error")).toBeDisplayed();
  });

  it("renders a multi-step trace with tool_call / tool_response interleaved", async () => {
    await $("span=Multi-Step Scenario").click();
    await $("h2=Multi-Step Scenario").waitForDisplayed({ timeout: 3_000 });

    await expect($("span=Prompt Assembled")).toBeDisplayed();
    await expect($("span=Model Requested Tool Call")).toBeDisplayed();
    // The arrows (→ / ←) are unique to tool_call / tool_response step labels,
    // so they can't collide with "Model Requested Tool Call" above.
    await expect($("span*=Tool Call → get_weather")).toBeDisplayed();
    await expect($("span*=Tool Response ← get_weather")).toBeDisplayed();
    await expect($("span=Final Model Response")).toBeDisplayed();
  });

  it("shows the USAGE token breakdown when a model step is expanded", async () => {
    await $("span=Multi-Step Scenario").click();
    await $("h2=Multi-Step Scenario").waitForDisplayed({ timeout: 3_000 });

    // RunDetail auto-expands the first model_step on mount, so USAGE should be visible.
    await expect($("span=USAGE")).toBeDisplayed();
    await expect($("span=Prompt:")).toBeDisplayed();
    await expect($("span=Completion:")).toBeDisplayed();
    await expect($("span=Total:")).toBeDisplayed();
  });

  it("Expand all / Collapse all toggles every step body", async () => {
    await $("span=Multi-Step Scenario").click();
    await $("h2=Multi-Step Scenario").waitForDisplayed({ timeout: 3_000 });

    // Initially only prompt_assembly + first model_step + first tool_call are expanded.
    await $("button=Collapse all").click();
    await browser.waitUntil(
      async () => (await $$("pre")).length === 0,
      { timeout: 3_000, timeoutMsg: "Expected zero <pre> blocks after Collapse all" },
    );

    await $("button=Expand all").click();
    // 5 steps in this trace: prompt_assembly + model_step + tool_call + tool_response + model_step
    await browser.waitUntil(
      async () => (await $$("pre")).length === 5,
      { timeout: 3_000, timeoutMsg: "Expected 5 <pre> blocks after Expand all" },
    );
  });
});
