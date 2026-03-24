import { useState, useCallback, useContext } from "react";
import {
  Plus,
  X,
  Play,
  Copy,
  Clock,
  DollarSign,
  Hash,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Columns2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PROVIDERS_LIST } from "@/constants/providers";
import { StudioContext } from "@/contexts/StudioContext";
import { streamText } from "@/lib/gateway";
import { calculateRequestCost } from "@/lib/modelPricing";
import { insertExecution, updateExecution, listToolsForEntity } from "@/lib/storage";
import { evaluateAssertion } from "./helpers";
import type { Execution } from "@/types";
import type { TestCase } from "./types";

interface ModelSlot {
  id: string;
  provider: string;
  model: string;
}

type SlotStatus = "idle" | "running" | "done" | "error";

interface SlotResult {
  text: string;
  displayedText: string;
  latency: number;
  tokens: number;
  cost: number;
  status: SlotStatus;
  pass?: boolean;
}

/** Build provider/model options from context or fallback to defaults */
function buildProviderModelOptions(
  providerModels: Record<string, Array<{ id?: string; name?: string }>>
): Record<string, { label: string; models: { value: string; label: string }[] }> {
  const result: Record<string, { label: string; models: { value: string; label: string }[] }> = {};

  for (const provider of PROVIDERS_LIST) {
    const models = providerModels[provider.id] ?? [];
    const validModels = models
      .filter((m): m is { id: string; name: string } => Boolean(m?.id && m?.name))
      .map((m) => ({ value: m.id, label: m.name }));
    if (validModels.length > 0) {
      result[provider.id] = {
        label: provider.name,
        models: validModels,
      };
    }
  }

  // Fallback when providerModels is empty (e.g. before API keys configured)
  if (Object.keys(result).length === 0) {
    return {
      openai: {
        label: "OpenAI",
        models: [
          { value: "gpt-4o", label: "gpt-4o" },
          { value: "gpt-4-turbo", label: "gpt-4-turbo" },
          { value: "gpt-3.5-turbo", label: "gpt-3.5-turbo" },
        ],
      },
      anthropic: {
        label: "Anthropic",
        models: [
          { value: "claude-3-5-sonnet", label: "claude-3.5-sonnet" },
          { value: "claude-3-opus", label: "claude-3-opus" },
          { value: "claude-3-haiku", label: "claude-3-haiku" },
        ],
      },
      google: {
        label: "Google",
        models: [
          { value: "gemini-1.5-pro", label: "gemini-1.5-pro" },
          { value: "gemini-1.5-flash", label: "gemini-1.5-flash" },
        ],
      },
    };
  }

  return result;
}

const COLUMN_COLORS = [
  { border: "border-l-primary", dot: "bg-primary", text: "text-primary" },
  { border: "border-l-[hsl(280,60%,55%)]", dot: "bg-[hsl(280,60%,55%)]", text: "text-[hsl(280,60%,55%)]" },
  { border: "border-l-[hsl(38,92%,50%)]", dot: "bg-[hsl(38,92%,50%)]", text: "text-[hsl(38,92%,50%)]" },
  { border: "border-l-[hsl(340,65%,55%)]", dot: "bg-[hsl(340,65%,55%)]", text: "text-[hsl(340,65%,55%)]" },
];


function generateId() {
  return Math.random().toString(36).slice(2, 8);
}

interface ModelsCompareProps {
  cases: TestCase[];
  providerModels: Record<string, Array<{ id?: string; name?: string }>>;
}

