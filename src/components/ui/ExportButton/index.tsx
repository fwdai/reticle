import { useState, useRef } from "react";
import { Download, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { downloadFile } from "@/lib/evals";

interface ExportFormat {
  label: string;
  extension: string;
  mimeType: string;
  serialize: () => string;
}

interface ExportButtonProps {
  filename: string;
  formats: ExportFormat[];
  disabled?: boolean;
}

export function ExportButton({ filename, formats, disabled = false }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleExport = (fmt: ExportFormat) => {
    downloadFile(`${filename}.${fmt.extension}`, fmt.serialize(), fmt.mimeType);
    setOpen(false);
  };

  if (formats.length === 1) {
    return (
      <button
        disabled={disabled}
        onClick={() => handleExport(formats[0])}
        className="flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-primary transition-colors disabled:opacity-40 disabled:pointer-events-none"
      >
        <Download className="h-3.5 w-3.5" />
        Export
      </button>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-primary transition-colors disabled:opacity-40 disabled:pointer-events-none"
      >
        <Download className="h-3.5 w-3.5" />
        Export
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1.5 min-w-[120px] rounded-lg border border-border-light bg-white py-1 shadow-md">
            {formats.map((fmt) => (
              <button
                key={fmt.extension}
                onClick={() => handleExport(fmt)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-text-main hover:bg-slate-50 transition-colors"
              >
                {fmt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
