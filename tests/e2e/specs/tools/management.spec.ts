import { navigateTo } from "../../helpers/app";
import { create } from "../../helpers/factory";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function seedTools() {
  await Promise.all([
    create("tool", {
      name: "fetch_weather",
      description: "Fetches current weather for a location.",
      mock_mode: "json",
      mock_response: '{"temp":22,"unit":"C"}',
    }),
    create("tool", {
      name: "search_docs",
      description: "Searches internal documentation.",
      mock_mode: "json",
      mock_response: '{"results":[]}',
    }),
    create("tool", {
      name: "run_script",
      description: "Executes a shell script.",
      mock_mode: "code",
    }),
  ]);
}

async function waitForToolList(minCount = 1) {
  await browser.waitUntil(
    async () => (await $$("main h3")).length >= minCount,
    { timeout: 5_000, timeoutMsg: `Expected at least ${minCount} tool card(s)` }
  );
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe("Tools", () => {
  beforeEach(async () => {
    await seedTools();
    await navigateTo("tools");
    await waitForToolList(3);
  });

  it("shows all tools", async () => {
    await expect($("h3=fetch_weather")).toBeDisplayed();
    await expect($("h3=search_docs")).toBeDisplayed();
    await expect($("h3=run_script")).toBeDisplayed();
  });

  it("filters to JSON Mock tools", async () => {
    await $("span=JSON Mock").click();
    await browser.waitUntil(
      async () => (await $$("main h3")).length === 2,
      { timeout: 3_000, timeoutMsg: "Expected 2 JSON mock tools" }
    );
    await expect($("h3=fetch_weather")).toBeDisplayed();
    await expect($("h3=search_docs")).toBeDisplayed();
    await expect($("h3=run_script")).not.toBeDisplayed();
  });

  it("filters to Code tools", async () => {
    await $("span=Code").click();
    await browser.waitUntil(
      async () => (await $$("main h3")).length === 1,
      { timeout: 3_000, timeoutMsg: "Expected 1 code tool" }
    );
    await expect($("h3=run_script")).toBeDisplayed();
    await expect($("h3=fetch_weather")).not.toBeDisplayed();
    await expect($("h3=search_docs")).not.toBeDisplayed();
  });

  it("searches by name", async () => {
    const search = await $('input[placeholder="Search tools..."]');
    await search.setValue("weather");
    await browser.waitUntil(
      async () => (await $$("main h3")).length === 1,
      { timeout: 3_000, timeoutMsg: "Expected 1 result after search" }
    );
    await expect($("h3=fetch_weather")).toBeDisplayed();
    await expect($("h3=search_docs")).not.toBeDisplayed();
    await expect($("h3=run_script")).not.toBeDisplayed();
  });

  it("creates a new tool", async () => {
    await $("button=New Tool").click();

    // Detail view opens with an empty tool — fill in the function name
    const nameInput = await $('input[placeholder="e.g. get_weather, search_docs"]');
    await nameInput.waitForDisplayed({ timeout: 3_000 });
    await nameInput.setValue("send_email");

    const descTextarea = await $('textarea[placeholder*="Describe what this tool does"]');
    await descTextarea.setValue("Sends an email to a recipient.");

    // Wait for auto-save
    await browser.waitUntil(
      async () => (await $('[data-save-status="saved"]')).isDisplayed(),
      { timeout: 5_000, timeoutMsg: "Expected tool to be saved" }
    );

    await $("button*=Tools").click();
    await waitForToolList(4);
    await expect($("h3=send_email")).toBeDisplayed();
  });

  it("updates a tool name", async () => {
    await $("h3=fetch_weather").click();

    const nameInput = await $('input[placeholder="e.g. get_weather, search_docs"]');
    await nameInput.waitForDisplayed({ timeout: 3_000 });
    await nameInput.clearValue();
    await nameInput.setValue("get_weather");

    await browser.waitUntil(
      async () => (await $('[data-save-status="saved"]')).isDisplayed(),
      { timeout: 5_000, timeoutMsg: "Expected tool update to be saved" }
    );

    await $("button*=Tools").click();
    await expect($("h3=get_weather")).toBeDisplayed();
    await expect($("h3=fetch_weather")).not.toBeDisplayed();
  });

  it("deletes a tool from detail view", async () => {
    await $("h3=search_docs").click();

    const nameInput = await $('input[placeholder="e.g. get_weather, search_docs"]');
    await nameInput.waitForDisplayed({ timeout: 3_000 });

    await $("button=Delete").click();

    // Confirm in the dialog
    const dialog = await $('[role="dialog"]');
    await dialog.waitForDisplayed({ timeout: 3_000 });
    await (await dialog.$("button=Delete")).click();

    // Should return to list without the deleted tool
    await waitForToolList(2);
    await expect($("h3=search_docs")).not.toBeDisplayed();
    await expect($("h3=fetch_weather")).toBeDisplayed();
  });
});
