interface PromptTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  textareaClassName?: string;
  contentClassName?: string;
  showCounters?: boolean;
}

export function PromptTextarea({
  value,
  onChange,
  placeholder = "Type your prompt here...",
  minHeight = "240px",
  textareaClassName = "",
  contentClassName = "p-5",
  showCounters = true,
}: PromptTextareaProps) {
  const characterCount = value.length;
  const estimatedTokenCount = Math.round(characterCount / 4);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className={`flex-1 min-h-0 ${contentClassName}`}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ minHeight }}
          className={`w-full resize-none border-0 bg-transparent text-sm leading-relaxed focus:outline-none focus:ring-0 placeholder:text-text-muted/40 ${textareaClassName}`}
        />
      </div>
      {showCounters && (
        <div className="flex-shrink-0 px-5 py-2 border-t border-border-light bg-sidebar-light/30 flex justify-end items-center h-10">
          <span className="text-[9px] text-text-muted uppercase">
            <span className="font-medium">{characterCount}</span> CHARACTERS • ~
            <span className="font-medium">{estimatedTokenCount}</span> TOKENS
            (approx.)
          </span>
        </div>
      )}
    </div>
  );
}
