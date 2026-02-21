import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

export function SearchField({
  value,
  onChange,
  placeholder = "Search...",
  className,
  inputClassName,
}: SearchFieldProps) {
  return (
    <div className={cn("relative flex-1 sm:flex-none min-w-0", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted size-4" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "pl-10 pr-10 py-2 bg-slate-50 border border-border-light rounded-xl text-sm w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all",
          inputClassName
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main cursor-pointer"
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
