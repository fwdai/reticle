import type { ReactNode } from "react";
import { AlignLeft, Code } from "lucide-react";
import { SegmentedSwitch } from "@/components/ui/SegmentedSwitch";

interface EvalEditToolbarProps {
  viewMode: "table" | "json";
  onSwitchToTable: () => void;
  onSwitchToJson: () => void;
  children?: ReactNode;
}

export function EvalEditToolbar({
  viewMode,
  onSwitchToTable,
  onSwitchToJson,
  children,
}: EvalEditToolbarProps) {
  return (
    <div className="flex items-center justify-between">
      <SegmentedSwitch<"table" | "json">
        variant="secondary"
        options={[
          { value: "table", label: "TABLE", icon: <AlignLeft className="h-3 w-3" /> },
          { value: "json", label: "JSON", icon: <Code className="h-3 w-3" /> },
        ]}
        value={viewMode}
        onChange={(v) => (v === "table" ? onSwitchToTable() : onSwitchToJson())}
      />
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