export function ModelsCompare({ cases, providerModels }: ModelsCompareProps) {
  const context = useContext(StudioContext);
  const { currentScenario, scenarioId } = context?.studioState ?? {};

  const PROVIDERS = buildProviderModelOptions(providerModels);
  const providerIds = Object.keys(PROVIDERS);

  const [slots, setSlots] = useState<ModelSlot[]>(() => {
    const first = providerIds[0];
    const second = providerIds[1] ?? first;
    return [
      { id: generateId(), provider: first, model: PROVIDERS[first].models[0]?.value ?? "" },
      { id: generateId(), provider: second, model: PROVIDERS[second].models[0]?.value ?? "" },
    ].filter((s) => s.model);
  });

  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(
    cases[0]?.id ?? null
  );
  const [results, setResults] = useState<Record<string, SlotResult>>({});
  const [isRunning, setIsRunning] = useState(false);

  // Fall back to scenario's current user prompt when no test cases exist
  const selectedCase = cases.find((c) => c.id === selectedCaseId) ?? cases[0] ?? {
    id: "current",
    inputs: { input: currentScenario?.userPrompt ?? "" },
    expected: "",
    assertion: "contains" as const,
  };

  const addSlot = () => {
    if (slots.length >= 4) return;
    const usedCombos = new Set(slots.map((s) => `${s.provider}/${s.model}`));
    let newProvider = providerIds[0];
    let newModel = PROVIDERS[newProvider]?.models[0]?.value ?? "";
    for (const p of providerIds) {
      for (const m of PROVIDERS[p].models) {
        if (!usedCombos.has(`${p}/${m.value}`)) {
          newProvider = p;
          newModel = m.value;
          break;
        }
      }
    }
    setSlots([...slots, { id: generateId(), provider: newProvider, model: newModel }]);
  };

  const removeSlot = (id: string) => {
    if (slots.length <= 2) return;
    setSlots(slots.filter((s) => s.id !== id));
    setResults((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const updateSlot = (id: string, field: "provider" | "model", value: string) => {
    setSlots(
      slots.map((s) => {
        if (s.id !== id) return s;
        if (field === "provider") {
          return {
            ...s,
            provider: value,
            model: PROVIDERS[value]?.models[0]?.value ?? "",
          };
        }
        return { ...s, [field]: value };
      })
    );
  };

  const runAll = useCallback(async () => {
    if (!scenarioId || !currentScenario) return;

    setIsRunning(true);
    // Reset all slots to running state immediately
    setResults(Object.fromEntries(
      slots.map((s) => [s.id, { text: "", displayedText: "", latency: 0, tokens: 0, cost: 0, status: "running" as SlotStatus }])
    ));

    const allTools = await listToolsForEntity(scenarioId, "scenario");

    await Promise.all(slots.map(async (slot) => {
      const startedMs = Date.now();
      const config = {
        ...currentScenario.configuration,
        provider: slot.provider,
        model: slot.model,
      };
      const snapshot_json = JSON.stringify({
        name: currentScenario.name,
        systemPrompt: currentScenario.systemPrompt,
        userPrompt: selectedCase.inputs.input,
        configuration: config,
        tools: allTools,
        attachments: currentScenario.attachments,
      });

      const executionId = await insertExecution({
        type: "scenario",
        runnable_id: scenarioId,
        snapshot_json,
        input_json: JSON.stringify(selectedCase.inputs),
        status: "running",
        started_at: startedMs,
      });

      try {
        const result = await streamText(
          selectedCase.inputs.input,
          currentScenario.systemPrompt,
          currentScenario.history,
          {
            provider: slot.provider,
            model: slot.model,
            systemPrompt: currentScenario.systemPrompt,
            temperature: currentScenario.configuration.temperature,
            maxTokens: currentScenario.configuration.maxTokens,
          },
          allTools,
          currentScenario.attachments,
        );

        let accumulatedText = "";
        for await (const chunk of result.textStream) {
          accumulatedText += chunk;
          setResults((prev) => ({
            ...prev,
            [slot.id]: { ...prev[slot.id], displayedText: accumulatedText },
          }));
        }

        const [finalText, usage] = await Promise.all([result.text, result.totalUsage]);
        const endedMs = Date.now();
        const latencyMs = result.latency ?? (endedMs - startedMs);
        const tokens = usage?.totalTokens ?? 0;
        const pass = selectedCase.expected
          ? evaluateAssertion(selectedCase.assertion, finalText, selectedCase.expected)
          : undefined;

        const usageWithCached = usage as
          | { inputTokens?: number; outputTokens?: number; cachedTokens?: number }
          | undefined;
        const cost =
          calculateRequestCost(slot.provider, slot.model, {
            inputTokens: usageWithCached?.inputTokens ?? 0,
            outputTokens: usageWithCached?.outputTokens ?? 0,
            cachedTokens: usageWithCached?.cachedTokens,
          }) ?? 0;

        setResults((prev) => ({
          ...prev,
          [slot.id]: {
            text: finalText,
            displayedText: finalText,
            latency: +(latencyMs / 1000).toFixed(2),
            tokens,
            cost,
            status: "done",
            pass,
          },
        }));

        const finalExecution: Execution = {
          type: "scenario",
          runnable_id: scenarioId,
          snapshot_json,
          input_json: JSON.stringify(selectedCase.inputs),
          result_json: JSON.stringify({ text: finalText, usage }),
          status: "succeeded",
          started_at: startedMs,
          ended_at: endedMs,
          usage_json: JSON.stringify({ ...usage, latency_ms: latencyMs }),
        };
        await updateExecution(executionId, finalExecution);

      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : "unknown";
        const endedMs = Date.now();

        setResults((prev) => ({
          ...prev,
          [slot.id]: {
            ...prev[slot.id],
            text: `Error: ${errorMsg}`,
            displayedText: `Error: ${errorMsg}`,
            status: "error",
          },
        }));

        const failedExecution: Execution = {
          type: "scenario",
          runnable_id: scenarioId,
          snapshot_json,
          input_json: JSON.stringify(selectedCase.inputs),
          status: "failed",
          started_at: startedMs,
          ended_at: endedMs,
          error_json: JSON.stringify({ message: errorMsg }),
        };
        await updateExecution(executionId, failedExecution);
      }
    }));

    setIsRunning(false);
  }, [slots, selectedCase, currentScenario, scenarioId]);

  const resetAll = () => {
    setResults({});
    setIsRunning(false);
  };

  const allDone = slots.every((s) => results[s.id]?.status === "done");
  const hasResults = Object.keys(results).length > 0;

  const bestLatency =
    allDone ? Math.min(...slots.map((s) => results[s.id]?.latency ?? Infinity)) : null;
  const bestCost =
    allDone ? Math.min(...slots.map((s) => results[s.id]?.cost ?? Infinity)) : null;

  return (
    <div className="flex flex-1 flex-col overflow-hidden h-full">
      {/* Test case selector + model slots bar */}
      <div className="flex flex-col gap-3 border-b border-border-light bg-slate-50 px-5 py-3">
        {/* Test case selector */}
        {cases.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
              Test Case
            </span>
            <Select
              value={selectedCaseId ?? ""}
              onValueChange={(v) => setSelectedCaseId(v)}
            >
              <SelectTrigger className="h-8 w-[280px] border-border-light text-xs">
                <SelectValue
                  placeholder={
                    selectedCase
                      ? (selectedCase.inputs.input || "Empty input").slice(0, 50) + (selectedCase.inputs.input?.length > 50 ? "…" : "")
                      : "Select case"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {cases.map((tc) => (
                  <SelectItem key={tc.id} value={tc.id} className="text-xs">
                    <span className="truncate block max-w-[240px]">
                      {tc.inputs.input || "Empty input"}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Model slots */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-text-muted mr-2">
            <Columns2 className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Models
            </span>
          </div>

          <div className="flex flex-1 items-center gap-2 overflow-x-auto scrollbar-thin">
            {slots.map((slot, idx) => (
              <div
                key={slot.id}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border border-border-light bg-white px-1.5 py-1 transition-all",
                  results[slot.id]?.status === "running" && "border-primary/40"
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full flex-shrink-0",
                    COLUMN_COLORS[idx].dot
                  )}
                />
                <Select
                  value={slot.provider}
                  onValueChange={(v) => updateSlot(slot.id, "provider", v)}
                >
                  <SelectTrigger className="h-7 w-[90px] border-0 bg-transparent px-1.5 text-[11px] font-semibold shadow-none focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PROVIDERS).map(([k, v]) => (
                      <SelectItem key={k} value={k} className="text-xs">
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-text-muted/30">/</span>
                <Select
                  value={slot.model}
                  onValueChange={(v) => updateSlot(slot.id, "model", v)}
                >
                  <SelectTrigger className="h-7 w-[130px] border-0 bg-transparent px-1.5 font-mono text-[11px] shadow-none focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(PROVIDERS[slot.provider]?.models ?? []).map((m) => (
                      <SelectItem
                        key={m.value}
                        value={m.value}
                        className="font-mono text-xs"
                      >
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {slots.length > 2 && (
                  <button
                    onClick={() => removeSlot(slot.id)}
                    className="ml-0.5 rounded p-0.5 text-text-muted/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
            {slots.length < 4 && (
              <button
                onClick={addSlot}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-dashed border-border-light text-text-muted hover:text-text-main hover:border-primary/40 transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-2">
            {hasResults && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetAll}
                className="h-8 gap-1.5 text-xs text-text-muted hover:text-text-main"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </Button>
            )}
            <Button
              size="sm"
              onClick={runAll}
              disabled={isRunning}
              className="h-8 gap-1.5 bg-primary text-white hover:bg-primary/90 font-semibold px-4"
            >
              <Play className="h-3 w-3" />
              {isRunning ? "Running…" : "Run All"}
            </Button>
          </div>
        </div>
      </div>

      {/* Summary bar — shown when all done */}
      {allDone && (
        <div className="flex items-center gap-6 border-b border-border-light bg-slate-100/80 px-5 py-2 animate-fade-in">
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
            Summary
          </span>
          <div className="flex items-center gap-4">
            {slots.map((slot, idx) => {
              const r = results[slot.id];
              if (!r) return null;
              const providerLabel = PROVIDERS[slot.provider]?.label ?? slot.provider;
              return (
                <div key={slot.id} className="flex items-center gap-2">
                  <span
                    className={cn("h-1.5 w-1.5 rounded-full", COLUMN_COLORS[idx].dot)}
                  />
                  <span className="font-mono text-[11px] font-medium text-text-main">
                    {providerLabel}/{slot.model}
                  </span>
                  <span className="font-mono text-[10px] text-text-muted">
                    {r.latency}s
                  </span>
                  <span className="font-mono text-[10px] text-text-muted">
                    ${r.cost.toFixed(4)}
                  </span>
                  {r.pass !== undefined &&
                    (r.pass ? (
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    ) : (
                      <XCircle className="h-3 w-3 text-destructive" />
                    ))}
                </div>
              );
            })}
          </div>
          <div className="ml-auto flex items-center gap-3 text-[10px] text-text-muted">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Fastest:{" "}
              <span className="font-mono font-semibold text-green-600">
                {bestLatency}s
              </span>
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Cheapest:{" "}
              <span className="font-mono font-semibold text-green-600">
                ${bestCost?.toFixed(4)}
              </span>
            </span>
          </div>
        </div>
      )}

      {/* Columns grid */}
      <div className="flex flex-1 overflow-hidden">
        {slots.map((slot, idx) => {
          const r = results[slot.id];
          const color = COLUMN_COLORS[idx];
          const providerLabel = PROVIDERS[slot.provider]?.label ?? slot.provider;
          return (
            <div
              key={slot.id}
              className={cn(
                "flex flex-1 flex-col border-l-2 overflow-hidden",
                color.border,
                idx > 0 && "border-l-2",
                idx === 0 && "border-l-2"
              )}
            >
              {/* Column header */}
              <div className="flex items-center justify-between border-b border-border-light bg-white px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", color.dot)} />
                  <span className="font-mono text-[11px] font-bold text-text-main">
                    {providerLabel}
                  </span>
                  <span className="font-mono text-[11px] text-text-muted">
                    {slot.model}
                  </span>
                </div>
                {r?.status === "done" && (
                  <button
                    className="text-text-muted hover:text-text-main transition-colors"
                    title="Copy output"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Response body */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-slate-50/50">
                {!r && (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-xs text-text-muted/50">
                      Click &quot;Run All&quot; to generate responses
                    </p>
                  </div>
                )}
                {r && (
                  <div className="space-y-3 animate-fade-in">
                    {r.status === "running" && (
                      <div className="h-0.5 w-full overflow-hidden rounded-full bg-border-light">
                        <div
                          className="h-full w-1/3 animate-pulse rounded-full bg-primary"
                          style={{
                            animation:
                              "pulse 1s ease-in-out infinite, moveRight 1.5s ease-in-out infinite",
                          }}
                        />
                      </div>
                    )}
                    <div className="text-sm leading-relaxed text-text-main whitespace-pre-wrap">
                      {r.displayedText}
                      {r.status === "running" && (
                        <span className="inline-block w-[2px] h-4 bg-primary ml-0.5 animate-pulse align-text-bottom" />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Column footer — stats */}
              {r?.status === "done" && (
                <div className="flex items-center justify-between border-t border-border-light bg-white px-4 py-2 animate-fade-in">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-[10px] text-text-muted">
                      <Clock className="h-3 w-3" />
                      <span
                        className={cn(
                          "font-mono font-semibold",
                          bestLatency === r.latency && "text-green-600"
                        )}
                      >
                        {r.latency}s
                      </span>
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-text-muted">
                      <Hash className="h-3 w-3" />
                      <span className="font-mono font-semibold">{r.tokens}</span>
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-text-muted">
                      <DollarSign className="h-3 w-3" />
                      <span
                        className={cn(
                          "font-mono font-semibold",
                          bestCost === r.cost && "text-green-600"
                        )}
                      >
                        ${r.cost.toFixed(4)}
                      </span>
                    </span>
                  </div>
                  {r.pass !== undefined && (
                    <div
                      className={cn(
                        "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                        r.pass
                          ? "bg-green-100 text-green-700"
                          : "bg-destructive/10 text-destructive"
                      )}
                    >
                      {r.pass ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {r.pass ? "PASS" : "FAIL"}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
