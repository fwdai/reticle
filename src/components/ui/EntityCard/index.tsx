import {
  Star,
  MoreVertical,
  Play,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type EntityStatus =
  | "ready"
  | "draft"
  | "running"
  | "error"
  | "needs-config"
  | "invalid";

const STATUS_CONFIG: Record<
  EntityStatus,
  { label: string; color: string; dotClass: string }
> = {
  ready: {
    label: "Ready",
    color: "text-success",
    dotClass: "bg-success",
  },
  draft: {
    label: "Draft",
    color: "text-text-muted",
    dotClass: "bg-text-muted",
  },
  running: {
    label: "Running",
    color: "text-primary",
    dotClass: "bg-primary",
  },
  error: {
    label: "Error",
    color: "text-destructive",
    dotClass: "bg-destructive",
  },
  "needs-config": {
    label: "Needs config",
    color: "text-warning",
    dotClass: "bg-warning",
  },
  invalid: {
    label: "Invalid",
    color: "text-destructive",
    dotClass: "bg-destructive",
  },
};

const STATUS_GLOW: Record<EntityStatus, string> = {
  ready: "0 0 8px 2px oklch(from var(--success) l c h / 0.5)",
  draft: "none",
  running: "0 0 8px 2px oklch(from var(--primary) l c h / 0.5)",
  error: "0 0 8px 2px oklch(from var(--destructive) l c h / 0.5)",
  "needs-config": "0 0 8px 2px oklch(from var(--warning) l c h / 0.5)",
  invalid: "0 0 8px 2px oklch(from var(--destructive) l c h / 0.5)",
};

const ICON_BG: Record<EntityStatus, string> = {
  ready: "bg-primary/10 group-hover:shadow-glow-sm",
  draft: "bg-muted",
  running: "bg-primary/15 shadow-glow-sm",
  error: "bg-destructive/10",
  "needs-config": "bg-warning/10",
  invalid: "bg-destructive/10",
};

const ICON_COLOR: Record<EntityStatus, string> = {
  ready: "text-primary",
  draft: "text-text-muted",
  running: "text-primary",
  error: "text-destructive",
  "needs-config": "text-warning",
  invalid: "text-destructive",
};

export interface EntityTag {
  label: string;
  icon?: LucideIcon;
  accent?: boolean;
}

export interface EntityMetric {
  label: string;
  value: string;
  highlight?: boolean;
}

export interface EntityMenuItem {
  label: string;
  icon: LucideIcon;
  destructive?: boolean;
  onClick: () => void;
}

export interface EntityCardProps {
  icon: LucideIcon;
  status: EntityStatus;
  name: string;
  description: string;
  tags?: EntityTag[];
  metrics?: EntityMetric[];
  starred?: boolean;
  onToggleStar?: (e: React.MouseEvent) => void;
  runnable?: boolean;
  onRun?: (e: React.MouseEvent) => void;
  onClick: () => void;
  menuItems?: EntityMenuItem[];
}

function StatusIndicator({ status }: { status: EntityStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      {status === "running" ? (
        <Loader2 className="h-3 w-3 animate-spin text-primary" />
      ) : (
        <span
          className={cn("h-1.5 w-1.5 rounded-full", cfg.dotClass)}
          style={{ boxShadow: STATUS_GLOW[status] }}
        />
      )}
      <span
        className={cn(
          "text-[10px] font-semibold tracking-wide uppercase",
          cfg.color
        )}
      >
        {cfg.label}
      </span>
    </div>
  );
}

export function EntityCard({
  icon: Icon,
  status,
  name,
  description,
  tags = [],
  metrics = [],
  starred,
  onToggleStar,
  runnable = false,
  onRun,
  onClick,
  menuItems = [],
}: EntityCardProps) {
  const regularItems = menuItems.filter((i) => !i.destructive);
  const destructiveItems = menuItems.filter((i) => i.destructive);

  return (
    <div
      onClick={onClick}
      className="group relative rounded-xl border border-border-light bg-white cursor-pointer select-none overflow-hidden transition-all duration-200 hover:shadow-sm"
    >
      {status === "running" && (
        <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden">
          <div
            className="h-full w-1/3 animate-flow-horizontal rounded-full"
            style={{
              position: "absolute",
              background: `linear-gradient(90deg, transparent, var(--primary), transparent)`,
            }}
          />
        </div>
      )}

      <div className="flex items-center px-4 py-3 gap-4">
        {/* Icon with star overlay */}
        <div className="relative flex-shrink-0">
          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-lg transition-all duration-300",
              ICON_BG[status]
            )}
          >
            <Icon className={cn("h-5 w-5", ICON_COLOR[status])} />
          </div>
          {onToggleStar && (
            <button
              className={cn(
                "absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white transition-all",
                starred
                  ? "text-warning opacity-100"
                  : "text-text-muted opacity-0 group-hover:opacity-50 hover:!opacity-100"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onToggleStar(e);
              }}
            >
              <Star
                className={cn("h-2.5 w-2.5", starred && "fill-current")}
              />
            </button>
          )}
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="text-[13px] font-bold text-text-main truncate flex-shrink-0 max-w-[40%]">
              {name}
            </h3>
            <StatusIndicator status={status} />
            <span className="text-[11px] text-text-muted/50 truncate hidden sm:inline">
              — {description}
            </span>
          </div>

          {tags.length > 0 && (
            <div className="flex items-center gap-3">
              {tags.map((tag, i) =>
                i === 0 && !tag.icon ? (
                  <span
                    key={i}
                    className="inline-flex items-center rounded-md border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary"
                  >
                    {tag.label}
                  </span>
                ) : (
                  <span
                    key={i}
                    className={cn(
                      "inline-flex items-center gap-1 text-[11px]",
                      tag.accent ? "text-primary/80" : "text-text-muted"
                    )}
                  >
                    {tag.icon && <tag.icon className="h-3 w-3" />}
                    {tag.label}
                  </span>
                )
              )}
            </div>
          )}
        </div>

        {/* Metrics */}
        {metrics.length > 0 && (
          <div className="hidden lg:flex items-center gap-5 flex-shrink-0 border-l border-border-light pl-5">
            {metrics.map((m, i) => (
              <div key={i} className="flex flex-col items-end gap-0.5">
                <span className="text-[10px] text-text-muted uppercase tracking-wide">
                  {m.label}
                </span>
                <span
                  className={cn(
                    "text-xs font-mono",
                    m.highlight ? "text-primary" : "text-text-main"
                  )}
                >
                  {m.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {runnable && onRun && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-text-muted hover:text-primary"
              onClick={(e) => {
                e.stopPropagation();
                onRun(e);
              }}
            >
              <Play className="h-3.5 w-3.5" />
            </Button>
          )}
          {menuItems.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-text-muted hover:text-text-main"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {regularItems.map((item, i) => (
                  <DropdownMenuItem
                    key={i}
                    className="gap-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      item.onClick();
                    }}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </DropdownMenuItem>
                ))}
                {destructiveItems.length > 0 &&
                  regularItems.length > 0 && <DropdownMenuSeparator />}
                {destructiveItems.map((item, i) => (
                  <DropdownMenuItem
                    key={i}
                    className="gap-2 text-xs text-destructive focus:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      item.onClick();
                    }}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
}
