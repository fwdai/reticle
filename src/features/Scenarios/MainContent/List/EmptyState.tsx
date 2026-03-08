import { FileText, Variable, MessageCircle } from "lucide-react";
import { StarterTemplates } from "@/components/ui/StarterTemplates";

const SCENARIO_TEMPLATES = [
  {
    icon: FileText,
    title: "Basic Prompt",
    description:
      "A single-turn scenario with a system prompt and user message. The simplest way to test a model.",
    tags: ["single-turn", "prompt"],
  },
  {
    icon: Variable,
    title: "With Variables",
    description:
      "A prompt template with input variables that can be swapped across test runs.",
    tags: ["variables", "template"],
  },
  {
    icon: MessageCircle,
    title: "Multi-Turn Chat",
    description:
      "A multi-turn conversation with an assistant turn, useful for testing dialogue flows.",
    tags: ["multi-turn", "chat"],
  },
];

interface EmptyStateProps {
  hasCollectionSelected: boolean;
  onCreateScenario?: () => void;
}

export function EmptyState({
  hasCollectionSelected,
  onCreateScenario,
}: EmptyStateProps) {
  return (
    <StarterTemplates
      headline="Add your first scenario"
      subtitle={
        hasCollectionSelected
          ? "Choose a starting point to create a test scenario, then run and compare results."
          : "Select or create a collection first, then pick a starting point below."
      }
      templates={SCENARIO_TEMPLATES}
      onSelect={() => onCreateScenario?.()}
    />
  );
}
