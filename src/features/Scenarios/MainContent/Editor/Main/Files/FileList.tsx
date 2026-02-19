import { HardDrive } from "lucide-react";
import { formatSize } from "./utils";
import { FileListItem } from "./FileListItem";
import type { AttachedFile } from "@/contexts/StudioContext";

interface FileListProps {
  files: AttachedFile[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
}

export function FileList({ files, onRemove, onClearAll }: FileListProps) {
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="bg-white border border-border-light rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] flex flex-col">
      <div className="h-10 px-5 border-b border-border-light bg-sidebar-light/50 flex justify-between items-center">
        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
          Attached Files
          <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
            {files.length}
          </span>
        </span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[10px] text-text-muted">
            <HardDrive className="h-3 w-3" />
            {formatSize(totalSize)} total
          </span>
          <button
            onClick={onClearAll}
            className="text-[10px] font-semibold text-text-muted hover:text-red-500 transition-colors tracking-wide"
          >
            CLEAR ALL
          </button>
        </div>
      </div>
      <div className="divide-y divide-border-light">
        {files.map((file) => (
          <FileListItem key={file.id} file={file} onRemove={onRemove} />
        ))}
      </div>
    </div>
  );
}
