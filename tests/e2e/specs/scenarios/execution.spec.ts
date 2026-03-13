import { navigateTo } from "../../helpers/app";
import { mockResponse, resetMocks } from "../../helpers/mock";
import { create } from "../../helpers/factory";

describe("Scenario execution", () => {
  beforeEach(async () => {
    await create("api_key", { provider: "openai", key: "OPENAI_KEY" });
    await create("scenario", {
      title: "Stop Test Scenario",
      system_prompt: "You are a helpful assistant.",
      user_prompt: "Say hello!",
      model: "gpt-4o",
    });

    await mockResponse("/v1/models", "tests/e2e/fixtures/openai/models.json", {
      provider: "openai",
    });
    await mockResponse("/v1/chat/completions", "tests/e2e/fixtures/openai/chat-completions.sse", {
      provider: "openai",
      contentType: "text/event-stream",
      delayMs: 10_000,
    });

    await navigateTo("scenarios");
    await $("h3=Stop Test Scenario").click();
    await $("button=Run").waitForDisplayed({ timeout: 5_000 });
  });

  afterEach(async () => {
    await resetMocks();
  });

  it("transitions Run → Stop when execution starts, and aborts when Stop is clicked", async () => {
    await $("button=Run").click();

    // Button must switch to Stop while the slow response is in flight
    await $("button=Stop").waitForDisplayed({ timeout: 3_000 });

    await $("button=Stop").click();

    // After aborting, button returns to Run and no successful status is shown
    await $("button=Run").waitForDisplayed({ timeout: 3_000 });
    await expect($("p=Cancelled by user")).toBeDisplayed();
    await expect($("span=200 OK")).not.toBeDisplayed();
  });
});
