import { navigateTo } from "../../helpers/app";
import { mockResponse, resetMocks } from "../../helpers/mock";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function assertRunSuccess() {
  await $('[data-testid="execution-status"]').waitForDisplayed({ timeout: 3_000 });
  await browser.waitUntil(
    async () => {
      const status = await $('[data-testid="execution-status"]').getText();
      return status === "Success";
    },
    { timeout: 20_000, timeoutMsg: "Agent execution did not reach Success status" }
  );
  await expect($('[data-testid="execution-status"]')).toHaveText("Success");
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe("Agents", () => {
  before(async () => {
    await mockResponse("/v1/models", "tests/e2e/fixtures/openai/models.json", {
      provider: "openai",
    });
    await mockResponse(
      "/v1/chat/completions",
      "tests/e2e/fixtures/openai/chat-completions.sse",
      { provider: "openai", contentType: "text/event-stream" }
    );
  });

  after(async () => {
    await resetMocks();
  });

  beforeEach(async () => {
    await navigateTo("agents");
    await $("h2=Your first agent, ready to build").waitForDisplayed({ timeout: 5_000 });
  });

  // ── From starter template ─────────────────────────────────────────────────

  it("creates an agent from the Release Notes Generator template and runs it", async () => {
    await expect($("h3=Release Notes Generator")).toBeDisplayed();
    await expect($("h3=Code Reviewer")).toBeDisplayed();
    await expect($("h3=Content Summarizer")).toBeDisplayed();

    await $("h3=Release Notes Generator").click();

    await $('input[placeholder="Name your agent..."]').waitForDisplayed({ timeout: 5_000 });
    await expect($('input[placeholder="Name your agent..."]')).toHaveValue(
      "Release Notes Generator"
    );
    await $('input[placeholder="Name your agent..."][data-save-status="saved"]').waitForExist({ timeout: 5_000 });

    await $('textarea[placeholder="Describe a task for this agent…"]').setValue(
      "Generate release notes for vercel/next.js"
    );
    await $('[data-testid="agent-run-button"]').click();

    await assertRunSuccess();
  });

  // ── From scratch ──────────────────────────────────────────────────────────

  it("creates an agent from scratch and runs it", async () => {
    await expect($("h3=Release Notes Generator")).toBeDisplayed();
    await expect($("h3=Code Reviewer")).toBeDisplayed();
    await expect($("h3=Content Summarizer")).toBeDisplayed();

    await $("button=Create an agent").click();

    const titleInput = await $('input[placeholder="Name your agent..."]');
    await titleInput.waitForDisplayed({ timeout: 5_000 });
    await titleInput.setValue("My first agent");
    await browser.keys("Enter");
    await $('input[placeholder="Name your agent..."][data-save-status="saved"]').waitForExist({ timeout: 5_000 });

    await $('textarea[placeholder="Describe a task for this agent…"]').setValue(
      "Say hello!"
    );
    await $('[data-testid="agent-run-button"]').click();

    await assertRunSuccess();
  });
});
