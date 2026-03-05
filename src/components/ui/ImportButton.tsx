import { useRef, useState } from "react";
import { Upload } from "lucide-react";

interface ImportButtonProps<T> {
  parse: (content: string, filename: string) => T[];
  onImport: (items: T[]) => void;
  accept?: string;
}

export function ImportButton<T>({
  parse,
  onImport,
  accept = ".jsonl,.csv,.json,.txt",
}: ImportButtonProps<T>) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = parse(content, file.name);
      if (parsed.length === 0) {
        setError("No valid rows found. Expected CSV or JSONL/JSON array.");
      } else {
        setError(null);
        onImport(parsed);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="flex items-center gap-3">
      {error && <span className="text-[11px] text-destructive">{error}</span>}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-primary transition-colors"
      >
        <Upload className="h-3.5 w-3.5" />
        Import JSONL / CSV
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
