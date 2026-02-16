import { useContext, useState, useRef, useCallback } from "react";
import {
  Upload,
  File,
  X,
  Image,
  FileText,
  FileSpreadsheet,
  Paperclip,
  HardDrive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StudioContext } from "@/contexts/StudioContext";
import type { AttachedFile } from "@/contexts/StudioContext";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return Image;
  if (type === "application/pdf" || type.includes("word")) return FileText;
  if (
    type.includes("sheet") ||
    type.includes("csv") ||
    type.includes("excel")
  )
    return FileSpreadsheet;
  return File;
}

function getFileCategory(type: string) {
  if (type.startsWith("image/")) return "Image";
  if (type === "application/pdf") return "PDF";
  if (type.includes("csv")) return "CSV";
  if (type.includes("sheet") || type.includes("excel")) return "Spreadsheet";
  if (type.includes("word")) return "Document";
  if (type.startsWith("text/")) return "Text";
  return "File";
}

function Files() {
  const context = useContext(StudioContext);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  if (!context) {
    throw new Error("Files must be used within a StudioProvider");
  }

  const { studioState, setStudioState } = context;
  const files = studioState.currentScenario.attachments ?? [];

  const setFiles = useCallback(
    (newFiles: AttachedFile[] | ((prev: AttachedFile[]) => AttachedFile[])) => {
      setStudioState((prev) => ({
        ...prev,
        currentScenario: {
          ...prev.currentScenario,
          attachments:
            typeof newFiles === "function"
              ? newFiles(prev.currentScenario.attachments ?? [])
              : newFiles,
        },
      }));
    },
    [setStudioState]
  );

  const addFiles = useCallback(
    (fileList: FileList) => {
      const newFiles: AttachedFile[] = Array.from(fileList).map((f) => ({
        id: crypto.randomUUID(),
        name: f.name,
        size: f.size,
        type: f.type || "application/octet-stream",
      }));
      setFiles((prev) => [...prev, ...newFiles]);
    },
    [setFiles]
  );

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleFilesChange = (newFiles: AttachedFile[]) => {
    setFiles(newFiles);
  };

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
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="max-w-4xl flex flex-col space-y-5 mx-auto">
      {/* Drop Zone */}
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
              if (e.target.files?.length) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
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
                onClick={() => handleFilesChange([])}
                className="text-[10px] font-semibold text-text-muted hover:text-red-500 transition-colors tracking-wide"
              >
                CLEAR ALL
              </button>
            </div>
          </div>
          <div className="divide-y divide-border-light">
            {files.map((file) => {
              const Icon = getFileIcon(file.type);
              const category = getFileCategory(file.type);
              return (
                <div
                  key={file.id}
                  className="flex items-center gap-3 px-5 py-3 group hover:bg-sidebar-light/30 transition-colors"
                >
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
                    onClick={() => removeFile(file.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Supported formats hint */}
      <div className="flex flex-wrap gap-2 px-1">
        {["PNG", "JPG", "PDF", "CSV", "XLSX", "DOCX", "TXT", "JSON"].map(
          (ext) => (
            <span
              key={ext}
              className="rounded-md border border-border-light bg-sidebar-light/50 px-2 py-1 text-[10px] font-semibold tracking-wide text-text-muted"
            >
              .{ext}
            </span>
          )
        )}
      </div>
    </div>
  );
}

export default Files;
