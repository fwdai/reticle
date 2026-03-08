import { ArrowRight, Sparkles, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StarterTemplate {
  icon: LucideIcon;
  title: string;
  description: string;
  tags: string[];
}

interface StarterTemplatesProps {
  headline: string;
  subtitle: string;
  templates: StarterTemplate[];
  onSelect?: (index: number) => void;
}

export function StarterTemplates({
  headline,
  subtitle,
  templates,
  onSelect,
}: StarterTemplatesProps) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="mx-auto w-full max-w-3xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-primary">
              Get Started
            </span>
          </div>
          <h2 className="mb-2 text-2xl font-bold tracking-tight text-text-main">
            {headline}
          </h2>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-text-muted">
            {subtitle}
          </p>
        </div>

        {/* Template cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {templates.map((tpl, i) => (
            <button
              key={i}
              onClick={() => onSelect?.(i)}
              className={cn(
                "group relative flex flex-col rounded-2xl border border-border-light bg-white p-5 text-left transition-all duration-200",
                "hover:border-primary/30",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              )}
              style={{ boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.06)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 8px 24px -4px color-mix(in oklch, var(--primary) 28%, transparent), 0 0 0 1px color-mix(in oklch, var(--primary) 15%, transparent)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 1px 3px 0 rgb(0 0 0 / 0.06)";
              }}
            >

              {/* Icon */}
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-primary/15">
                <tpl.icon className="h-4.5 w-4.5" />
              </div>

              {/* Content */}
              <h3 className="mb-1 text-sm font-bold text-text-main">
                {tpl.title}
              </h3>
              <p className="mb-3 flex-1 text-[12.5px] leading-relaxed text-text-muted line-clamp-3">
                {tpl.description}
              </p>

              {/* Tags */}
              <div className="mb-3 flex flex-wrap gap-1.5">
                {tpl.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-border-light bg-slate-50 px-2 py-0.5 font-mono text-[10px] font-medium text-text-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* CTA */}
              <div className="flex items-center gap-1.5 text-[12px] font-semibold text-primary transition-all duration-200 group-hover:gap-2.5">
                Start with this
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
