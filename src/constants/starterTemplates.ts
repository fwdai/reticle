import {
  Bot, Wrench, Target,
  FileCode, FileText, Variable, MessageCircle,
  Braces, Zap,
  Layers, BookOpen,
  Library,
} from "lucide-react";
import type { StarterTemplate, StarterTemplatesProps } from "@/components/ui/EmptyState";

export type { StarterTemplate };

export type EntityEmptyStateConfig = Omit<StarterTemplatesProps, "onCreateBlank" | "onSelect">;

// ─── Agents ──────────────────────────────────────────────────────────────────

export const AGENT_EMPTY_STATE: EntityEmptyStateConfig = {
  badge: "Agents",
  badgeIcon: Zap,
  headline: "Your first agent, ready to build",
  subtitle:
    "Agents are AI workers you configure with a model, instructions, and tools. Define one here, then run it against scenarios to test and refine its behavior.",
  createLabel: "Create an agent",
  templates: [
    {
      icon: Bot,
      title: "Simple Assistant",
      description:
        "A single-model agent with a system prompt and no tools — the fastest way to get a working agent running.",
      tags: ["gpt-4.1", "no tools"],
    },
    {
      icon: Wrench,
      title: "Tool-Using Agent",
      description:
        "An agent wired up to your registered tools so it can fetch data, call APIs, or trigger actions mid-run.",
      tags: ["gpt-4.1", "tools"],
    },
    {
      icon: Target,
      title: "Eval-Ready Agent",
      description:
        "An agent pre-configured to run against a scenario suite — useful for catching regressions as you iterate.",
      tags: ["gpt-4.1", "evals"],
    },
  ],
};

// ─── Scenarios ────────────────────────────────────────────────────────────────

export const SCENARIO_EMPTY_STATE: EntityEmptyStateConfig = {
  badge: "Scenarios",
  badgeIcon: FileCode,
  headline: "Start testing your models",
  subtitle:
    "Scenarios are structured prompts you run against a model. Build a library of cases to compare outputs, catch regressions, and measure quality over time.",
  createLabel: "Create a scenario",
  templates: [
    {
      icon: FileText,
      title: "Basic Prompt",
      description:
        "A single-turn prompt with a system message and user input — the simplest unit of model testing.",
      tags: ["single-turn", "prompt"],
    },
    {
      icon: Variable,
      title: "Parameterized",
      description:
        "A prompt template with named variables like {{input}} you can swap out to run the same scenario across different cases.",
      tags: ["variables", "template"],
    },
    {
      icon: MessageCircle,
      title: "Multi-Turn",
      description:
        "A multi-turn conversation that includes prior assistant turns — useful for testing instruction-following and context handling.",
      tags: ["multi-turn", "chat"],
    },
  ],
};

// ─── Tools ────────────────────────────────────────────────────────────────────

export const TOOL_EMPTY_STATE: EntityEmptyStateConfig = {
  badge: "Tools",
  badgeIcon: Wrench,
  headline: "Give your agents something to do",
  subtitle:
    "Tools are callable functions defined once and shared across agents and scenarios. Connect to external APIs, transform data, or encapsulate any logic your agents need.",
  createLabel: "Create a tool",
  templates: [
    {
      icon: Zap,
      title: "HTTP Request",
      description:
        "Calls an external REST endpoint and returns the response — the go-to starting point for any integration.",
      tags: ["http", "json"],
    },
    {
      icon: Braces,
      title: "JSON Transform",
      description:
        "Parses and reshapes a JSON payload between agent steps, useful for mapping data across tools.",
      tags: ["json", "transform"],
    },
    {
      icon: Wrench,
      title: "Custom Function",
      description:
        "A blank slate — define your own parameters and logic, then attach it to any agent or scenario.",
      tags: ["custom", "code"],
    },
  ],
};

// ─── Templates ────────────────────────────────────────────────────────────────

export const TEMPLATE_EMPTY_STATE: EntityEmptyStateConfig = {
  badge: "Prompt Templates",
  badgeIcon: Library,
  headline: "Reuse what works",
  subtitle:
    "Prompt templates let you define and version your best prompts in one place. Use variables to keep them flexible, then attach them to scenarios and agents across your workspace.",
  createLabel: "Create a template",
  templates: [
    {
      icon: Layers,
      title: "System Prompt",
      description:
        "A reusable system prompt that sets the persona and constraints for a model — swap it across scenarios without rewriting.",
      tags: ["system", "reusable"],
    },
    {
      icon: Variable,
      title: "With Variables",
      description:
        "A prompt with named placeholders like {{topic}} or {{tone}} that get filled in at run time for flexible reuse.",
      tags: ["user", "variables"],
    },
    {
      icon: BookOpen,
      title: "Few-Shot Examples",
      description:
        "A structured prompt that includes input/output examples to steer the model toward a consistent format or style.",
      tags: ["user", "few-shot"],
    },
  ],
};
