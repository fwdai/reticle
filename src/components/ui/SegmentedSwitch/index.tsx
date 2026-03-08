import type { ReactNode } from "react";

export interface SegmentedSwitchOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

type SegmentedSwitchVariant = "default" | "secondary";

interface SegmentedSwitchProps<T extends string> {
  options: SegmentedSwitchOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "default" | "compact" | "section";
  variant?: SegmentedSwitchVariant;
}

function SegmentedSwitch<T extends string>({
  options,
  value,
  onChange,
  size = "default",
  variant = "default",
}: SegmentedSwitchProps<T>) {
  const sizeClasses =
    size === "compact"
      ? "px-2 py-0.5 text-[10px] uppercase tracking-widest"
      : size === "section"
        ? "px-3 py-1 text-xs uppercase tracking-widest"
        : "px-4 py-1.5 text-xs";

  const isSecondary = variant === "secondary";
  const containerClasses = isSecondary
    ? "flex items-center rounded-lg border border-border-light bg-white p-0.5"
    : "flex bg-gray-100 p-1 rounded-xl";
  const buttonSizeClasses = isSecondary ? "gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-semibold tracking-wide" : `gap-1 font-semibold rounded-lg ${sizeClasses}`;
  const activeClasses = isSecondary
    ? "bg-primary/15 text-primary shadow-sm"
    : "bg-white shadow-sm text-text-main";

  return (
    <div className={containerClasses}>
      {options.map((option) => {
        const isActive = value === option.value;
        const isDisabled = option.disabled;
        return (
          <button
            key={option.value}
            type="button"
            disabled={isDisabled}
            onClick={() => !isDisabled && onChange(option.value)}
            className={`flex items-center transition-all ${buttonSizeClasses} ${
              isDisabled
                ? "cursor-not-allowed opacity-50"
                : isActive
                  ? activeClasses
                  : "text-text-muted hover:text-text-main"
            }`}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export type { SegmentedSwitchVariant };
export { SegmentedSwitch };
