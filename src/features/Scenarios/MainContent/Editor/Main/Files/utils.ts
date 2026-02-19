import {
  File,
  Image,
  FileText,
  FileSpreadsheet,
  type LucideIcon,
} from "lucide-react";

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileIcon(type: string): LucideIcon {
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

export function getFileCategory(type: string) {
  if (type.startsWith("image/")) return "Image";
  if (type === "application/pdf") return "PDF";
  if (type.includes("csv")) return "CSV";
  if (type.includes("sheet") || type.includes("excel")) return "Spreadsheet";
  if (type.includes("word")) return "Document";
  if (type.startsWith("text/")) return "Text";
  return "File";
}
