import { navigateTo } from "../helpers/app";
import { create } from "../helpers/factory";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function seedTemplates() {
  await Promise.all([
    create("prompt_template", {
      type: "system",
      name: "JSON Formatter",
      content: "Always respond with valid JSON.",
    }),
    create("prompt_template", {
      type: "system",
      name: "Code Reviewer",
      content: "Review the following code for bugs and style issues.",
    }),
    create("prompt_template", {
      type: "user",
      name: "Rewrite in Tone",
      content: "Rewrite the following text in a {{tone}} tone:\n\n{{text}}",
      variables_json: JSON.stringify(["tone", "text"]),
    }),
  ]);
}

async function waitForTemplateList(minCount = 1) {
  await browser.waitUntil(
    async () => (await $$("main h3")).length >= minCount,
    { timeout: 5_000, timeoutMsg: `Expected at least ${minCount} template card(s)` }
  );
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe("Prompt Templates", () => {
  beforeEach(async () => {
    await seedTemplates();
    await navigateTo("templates");
    await waitForTemplateList(3);
  });

  it("shows all templates", async () => {
    await expect($("h3=JSON Formatter")).toBeDisplayed();
    await expect($("h3=Code Reviewer")).toBeDisplayed();
    await expect($("h3=Rewrite in Tone")).toBeDisplayed();
  });

  it("filters to system templates", async () => {
    await $("span=System").click();
    await browser.waitUntil(
      async () => (await $$("main h3")).length === 2,
      { timeout: 3_000, timeoutMsg: "Expected 2 system templates" }
    );
    await expect($("h3=JSON Formatter")).toBeDisplayed();
    await expect($("h3=Code Reviewer")).toBeDisplayed();
    await expect($("h3=Rewrite in Tone")).not.toBeDisplayed();
  });

  it("filters to user templates", async () => {
    await $("span=User").click();
    await browser.waitUntil(
      async () => (await $$("main h3")).length === 1,
      { timeout: 3_000, timeoutMsg: "Expected 1 user template" }
    );
    await expect($("h3=Rewrite in Tone")).toBeDisplayed();
    await expect($("h3=JSON Formatter")).not.toBeDisplayed();
    await expect($("h3=Code Reviewer")).not.toBeDisplayed();
  });

  it("searches by name", async () => {
    const search = await $('input[placeholder="Search templates..."]');
    await search.setValue("JSON");
    await browser.waitUntil(
      async () => (await $$("main h3")).length === 1,
      { timeout: 3_000, timeoutMsg: "Expected 1 result after search" }
    );
    await expect($("h3=JSON Formatter")).toBeDisplayed();
    await expect($("h3=Code Reviewer")).not.toBeDisplayed();
    await expect($("h3=Rewrite in Tone")).not.toBeDisplayed();
  });

  it("creates a new template", async () => {
    await $("button=New Template").click();

    const nameInput = await $('input[placeholder="Name your template..."]');
    await nameInput.waitForDisplayed({ timeout: 3_000 });
    await nameInput.setValue("My New Template");

    const textarea = await $('textarea[placeholder*="Enter your prompt template"]');
    await textarea.setValue("You are a helpful assistant.");

    // Wait for auto-save (800ms debounce + network)
    await browser.waitUntil(
      async () => (await $('[data-save-status="saved"]')).isDisplayed(),
      { timeout: 5_000, timeoutMsg: "Expected template to be saved" }
    );

    await $("button*=Templates").click();
    await waitForTemplateList(4);
    await expect($("h3=My New Template")).toBeDisplayed();
  });

  it("updates an existing template name", async () => {
    await $("h3=JSON Formatter").click();

    const nameInput = await $('input[placeholder="Template name..."]');
    await nameInput.waitForDisplayed({ timeout: 3_000 });
    await nameInput.clearValue();
    await nameInput.setValue("JSON Formatter Updated");

    await browser.waitUntil(
      async () => (await $('[data-save-status="saved"]')).isDisplayed(),
      { timeout: 5_000, timeoutMsg: "Expected template update to be saved" }
    );

    await $("button*=Templates").click();
    await expect($("h3=JSON Formatter Updated")).toBeDisplayed();
    await expect($("h3=JSON Formatter")).not.toBeDisplayed();
  });

  it("deletes a template from detail view", async () => {
    await $("h3=Code Reviewer").click();

    const nameInput = await $('input[placeholder="Template name..."]');
    await nameInput.waitForDisplayed({ timeout: 3_000 });

    await $("button=Delete").click();

    // Confirm in the dialog
    const dialog = await $('[role="dialog"]');
    await dialog.waitForDisplayed({ timeout: 3_000 });
    await (await dialog.$("button=Delete")).click();

    // Should navigate back to list without the deleted template
    await waitForTemplateList(2);
    await expect($("h3=Code Reviewer")).not.toBeDisplayed();
    await expect($("h3=JSON Formatter")).toBeDisplayed();
  });
});
