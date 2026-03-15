import { useState } from "react";
import { Upload } from "lucide-react";
import { openFileWithDialog } from "@/lib/evals";

interface ImportButtonProps<T> {
  parse: (content: string, filename: string) => T[];
  onImport: (items: T[]) => void;
}

export function ImportButton<T>({ parse, onImport }: ImportButtonProps<T>) {
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    const result = await openFileWithDialog([
      { name: "Dataset", extensions: ["json", "jsonl", "csv", "txt"] },
    ]);
    if (!result) return;

    const filename = result.path.split("/").pop() ?? result.path.split("\\").pop() ?? "import";
    const parsed = parse(result.content, filename);
    if (parsed.length === 0) {
      setError("No valid rows found. Expected CSV or JSONL/JSON array.");
    } else {
      setError(null);
      onImport(parsed);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {error && <span className="text-[11px] text-destructive">{error}</span>}
      <button
        onClick={handleClick}
        className="flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-primary transition-colors"
      >
        <Upload className="h-3.5 w-3.5" />
        Import JSONL / CSV
      </button>
    </div>
  );
}
