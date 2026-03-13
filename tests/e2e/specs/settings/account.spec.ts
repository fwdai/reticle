import { navigateTo } from "../../helpers/app";

async function goToAccount() {
  await navigateTo("settings");
  await $('[data-testid="settings-nav-account"]').click();
  await $("h1=Account").waitForDisplayed({ timeout: 5_000 });
}

describe("Account settings", () => {
  beforeEach(async () => {
    await goToAccount();
  });

  it("shows all account form fields", async () => {
    await expect($('input[placeholder="e.g. Alex"]')).toBeDisplayed();
    await expect($('input[placeholder="e.g. Smith"]')).toBeDisplayed();
    await expect($('input[placeholder="e.g. Engineer, Researcher, PM"]')).toBeDisplayed();
  });

  it("saves first and last name on blur", async () => {
    const firstName = await $('input[placeholder="e.g. Alex"]');
    await firstName.click();
    await firstName.setValue("Jane");
    await browser.keys("Tab");

    const lastName = await $('input[placeholder="e.g. Smith"]');
    await lastName.setValue("Doe");
    await browser.keys("Tab");

    // Navigate away and back to verify persistence
    await navigateTo("scenarios");
    await goToAccount();

    await expect($('input[placeholder="e.g. Alex"]')).toHaveValue("Jane");
    await expect($('input[placeholder="e.g. Smith"]')).toHaveValue("Doe");
  });

  it("saves role on blur", async () => {
    const roleInput = await $('input[placeholder="e.g. Engineer, Researcher, PM"]');
    await roleInput.click();
    await roleInput.setValue("Engineer");
    await browser.keys("Tab");

    await navigateTo("scenarios");
    await goToAccount();

    await expect($('input[placeholder="e.g. Engineer, Researcher, PM"]')).toHaveValue("Engineer");
  });

  it("selects a usage context and persists it", async () => {
    await $('[data-testid="usage-context-work"]').click();
    await expect($('[data-testid="usage-context-work"]')).toHaveAttribute("aria-pressed", "true");
    await expect($('[data-testid="usage-context-personal"]')).toHaveAttribute("aria-pressed", "false");

    await navigateTo("scenarios");
    await goToAccount();

    await expect($('[data-testid="usage-context-work"]')).toHaveAttribute("aria-pressed", "true");
  });
});
