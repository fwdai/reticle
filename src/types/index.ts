export type Page = "home" | "studio" | "environments" | "runs" | "settings" | "templates";

export type SidebarItem = Exclude<Page, "home">;

export type LLMCallConfig = {
  provider: string;
  model: string;
  systemPrompt: string;
}