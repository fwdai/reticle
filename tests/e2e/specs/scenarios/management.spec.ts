import { navigateTo, openDropdown } from "../../helpers/app";
import { create } from "../../helpers/factory";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function seedScenarios() {
  const collection = await create("collection", { name: "API Tests" });

  await Promise.all([
    create("scenario", {
      title: "Sentiment Analyzer",
      user_prompt: "Classify the sentiment.",
      collection_id: collection.id,
    }),
    create("scenario", {
      title: "Data Extractor",
      user_prompt: "Extract structured data.",
      collection_id: collection.id,
    }),
    // No collection_id → factory puts this in the Default collection
    create("scenario", {
      title: "Bug Reproducer",
      user_prompt: "Reproduce the bug.",
    }),
  ]);
}

async function waitForScenarioList(minCount = 1) {
  await browser.waitUntil(
    async () => (await $$("main h3")).length >= minCount,
    { timeout: 5_000, timeoutMsg: `Expected at least ${minCount} scenario card(s)` }
  );
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe("Scenarios", () => {
  beforeEach(async () => {
    await seedScenarios();
    await navigateTo("scenarios");
    // The context auto-selects the first collection on init; reset to "All Scenarios"
    // so every test starts from the full unfiltered list.
    await $("span=All Scenarios").click();
    await waitForScenarioList(3);
  });

  it("shows all scenarios", async () => {
    await expect($("h3=Sentiment Analyzer")).toBeDisplayed();
    await expect($("h3=Data Extractor")).toBeDisplayed();
    await expect($("h3=Bug Reproducer")).toBeDisplayed();
  });

  it("filters by collection", async () => {
    await $("span=API Tests").click();
    await browser.waitUntil(
      async () => (await $$("main h3")).length === 2,
      { timeout: 3_000, timeoutMsg: "Expected 2 scenarios in the API Tests collection" }
    );
    await expect($("h3=Sentiment Analyzer")).toBeDisplayed();
    await expect($("h3=Data Extractor")).toBeDisplayed();
    await expect($("h3=Bug Reproducer")).not.toBeDisplayed();
  });

  it("searches by title", async () => {
    const search = await $('input[placeholder="Search scenarios..."]');
    await search.click();
    await search.setValue("Extract");
    await browser.waitUntil(
      async () => (await $$("main h3")).length === 1,
      { timeout: 3_000, timeoutMsg: "Expected 1 result after search" }
    );
    await expect($("h3=Data Extractor")).toBeDisplayed();
    await expect($("h3=Sentiment Analyzer")).not.toBeDisplayed();
    await expect($("h3=Bug Reproducer")).not.toBeDisplayed();
  });

  it("creates a new scenario", async () => {
    await $("button=New Scenario").click();

    const titleInput = await $('input[placeholder="Name your scenario..."]');
    await titleInput.waitForDisplayed({ timeout: 3_000 });
    await titleInput.setValue("Summarizer");
    await browser.keys("Enter");

    await browser.waitUntil(
      async () => (await $('[data-save-status="saved"]')).isDisplayed(),
      { timeout: 5_000, timeoutMsg: "Expected scenario to be saved" }
    );

    await $('[data-testid="back-to-list"]').click();
    await waitForScenarioList(4);
    await expect($("h3=Summarizer")).toBeDisplayed();
  });

  it("updates a scenario title", async () => {
    await $("h3=Data Extractor").click();

    const titleInput = await $('input[placeholder="Name your scenario..."]');
    await titleInput.waitForDisplayed({ timeout: 3_000 });
    await titleInput.clearValue();
    await titleInput.setValue("JSON Extractor");
    await browser.keys("Enter");

    await browser.waitUntil(
      async () => (await $('[data-save-status="saved"]')).isDisplayed(),
      { timeout: 5_000, timeoutMsg: "Expected scenario update to be saved" }
    );

    await $('[data-testid="back-to-list"]').click();
    await expect($("h3=JSON Extractor")).toBeDisplayed();
    await expect($("h3=Data Extractor")).not.toBeDisplayed();
  });

  it("deletes a scenario from detail view", async () => {
    await $("h3=Sentiment Analyzer").click();

    const titleInput = await $('input[placeholder="Name your scenario..."]');
    await titleInput.waitForDisplayed({ timeout: 3_000 });

    // Open the context menu and click Delete
    await openDropdown(await $('[data-testid="scenario-menu"]'));
    const deleteItem = await $('[role="menuitem"]*=Delete');
    await deleteItem.waitForDisplayed({ timeout: 3_000 });
    await deleteItem.click();

    const dialog = await $('[role="dialog"]');
    await dialog.waitForDisplayed({ timeout: 3_000 });
    await expect(dialog.$('p*=Sentiment Analyzer')).toBeDisplayed();

    const deleteButton = await $('[data-testid="confirm-delete"]');
    await deleteButton.waitForDisplayed({ timeout: 3_000 });
    await deleteButton.click();

    // Wait for dialog to close (deletion complete), then go to "All Scenarios".
    // StudioContext auto-loads the next scenario after deletion, so we navigate
    // back to the list explicitly rather than relying on backToList().
    await dialog.waitForDisplayed({ timeout: 5_000, reverse: true });
    await $("span=All Scenarios").click();


    await waitForScenarioList(2);
    await expect($("h3=Sentiment Analyzer")).not.toBeDisplayed();
    await expect($("h3=Data Extractor")).toBeDisplayed();
  });
});
