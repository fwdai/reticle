import { waitForAppReady, navigateTo } from "../helpers/app";

describe("Navigation", () => {
  before(async () => {
    await waitForAppReady();
  });

  it("app loads and nav is visible", async () => {
    await expect($('[data-testid="nav-home"]')).toBeDisplayed();
  });

  it("navigates to Agents", async () => {
    await navigateTo("agents");
    await expect($("h1=Agents")).toBeDisplayed();
  });

  it("navigates to Tools", async () => {
    await navigateTo("tools");
    await expect($("h1=Tools")).toBeDisplayed();
  });

  it("navigates to Runs", async () => {
    await navigateTo("runs");
    await expect($("h1=Runs History")).toBeDisplayed();
  });

  it("navigates back to Agents", async () => {
    await navigateTo("agents");
    await expect($("h1=Agents")).toBeDisplayed();
  });
});
