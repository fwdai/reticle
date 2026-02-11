function Context() {
  return (
    <div className="max-w-4xl h-full flex flex-col">
      <div className="flex-1 bg-white border border-border-light rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] flex flex-col overflow-hidden">
        <div className="px-5 py-3 border-b border-border-light bg-sidebar-light/50 flex justify-between items-center">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
            Conversation History
          </span>
        </div>
        <div className="flex-1 p-6 bg-transparent border-none focus:ring-0 text-sm font-mono leading-relaxed resize-none text-text-main placeholder:text-gray-300">
          <p className="text-text-muted">
            Controls for how conversation history is included in the prompt.
          </p>
          {/* Add UI elements here for:
              - Toggle to include/exclude history
              - Slider/input for number of turns to include
              - Option to select a specific past conversation (if applicable)
          */}
        </div>
      </div>
    </div>
  );
}

export default Context;
