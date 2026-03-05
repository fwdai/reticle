import { Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { SaveStatus } from "@/components/ui/EditableTitle";

interface SaveIndicatorProps {
  status: SaveStatus;
  /** How long (ms) the check icon stays visible after "saved" before fading out */
  fadeDelay?: number;
}

export function SaveIndicator({ status, fadeDelay = 2000 }: SaveIndicatorProps) {
  const [showCheck, setShowCheck] = useState(false);

  useEffect(() => {
    if (status === "saved") {
      setShowCheck(true);
      const timer = setTimeout(() => setShowCheck(false), fadeDelay);
      return () => clearTimeout(timer);
    }
    setShowCheck(false);
  }, [status, fadeDelay]);

  if (status === "saving") {
    return <Loader2 className="h-3 w-3 text-text-muted animate-spin" />;
  }

  if (showCheck) {
    return (
      <Check className="h-3 w-3 text-green-500 animate-in fade-in duration-200" />
    );
  }

  return null;
}
