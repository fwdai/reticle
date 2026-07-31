import { Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";

import { fetchAndNormalizeModels, clearModelCache } from "@/lib/modelManager";
import { getSetting, setSetting } from "@/lib/storage";
import { LOCAL_PROVIDER_BASE_URL_SETTING_KEY } from "@/lib/gateway/constants";
import { normalizeProviderBaseUrl } from "@/lib/gateway/helpers";
import { PROVIDERS as ALL_PROVIDERS } from "@/constants/providers";

type SaveStatus = "idle" | "saving" | "saved" | "error";

const PROVIDERS = [
  {
    id: "openai",
    label: "OpenAI API Key",
    placeholder: "sk-...",
    fallbackDescription: "Required for OpenAI text and reasoning models.",
  },
  {
    id: "anthropic",
    label: "Anthropic API Key",
    placeholder: "sk-ant-...",
    fallbackDescription: "Required for Anthropic Claude models.",
  },
  {
    id: "google",
    label: "Google Vertex/Gemini API Key",
    placeholder: "Enter Google Cloud API Key",
    fallbackDescription: "Required for Google Gemini models.",
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

  // 'local' needs no API key — just a base URL, stored in `settings` rather than `api_keys`.
  // Reuses the shared `saveStatus`/`getInputClass`/`renderStatusIcon` machinery below (keyed
  // by "local") rather than a parallel status state, so the same visual feedback applies.
  const [localBaseUrl, setLocalBaseUrl] = useState("");

  useEffect(() => {
    const loadLocalBaseUrl = async () => {
      try {
        const stored = await getSetting(LOCAL_PROVIDER_BASE_URL_SETTING_KEY);
        setLocalBaseUrl(stored ?? ALL_PROVIDERS.LOCAL.baseUrl);
      } catch (error) {
        console.error("Failed to load local provider base URL:", error);
        setLocalBaseUrl(ALL_PROVIDERS.LOCAL.baseUrl);
      }
    };
    loadLocalBaseUrl();
  }, []);

  const handleSaveLocalBaseUrl = async (rawValue: string) => {
    let value: string;
    try {
      value = rawValue.trim() ? normalizeProviderBaseUrl(rawValue) : ALL_PROVIDERS.LOCAL.baseUrl;
    } catch (error) {
      setSaveStatus((prev) => ({ ...prev, local: "error" }));
      toast.error("Invalid local endpoint", {
        description: error instanceof Error ? error.message : "Please enter a valid http(s) URL.",
      });
      return;
    }
    setSaveStatus((prev) => ({ ...prev, local: "saving" }));
    try {
      await setSetting(LOCAL_PROVIDER_BASE_URL_SETTING_KEY, value);
      clearModelCache();
      loadModels();
      setLocalBaseUrl(value);
      setSaveStatus((prev) => ({ ...prev, local: "saved" }));
      setTimeout(() => {
        setSaveStatus((prev) => ({ ...prev, local: "idle" }));
      }, 3000);
    } catch (error) {
      console.error("Failed to save local provider base URL:", error);
      setSaveStatus((prev) => ({ ...prev, local: "error" }));
      toast.error("Failed to save local endpoint", { description: "Could not save the base URL. Please try again." });
    }
  };

  // Re-run after any save/delete that could change which models are reachable
  // (a new/removed API key, or a changed local endpoint) — clearing the cache
  // alone leaves `providerModels` (and the descriptions derived from it) stale
  // until the component happens to remount.
  const loadModels = useCallback(async () => {
    try {
      const models = await fetchAndNormalizeModels();
      setProviderModels(models);
    } catch (error) {
      console.error("Failed to fetch provider models:", error);
    }
  }, []);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

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
        clearModelCache();
        // main inlined fetchAndNormalizeModels({ forceRefresh: true }) here;
        // this branch routes every refresh through loadModels() so the
        // out-of-order guard added later applies to all of them. Dropping
        // forceRefresh is safe: clearModelCache() above removes the cache
        // key, and getAllModels refetches when the provider is absent from
        // the cache regardless of the flag.
        loadModels();
      } catch (error) {
        console.error(`Failed to delete API key for ${provider}:`, error);
        setSaveStatus((prev) => ({ ...prev, [provider]: "error" }));
        toast.error("Failed to remove API key", { description: `Could not remove the ${provider} key.` });
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
      clearModelCache();
      loadModels();
      setApiKeys((prev) => ({ ...prev, [provider]: apiKey }));
      const models = await fetchAndNormalizeModels({ forceRefresh: true });
      setProviderModels(models);
      setSaveStatus((prev) => ({ ...prev, [provider]: "saved" }));

      setTimeout(() => {
        setSaveStatus((prev) => ({ ...prev, [provider]: "idle" }));
      }, 3000);
    } catch (error) {
      console.error(`Failed to save API key for ${provider}:`, error);
      setSaveStatus((prev) => ({ ...prev, [provider]: "error" }));
      toast.error("Failed to save API key", { description: `Could not save the ${provider} key. Please try again.` });
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
                data-save-status={saveStatus[id]}
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

        <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Local Endpoint (Ollama, LM Studio, vLLM, etc.)
          </label>
          <div className="relative">
            <input
              className={getInputClass("local")}
              placeholder={ALL_PROVIDERS.LOCAL.baseUrl}
              type="text"
              value={localBaseUrl}
              data-save-status={saveStatus.local}
              onChange={(e) => setLocalBaseUrl(e.target.value)}
              onBlur={(e) => handleSaveLocalBaseUrl(e.target.value)}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {renderStatusIcon("local")}
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {getProviderDescription(
              "local",
              `No API key needed — point this at any OpenAI-compatible server (defaults to ${ALL_PROVIDERS.LOCAL.baseUrl} for Ollama).`
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ApiKeys;
