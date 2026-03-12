import { browser } from "@wdio/globals";
import { waitForAppReady, navigateTo } from "../../helpers/app";
import { mockResponse, resetMocks } from "../../helpers/mock";

// describe("getting started", () => {
//   before(async () => {
//     // Register mock before the app fetches models on boot
//     await mockResponse("/v1/models", "tests/e2e/fixtures/openai/models.json", {
//       provider: "openai",
//     });
//     await waitForAppReady();
//   });

//   after(async () => {
//     await resetMocks();
//   });

//   // ─── Homepage ────────────────────────────────────────────────────────────────

//   it("shows the welcome screen with all three getting-started steps", async () => {
//     await expect($("h2=Welcome to Reticle!")).toBeDisplayed();
//     await expect($("h4=1. Connect an AI Provider")).toBeDisplayed();
//     await expect($("h4=2. Run Your First Scenario")).toBeDisplayed();
//     await expect($("h4=3. Complete Your Profile")).toBeDisplayed();
//   });

//   // ─── Scenarios: no-models warning ────────────────────────────────────────────

//   it("shows a no-models warning in the Scenarios Configuration panel", async () => {
//     await navigateTo("studio");

//     // Scenarios require a collection — create one first
//     await $("=Add collection").click();
//     await $("#collection-name").setValue("E2E Tests");
//     await $("button=Create collection").click();

//     // Select the new collection and create a blank scenario
//     await $("=E2E Tests").click();
//     await $("button=Create a scenario").click();

//     // Configuration panel (right sidebar) should warn about missing API key
//     await expect($("=No models available.")).toBeDisplayed();
//     await expect($("=Add an API key in Settings")).toBeDisplayed();
//   });

//   // ─── Agents: no-models warning ───────────────────────────────────────────────

//   it("shows a no-models warning in the Agents Configuration panel", async () => {
//     await navigateTo("agents");

//     // Create a blank agent from the empty state
//     await $("button=Create an agent").click();

//     await expect($("=No models available.")).toBeDisplayed();
//     await expect($("=Add an API key in Settings")).toBeDisplayed();
//   });

//   // ─── Step 1: connect a provider ──────────────────────────────────────────────

//   it("clicking step 1 navigates to API keys settings", async () => {
//     await navigateTo("home");

//     await $("h4=1. Connect an AI Provider").click();

//     await expect($("label=OpenAI API Key")).toBeDisplayed();
//   });

//   it("entering an OpenAI API key saves successfully", async () => {
//     await $('input[placeholder="sk-..."]').setValue("OPENAI_KEY");
//     // The field auto-saves on change; wait for the Saved badge
//     await $("=Saved").waitForDisplayed({ timeout: 5_000 });
//   });

//   it("models from mock are shown in the Scenarios Configuration panel", async () => {
//     await navigateTo("studio");

//     // Select the collection and open the previously-created scenario
//     await $("=E2E Tests").click();
//     await $("[data-testid='scenario-card']").click();

//     // Model dropdown should now list the mocked OpenAI models
//     await expect($("=gpt-4o")).toBeDisplayed();
//     await expect($("=gpt-4o-mini")).toBeDisplayed();
//   });

//   it("models from mock are shown in the Agents Configuration panel", async () => {
//     await navigateTo("agents");

//     // Re-open the previously-created agent
//     await $("[data-testid='agent-card']").click();

//     await expect($("=gpt-4o")).toBeDisplayed();
//     await expect($("=gpt-4o-mini")).toBeDisplayed();
//   });

//   // ─── Step 1 completion ───────────────────────────────────────────────────────

//   it("step 1 shows Completed on the homepage after the API key is saved", async () => {
//     await navigateTo("home");

//     // The step 1 card should now show "Completed" instead of "Setup Keys"
//     await expect($("h4=1. Connect an AI Provider")).toBeDisplayed();
//     await expect($("=Completed")).toBeDisplayed();
//   });

//   // ─── Step 2: run a scenario ───────────────────────────────────────────────────

//   it("clicking step 2 navigates to Scenarios and a new scenario can be named", async () => {
//     // Step 2 is now the current step (step 1 done, step 2 not done)
//     await $("h4=2. Run Your First Scenario").click();

//     // Should be on the Scenarios page
//     await expect($("[data-testid='nav-studio']")).toBeDisplayed();

//     // Create a new scenario
//     await $("=E2E Tests").click();
//     await $("button=New Scenario").click();

//     // Type the scenario name
//     const titleInput = await $('input[placeholder="Name your scenario..."]');
//     await titleInput.setValue("First scenario");
//     await browser.keys("Enter");

//     await expect($("=First scenario")).toBeDisplayed();
//   });
// });
