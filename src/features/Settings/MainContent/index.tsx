import { Eye, EyeOff, Sun, Moon, Monitor, CheckCircle, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { invoke } from '@tauri-apps/api/core';
import { getVersion } from "@tauri-apps/api/app";

import MainContent from "@/components/Layout/MainContent";
import Header from "../Header";
import { fetchAndNormalizeModels } from "@/lib/modelManager";

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';


function Settings() {
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const [openaiVisible, setOpenaiVisible] = useState(false);
  const [anthropicVisible, setAnthropicVisible] = useState(false);
  const [googleVisible, setGoogleVisible] = useState(false);
  const [telemetryEnabled, setTelemetryEnabled] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<"light" | "dark" | "system">("light");

  const [apiKeys, setApiKeys] = useState<{ [key: string]: string }>({});
  const [saveStatus, setSaveStatus] = useState<{ [key: string]: SaveStatus }>({
    openai: 'idle',
    anthropic: 'idle',
    google: 'idle',
  });
  const [providerModels, setProviderModels] = useState<Record<string, { id: string; name: string }[]>>({});

  useEffect(() => {
    getVersion().then(setAppVersion);
  }, []);

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

  const getProviderDescription = (providerId: string, fallback: string): string => {
    const models = providerModels[providerId];
    if (!models?.length) return fallback;
    const topModels = models.slice(0, 3).map((m) => m.name).join(", ");
    return `Enables ${models.length} models including ${topModels}${models.length > 3 ? ", etc" : ""}.`;
  };

  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        const keys: any = await invoke("db_select_cmd", {
          table: "api_keys",
          query: {},
        });
        const keyMap = keys.reduce((acc: any, { provider, key }: any) => {
          acc[provider] = key;
          return acc;
        }, {});
        setApiKeys(keyMap);
      } catch (error) {
        console.error("Failed to fetch API keys:", error);
      }
    };
    fetchApiKeys();
  }, []);

  const handleSaveApiKey = async (provider: string, apiKey: string) => {
    if (!apiKey) {
      setApiKeys((prevKeys) => ({ ...prevKeys, [provider]: "" }));
      setSaveStatus((prevStatus) => ({ ...prevStatus, [provider]: 'idle' }));
      // Optionally, delete the key if it's cleared
      try {
        await invoke("db_delete_cmd", { table: "api_keys", query: { where: { provider } } });
        console.log(`API key for ${provider} cleared/deleted.`);
      } catch (error) {
        console.error(`Failed to delete API key for ${provider}:`, error);
        setSaveStatus((prevStatus) => ({ ...prevStatus, [provider]: 'error' }));
      }
      return;
    }

    setSaveStatus((prevStatus) => ({ ...prevStatus, [provider]: 'saving' }));

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
      setApiKeys((prevKeys) => ({ ...prevKeys, [provider]: apiKey }));
      setSaveStatus((prevStatus) => ({ ...prevStatus, [provider]: 'saved' }));
      console.log(`API key for ${provider} saved.`);

      setTimeout(() => {
        setSaveStatus((prevStatus) => ({ ...prevStatus, [provider]: 'idle' }));
      }, 3000); // Revert to idle after 3 seconds

    } catch (error) {
      console.error(`Failed to save API key for ${provider}:`, error);
      setSaveStatus((prevStatus) => ({ ...prevStatus, [provider]: 'error' }));
    }
  };

  const getInputClass = (provider: string) => {
    let baseClass = "w-full px-4 py-2.5 border rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pr-12";
    switch (saveStatus[provider]) {
      case 'saved':
        return `${baseClass} border-green-500 ring-2 ring-green-200`;
      case 'error':
        return `${baseClass} border-red-500 ring-2 ring-red-200`;
      case 'saving':
        return `${baseClass} border-blue-500 ring-2 ring-blue-200`; // Or some other indicator
      default:
        return `${baseClass} border-slate-200`;
    }
  };

  const renderStatusIcon = (provider: string) => {
    switch (saveStatus[provider]) {
      case 'saved':
        return <CheckCircle className="size-5 text-green-500" />;
      case 'error':
        return <XCircle className="size-5 text-red-500" />;
      case 'saving':
        return <span className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>; // Simple spinner
      default:
        return null;
    }
  };

  return (
    <MainContent>
      <Header />
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50">
        <div className="max-w-3xl mx-auto px-10 py-12 space-y-10">
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">API Keys</h2>
              <p className="text-sm text-slate-500 mt-1">
                Configure your LLM provider credentials. These keys are encrypted at rest and used as defaults across all scenarios.
              </p>
            </div>
            <div className="space-y-4">
              {/* OpenAI API Key */}
              <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  OpenAI API Key
                </label>
                <div className="relative">
                  <input
                    className={getInputClass("openai")}
                    placeholder="sk-..."
                    type={openaiVisible ? "text" : "password"}
                    value={apiKeys.openai || ""} // Use value instead of defaultValue
                    onChange={(e) => setApiKeys((prevKeys) => ({ ...prevKeys, openai: e.target.value }))}
                    onBlur={(e) => handleSaveApiKey("openai", e.target.value)}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {saveStatus.openai === "saved" ? (
                      renderStatusIcon("openai")
                    ) : (
                      <>
                        {renderStatusIcon("openai")}
                        <button
                          className="text-slate-400 hover:text-primary transition-colors"
                          onClick={() => setOpenaiVisible(!openaiVisible)}
                        >
                          {openaiVisible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  {getProviderDescription("openai", "Required for OpenAI chat models (GPT-4o, o1, o3, etc.).")}
                </p>
              </div>

              {/* Anthropic API Key */}
              <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Anthropic API Key
                </label>
                <div className="relative">
                  <input
                    className={getInputClass("anthropic")}
                    placeholder="sk-ant-..."
                    type={anthropicVisible ? "text" : "password"}
                    value={apiKeys.anthropic || ""} // Use value instead of defaultValue
                    onChange={(e) => setApiKeys((prevKeys) => ({ ...prevKeys, anthropic: e.target.value }))}
                    onBlur={(e) => handleSaveApiKey("anthropic", e.target.value)}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {saveStatus.anthropic === "saved" ? (
                      renderStatusIcon("anthropic")
                    ) : (
                      <>
                        {renderStatusIcon("anthropic")}
                        <button
                          className="text-slate-400 hover:text-primary transition-colors"
                          onClick={() => setAnthropicVisible(!anthropicVisible)}
                        >
                          {anthropicVisible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  {getProviderDescription("anthropic", "Required for Claude models (Claude 3.5 Sonnet, Opus, etc.).")}
                </p>
              </div>

              {/* Google Vertex/Gemini API Key */}
              <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Google Vertex/Gemini API Key
                </label>
                <div className="relative">
                  <input
                    className={getInputClass("google")}
                    placeholder="Enter Google Cloud API Key"
                    type={googleVisible ? "text" : "password"}
                    value={apiKeys.google || ""} // Use value instead of defaultValue
                    onChange={(e) => setApiKeys((prevKeys) => ({ ...prevKeys, google: e.target.value }))}
                    onBlur={(e) => handleSaveApiKey("google", e.target.value)}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {saveStatus.google === "saved" ? (
                      renderStatusIcon("google")
                    ) : (
                      <>
                        {renderStatusIcon("google")}
                        <button
                          className="text-slate-400 hover:text-primary transition-colors"
                          onClick={() => setGoogleVisible(!googleVisible)}
                        >
                          {googleVisible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  {getProviderDescription("google", "Required for Google Gemini models (Gemini 1.5 Pro, Flash, etc.).")}
                </p>
              </div>
            </div>
          </section>
          <hr className="border-slate-100" />
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Defaults</h2>
              <p className="text-sm text-slate-500 mt-1">Set the baseline configuration for new experiments.</p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Default Provider
                </label>
                <select className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat">
                  <option>OpenAI</option>
                  <option selected>Anthropic</option>
                  <option>Google</option>
                  <option>Local (Ollama)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Default Model
                </label>
                <select className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat">
                  <option>claude-3-5-sonnet-20240620</option>
                  <option>gpt-4o</option>
                  <option>gemini-1.5-pro</option>
                </select>
              </div>
            </div>
          </section>
          <hr className="border-slate-100" />
          <section className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Telemetry</h2>
              <p className="text-sm text-slate-500 mt-1">Help us improve by sending anonymous usage data.</p>
            </div>
            <button
              className={`relative w-14 h-7 rounded-full transition-colors ${telemetryEnabled ? "bg-primary" : "bg-slate-300"}`}
              onClick={() => setTelemetryEnabled(!telemetryEnabled)}
            >
              <span className="sr-only">Enable telemetry</span>
              <span
                className={`absolute top-1.5 left-1.5 inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${telemetryEnabled ? "translate-x-6" : "translate-x-0"
                  }`}
              />
            </button>
          </section>
          <hr className="border-slate-100" />
          <section className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Theme</h2>
              <p className="text-sm text-slate-500 mt-1">Select your preferred interface appearance.</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div
                className="cursor-pointer group"
                onClick={() => setSelectedTheme("light")}
              >
                <div
                  className={`aspect-video bg-white border-2 rounded-xl mb-3 flex items-center justify-center shadow-sm ${selectedTheme === "light" ? "border-primary" : "border-slate-200 hover:border-indigo-300 transition-colors"
                    }`}
                >
                  <Sun className={`size-6 ${selectedTheme === "light" ? "text-primary" : "text-slate-400"}`} />
                </div>
                <p
                  className={`text-xs font-bold text-center uppercase tracking-wider ${selectedTheme === "light" ? "text-primary" : "text-slate-400 group-hover:text-slate-600"
                    }`}
                >
                  Light
                </p>
              </div>
              <div
                className="cursor-pointer group"
                onClick={() => setSelectedTheme("dark")}
              >
                <div
                  className={`aspect-video bg-slate-900 border rounded-xl mb-3 flex items-center justify-center ${selectedTheme === "dark" ? "border-primary" : "border-slate-200 hover:border-indigo-300 transition-colors"
                    }`}
                >
                  <Moon className={`size-6 ${selectedTheme === "dark" ? "text-primary" : "text-white/50"}`} />
                </div>
                <p
                  className={`text-xs font-bold text-center uppercase tracking-wider ${selectedTheme === "dark" ? "text-primary" : "text-slate-400 group-hover:text-slate-600"
                    }`}
                >
                  Dark
                </p>
              </div>
              <div
                className="cursor-pointer group"
                onClick={() => setSelectedTheme("system")}
              >
                <div
                  className={`aspect-video bg-gradient-to-br from-white to-slate-900 border rounded-xl mb-3 flex items-center justify-center ${selectedTheme === "system" ? "border-primary" : "border-slate-200 hover:border-indigo-300 transition-colors"
                    }`}
                >
                  <Monitor className={`size-6 ${selectedTheme === "system" ? "text-primary" : "text-slate-600"}`} />
                </div>
                <p
                  className={`text-xs font-bold text-center uppercase tracking-wider ${selectedTheme === "system" ? "text-primary" : "text-slate-400 group-hover:text-slate-600"
                    }`}
                >
                  System
                </p>
              </div>
            </div>
          </section>

          <div className="flex flex-col md:flex-row items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-8 border-t border-slate-100">
            <div className="flex gap-8 mb-4 md:mb-0">
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 bg-blue-500 rounded-full"></span> v{appVersion ?? "…"}
              </span>
            </div>
            <div className="flex gap-6">
              <a className="hover:text-primary transition-colors" href="#">
                Privacy Policy
              </a>
              <a className="hover:text-primary transition-colors" href="#">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </MainContent >
  );
}

export default Settings;