import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Eye, EyeOff, Trash2, ChevronDown } from "lucide-react";

interface EnvVar {
  id: string;
  key: string;
  value: string;
  is_secret: number;
}

interface RowState {
  key: string;
  value: string;
  is_secret: boolean;
  showValue: boolean;
}

const PAGE_SIZE = 20;

async function loadVars(): Promise<EnvVar[]> {
  return invoke("db_select_cmd", {
    table: "env_variables",
    query: { orderBy: "created_at", orderDirection: "asc" },
  });
}

export default function EnvVariables() {
  const [vars, setVars] = useState<EnvVar[]>([]);
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [adding, setAdding] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newIsSecret, setNewIsSecret] = useState(false);
  const newKeyRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadVars().then((data) => {
      setVars(data);
      const initial: Record<string, RowState> = {};
      for (const v of data) {
        initial[v.id] = {
          key: v.key,
          value: v.value,
          is_secret: v.is_secret === 1,
          showValue: false,
        };
      }
      setRows(initial);
    });
  }, []);

  useEffect(() => {
    if (adding) newKeyRef.current?.focus();
  }, [adding]);

  function updateRow(id: string, patch: Partial<RowState>) {
    setRows((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function saveField(id: string, field: "key" | "value") {
    const row = rows[id];
    const current = vars.find((v) => v.id === id);
    if (!row || !current) return;
    const newVal = row[field];
    if (newVal === current[field]) return;
    if (field === "key" && !newVal.trim()) {
      updateRow(id, { key: current.key });
      return;
    }
    try {
      await invoke("db_update_cmd", {
        table: "env_variables",
        query: { where: { id } },
        data: { [field]: newVal },
      });
      setVars((prev) =>
        prev.map((v) => (v.id === id ? { ...v, [field]: newVal } : v))
      );
    } catch (e) {
      console.error("Failed to save", e);
      updateRow(id, { [field]: current[field] });
    }
  }

async function deleteVar(id: string) {
    try {
      await invoke("db_delete_cmd", {
        table: "env_variables",
        query: { where: { id } },
      });
      setVars((prev) => prev.filter((v) => v.id !== id));
      setRows((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (e) {
      console.error("Failed to delete", e);
    }
  }

  async function addVar() {
    const key = newKey.trim();
    if (!key) return;
    try {
      const id: string = await invoke("db_insert_cmd", {
        table: "env_variables",
        data: { key, value: newValue, is_secret: newIsSecret ? 1 : 0 },
      });
      const added: EnvVar = { id, key, value: newValue, is_secret: newIsSecret ? 1 : 0 };
      setVars((prev) => [...prev, added]);
      setRows((prev) => ({
        ...prev,
        [id]: { key, value: newValue, is_secret: newIsSecret, showValue: false },
      }));
      setNewKey("");
      setNewValue("");
      setNewIsSecret(false);
      setAdding(false);
    } catch (e) {
      console.error("Failed to add variable", e);
    }
  }

  const displayed = vars.slice(0, visible);
  const remaining = vars.length - visible;

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">
        Reference in prompts with{" "}
        <code className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">{"{{VAR_NAME}}"}</code>.
        {" "}Access in tool code with{" "}
        <code className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">{"env.VAR_NAME"}</code>.
        {" "}Secret values are masked in the UI.
      </p>

      <div className="bg-white border border-border-light rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-[300px]">

        {/* Column headers */}
        <div className="flex items-center bg-sidebar-light/50 border-b border-border-light px-6 py-3 shrink-0">
          <div className="w-[38%] shrink-0 text-[10px] font-bold text-text-muted uppercase tracking-widest">Variable Name</div>
          <div className="flex-1 text-[10px] font-bold text-text-muted uppercase tracking-widest">Value</div>
          <div className="w-40 shrink-0 flex justify-end">
            <button
              className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
              onClick={() => setAdding(true)}
            >
              + ADD VARIABLE
            </button>
          </div>
        </div>

        {/* Body — flex-1 so it fills space between header and footer */}
        <div className="flex-1">
          {displayed.length === 0 && !adding ? (
            <div className="flex flex-col items-center justify-center h-full py-16 gap-3">
              <p className="text-sm font-medium text-text-muted">No environment variables yet</p>
              <p className="text-xs text-text-muted/60 max-w-xs text-center">
                Add variables to reference them in prompts and tools using <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">{"{{VAR_NAME}}"}</code>
              </p>
              <button
                className="mt-2 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                onClick={() => setAdding(true)}
              >
                + Add Variable
              </button>
            </div>
          ) : (
            <div>
              {displayed.map((v) => {
                const row = rows[v.id];
                if (!row) return null;
                return (
                  <div key={v.id} className="flex items-center px-6 py-2.5 border-b border-border-light hover:bg-sidebar-light/30 transition-colors group">
                    <div className="w-[38%] shrink-0">
                      <input
                        className="font-mono text-sm font-medium text-text-main bg-transparent w-full focus:outline-none"
                        value={row.key}
                        onChange={(e) => updateRow(v.id, { key: e.target.value })}
                        onBlur={() => saveField(v.id, "key")}
                        spellCheck={false}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg flex items-center justify-between gap-3">
                        <input
                          className={`text-sm font-mono bg-transparent flex-1 min-w-0 focus:outline-none ${
                            row.is_secret && !row.showValue ? "text-text-muted" : "text-text-main"
                          }`}
                          type={row.is_secret && !row.showValue ? "password" : "text"}
                          value={row.value}
                          onChange={(e) => updateRow(v.id, { value: e.target.value })}
                          onBlur={() => saveField(v.id, "value")}
                          spellCheck={false}
                        />
                        {row.is_secret && (
                          <button
                            className="text-text-muted hover:text-primary transition-colors shrink-0"
                            onClick={() => updateRow(v.id, { showValue: !row.showValue })}
                          >
                            {row.showValue ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="w-40 shrink-0 flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="text-text-muted hover:text-red-500 transition-colors"
                        onClick={() => deleteVar(v.id)}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {adding && (
                <div className="flex items-center px-6 py-2.5 border-b border-border-light bg-sidebar-light/20">
                  <div className="w-[38%] shrink-0">
                    <input
                      ref={newKeyRef}
                      className="font-mono text-sm font-medium text-text-main bg-transparent w-full focus:outline-none placeholder-text-muted/40"
                      placeholder="VARIABLE_NAME"
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value.toUpperCase().replace(/\s/g, "_"))}
                      onKeyDown={(e) => { if (e.key === "Enter") addVar(); if (e.key === "Escape") { setAdding(false); setNewKey(""); setNewValue(""); setNewIsSecret(false); } }}
                      spellCheck={false}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg flex items-center gap-3">
                      <input
                        className="text-sm font-mono text-text-main bg-transparent flex-1 min-w-0 focus:outline-none placeholder-text-muted/40"
                        placeholder="value"
                        type={newIsSecret ? "password" : "text"}
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") addVar(); if (e.key === "Escape") { setAdding(false); setNewKey(""); setNewValue(""); setNewIsSecret(false); } }}
                        spellCheck={false}
                      />
                    </div>
                  </div>
                  <div className="w-40 shrink-0 flex items-center justify-end gap-3">
                    <button
                      className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${
                        newIsSecret ? "text-primary" : "text-text-muted hover:text-primary"
                      }`}
                      onClick={() => setNewIsSecret((s) => !s)}
                    >
                      Secret
                    </button>
                    <button
                      className="text-[10px] font-bold text-primary hover:text-primary/80 uppercase tracking-widest transition-colors"
                      onClick={addVar}
                    >
                      Add
                    </button>
                    <button
                      className="text-text-muted hover:text-red-500 transition-colors"
                      onClick={() => { setAdding(false); setNewKey(""); setNewValue(""); setNewIsSecret(false); }}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              )}
              {remaining > 0 && (
                <div className="px-6 py-3">
                  <button
                    className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                    onClick={() => setVisible((n) => n + PAGE_SIZE)}
                  >
                    <ChevronDown className="size-3" />
                    SHOW {remaining} MORE VARIABLE{remaining !== 1 ? "S" : ""}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-sidebar-light/30 border-t border-border-light shrink-0 flex items-center">
          <span className="text-[11px] text-text-muted">
            {vars.length} variable{vars.length !== 1 ? "s" : ""}
          </span>
        </div>

      </div>
    </div>
  );
}
