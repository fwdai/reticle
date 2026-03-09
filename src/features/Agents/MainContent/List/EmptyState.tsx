import { StarterTemplates } from "@/components/ui/StarterTemplates";
import { AGENT_STARTER_TEMPLATES } from "@/constants/starterTemplates";

interface EmptyStateProps {
  onCreateAgent?: () => void;
}

export function EmptyState({ onCreateAgent }: EmptyStateProps) {
  return (
    <StarterTemplates
      headline="Your first agent awaits"
      subtitle="Choose a starting point to configure your AI agent, then test and iterate."
      templates={AGENT_STARTER_TEMPLATES}
      onSelect={() => onCreateAgent?.()}
    />
  );
}
