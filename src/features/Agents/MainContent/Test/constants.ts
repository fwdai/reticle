import {
  CheckCircle2,
  ListChecks,
  Code,
  Brain,
  Wrench,
  Shield,
  ArrowRight,
  AlertTriangle,
  Timer,
} from "lucide-react";
import type { ComponentType } from "react";
import type { AssertionType } from "./types";

export const ASSERTION_CONFIG: Record<
  AssertionType,
  { label: string; icon: ComponentType<{ className?: string }>; description: string; color: string }
> = {
  exact_match: {
    label: "Exact Match",
    icon: CheckCircle2,
    description: "Output matches exactly",
    color: "text-primary",
  },
  contains: {
    label: "Contains",
    icon: ListChecks,
    description: "Output contains substring",
    color: "text-primary",
  },
  json_schema: {
    label: "JSON Schema",
    icon: Code,
    description: "Output validates against schema",
    color: "text-primary",
  },
  llm_judge: {
    label: "LLM Judge",
    icon: Brain,
    description: "LLM evaluates quality",
    color: "text-amber-600",
  },
  tool_called: {
    label: "Tool Called",
    icon: Wrench,
    description: "Agent must call this tool",
    color: "text-green-600",
  },
  tool_not_called: {
    label: "Tool Not Called",
    icon: Shield,
    description: "Agent must NOT call this tool",
    color: "text-destructive",
  },
  tool_sequence: {
    label: "Tool Sequence",
    icon: ArrowRight,
    description: "Tools called in this order",
    color: "text-primary",
  },
  loop_count: {
    label: "Loop Count",
    icon: Timer,
    description: "Max iterations allowed",
    color: "text-amber-600",
  },
  guardrail: {
    label: "Guardrail Check",
    icon: AlertTriangle,
    description: "No safety violations",
    color: "text-destructive",
  },
};
