import { navigateTo, waitForResponseContent } from "../../helpers/app";
import { mockResponse, resetMocks } from "../../helpers/mock";

// ─── Shared setup ────────────────────────────────────────────────────────────

/**
 * Walk through steps 1 and 2 of the getting-started flow.
 * Ends with the app on the Home page, both steps marked Completed.
 */
async function completeTwoOnboardingSteps() {
  // Getting started screen is shown with all three steps
  await expect($("h2=Welcome to Reticle!")).toBeDisplayed();
  await expect($("h4=1. Connect an AI Provider")).toBeDisplayed();
  await expect($("h4=2. Run Your First Scenario")).toBeDisplayed();
  await expect($("h4=3. Complete Your Profile")).toBeDisplayed();

  // ── Step 1: connect a provider ─────────────────────────────────────────────
  await $("h4=1. Connect an AI Provider").click();
  await expect($("label=OpenAI API Key")).toBeDisplayed();

  const apiKeyInput = await $('input[placeholder="sk-..."]');
  await apiKeyInput.setValue("OPENAI_KEY");
  await apiKeyInput.blur();
  await $('input[placeholder="sk-..."][data-save-status="saved"]').waitForExist({ timeout: 5_000 });

  await navigateTo("home");
  await $("span=Completed").waitForDisplayed({ timeout: 5_000 });

  // ── Step 2: run a scenario ─────────────────────────────────────────────────
  await $("h4=2. Run Your First Scenario").click();
  await expect($("h1=All Scenarios")).toBeDisplayed();

  await $("button=Create a scenario").click();

  const titleInput = await $('input[placeholder="Name your scenario..."]');
  await titleInput.waitForDisplayed({ timeout: 5_000 });
  await titleInput.setValue("First scenario");
  await browser.keys("Enter");
  await expect($('input[placeholder="Name your scenario..."]')).toHaveValue("First scenario");

  await $('textarea[placeholder="Type your system instructions here..."]').setValue(
    "You are a helpful assistant."
  );

  await $("button=Input").click();
  await $('textarea[placeholder*="Enter your prompt here"]').setValue("Say hello!");

  await $('[data-testid="model-select"]').click();
  await $('[role="option"]=gpt-4o-mini').waitForDisplayed({ timeout: 3_000 });
  await $('[role="option"]=gpt-4o').click();

  await $("button=Run").click();
  await $("button=Stop").waitForDisplayed({ timeout: 3_000 });

  await waitForResponseContent("Hello from the mock!");
  await $("button=Run").waitForDisplayed({ timeout: 3_000 });
  await expect($("span=200 OK")).toBeDisplayed();
  await expect($("span*=tokens")).toBeDisplayed();
  await expect($("span*=$")).toBeDisplayed();

  await navigateTo("home");
  await browser.waitUntil(
    async () => (await $$("span=Completed")).length >= 2,
    { timeout: 5_000, timeoutMsg: "Expected step 2 to be marked Completed" }
  );
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe("Getting started", () => {
  beforeEach(async () => {
    await mockResponse("/v1/models", "tests/e2e/fixtures/openai/models.json", {
      provider: "openai",
    });
    await mockResponse("/v1/chat/completions", "tests/e2e/fixtures/openai/chat-completions.sse", {
      provider: "openai",
      contentType: "text/event-stream",
    });
  });

  afterEach(async () => {
    await resetMocks();
  });

  // ── Variant A: complete profile ───────────────────────────────────────────

  it("shows dashboard after completing all three steps", async () => {
    await completeTwoOnboardingSteps();

    await $("button*=Set this up").click();
    await expect($("h1=Account")).toBeDisplayed();

    const firstNameInput = await $('input[placeholder="e.g. Alex"]');
    await firstNameInput.setValue("Alex");
    await firstNameInput.blur();

    await navigateTo("home");
    await $("h1*=Welcome back").waitForDisplayed({ timeout: 5_000 });
    await expect($("h2=Welcome to Reticle!")).not.toBeDisplayed();
    await expect($("span=Scenarios")).toBeDisplayed();
    await expect($("span=Agents")).toBeDisplayed();
    await expect($("span=Runs this week")).toBeDisplayed();
  });

  // ── Variant B: skip profile ───────────────────────────────────────────────

  it("shows dashboard with profile nudge after skipping step 3", async () => {
    await completeTwoOnboardingSteps();

    await $("button=Skip for now").click();

    await $("h1*=Welcome back").waitForDisplayed({ timeout: 5_000 });
    await expect($("h2=Welcome to Reticle!")).not.toBeDisplayed();
    await expect($("p=Complete your profile")).toBeDisplayed();
  });
});
