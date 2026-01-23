export type Page = "home" | "studio" | "enviroments" | "runs" | "settings";

export type SidebarItem = Exclude<Page, "home">;
