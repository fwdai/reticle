import { browser } from "@wdio/globals";

export type NavPage = "home" | "studio" | "agents" | "tools" | "templates" | "runs";

/** Wait for the app to finish loading (nav is the first reliable landmark). */
export async function waitForAppReady(timeout = 15_000): Promise<void> {
  await $('[data-testid="nav-home"]').waitForDisplayed({ timeout });
}

/** Click a nav item and pause briefly for the page transition. */
export async function navigateTo(page: NavPage): Promise<void> {
  await $(`[data-testid="nav-${page}"]`).click();
  await browser.pause(300);
}
