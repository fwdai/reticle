import { useContext, useState, useCallback, useEffect } from "react";
import { User, Bot, Menu, Braces, Plus, Trash2 } from "lucide-react";
import { StudioContext } from "@/contexts/StudioContext";
import { SegmentedSwitch } from "@/components/ui/SegmentedSwitch";
import type { HistoryItem } from "@/contexts/StudioContext";

function parseHistoryJson(jsonStr: string): HistoryItem[] | null {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(
      (item): item is HistoryItem =>
        item &&
        typeof item === "object" &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string"
    );
  } catch {
    return null;
  }
}

function History() {
  const context = useContext(StudioContext);
  const [placeholderPair, setPlaceholderPair] = useState({
    user: "",
    assistant: "",
  });

  if (!context) {
    throw new Error("History must be used within a StudioProvider");
  }

  const { studioState, setStudioState } = context;
  const { history } = studioState.currentScenario;
  const { historyViewMode: viewMode, historyJsonDraft: jsonDraft } = studioState;
  const hasHistory = history.length > 0;

  const setViewMode = useCallback(
    (mode: "visual" | "json") => {
      setStudioState((prev) => ({ ...prev, historyViewMode: mode }));
    },
    [setStudioState]
  );

  const setJsonDraft = useCallback(
    (value: string) => {
      setStudioState((prev) => ({ ...prev, historyJsonDraft: value }));
    },
    [setStudioState]
  );

  useEffect(() => {
    if (hasHistory) {
      setPlaceholderPair({ user: "", assistant: "" });
    }
  }, [hasHistory]);

  const handleHistoryChange = useCallback(
    (newHistory: HistoryItem[]) => {
      setStudioState((prev) => ({
        ...prev,
        currentScenario: {
          ...prev.currentScenario,
          history: newHistory,
        },
      }));
    },
    [setStudioState]
  );

  const switchToVisual = () => {
    if (viewMode === "json") {
      const parsed = parseHistoryJson(jsonDraft);
      if (parsed !== null) {
        handleHistoryChange(parsed);
        setPlaceholderPair({ user: "", assistant: "" });
      }
    }
    setViewMode("visual");
  };

  const switchToJson = () => {
    if (viewMode === "visual") {
      const dataToSerialize =
        hasHistory || placeholderPair.user || placeholderPair.assistant
          ? hasHistory
            ? history
            : [
              { role: "user" as const, content: placeholderPair.user },
              { role: "assistant" as const, content: placeholderPair.assistant },
            ]
          : [];
      setJsonDraft(JSON.stringify(dataToSerialize, null, 2));
    }
    setViewMode("json");
  };

  const addPair = () => {
    const toAdd =
      hasHistory || placeholderPair.user || placeholderPair.assistant
        ? hasHistory
          ? [
            ...history,
            { role: "user" as const, content: "" },
            { role: "assistant" as const, content: "" },
          ]
          : [
            { role: "user" as const, content: placeholderPair.user },
            { role: "assistant" as const, content: placeholderPair.assistant },
            { role: "user" as const, content: "" },
            { role: "assistant" as const, content: "" },
          ]
        : [
          { role: "user" as const, content: "" },
          { role: "assistant" as const, content: "" },
        ];
    handleHistoryChange(toAdd);
    setPlaceholderPair({ user: "", assistant: "" });
  };

  const updateMessage = (index: number, content: string) => {
    if (!hasHistory) {
      if (index === 0) {
        setPlaceholderPair((p) => {
          const next = { ...p, user: content };
          const hasContent = content || next.assistant;
          handleHistoryChange(
            hasContent
              ? [
                { role: "user" as const, content },
                { role: "assistant" as const, content: next.assistant },
              ]
              : []
          );
          return next;
        });
      } else {
        setPlaceholderPair((p) => {
          const next = { ...p, assistant: content };
          const hasContent = content || next.user;
          handleHistoryChange(
            hasContent
              ? [
                { role: "user" as const, content: next.user },
                { role: "assistant" as const, content },
              ]
              : []
          );
          return next;
        });
      }
      return;
    }

    const newHistory = [...history];
    const role = index % 2 === 0 ? ("user" as const) : ("assistant" as const);
    while (newHistory.length <= index) {
      const fillRole =
        newHistory.length % 2 === 0 ? ("user" as const) : ("assistant" as const);
      newHistory.push({ role: fillRole, content: "" });
    }
    newHistory[index] = { role, content };
    handleHistoryChange(newHistory);
  };

  const removePair = (pairIndex: number) => {
    if (!hasHistory && pairIndex === 0) {
      setPlaceholderPair({ user: "", assistant: "" });
      return;
    }
    const userIdx = pairIndex * 2;
    const assistantIdx = pairIndex * 2 + 1;
    const newHistory = history.filter(
      (_, i) => i !== userIdx && i !== assistantIdx
    );
    handleHistoryChange(newHistory);
  };

  const pairs: { user: HistoryItem; assistant: HistoryItem; index: number }[] =
    [];
  if (!hasHistory) {
    pairs.push({
      user: { role: "user", content: placeholderPair.user },
      assistant: { role: "assistant", content: placeholderPair.assistant },
      index: 0,
    });
  } else {
    for (let i = 0; i < history.length; i += 2) {
      const user = history[i];
      const assistant = history[i + 1];
      if (user?.role === "user" && assistant?.role === "assistant") {
        pairs.push({ user, assistant, index: i });
      } else if (user?.role === "user") {
        pairs.push({
          user,
          assistant: { role: "assistant" as const, content: "" },
          index: i,
        });
      }
    }
  }

  const userCount = history.filter((h) => h.role === "user").length;
  const assistantCount = history.filter((h) => h.role === "assistant").length;

  return (
    <div className="max-w-4xl flex flex-col">
      <div className="bg-white border border-border-light rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] flex flex-col">
        <div className="h-10 px-5 border-b border-border-light bg-sidebar-light/50 flex justify-between items-center">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
            Conversation History
          </span>
          <SegmentedSwitch
            size="section"
            options={[
              { value: "visual", label: "Visual", icon: <Menu size={12} strokeWidth={2} /> },
              { value: "json", label: "Raw JSON", icon: <Braces size={12} strokeWidth={2} /> },
            ]}
            value={viewMode}
            onChange={(v) => (v === "visual" ? switchToVisual() : switchToJson())}
          />
        </div>

        <div className="p-6">
          {viewMode === "visual" ? (
            <div className="space-y-4">
              {pairs.length === 0 ? (
                <p className="text-sm text-text-muted">
                  No conversation history yet. Add a message pair to get
                  started.
                </p>
              ) : (
                pairs.map((pair, pairIndex) => (
                  <div
                    key={pairIndex}
                    className="space-y-3 p-4 rounded-xl bg-sidebar-light/30 border border-border-light"
                  >
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="flex-shrink-0 size-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User size={16} className="text-primary" />
                        </div>
                        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mt-1 block">
                          USR
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <textarea
                          value={pair.user.content}
                          onChange={(e) =>
                            updateMessage(pair.index, e.target.value)
                          }
                          placeholder="User message..."
                          className="w-full p-3 text-sm bg-white border border-border-light rounded-lg focus:ring-1 focus:ring-primary focus:border-primary resize-none min-h-[80px] text-text-main placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="flex-shrink-0 size-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot size={16} className="text-primary" />
                        </div>
                        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mt-1 block">
                          AI
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <textarea
                          value={pair.assistant.content}
                          onChange={(e) =>
                            updateMessage(pair.index + 1, e.target.value)
                          }
                          placeholder="Assistant message..."
                          className="w-full p-3 text-sm bg-white border border-border-light rounded-lg focus:ring-1 focus:ring-primary focus:border-primary resize-none min-h-[80px] text-text-main placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => removePair(pairIndex)}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={12} />
                      Remove pair
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="flex flex-col h-full min-h-[300px]">
              <textarea
                value={jsonDraft}
                onChange={(e) => setJsonDraft(e.target.value)}
                placeholder='[{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]'
                className="flex-1 min-h-[280px] p-4 text-sm font-mono bg-white border border-primary/30 rounded-xl focus:ring-1 focus:ring-primary focus:border-primary resize-none text-text-main placeholder:text-gray-400"
              />
              <div className="flex justify-between items-center mt-4">
                <p className="text-[10px] text-text-muted">
                  Paste a JSON array of{" "}
                  <span className="text-primary font-medium">
                    {"{ role, content }"}
                  </span>{" "}
                  objects
                </p>
              </div>
            </div>
          )}
        </div>
        {pairs.length > 0 && (
          <div className="px-5 py-2 border-t border-border-light bg-sidebar-light/30 flex justify-between items-center h-10">
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-text-muted uppercase">
                {hasHistory
                  ? `${history.length} MESSAGES · ${userCount} USER · ${assistantCount} ASSISTANT`
                  : "0 MESSAGES · 0 USER · 0 ASSISTANT"}
              </span>
            </div>
            {viewMode === "visual" && <button
              onClick={addPair}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-primary hover:text-primary/80 transition-colors"
            >
              <Plus size={14} strokeWidth={2} />
              ADD PAIR
            </button>}
          </div>
        )}
      </div>
    </div>
  );
}

export default History;
