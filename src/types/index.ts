export type Page = "home" | "studio" | "environments" | "runs" | "settings" | "templates";

export type SidebarItem = Exclude<Page, "home">;
