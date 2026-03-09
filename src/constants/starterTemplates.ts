import { Bot, Wrench, Target, FileText, Variable, MessageCircle, Braces, Zap, Layers, BookOpen } from "lucide-react";
import type { StarterTemplate } from "@/components/ui/StarterTemplates";

export const AGENT_STARTER_TEMPLATES: StarterTemplate[] = [
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

export const SCENARIO_STARTER_TEMPLATES: StarterTemplate[] = [
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

export const TOOL_STARTER_TEMPLATES: StarterTemplate[] = [
  {
    icon: Wrench,
    title: "HTTP Request",
    description:
      "Call an external REST API and return the response. Perfect for fetching data or triggering webhooks.",
    tags: ["http", "json"],
  },
  {
    icon: Braces,
    title: "JSON Transform",
    description:
      "Parse, filter, or reshape a JSON payload. Useful for data mapping between agent steps.",
    tags: ["json", "transform"],
  },
  {
    icon: Zap,
    title: "Custom Function",
    description:
      "Write a fully custom tool with your own parameters and logic, callable by any agent.",
    tags: ["custom", "code"],
  },
];

export const TEMPLATE_STARTER_TEMPLATES: StarterTemplate[] = [
  {
    icon: Layers,
    title: "System Prompt",
    description:
      "A reusable system prompt that sets the role and behavior of a model across multiple scenarios.",
    tags: ["system", "reusable"],
  },
  {
    icon: Variable,
    title: "With Variables",
    description:
      "A prompt template with named placeholders like {{topic}} that get filled in at run time.",
    tags: ["user", "variables"],
  },
  {
    icon: BookOpen,
    title: "Few-Shot Examples",
    description:
      "A structured prompt with input/output examples to guide the model towards a desired format.",
    tags: ["user", "few-shot"],
  },
];
