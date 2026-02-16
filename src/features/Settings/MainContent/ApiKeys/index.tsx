import { Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

import { fetchAndNormalizeModels } from "@/lib/modelManager";

type SaveStatus = "idle" | "saving" | "saved" | "error";

const PROVIDERS = [
  {
    id: "openai",
    label: "OpenAI API Key",
    placeholder: "sk-...",
    fallbackDescription: "Required for OpenAI chat models (GPT-4o, o1, o3, etc.).",
  },
  {
    id: "anthropic",
    label: "Anthropic API Key",
    placeholder: "sk-ant-...",
    fallbackDescription: "Required for Claude models (Claude 3.5 Sonnet, Opus, etc.).",
  },
  {
    id: "google",
    label: "Google Vertex/Gemini API Key",
    placeholder: "Enter Google Cloud API Key",
    fallbackDescription: "Required for Google Gemini models (Gemini 1.5 Pro, Flash, etc.).",
  },
] as const;

function ApiKeys() {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});
  const [saveStatus, setSaveStatus] = useState<Record<string, SaveStatus>>({
    openai: "idle",
    anthropic: "idle",
    google: "idle",
  });
  const [providerModels, setProviderModels] = useState<
    Record<string, { id: string; name: string }[]>
  >({});

  useEffect(() => {
    const loadModels = async () => {
      try {
        const models = await fetchAndNormalizeModels();
        setProviderModels(models);
      } catch (error) {
        console.error("Failed to fetch provider models:", error);
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        const keys: { provider: string; key: string }[] = await invoke(
          "db_select_cmd",
          { table: "api_keys", query: {} }
        );
        const keyMap = keys.reduce(
          (acc, { provider, key }) => {
            acc[provider] = key;
            return acc;
          },
          {} as Record<string, string>
        );
        setApiKeys(keyMap);
      } catch (error) {
        console.error("Failed to fetch API keys:", error);
      }
    };
    fetchApiKeys();
  }, []);

  const getProviderDescription = (
    providerId: string,
    fallback: string
  ): string => {
    const models = providerModels[providerId];
    if (!models?.length) return fallback;
    const topModels = models.slice(0, 3).map((m) => m.name).join(", ");
    return `Enables ${models.length} models including ${topModels}${models.length > 3 ? ", etc" : ""}.`;
  };

  const handleSaveApiKey = async (provider: string, apiKey: string) => {
    if (!apiKey) {
      setApiKeys((prev) => ({ ...prev, [provider]: "" }));
      setSaveStatus((prev) => ({ ...prev, [provider]: "idle" }));
      try {
        await invoke("db_delete_cmd", {
          table: "api_keys",
          query: { where: { provider } },
        });
      } catch (error) {
        console.error(`Failed to delete API key for ${provider}:`, error);
        setSaveStatus((prev) => ({ ...prev, [provider]: "error" }));
      }
      return;
    }

    setSaveStatus((prev) => ({ ...prev, [provider]: "saving" }));

    try {
      const updatedRows = await invoke("db_update_cmd", {
        table: "api_keys",
        query: { where: { provider } },
        data: { key: apiKey },
      });

      if (updatedRows === 0) {
        await invoke("db_insert_cmd", {
          table: "api_keys",
          data: { provider, key: apiKey },
        });
      }
      setApiKeys((prev) => ({ ...prev, [provider]: apiKey }));
      setSaveStatus((prev) => ({ ...prev, [provider]: "saved" }));

      setTimeout(() => {
        setSaveStatus((prev) => ({ ...prev, [provider]: "idle" }));
      }, 3000);
    } catch (error) {
      console.error(`Failed to save API key for ${provider}:`, error);
      setSaveStatus((prev) => ({ ...prev, [provider]: "error" }));
    }
  };

  const toggleVisibility = (provider: string) => {
    setVisibility((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  const getInputClass = (provider: string) => {
    const base =
      "w-full px-4 py-2.5 border rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pr-12";
    switch (saveStatus[provider]) {
      case "saved":
        return `${base} border-green-500 ring-2 ring-green-200`;
      case "error":
        return `${base} border-red-500 ring-2 ring-red-200`;
      case "saving":
        return `${base} border-blue-500 ring-2 ring-blue-200`;
      default:
        return `${base} border-slate-200`;
    }
  };

  const renderStatusIcon = (provider: string) => {
    switch (saveStatus[provider]) {
      case "saved":
        return <CheckCircle className="size-5 text-green-500" />;
      case "error":
        return <XCircle className="size-5 text-red-500" />;
      case "saving":
        return (
          <span className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">
          Configure your LLM provider credentials. These keys are encrypted at
          rest and used as defaults across all scenarios.
        </p>
      </div>
      <div className="space-y-4">
        {PROVIDERS.map(({ id, label, placeholder, fallbackDescription }) => (
          <div
            key={id}
            className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm"
          >
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              {label}
            </label>
            <div className="relative">
              <input
                className={getInputClass(id)}
                placeholder={placeholder}
                type={visibility[id] ? "text" : "password"}
                value={apiKeys[id] ?? ""}
                onChange={(e) =>
                  setApiKeys((prev) => ({ ...prev, [id]: e.target.value }))
                }
                onBlur={(e) => handleSaveApiKey(id, e.target.value)}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {saveStatus[id] === "saved" ? (
                  renderStatusIcon(id)
                ) : (
                  <>
                    {renderStatusIcon(id)}
                    <button
                      type="button"
                      className="text-slate-400 hover:text-primary transition-colors"
                      onClick={() => toggleVisibility(id)}
                    >
                      {visibility[id] ? (
                        <EyeOff className="size-5" />
                      ) : (
                        <Eye className="size-5" />
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              {getProviderDescription(id, fallbackDescription)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ApiKeys;
