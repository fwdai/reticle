import { navigateTo, waitForResponseContent } from "../../helpers/app";
import { mockResponse, resetMocks } from "../../helpers/mock";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function assertRunSuccess() {
  await $("button=Run").click();
  await $("button=Stop").waitForDisplayed({ timeout: 3_000 });
  await waitForResponseContent("Hello from the mock!");
  await $("button=Run").waitForDisplayed({ timeout: 3_000 });
  await expect($("span=200 OK")).toBeDisplayed();
  await expect($("span*=tokens")).toBeDisplayed();
  await expect($("span*=$")).toBeDisplayed();
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe("Scenarios", () => {
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
    await navigateTo("scenarios");
    await $("h2=Start testing your models").waitForDisplayed({ timeout: 5_000 });
  });

  // ── From starter template ─────────────────────────────────────────────────

  it("creates a scenario from the Sentiment Classifier template and runs it", async () => {
    // Empty state shows all three starter templates
    await expect($("h3=Sentiment Classifier")).toBeDisplayed();
    await expect($("h3=Extract Structured Data")).toBeDisplayed();
    await expect($("h3=Debugging Session")).toBeDisplayed();

    // Click the template card (click bubbles to the button)
    await $("h3=Sentiment Classifier").click();

    // Editor opens with the template title and pre-filled prompts
    await $('input[placeholder="Name your scenario..."]').waitForDisplayed({ timeout: 5_000 });
    await expect($('input[placeholder="Name your scenario..."]')).toHaveValue(
      "Sentiment Classifier"
    );

    await assertRunSuccess();
  });

  // ── From scratch ──────────────────────────────────────────────────────────

  it("creates a scenario from scratch and runs it", async () => {
    // Empty state shows all three starter templates and the create button
    await expect($("h3=Sentiment Classifier")).toBeDisplayed();
    await expect($("h3=Extract Structured Data")).toBeDisplayed();
    await expect($("h3=Debugging Session")).toBeDisplayed();

    // Create blank instead of using a template
    await $("button=Create a scenario").click();

    // Editor opens with empty title — fill in the scenario details
    const titleInput = await $('input[placeholder="Name your scenario..."]');
    await titleInput.waitForDisplayed({ timeout: 5_000 });
    await titleInput.setValue("My first scenario");
    await browser.keys("Enter");

    await $('textarea[placeholder="Type your system instructions here..."]').setValue(
      "You are a helpful assistant."
    );

    await $("button=Input").click();
    await $('textarea[placeholder*="Enter your prompt here"]').setValue("Say hello!");

    await assertRunSuccess();
  });
});
