import { navigateTo } from "../helpers/app";
import { create } from "../helpers/factory";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function seedExecutions() {
  const [scenario1, scenario2, agent1, agent2] = await Promise.all([
    create("scenario", { title: "Sentiment Classifier" }),
    create("scenario", { title: "Data Extractor" }),
    create("agent", { name: "Release Notes Generator" }),
    create("agent", { name: "Code Reviewer" }),
  ]);

  await Promise.all([
    create("execution", {
      type: "scenario",
      runnable_id: scenario1.id,
      snapshot_json: JSON.stringify({ name: scenario1.title, configuration: { provider: "openai", model: "gpt-4o" } }),
      input_json: JSON.stringify({ configuration: { provider: "openai", model: "gpt-4o" }, systemPrompt: "", userPrompt: "" }),
      status: "succeeded",
      started_at: Date.now() - 4000,
    }),
    create("execution", {
      type: "scenario",
      runnable_id: scenario2.id,
      snapshot_json: JSON.stringify({ name: scenario2.title, configuration: { provider: "openai", model: "gpt-4o-mini" } }),
      status: "succeeded",
      started_at: Date.now() - 3000,
    }),
    create("execution", {
      type: "agent",
      runnable_id: agent1.id,
      snapshot_json: JSON.stringify({
        name: agent1.name,
        systemPrompt: "You are a release notes generator.",
        configuration: { provider: "openai", model: "gpt-4o", temperature: 0.4, maxTokens: 4096 },
        maxIterations: 10,
        timeoutSeconds: 60,
      }),
      input_json: JSON.stringify({
        taskInput: "Generate release notes for vercel/next.js",
        systemPrompt: "You are a release notes generator.",
        userPrompt: "Generate release notes for vercel/next.js",
        configuration: { provider: "openai", model: "gpt-4o", temperature: 0.4, maxTokens: 4096 },
      }),
      steps_json: JSON.stringify([
        { id: "step-1", type: "task_input", label: "Task", status: "success", timestamp: "00:00.000", content: "Generate release notes for vercel/next.js" },
        { id: "step-2", type: "model_call", label: "gpt-4o", status: "success", timestamp: "00:00.100", loop: 1, content: "", tokens: 312 },
        { id: "step-3", type: "output", label: "Final Response", status: "success", timestamp: "00:01.200", content: "Here are the release notes for Next.js..." },
      ]),
      status: "succeeded",
      started_at: Date.now() - 2000,
      ended_at: Date.now() - 800,
    }),
    create("execution", {
      type: "agent",
      runnable_id: agent2.id,
      snapshot_json: JSON.stringify({ name: agent2.name, configuration: { provider: "openai", model: "gpt-4o" } }),
      status: "succeeded",
      started_at: Date.now() - 1000,
    }),
  ]);
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe("Run History", () => {
  beforeEach(async () => {
    await seedExecutions();
    await navigateTo("runs");
    await browser.waitUntil(
      async () => (await $$("tbody tr")).length > 0,
      { timeout: 5_000, timeoutMsg: "Expected run rows to appear" }
    );
  });

  it("shows all 4 executions", async () => {
    await expect($$("tbody tr")).toBeElementsArrayOfSize(4);
    await expect($("span=Sentiment Classifier")).toBeDisplayed();
    await expect($("span=Data Extractor")).toBeDisplayed();
    await expect($("span=Release Notes Generator")).toBeDisplayed();
    await expect($("span=Code Reviewer")).toBeDisplayed();
  });

  it("filters to scenario runs only", async () => {
    await $("span=Scenarios").click();
    await browser.waitUntil(
      async () => (await $$("tbody tr")).length === 2,
      { timeout: 3_000, timeoutMsg: "Expected 2 scenario rows" }
    );
    await expect($("span=Sentiment Classifier")).toBeDisplayed();
    await expect($("span=Data Extractor")).toBeDisplayed();
    await expect($("span=Release Notes Generator")).not.toBeDisplayed();
    await expect($("span=Code Reviewer")).not.toBeDisplayed();
  });

  it("filters to agent runs only", async () => {
    await $("span=Agents").click();
    await browser.waitUntil(
      async () => (await $$("tbody tr")).length === 2,
      { timeout: 3_000, timeoutMsg: "Expected 2 agent rows" }
    );
    await expect($("span=Release Notes Generator")).toBeDisplayed();
    await expect($("span=Code Reviewer")).toBeDisplayed();
    await expect($("span=Sentiment Classifier")).not.toBeDisplayed();
    await expect($("span=Data Extractor")).not.toBeDisplayed();
  });


  it("opens execution detail and navigates back", async () => {
    await $("span=Sentiment Classifier").click();

    // Check header
    await expect($("h2=Sentiment Classifier")).toBeDisplayed();
    await expect($("span=200 OK")).toBeDisplayed();
    await expect($("span=gpt-4o")).toBeDisplayed();

    // Check Timeline — Prompt Assembled is auto-expanded, Model Response is collapsed
    await expect($("span=Prompt Assembled")).toBeDisplayed();
    await expect($("span=Model Response")).toBeDisplayed();

    // Verify prompt assembly payload in the expanded pre
    const pre = await $("pre");
    await pre.waitForDisplayed({ timeout: 3_000 });
    const text = await pre.getText();
    expect(JSON.parse(text)).toEqual({
      model: "gpt-4o",
      temperature: 0.7,
      max_tokens: 2048,
      messages: [
        { role: "system", content: "" },
        { role: "user", content: "" },
      ],
    });

    await $("button=Runs").click();
    await expect($$("tbody tr")).toBeElementsArrayOfSize(4);
  });

  it("shows scenario execution in visualizer", async () => {
    await $("span=Sentiment Classifier").click();
    await expect($("h2=Sentiment Classifier")).toBeDisplayed();

    await $("button=Visualizer").click();

    // Flow node headings
    await expect($("div=SYSTEM PROMPT")).toBeDisplayed();
    await expect($("div=USER INPUT")).toBeDisplayed();
    await expect($("div=RESPONSE")).toBeDisplayed();

    // Scenario has no prompts seeded — shows empty state text
    await expect($("div=No system prompt")).toBeDisplayed();
    await expect($("div=User prompt is required to run")).toBeDisplayed();

    // Model node shows the model id
    await expect($("div=gpt-4o")).toBeDisplayed();

    await $("button=Runs").click();
    await expect($$("tbody tr")).toBeElementsArrayOfSize(4);
  });

  it("opens agent execution detail and navigates back", async () => {
    await $("span=Agents").click();
    await browser.waitUntil(
      async () => (await $$("tbody tr")).length === 2,
      { timeout: 3_000, timeoutMsg: "Expected 2 agent rows" }
    );

    await $("span=Release Notes Generator").click();

    await expect($("h2=Release Notes Generator")).toBeDisplayed();
    await expect($("span=200 OK")).toBeDisplayed();
    await expect($("span=gpt-4o")).toBeDisplayed();

    // Agent trace shows prompt assembly + agent-specific steps
    await expect($("span=Prompt Assembled")).toBeDisplayed();
    await expect($("span=Task")).toBeDisplayed();
    await expect($("span=gpt-4o")).toBeDisplayed();
    await expect($("span=Final Response")).toBeDisplayed();

    // Prompt assembly (auto-expanded) reflects the agent's system instructions and task
    const pre = await $("pre");
    await pre.waitForDisplayed({ timeout: 3_000 });
    const text = await pre.getText();
    expect(JSON.parse(text)).toEqual({
      model: "gpt-4o",
      temperature: 0.4,
      max_tokens: 4096,
      messages: [
        { role: "system", content: "You are a release notes generator." },
        { role: "user", content: "Generate release notes for vercel/next.js" },
      ],
    });
    await $("button=Runs").click();
    await expect($$("tbody tr")).toBeElementsArrayOfSize(2);
  });

  it("shows agent execution in visualizer", async () => {
    await $("span=Agents").click();
    await browser.waitUntil(
      async () => (await $$("tbody tr")).length === 2,
      { timeout: 3_000, timeoutMsg: "Expected 2 agent rows" }
    );

    await $("span=Release Notes Generator").click();
    await expect($("h2=Release Notes Generator")).toBeDisplayed();

    await $("button=Visualizer").click();

    // Flow nodes
    await expect($("div=SYSTEM PROMPT")).toBeDisplayed();
    await expect($("div=USER INPUT")).toBeDisplayed();
    await expect($("div=RESPONSE")).toBeDisplayed();

    // Agent has system instructions and task input seeded — rendered in <p> with quotes
    await expect($("p*=You are a release notes generator.")).toBeDisplayed();
    await expect($("p*=Generate release notes for vercel/next.js")).toBeDisplayed();

    // Model node shows the model id
    await expect($("div=gpt-4o")).toBeDisplayed();

    await $("button=Runs").click();
    await expect($$("tbody tr")).toBeElementsArrayOfSize(2);
  });

  it("searches by name", async () => {
    const search = await $('input[placeholder="Search scenario, ID, or model..."]');
    await search.setValue("Sentiment");
    await browser.waitUntil(
      async () => (await $$("tbody tr")).length === 1,
      { timeout: 3_000, timeoutMsg: "Expected 1 row after search" }
    );
    await expect($("span=Sentiment Classifier")).toBeDisplayed();
    await expect($("span=Data Extractor")).not.toBeDisplayed();
    await expect($("span=Release Notes Generator")).not.toBeDisplayed();
  });
});
