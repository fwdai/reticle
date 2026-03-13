import { navigateTo } from "../../helpers/app";
import { create } from "../../helpers/factory";

async function waitForSettingsReady() {
  await $("h1=API Keys").waitForDisplayed({ timeout: 5_000 });
}

describe("API Keys", () => {
  beforeEach(async () => {
    await navigateTo("settings");
    await waitForSettingsReady();
  });

  it("shows all three provider inputs", async () => {
    await expect($("label=OpenAI API Key")).toBeDisplayed();
    await expect($("label=Anthropic API Key")).toBeDisplayed();
    await expect($("label=Google Vertex/Gemini API Key")).toBeDisplayed();
  });

  it("saves provider keys on blur", async () => {
    const cases = [
      {
        name: "OpenAI",
        placeholder: 'input[placeholder="sk-..."]',
        value: "sk-test-openai-key",
      },
      {
        name: "Anthropic",
        placeholder: 'input[placeholder="sk-ant-..."]',
        value: "sk-ant-test-key",
      },
      {
        name: "Google",
        placeholder: 'input[placeholder="Enter Google Cloud API Key"]',
        value: "google-test-api-key",
      },
    ] as const;

    for (const { name, placeholder, value } of cases) {
      const input = await $(placeholder);
      await input.click();
      await input.setValue(value);
      await input.blur();
      await browser.waitUntil(
        async () => (await $(placeholder).getAttribute("data-save-status")) === "saved",
        { timeout: 5_000, timeoutMsg: `Expected ${name} key to reach saved status` }
      );
    }
  });

  it("loads existing keys from storage on mount", async () => {
    await create("api_key", { provider: "anthropic", key: "sk-ant-persisted" });
    // Re-navigate to trigger a fresh component mount that reads from DB
    await navigateTo("scenarios");
    await navigateTo("settings");
    await waitForSettingsReady();
    await expect($('input[placeholder="sk-ant-..."]')).toHaveValue("sk-ant-persisted");
    await expect($('input[placeholder="Enter Google Cloud API Key"]')).toHaveValue("");
    await expect($('input[placeholder="sk-..."]')).toHaveValue("");
  });
});
