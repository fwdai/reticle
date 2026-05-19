import { navigateTo } from "../../helpers/app";
import { mockResponse, resetMocks } from "../../helpers/mock";
import { create } from "../../helpers/factory";

const TASK_INPUT = 'textarea[placeholder="Describe a task for this agent…"]';
const RUN_BUTTON = '[data-testid="agent-run-button"]';
const STATUS = '[data-testid="execution-status"]';

async function waitForStatus(expected: string, timeout = 5_000): Promise<void> {
  await browser.waitUntil(
    async () => (await $(STATUS).getText()) === expected,
    { timeout, timeoutMsg: `Expected execution status to be "${expected}"` },
  );
}

async function openSeededAgent(name: string): Promise<void> {
  await create("api_key", { provider: "openai", key: "OPENAI_KEY" });
  await create("agent", {
    name,
    agent_goal: "Greet the user.",
    system_instructions: "You are a helpful assistant.",
    model: "gpt-4o",
  });

  await navigateTo("agents");
  await $(`h3=${name}`).click();
  await $(RUN_BUTTON).waitForDisplayed({ timeout: 5_000 });
}

describe("Agent execution", () => {
  afterEach(async () => {
    await resetMocks();
  });

  it("transitions Idle → Running and aborts to Cancelled when Stop is clicked", async () => {
    await mockResponse("/v1/models", "tests/e2e/fixtures/openai/models.json", {
      provider: "openai",
    });
    await mockResponse("/v1/chat/completions", "tests/e2e/fixtures/openai/chat-completions.sse", {
      provider: "openai",
      contentType: "text/event-stream",
      delayMs: 10_000,
    });

    await openSeededAgent("Stop Test Agent");
    await waitForStatus("Idle");

    await $(TASK_INPUT).setValue("Say hello!");
    await $(RUN_BUTTON).click();

    await waitForStatus("Running", 3_000);

    // Same button toggles to Stop while running.
    await $(RUN_BUTTON).click();

    await waitForStatus("Cancelled", 3_000);
  });

  it("runs to Success when the model responds", async () => {
    await mockResponse("/v1/models", "tests/e2e/fixtures/openai/models.json", {
      provider: "openai",
    });
    await mockResponse("/v1/chat/completions", "tests/e2e/fixtures/openai/chat-completions.sse", {
      provider: "openai",
      contentType: "text/event-stream",
    });

    await openSeededAgent("Success Test Agent");
    await waitForStatus("Idle");

    await $(TASK_INPUT).setValue("Say hello!");
    await $(RUN_BUTTON).click();

    await waitForStatus("Success", 20_000);
  });
});
