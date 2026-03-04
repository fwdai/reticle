import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface FlowNodeProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  status?: "active" | "idle" | "success" | "error" | "pending";
  children?: ReactNode;
  className?: string;
  glowing?: boolean;
  onClick?: () => void;
}

export function FlowNode({ icon: Icon, title, subtitle, status = "idle", children, className, glowing, onClick }: FlowNodeProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative rounded-xl border bg-card p-4 transition-all duration-300 cursor-pointer select-none",
        "hover:border-primary/40 hover:shadow-glow-sm",
        status === "active" && "border-primary/50 shadow-glow-sm",
        status === "success" && "border-primary/40 shadow-glow-sm",
        status === "error" && "border-destructive/40",
        status === "idle" && "border-border",
        status === "pending" && "border-border opacity-60",
        glowing && "animate-pulse-glow",
        className
      )}
    >
      {/* Status indicator */}
      <div className="absolute -top-1.5 -right-1.5">
        <div className={cn(
          "h-3 w-3 rounded-full border-2 border-card",
          status === "active" && "bg-primary",
          status === "success" && "bg-primary",
          status === "error" && "bg-destructive",
          status === "idle" && "bg-muted-foreground/30",
          status === "pending" && "bg-muted-foreground/20",
        )} />
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
          status === "active" && "bg-primary/15 text-primary",
          status === "success" && "bg-primary/15 text-primary",
          status === "error" && "bg-destructive/15 text-destructive",
          status === "idle" && "bg-muted text-text-muted",
          status === "pending" && "bg-muted text-text-muted opacity-50",
        )}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-xs font-semibold tracking-wide text-foreground">{title}</div>
          {subtitle && <div className="text-[10px] text-text-muted">{subtitle}</div>}
        </div>
      </div>

      {/* Content */}
      {children && (
        <div className="mt-3 border-t border-border pt-3">
          {children}
        </div>
      )}
    </div>
  );
}

interface FlowConnectorProps {
  direction?: "horizontal" | "vertical";
  animated?: boolean;
  status?: "active" | "idle" | "success";
  label?: string;
  length?: "short" | "medium" | "long";
  /** When true, arrow points toward the start (e.g. left for horizontal) instead of the end */
  reversed?: boolean;
}

export function FlowConnector({ direction = "horizontal", animated, status = "idle", label, length = "medium", reversed = false }: FlowConnectorProps) {
  const isH = direction === "horizontal";
  const lengthClass = length === "short" ? (isH ? "w-12" : "h-12") : length === "long" ? (isH ? "w-24" : "h-24") : (isH ? "w-16" : "h-16");

  return (
    <div className={cn(
      "relative flex items-center justify-center flex-shrink-0",
      isH ? "flex-row" : "flex-col",
      reversed && (isH ? "flex-row-reverse" : "flex-col-reverse"),
      lengthClass
    )}>
      {/* Line */}
      <div className={cn(
        "relative",
        isH ? "h-px w-full" : "w-px h-full",
        status === "active" && "bg-primary/40",
        status === "success" && "bg-primary/40",
        status === "idle" && "bg-muted-foreground/30",
      )}>
        {/* Animated pulse */}
        {animated && (
          <div className={cn(
            "absolute rounded-full",
            isH
              ? reversed
                ? "h-1.5 w-1.5 -top-[2.5px] animate-flow-horizontal-reversed"
                : "h-1.5 w-1.5 left-0 -top-[2.5px] animate-flow-horizontal"
              : reversed
                ? "h-1.5 w-1.5 -left-[2.5px] animate-flow-vertical-reversed"
                : "h-1.5 w-1.5 top-0 -left-[2.5px] animate-flow-vertical",
            status === "active" && "bg-primary shadow-glow-sm",
            status === "success" && "bg-primary shadow-glow-sm",
            status === "idle" && "bg-muted-foreground",
          )} />
        )}
      </div>

      {/* Arrow */}
      <div className={cn(
        "flex-shrink-0",
        isH ? "-ml-px" : "-mt-px",
        reversed && (isH ? "ml-0 -mr-px" : "mt-0 -mb-px"),
      )}>
        {isH ? (
          <svg width="6" height="10" viewBox="0 0 6 10" className={cn(
            status === "active" && "text-primary/60",
            status === "success" && "text-primary/60",
            status === "idle" && "text-muted-foreground/60",
            reversed && "rotate-180",
          )}>
            <path d="M1 1L5 5L1 9" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="10" height="6" viewBox="0 0 10 6" className={cn(
            status === "active" && "text-primary/60",
            status === "success" && "text-primary/60",
            status === "idle" && "text-muted-foreground/60",
            reversed && "rotate-180",
          )}>
            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* Label */}
      {label && (
        <div className={cn(
          "absolute text-[9px] font-medium tracking-wider uppercase text-text-muted",
          isH ? "-top-4" : "left-4 top-1/2 -translate-y-1/2"
        )}>
          {label}
        </div>
      )}
    </div>
  );
}
