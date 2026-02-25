import { formatTokens } from "@/lib/helpers/format";
import { StatBlock } from "./StatBlock";

export interface TokenCostData {
  tokensUsed: number;
  totalCost: number;
  avgLatency: number;
  tokensDelta?: number;
  costDelta?: number;
  latencyDelta?: number;
}

interface TokenCostCardProps {
  data: TokenCostData;
}

export function TokenCostCard({ data }: TokenCostCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">Tokens & Cost</h3>
        <span className="text-[11px] text-muted-foreground">Last 7 days</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatBlock
          label="Tokens Used"
          value={formatTokens(data.tokensUsed, false)}
          delta={data.tokensDelta}
          positive={data.tokensDelta != null ? data.tokensDelta < 0 : undefined}
        />
        <StatBlock
          label="Total Cost"
          value={`$${data.totalCost.toFixed(2)}`}
          delta={data.costDelta}
          positive={data.costDelta != null ? data.costDelta < 0 : undefined}
        />
        <StatBlock
          label="Avg Latency"
          value={`${data.avgLatency.toFixed(2)}s`}
          delta={data.latencyDelta}
          positive={
            data.latencyDelta != null ? data.latencyDelta < 0 : undefined
          }
        />
      </div>
    </div>
  );
}
