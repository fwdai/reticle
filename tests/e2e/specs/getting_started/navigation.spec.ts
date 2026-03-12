import { navigateTo } from "../../helpers/app";

describe("Navigation", () => {
  it("navigates through all main sections", async () => {
    // App loads and nav is visible
    await expect($('[data-testid="nav-home"]')).toBeDisplayed();

    // Navigates to Scenarios
    await navigateTo("scenarios");
    await expect($("h1=All Scenarios")).toBeDisplayed();
    await expect($("h2=Start testing your models")).toBeDisplayed();
    await expect($("h3=Sentiment Classifier")).toBeDisplayed();
    await expect($("h3=Extract Structured Data")).toBeDisplayed();
    await expect($("h3=Debugging Session")).toBeDisplayed();
    await expect($("button=Create a scenario")).toBeDisplayed();

    // Navigates to Agents
    await navigateTo("agents");
    await expect($("h1=Agents")).toBeDisplayed();
    await expect($("h2=Your first agent, ready to build")).toBeDisplayed();
    await expect($("h3=Release Notes Generator")).toBeDisplayed();
    await expect($("h3=Code Reviewer")).toBeDisplayed();
    await expect($("h3=Content Summarizer")).toBeDisplayed();
    await expect($("button=Create an agent")).toBeDisplayed();

    // Navigates to Tools
    await navigateTo("tools");
    await expect($("h1=Tools")).toBeDisplayed();
    await expect($("h2=Give your agents something to do")).toBeDisplayed();
    await expect($("h3=Fetch Webpage")).toBeDisplayed();
    await expect($("h3=SQL Query")).toBeDisplayed();
    await expect($("h3=Send Notification")).toBeDisplayed();
    await expect($("button=Create a tool")).toBeDisplayed();

    // Navigates to Templates
    await navigateTo("templates");
    await expect($("h1*=Templates")).toBeDisplayed();
    await expect($("h2=Reuse what works")).toBeDisplayed();
    await expect($("h3=JSON-Only Responder")).toBeDisplayed();
    await expect($("h3=Rewrite with Tone")).toBeDisplayed();
    await expect($("h3=Few-Shot Classifier")).toBeDisplayed();
    await expect($("button=Create a template")).toBeDisplayed();

    // Navigates to Runs
    await navigateTo("runs");
    await expect($("h1=Runs History")).toBeDisplayed();
    await expect($("p=No runs yet")).toBeDisplayed();
    await expect($("p*=Run a scenario or an agent to see executions here.")).toBeDisplayed();

    // Settings — API Keys
    await $('[data-testid="nav-settings"]').click();
    await expect($("h1=API Keys")).toBeDisplayed();
    await expect($("label=OpenAI API Key")).toBeDisplayed();
    await expect($("label=Anthropic API Key")).toBeDisplayed();
    await expect($("label=Google Vertex/Gemini API Key")).toBeDisplayed();

    // Settings — Account
    await $('[data-testid="settings-nav-account"]').click();
    await expect($("h1=Account")).toBeDisplayed();
    await expect($("label*=First name")).toBeDisplayed();
    await expect($("label*=Last name")).toBeDisplayed();
    await expect($("label*=Role")).toBeDisplayed();

    // Settings — Preferences
    await $('[data-testid="settings-nav-preferences"]').click();
    await expect($("h1=Preferences")).toBeDisplayed();
    await expect($("label*=Default Provider")).toBeDisplayed();
    await expect($("label*=Default Model")).toBeDisplayed();
    await expect($("h2=Telemetry")).toBeDisplayed();
    await expect($("h2=Updates")).toBeDisplayed();

    // Settings — Env Variables
    await $('[data-testid="settings-nav-env-variables"]').click();
    await expect($("h1=Environment Variables")).toBeDisplayed();
    await expect($("p=No environment variables yet")).toBeDisplayed();

    // Navigates back to Home and shows the getting-started steps
    await navigateTo("home");
    await expect($("h2=Welcome to Reticle!")).toBeDisplayed();
    await expect($("h4=1. Connect an AI Provider")).toBeDisplayed();
    await expect($("h4=2. Run Your First Scenario")).toBeDisplayed();
    await expect($("h4=3. Complete Your Profile")).toBeDisplayed();
  });
});
