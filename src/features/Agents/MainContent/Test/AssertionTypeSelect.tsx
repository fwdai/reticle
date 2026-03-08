import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { AssertionType } from "./types";

interface AssertionTypeSelectProps {
  value: AssertionType;
  onChange: (v: AssertionType) => void;
  className?: string;
}

const OUTPUT_TYPES: AssertionType[] = [
  "exact_match",
  "contains",
  "json_schema",
  "llm_judge",
];

const BEHAVIOR_TYPES: AssertionType[] = [
  "tool_called",
  "tool_not_called",
  "tool_sequence",
  "loop_count",
  "guardrail",
];

const LABELS: Record<AssertionType, string> = {
  exact_match: "Exact Match",
  contains: "Contains",
  json_schema: "JSON Schema",
  llm_judge: "LLM Judge",
  tool_called: "Tool Called",
  tool_not_called: "Tool Not Called",
  tool_sequence: "Tool Sequence",
  loop_count: "Loop Count",
  guardrail: "Guardrail Check",
};

export function AssertionTypeSelect({
  value,
  onChange,
  className,
}: AssertionTypeSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as AssertionType)}>
      <SelectTrigger
        className={cn(
          "h-8 w-[150px] text-[11px] bg-white border-slate-200 focus:ring-2 focus:ring-primary/20",
          className
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <div className="px-2 py-1.5 text-[10px] font-semibold text-text-muted tracking-widest uppercase">
          Output
        </div>
        {OUTPUT_TYPES.map((t) => (
          <SelectItem key={t} value={t} className="text-xs">
            {LABELS[t]}
          </SelectItem>
        ))}
        <div className="px-2 py-1.5 text-[10px] font-semibold text-text-muted tracking-widest uppercase border-t border-border-light mt-1 pt-2">
          Behavior
        </div>
        {BEHAVIOR_TYPES.map((t) => (
          <SelectItem key={t} value={t} className="text-xs">
            {LABELS[t]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
