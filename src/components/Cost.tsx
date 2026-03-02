import { Info } from "lucide-react";
import { formatCost } from "@/lib/helpers/format";
import { calculateRequestCost } from "@/lib/modelPricing";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CostProps {
  provider?: string;
  model?: string;
  inputTokens: number;
  outputTokens: number;
}

export default function Cost({ provider, model, inputTokens, outputTokens }: CostProps) {

  const totalCost = provider && model
    ? calculateRequestCost(provider, model, { inputTokens, outputTokens })
    : 0;

  return (
    <div className="flex flex-col">
      <span className="text-[8px] uppercase font-bold text-text-muted leading-none mb-1">
        Cost
      </span>
      <div className="flex items-center gap-1">
        <span className="text-[11px] font-bold text-text-main leading-none">
          {formatCost(totalCost)}
        </span>
        {totalCost != null && totalCost > 0 && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-text-muted/60 hover:text-text-muted cursor-help flex-shrink-0" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[200px]">
                <p>Approximated cost based on token usage and model pricing. It is an estimate, not an exact value charged by the provider.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}
