import { PromptTemplate } from "@/types/index";

export interface Variable {
  id: number;
  key: string;
  value: string;
}

export interface PromptBoxProps {
  type: "system" | "user";
  initialPromptValue?: string;
  initialVariables?: Variable[];
  onPromptChange: (prompt: string) => void;
  onVariablesChange: (variables: Variable[]) => void;
  showTemplateManager?: boolean;
}

// Re-export PromptTemplate for convenience
export type { PromptTemplate };
