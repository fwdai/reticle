import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyButtonProps {
  text: string;
  className?: string;
  iconSize?: number;
  showLabel?: boolean;
}

const COPIED_DURATION_MS = 2000;

function CopyButton({
  text,
  className = "text-[10px] font-bold text-text-muted hover:text-primary transition-colors flex items-center gap-1",
  iconSize = 14,
  showLabel = true,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleClick = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), COPIED_DURATION_MS);
  };

  if (!text) return null;

  return (
    <button onClick={handleClick} className={className}>
      {copied ? (
        <>
          <Check size={iconSize} className="text-green-500" />
          {showLabel && "COPIED"}
        </>
      ) : (
        <>
          <Copy size={iconSize} />
          {showLabel && "COPY"}
        </>
      )}
    </button>
  );
}

export { CopyButton };
