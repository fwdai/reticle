import {
  Brain,
  Wrench,
  Cpu,
  Sparkles,
  Send,
  ArrowRight,
  Eye,
  PenLine,
  MessageSquare,
  Target,
  AlertTriangle,
  Hand,
} from "lucide-react";
import type { StepType } from "@/types";

export const stepConfig: Record<StepType, { icon: React.ElementType; badge: string }> = {
  task_input: { icon: Target, badge: "INPUT" },
  reasoning: { icon: Brain, badge: "REASON" },
  model_call: { icon: Cpu, badge: "LLM" },
  model_response: { icon: MessageSquare, badge: "RESPONSE" },
  tool_call: { icon: Wrench, badge: "TOOL" },
  tool_response: { icon: Send, badge: "RESULT" },
  memory_read: { icon: Eye, badge: "READ" },
  memory_write: { icon: PenLine, badge: "WRITE" },
  decision: { icon: Sparkles, badge: "DECIDE" },
  output: { icon: ArrowRight, badge: "OUTPUT" },
  error: { icon: AlertTriangle, badge: "ERROR" },
  human_input: { icon: Hand, badge: "HUMAN" },
};

export const filterOptions: { value: StepType | "all"; label: string }[] = [
  { value: "all", label: "All steps" },
  { value: "reasoning", label: "Reasoning" },
  { value: "model_call", label: "LLM" },
  { value: "tool_call", label: "Tools" },
  { value: "memory_read", label: "Memory" },
  { value: "decision", label: "Decisions" },
  { value: "human_input", label: "Human" },
];
