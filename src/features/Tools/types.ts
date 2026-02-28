export type { Tool, ToolParameter } from "@/components/Tools/types";
import type { Tool } from "@/components/Tools/types";

export interface ToolWithMeta extends Tool {
  updatedAt: number | null;
  usedBy: number;
}
