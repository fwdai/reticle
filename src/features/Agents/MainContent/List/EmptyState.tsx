import { Bot, Wrench, Target } from "lucide-react";
import { StarterTemplates } from "@/components/ui/StarterTemplates";

const AGENT_TEMPLATES = [
  {
    icon: Bot,
    title: "Simple Assistant",
    description:
      "A prompt-driven agent with a system prompt and no tools. Great for text generation and Q&A.",
    tags: ["gpt-4.1", "no tools"],
  },
  {
    icon: Wrench,
    title: "Tool-Using Agent",
    description:
      "An agent that can call your registered tools to fetch data, run code, or take actions.",
    tags: ["gpt-4.1", "with tools"],
  },
  {
    icon: Target,
    title: "Eval-Ready Agent",
    description:
      "An agent configured with scenarios for regression testing and quality evaluation.",
    tags: ["gpt-4.1", "evals"],
  },
];

interface EmptyStateProps {
  onCreateAgent?: () => void;
}

export function EmptyState({ onCreateAgent }: EmptyStateProps) {
  return (
    <StarterTemplates
      headline="Your first agent awaits"
      subtitle="Choose a starting point to configure your AI agent, then test and iterate."
      templates={AGENT_TEMPLATES}
      onSelect={() => onCreateAgent?.()}
    />
  );
}
