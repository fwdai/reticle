import { navigateTo, openDropdown } from "../helpers/app";
import { create } from "../helpers/factory";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function seedAgents() {
  await Promise.all([
    create("agent", {
      name: "Release Notes Generator",
      agent_goal: "Generate release notes from a git log.",
      system_instructions: "You are a technical writer.",
    }),
    create("agent", {
      name: "Code Reviewer",
      agent_goal: "Review code for bugs and style issues.",
      system_instructions: "You are a senior software engineer.",
    }),
    create("agent", {
      name: "Draft Agent",
      // no agent_goal / system_instructions → status: needs-config
    }),
  ]);
}

async function waitForAgentList(minCount = 1) {
  await browser.waitUntil(
    async () => (await $$("main h3")).length >= minCount,
    { timeout: 5_000, timeoutMsg: `Expected at least ${minCount} agent card(s)` }
  );
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe("Agents", () => {
  beforeEach(async () => {
    await seedAgents();
    await navigateTo("agents");
    await waitForAgentList(3);
  });

  it("shows all agents", async () => {
    await expect($("h3=Release Notes Generator")).toBeDisplayed();
    await expect($("h3=Code Reviewer")).toBeDisplayed();
    await expect($("h3=Draft Agent")).toBeDisplayed();
  });

  it("filters to ready agents", async () => {
    await $("span=Ready").click();
    await browser.waitUntil(
      async () => (await $$("main h3")).length === 2,
      { timeout: 3_000, timeoutMsg: "Expected 2 ready agents" }
    );
    await expect($("h3=Release Notes Generator")).toBeDisplayed();
    await expect($("h3=Code Reviewer")).toBeDisplayed();
    await expect($("h3=Draft Agent")).not.toBeDisplayed();
  });

  it("filters to needs-config agents", async () => {
    await $("span=Needs Config").click();
    await browser.waitUntil(
      async () => (await $$("main h3")).length === 1,
      { timeout: 3_000, timeoutMsg: "Expected 1 needs-config agent" }
    );
    await expect($("h3=Draft Agent")).toBeDisplayed();
    await expect($("h3=Release Notes Generator")).not.toBeDisplayed();
    await expect($("h3=Code Reviewer")).not.toBeDisplayed();
  });

  it("searches by name", async () => {
    const search = await $('input[placeholder="Search agents..."]');
    await search.setValue("Code");
    await browser.waitUntil(
      async () => (await $$("main h3")).length === 1,
      { timeout: 3_000, timeoutMsg: "Expected 1 result after search" }
    );
    await expect($("h3=Code Reviewer")).toBeDisplayed();
    await expect($("h3=Release Notes Generator")).not.toBeDisplayed();
    await expect($("h3=Draft Agent")).not.toBeDisplayed();
  });

  it("creates a new agent", async () => {
    await $("button=New Agent").click();

    const nameInput = await $('input[placeholder="Name your agent..."]');
    await nameInput.waitForDisplayed({ timeout: 3_000 });
    await nameInput.setValue("Data Analyst");

    await browser.waitUntil(
      async () => (await $('[data-save-status="saved"]')).isDisplayed(),
      { timeout: 5_000, timeoutMsg: "Expected agent to be saved" }
    );

    await $("button*=Agents").click();
    await waitForAgentList(4);
    await expect($("h3=Data Analyst")).toBeDisplayed();
  });

  it("updates an agent name", async () => {
    await $("h3=Draft Agent").click();

    const nameInput = await $('input[placeholder="Agent name..."]');
    await nameInput.waitForDisplayed({ timeout: 3_000 });
    await nameInput.clearValue();
    await nameInput.setValue("Renamed Agent");

    await browser.waitUntil(
      async () => (await $('[data-save-status="saved"]')).isDisplayed(),
      { timeout: 5_000, timeoutMsg: "Expected agent update to be saved" }
    );

    await $("button*=Agents").click();
    await expect($("h3=Renamed Agent")).toBeDisplayed();
    await expect($("h3=Draft Agent")).not.toBeDisplayed();
  });

  it("deletes an agent from detail view", async () => {
    await $("h3=Code Reviewer").click();

    const nameInput = await $('input[placeholder="Agent name..."]');
    await nameInput.waitForDisplayed({ timeout: 3_000 });

    // Open the context menu and click Delete
    await openDropdown(await $('[data-testid="agent-menu"]'));
    const deleteItem = await $('[role="menuitem"]*=Delete');
    await deleteItem.waitForDisplayed({ timeout: 3_000 });
    await deleteItem.click();

    // Confirm in the dialog
    const dialog = await $('[role="dialog"]');
    await dialog.waitForDisplayed({ timeout: 3_000 });
    await (await dialog.$("button=Delete")).click();

    // Should return to the list without the deleted agent
    await waitForAgentList(2);
    await expect($("h3=Code Reviewer")).not.toBeDisplayed();
    await expect($("h3=Release Notes Generator")).toBeDisplayed();
  });
});
