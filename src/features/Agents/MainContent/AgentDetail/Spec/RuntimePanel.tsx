export function RuntimePanel() {
  return (
    <div className="p-5 space-y-5">
      <div>
        <h4 className="text-[10px] font-semibold tracking-widest text-text-muted uppercase mb-3">
          Scratchpad
        </h4>
        <div className="rounded-lg border border-border-light bg-white p-3 min-h-[80px]">
          <p className="text-[11px] text-text-muted/60 italic">
            Internal reasoning will appear here during runs...
          </p>
        </div>
      </div>
      <div>
        <h4 className="text-[10px] font-semibold tracking-widest text-text-muted uppercase mb-3">
          Conversation State
        </h4>
        <div className="rounded-lg border border-border-light bg-white p-3 min-h-[60px]">
          <p className="text-[11px] text-text-muted/60 italic">
            No messages yet. Run the agent to see conversation state.
          </p>
        </div>
      </div>
    </div>
  );
}
