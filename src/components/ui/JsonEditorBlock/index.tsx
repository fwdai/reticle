import { cn } from "@/lib/utils";

interface JsonEditorBlockProps {
  filename: string;
  metadata?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string | null;
  minHeight?: string;
}

export function JsonEditorBlock({
  filename,
  metadata,
  value,
  onChange,
  placeholder,
  error = null,
  minHeight = "420px",
}: JsonEditorBlockProps) {
  return (
    <div className="space-y-2">
      <div className="rounded-xl overflow-hidden border border-border-light shadow-sm bg-slate-800">
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-600/50 bg-slate-800/80">
          <span className="text-[10px] font-mono text-slate-400">{filename}</span>
          {metadata && (
            <span className="text-[10px] text-slate-500">{metadata}</span>
          )}
        </div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          style={{ minHeight }}
          className={cn(
            "w-full resize-none bg-transparent p-5 font-mono text-[13px] leading-relaxed text-slate-100 focus:outline-none placeholder:text-slate-500",
            error && "caret-red-400"
          )}
          placeholder={placeholder}
        />
      </div>
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-destructive border border-red-200">
          <span className="font-semibold">Parse Error:</span> {error}
        </div>
      )}
      <p className="text-[10px] tracking-wide text-text-muted">
        EDIT THE JSON ARRAY DIRECTLY · CHANGES SYNC WHEN SWITCHING TO TABLE VIEW
      </p>
    </div>
  );
}
