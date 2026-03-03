import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ASSERTION_LABELS, type AssertionType } from "./types";

interface AssertionDropdownProps {
  value: AssertionType;
  onChange: (v: AssertionType) => void;
}

export function AssertionDropdown({ value, onChange }: AssertionDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-md border border-border-light bg-white px-2.5 py-1.5 text-[11px] font-medium text-text-main hover:border-primary/40 transition-all"
      >
        {ASSERTION_LABELS[value]}
        <ChevronDown className="h-3 w-3 text-text-muted" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-40 rounded-lg border border-border-light bg-white p-1 shadow-lg">
          {(Object.keys(ASSERTION_LABELS) as AssertionType[]).map((a) => (
            <button
              key={a}
              onClick={() => {
                onChange(a);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center rounded-md px-3 py-2 text-xs transition-colors",
                a === value
                  ? "bg-primary/15 text-primary font-medium"
                  : "text-text-main hover:bg-slate-50"
              )}
            >
              {ASSERTION_LABELS[a]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
