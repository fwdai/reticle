import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { formatCost, formatTokens } from "@/lib/helpers/format";

export interface ExecutionStepMetaRowProps {
  isLlm: boolean;
  tokens?: number;
  stepCost: number | null;
  durationLabel: string | null;
  metaBase: string;
  metaMuted: string;
}

function interleaveMiddot(nodes: ReactNode[], metaMuted: string): ReactNode[] {
  return nodes.flatMap((node, i) =>
    i === 0
      ? [node]
      : [
        <span key={`sep-${i}`} className={cn(metaMuted, "select-none")} aria-hidden>
          ·
        </span>,
        node,
      ]
  );
}

export function ExecutionStepMetaRow({
  isLlm,
  tokens,
  stepCost,
  durationLabel,
  metaBase,
  metaMuted,
}: ExecutionStepMetaRowProps) {
  if (!isLlm) {
    return durationLabel ? <span className={metaMuted}>{durationLabel}</span> : null;
  }

  const parts: ReactNode[] = [];
  if (tokens != null && tokens > 0) {
    parts.push(
      <span key="tok" className={metaMuted}>
        {formatTokens(tokens, true)}
      </span>
    );
  }
  if (stepCost != null && stepCost > 0) {
    parts.push(
      <span key="cost" className={cn(metaBase, "text-primary/70")}>
        {formatCost(stepCost)}
      </span>
    );
  }
  if (durationLabel) {
    parts.push(
      <span key="dur" className={metaMuted}>
        {durationLabel}
      </span>
    );
  }

  if (parts.length === 0) return null;

  return (
    <span className="inline-flex flex-wrap items-center gap-x-1">
      {interleaveMiddot(parts, metaMuted)}
    </span>
  );
}
