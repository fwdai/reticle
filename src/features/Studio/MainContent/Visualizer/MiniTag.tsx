import { cn } from "@/lib/utils";

interface MiniTagProps {
  children: React.ReactNode;
  variant?: "default" | "accent" | "muted";
}

export function MiniTag({ children, variant = "default" }: MiniTagProps) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide",
      variant === "default" && "bg-muted text-muted-foreground",
      variant === "accent" && "bg-accent/10 text-accent",
      variant === "muted" && "bg-muted/50 text-muted-foreground/60",
    )}>
      {children}
    </span>
  );
}
