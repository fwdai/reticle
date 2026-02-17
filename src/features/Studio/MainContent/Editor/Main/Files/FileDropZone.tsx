import { useState, useRef } from "react";
import { Upload, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileDropZoneProps {
  onFilesAdded: (fileList: FileList) => void;
}

export function FileDropZone({ onFilesAdded }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    if (e.dataTransfer.files.length) onFilesAdded(e.dataTransfer.files);
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "bg-white border rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] overflow-hidden transition-all duration-200",
        isDragging
          ? "border-primary ring-2 ring-primary/30"
          : "border-border-light"
      )}
    >
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-4 p-10 text-center transition-colors",
          isDragging ? "bg-primary/5" : "bg-transparent"
        )}
      >
        <div
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-200",
            isDragging
              ? "bg-primary/15 text-primary scale-110"
              : "bg-sidebar-light text-text-muted"
          )}
        >
          <Upload className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-semibold text-text-main">
            {isDragging ? "Drop files here" : "Drag & drop files"}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Images, PDFs, CSVs, documents — any file for LLM analysis
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2 font-medium border-border-light hover:bg-sidebar-light"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip className="h-3.5 w-3.5" />
          Add File
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) onFilesAdded(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
