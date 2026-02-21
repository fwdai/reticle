import { useRef, useEffect, useState } from "react";

export type SaveStatus = "saved" | "saving" | "unsaved";

interface EditableTitleProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: (value: string) => void;
  /** When provided, Escape will revert to this value */
  revertValue?: string;
  placeholder?: string;
  saveStatus: SaveStatus;
  autoFocus?: boolean;
}

const MIN_WIDTH = 96;

const statusBadgeStyles: Record<SaveStatus, string> = {
  saved: "bg-green-50 text-green-600 border-green-100",
  saving: "bg-amber-50 text-amber-600 border-amber-100",
  unsaved: "bg-gray-100 text-gray-600 border-gray-100",
};

export function EditableTitle({
  value,
  onChange,
  onBlur,
  revertValue,
  placeholder = "Name...",
  saveStatus,
  autoFocus = false,
}: EditableTitleProps) {
  const mirrorRef = useRef<HTMLSpanElement>(null);
  const [inputWidth, setInputWidth] = useState(MIN_WIDTH);

  const displayText = value || placeholder;

  useEffect(() => {
    if (mirrorRef.current) {
      const w = mirrorRef.current.scrollWidth;
      setInputWidth(Math.max(MIN_WIDTH, w + 2));
    }
  }, [value, placeholder]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      if (revertValue !== undefined) {
        onChange(revertValue);
      }
      e.currentTarget.blur();
    }
  };

  const handleBlur = () => {
    const trimmed = value.trim();
    if (onBlur && (revertValue === undefined || trimmed !== revertValue)) {
      onBlur(trimmed);
    }
  };

  const statusBadge = (
    <span
      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ml-2 uppercase tracking-tight ${statusBadgeStyles[saveStatus]}`}
    >
      {saveStatus === "saved" ? "Saved" : saveStatus === "saving" ? "Saving..." : "Unsaved"}
    </span>
  );

  return (
    <div className="relative flex items-center text-sm shrink-0">
      <span
        ref={mirrorRef}
        className="pointer-events-none absolute left-0 top-0 whitespace-pre font-bold text-sm text-text-main opacity-0"
        aria-hidden
      >
        {displayText || "\u00A0"}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{ width: inputWidth }}
        className="font-bold bg-transparent border-none outline-none text-text-main placeholder:text-text-muted/40 focus:ring-0 py-0"
        autoFocus={autoFocus}
      />
      {statusBadge}
    </div>
  );
}
