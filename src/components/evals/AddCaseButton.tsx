import { Plus } from "lucide-react";

interface AddCaseButtonProps {
  onClick: () => void;
  label?: string;
}

export function AddCaseButton({ onClick, label = "Add Test Case" }: AddCaseButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-2.5 text-xs font-semibold text-text-muted hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all bg-transparent"
    >
      <Plus className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
