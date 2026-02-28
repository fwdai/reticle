import type { Tool, ToolParameter } from "@/components/Tools/types";

export type { ToolParameter };

export interface RegistryTool extends Tool {
  category: string;
  usedBy: number;
  updatedAt: string;
}
