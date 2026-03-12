import { waitForAppReady, navigateTo } from "../../helpers/app";

describe("Navigation", () => {
  before(async () => {
    await waitForAppReady();
  });

  it("app loads and nav is visible", async () => {
    await expect($('[data-testid="nav-home"]')).toBeDisplayed();
  });

  it("navigates to Scenarios", async () => {
    await navigateTo("studio");
    await expect($("h1=All Scenarios")).toBeDisplayed();
    await expect($("h2=Start testing your models")).toBeDisplayed();
    await expect($("h3=Sentiment Classifier")).toBeDisplayed();
    await expect($("h3=Extract Structured Data")).toBeDisplayed();
    await expect($("h3=Debugging Session")).toBeDisplayed();
    await expect($("button=Create a scenario")).toBeDisplayed();
  });

  it("navigates to Agents", async () => {
    await navigateTo("agents");
    await expect($("h1=Agents")).toBeDisplayed();
    await expect($("h2=Your first agent, ready to build")).toBeDisplayed();
    await expect($("h3=Release Notes Generator")).toBeDisplayed();
    await expect($("h3=Code Reviewer")).toBeDisplayed();
    await expect($("h3=Content Summarizer")).toBeDisplayed();
    await expect($("button=Create an agent")).toBeDisplayed();
  });

  it("navigates to Tools", async () => {
    await navigateTo("tools");
    await expect($("h1=Tools")).toBeDisplayed();
    await expect($("h2=Give your agents something to do")).toBeDisplayed();
    await expect($("h3=Fetch Webpage")).toBeDisplayed();
    await expect($("h3=SQL Query")).toBeDisplayed();
    await expect($("h3=Send Notification")).toBeDisplayed();
    await expect($("button=Create a tool")).toBeDisplayed();
  });

  it("navigates to Templates", async () => {
    await navigateTo("templates");
    await expect($("h1*=Templates")).toBeDisplayed();
    await expect($("h2=Reuse what works")).toBeDisplayed();
    await expect($("h3=JSON-Only Responder")).toBeDisplayed();
    await expect($("h3=Rewrite with Tone")).toBeDisplayed();
    await expect($("h3=Few-Shot Classifier")).toBeDisplayed();
    await expect($("button=Create a template")).toBeDisplayed();
  });

  it("navigates to Runs", async () => {
    await navigateTo("runs");
    await expect($("h1=Runs History")).toBeDisplayed();
    await expect($("p=No runs yet")).toBeDisplayed();
    await expect($("p*=Run a scenario or an agent to see executions here.")).toBeDisplayed();
  });

  // ─── Settings ────────────────────────────────────────────────────────────────

  it("navigates to Settings — API Keys", async () => {
    await $('[data-testid="nav-settings"]').click();
    await expect($("h1=API Keys")).toBeDisplayed();
    await expect($("label=OpenAI API Key")).toBeDisplayed();
    await expect($("label=Anthropic API Key")).toBeDisplayed();
    await expect($("label=Google Vertex/Gemini API Key")).toBeDisplayed();
  });

  it("navigates to Settings — Account", async () => {
    await $('[data-testid="settings-nav-account"]').click();
    await expect($("h1=Account")).toBeDisplayed();
    await expect($("label*=First name")).toBeDisplayed();
    await expect($("label*=Last name")).toBeDisplayed();
    await expect($("label*=Role")).toBeDisplayed();
  });

  it("navigates to Settings — Preferences", async () => {
    await $('[data-testid="settings-nav-preferences"]').click();
    await expect($("h1=Preferences")).toBeDisplayed();
    await expect($("label*=Default Provider")).toBeDisplayed();
    await expect($("label*=Default Model")).toBeDisplayed();
    await expect($("h2=Telemetry")).toBeDisplayed();
    await expect($("h2=Updates")).toBeDisplayed();
  });

  it("navigates to Settings — Env Variables", async () => {
    await $('[data-testid="settings-nav-env-variables"]').click();
    await expect($("h1=Environment Variables")).toBeDisplayed();
    await expect($("p=No environment variables yet")).toBeDisplayed();
  });

  it("navigates back to Home and shows the getting-started steps", async () => {
    await navigateTo("home");
    await expect($("h2=Welcome to Reticle!")).toBeDisplayed();
    await expect($("h4=1. Connect an AI Provider")).toBeDisplayed();
    await expect($("h4=2. Run Your First Scenario")).toBeDisplayed();
    await expect($("h4=3. Complete Your Profile")).toBeDisplayed();
  });
});
