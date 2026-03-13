import { navigateTo, openDropdown } from "../../helpers/app";

async function goToPreferences() {
  await navigateTo("settings");
  await $('[data-testid="settings-nav-preferences"]').click();
  await $("h1=Preferences").waitForDisplayed({ timeout: 5_000 });
}

describe("Preferences", () => {
  beforeEach(async () => {
    await goToPreferences();
  });

  it("shows all preference sections", async () => {
    await expect($("label=Default Provider")).toBeDisplayed();
    await expect($("label=Default Model")).toBeDisplayed();
    await expect($("h2=Telemetry")).toBeDisplayed();
    await expect($("h2=Updates")).toBeDisplayed();
  });

  it("saves default provider and model", async () => {
    // Inject a model list into the localStorage cache so the model select
    // is populated without needing real API keys or network calls.
    await browser.execute(() => {
      localStorage.setItem("allModelCache", JSON.stringify({
        data: {
          anthropic: [
            { id: "claude-opus-4-6", display_name: "claude-opus-4-6" },
            { id: "claude-sonnet-4-6", display_name: "claude-sonnet-4-6" },
          ],
        },
        timestamp: Date.now(),
      }));
    });

    // Re-navigate so the component mounts with the seeded cache.
    await navigateTo("scenarios");
    await goToPreferences();

    // Select Anthropic as the default provider.
    const providerTrigger = await $('[data-testid="default-provider-select"]');
    await openDropdown(providerTrigger);
    const anthropicOption = await $('[role="option"]*=Anthropic');
    await anthropicOption.waitForDisplayed({ timeout: 3_000 });
    await anthropicOption.click();

    // Wait for the model select to become enabled with Anthropic models.
    await browser.waitUntil(
      async () => (await $('[data-testid="default-model-select"]').getAttribute("disabled")) === null,
      { timeout: 3_000, timeoutMsg: "Expected model select to be enabled after provider change" }
    );

    // Select a specific model.
    const modelTrigger = await $('[data-testid="default-model-select"]');
    await openDropdown(modelTrigger);
    const modelOption = await $('[role="option"]*=claude-sonnet-4-6');
    await modelOption.waitForDisplayed({ timeout: 3_000 });
    await modelOption.click();

    // Navigate away and back — settings are persisted to DB.
    await navigateTo("scenarios");
    await goToPreferences();

    await expect($('[data-testid="default-provider-select"]')).toHaveText(
      expect.stringContaining("Anthropic")
    );
    await expect($('[data-testid="default-model-select"]')).toHaveText(
      expect.stringContaining("claude-sonnet-4-6")
    );
  });

  it("toggles telemetry", async () => {
    const toggle = await $('[data-testid="telemetry-toggle"]');
    const initial = await toggle.getAttribute("aria-checked");

    await toggle.click();
    await expect(toggle).toHaveAttribute(
      "aria-checked",
      initial === "true" ? "false" : "true"
    );

    // Verify it persists after re-navigation
    await navigateTo("scenarios");
    await goToPreferences();
    await expect($('[data-testid="telemetry-toggle"]')).toHaveAttribute(
      "aria-checked",
      initial === "true" ? "false" : "true"
    );
  });
});
