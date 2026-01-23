export type Page = "home" | "studio" | "environments" | "runs" | "settings";

export type SidebarItem = Exclude<Page, "home">;
