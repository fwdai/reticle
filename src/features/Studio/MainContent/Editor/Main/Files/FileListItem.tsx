import { X } from "lucide-react";
import { getFileIcon, getFileCategory, formatSize } from "./utils";
import type { AttachedFile } from "@/contexts/StudioContext";

interface FileListItemProps {
  file: AttachedFile;
  onRemove: (id: string) => void;
}

export function FileListItem({ file, onRemove }: FileListItemProps) {
  const Icon = getFileIcon(file.type);
  const category = getFileCategory(file.type);

  return (
    <div className="flex items-center gap-3 px-5 py-3 group hover:bg-sidebar-light/30 transition-colors">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-sidebar-light text-text-muted">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-text-main">
          {file.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="rounded bg-sidebar-light px-1.5 py-0.5 text-[10px] font-semibold text-text-muted">
            {category}
          </span>
          <span className="text-[10px] text-text-muted">
            {formatSize(file.size)}
          </span>
        </div>
      </div>
      <button
        onClick={() => onRemove(file.id)}
        className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
