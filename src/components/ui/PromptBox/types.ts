export interface Variable {
  id: number;
  key: string;
  value: string;
}

export interface Template {
  name: string;
  prompt: string;
  variables: Variable[];
}

export interface PromptBoxProps {
  type: "system" | "user";
  initialPromptValue?: string;
  initialVariables?: Variable[];
  onPromptChange: (prompt: string) => void;
  onVariablesChange: (variables: Variable[]) => void;
  showTemplateManager?: boolean;
}
