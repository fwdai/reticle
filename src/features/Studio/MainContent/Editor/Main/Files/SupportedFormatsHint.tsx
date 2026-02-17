const SUPPORTED_FORMATS = [
  "PNG",
  "JPG",
  "PDF",
  "CSV",
  "XLSX",
  "DOCX",
  "TXT",
  "JSON",
];

export function SupportedFormatsHint() {
  return (
    <div className="flex flex-wrap gap-2 px-1">
      {SUPPORTED_FORMATS.map((ext) => (
        <span
          key={ext}
          className="rounded-md border border-border-light bg-sidebar-light/50 px-2 py-1 text-[10px] font-semibold tracking-wide text-text-muted"
        >
          .{ext}
        </span>
      ))}
    </div>
  );
}
