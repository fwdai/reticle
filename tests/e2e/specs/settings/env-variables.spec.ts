import { navigateTo } from "../../helpers/app";
import { create } from "../../helpers/factory";

async function goToEnvVars() {
  await navigateTo("settings");
  await $('[data-testid="settings-nav-env-variables"]').click();
  await $("h1=Environment Variables").waitForDisplayed({ timeout: 5_000 });
}

async function waitForKeyInList(key: string) {
  await browser.waitUntil(
    async () => {
      for (const inp of await $$('input[data-testid^="env-key-"]')) {
        if (await inp.getValue() === key) return true;
      }
      return false;
    },
    { timeout: 3_000, timeoutMsg: `Expected "${key}" to appear in the list` }
  );
}

describe("Environment Variables", () => {
  beforeEach(async () => {
    await goToEnvVars();
  });

  it("adds a plain variable", async () => {
    await $("button*=ADD VARIABLE").click();
    await $('input[placeholder="VARIABLE_NAME"]').setValue("PLAIN_TEST");
    await $('input[placeholder="value"]').setValue("hello");
    await browser.keys("Enter");

    await waitForKeyInList("PLAIN_TEST");
  });

  it("edits a variable value", async () => {
    const v = await create("env_variable", { key: "EDIT_TEST", value: "old-value" });

    await navigateTo("scenarios");
    await goToEnvVars();

    const valueInput = await $(`[data-testid="env-value-${v.id}"]`);
    await valueInput.click();
    await valueInput.clearValue();
    await valueInput.setValue("new-value");
    await browser.keys("Tab");

    await navigateTo("scenarios");
    await goToEnvVars();

    await expect($(`[data-testid="env-value-${v.id}"]`)).toHaveValue("new-value");
  });

  it("deletes a variable", async () => {
    const v = await create("env_variable", { key: "DELETE_TEST", value: "bye" });

    await navigateTo("scenarios");
    await goToEnvVars();

    await $(`[data-testid="env-delete-${v.id}"]`).click();

    await browser.waitUntil(
      async () => !(await $(`[data-testid="env-var-row-${v.id}"]`).isExisting()),
      { timeout: 3_000, timeoutMsg: "Expected row to be removed after deletion" }
    );
  });

  it("adds a secret variable and masks the value", async () => {
    await $("button*=ADD VARIABLE").click();
    await $('input[placeholder="VARIABLE_NAME"]').setValue("SECRET_TEST");
    await $('input[placeholder="value"]').setValue("supersecret");
    await $('[data-testid="new-var-secret"]').click();
    await $('[data-testid="new-var-add"]').click();

    await waitForKeyInList("SECRET_TEST");

    // Find the ID of the newly added row, then verify its value is masked
    let varId: string | null = null;
    for (const inp of await $$('input[data-testid^="env-key-"]')) {
      if (await inp.getValue() === "SECRET_TEST") {
        varId = (await inp.getAttribute("data-testid"))!.replace("env-key-", "");
        break;
      }
    }
    await expect($(`[data-testid="env-value-${varId}"]`)).toHaveAttribute("type", "password");
  });
});
