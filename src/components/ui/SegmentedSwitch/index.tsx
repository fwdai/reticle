import type { ReactNode } from "react";

export interface SegmentedSwitchOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

interface SegmentedSwitchProps<T extends string> {
  options: SegmentedSwitchOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "default" | "compact" | "section";
}

function SegmentedSwitch<T extends string>({
  options,
  value,
  onChange,
  size = "default",
}: SegmentedSwitchProps<T>) {
  const sizeClasses =
    size === "compact"
      ? "px-2 py-0.5 text-[10px] uppercase tracking-widest"
      : size === "section"
        ? "px-3 py-1 text-xs uppercase tracking-widest"
        : "px-4 py-1.5 text-xs";

  return (
    <div className="flex bg-gray-100 p-1 rounded-xl">
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`flex items-center gap-1 font-semibold rounded-lg transition-colors ${sizeClasses} ${
              isActive
                ? "bg-white shadow-sm text-text-main"
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

export { SegmentedSwitch };
