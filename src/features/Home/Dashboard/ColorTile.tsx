import type { LucideIcon } from "lucide-react";

interface ColorTileProps {
  palette: { bg: string; label: string };
  label: string;
  value: number;
  icon: LucideIcon;
  subtitle?: string;
  onClick?: () => void;
}

export function ColorTile({
  palette,
  label,
  value,
  icon: Icon,
  subtitle,
  onClick,
}: ColorTileProps) {
  const content = (
    <div
      className="relative overflow-hidden rounded-2xl p-6 transition-transform duration-200 hover:scale-[1.02]"
      style={{ background: `hsl(${palette.bg})` }}
    >
      <div className="flex items-center justify-between">
        <div>
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: `hsl(${palette.label})` }}
          >
            {label}
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className="font-mono text-4xl font-bold"
              style={{ color: `hsl(${palette.label})` }}
            >
              {value}
            </span>
            {subtitle && (
              <span
                className="text-xs font-medium"
                style={{ color: `hsl(${palette.label} / 0.7)` }}
              >
                {subtitle}
              </span>
            )}
          </div>
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: `hsl(${palette.label} / 0.15)` }}
        >
          <Icon className="h-5 w-5" style={{ color: `hsl(${palette.label})` }} />
        </div>
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="text-left w-full">
        {content}
      </button>
    );
  }
  return content;
}
