import { Sun, Moon, Monitor } from "lucide-react";
import { useState, useEffect } from "react";

import { PROVIDERS_LIST } from "@/constants/providers";
import { NativeSelect } from "@/components/ui/native-select";
import { fetchAndNormalizeModels } from "@/lib/modelManager";
import { getSetting, setSetting } from "@/lib/storage";

function Preferences() {
  const [telemetryEnabled, setTelemetryEnabled] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<
    "light" | "dark" | "system"
  >("light");
  const [providerModels, setProviderModels] = useState<
    Record<string, { id: string; name: string }[]>
  >({});
  const [defaultProvider, setDefaultProvider] = useState<string>(
    PROVIDERS_LIST[0]?.id ?? ""
  );
  const [defaultModel, setDefaultModel] = useState<string>("");

  const themeOptions = ["light", "dark", "system"] as const;

  useEffect(() => {
    const load = async () => {
      try {
        const [models, savedProvider, savedModel, savedTelemetry, savedTheme] =
          await Promise.all([
            fetchAndNormalizeModels(),
            getSetting("default_provider"),
            getSetting("default_model"),
            getSetting("telemetry_enabled"),
            getSetting("theme"),
          ]);
        setProviderModels(models);
        const provider =
          savedProvider && PROVIDERS_LIST.some((p) => p.id === savedProvider)
            ? savedProvider
            : PROVIDERS_LIST[0]?.id ?? "";
        setDefaultProvider(provider);
        const modelsForProvider = models[provider] ?? [];
        const modelValid =
          savedModel && modelsForProvider.some((m) => m.id === savedModel);
        setDefaultModel(
          modelValid ? savedModel : modelsForProvider[0]?.id ?? ""
        );
        setTelemetryEnabled(savedTelemetry !== "false");
        setSelectedTheme(
          themeOptions.includes(savedTheme as (typeof themeOptions)[number])
            ? (savedTheme as (typeof themeOptions)[number])
            : "light"
        );
      } catch (error) {
        console.error("Failed to load preferences:", error);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (defaultProvider && providerModels[defaultProvider]?.length > 0) {
      const models = providerModels[defaultProvider];
      const currentModelValid = models.some((m) => m.id === defaultModel);
      if (!currentModelValid) {
        const newModel = models[0].id;
        setDefaultModel(newModel);
        setSetting("default_model", newModel);
      }
    } else {
      setDefaultModel("");
    }
  }, [defaultProvider, providerModels]);

  const handleProviderChange = (value: string) => {
    setDefaultProvider(value);
    setSetting("default_provider", value);
  };

  const handleModelChange = (value: string) => {
    setDefaultModel(value);
    setSetting("default_model", value);
  };

  const handleTelemetryToggle = () => {
    const next = !telemetryEnabled;
    setTelemetryEnabled(next);
    setSetting("telemetry_enabled", String(next));
  };

  const handleThemeChange = (theme: "light" | "dark" | "system") => {
    setSelectedTheme(theme);
    setSetting("theme", theme);
  };

  const modelsForProvider = defaultProvider
    ? providerModels[defaultProvider] ?? []
    : [];

  return (
    <>
      <section className="space-y-6">
        <div>
          <p className="text-sm text-slate-500">
            Set the baseline configuration for new experiments.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Default Provider
            </label>
            <NativeSelect
              value={defaultProvider}
              onChange={(e) => handleProviderChange(e.target.value)}
            >
              {PROVIDERS_LIST.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Default Model
            </label>
            <NativeSelect
              value={defaultModel}
              onChange={(e) => handleModelChange(e.target.value)}
              disabled={modelsForProvider.length === 0}
            >
              {modelsForProvider.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>
      </section>
      <hr className="border-slate-100" />
      <section className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Telemetry</h2>
          <p className="text-sm text-slate-500 mt-1">
            Help us improve by sending anonymous usage data.
          </p>
        </div>
        <button
          type="button"
          className={`relative w-14 h-7 rounded-full transition-colors ${telemetryEnabled ? "bg-primary" : "bg-slate-300"}`}
          onClick={handleTelemetryToggle}
        >
          <span className="sr-only">Enable telemetry</span>
          <span
            className={`absolute top-1.5 left-1.5 inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${telemetryEnabled ? "translate-x-6" : "translate-x-0"}`}
          />
        </button>
      </section>
      <hr className="border-slate-100" />
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Theme</h2>
          <p className="text-sm text-slate-500 mt-1">
            Select your preferred interface appearance.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div
            className="cursor-pointer group"
            onClick={() => handleThemeChange("light")}
          >
            <div
              className={`aspect-video bg-white border-2 rounded-xl mb-3 flex items-center justify-center shadow-sm ${selectedTheme === "light" ? "border-primary" : "border-slate-200 hover:border-indigo-300 transition-colors"}`}
            >
              <Sun
                className={`size-6 ${selectedTheme === "light" ? "text-primary" : "text-slate-400"}`}
              />
            </div>
            <p
              className={`text-xs font-bold text-center uppercase tracking-wider ${selectedTheme === "light" ? "text-primary" : "text-slate-400 group-hover:text-slate-600"}`}
            >
              Light
            </p>
          </div>
          <div
            className="cursor-pointer group"
            onClick={() => handleThemeChange("dark")}
          >
            <div
              className={`aspect-video bg-slate-900 border rounded-xl mb-3 flex items-center justify-center ${selectedTheme === "dark" ? "border-primary" : "border-slate-200 hover:border-indigo-300 transition-colors"}`}
            >
              <Moon
                className={`size-6 ${selectedTheme === "dark" ? "text-primary" : "text-white/50"}`}
              />
            </div>
            <p
              className={`text-xs font-bold text-center uppercase tracking-wider ${selectedTheme === "dark" ? "text-primary" : "text-slate-400 group-hover:text-slate-600"}`}
            >
              Dark
            </p>
          </div>
          <div
            className="cursor-pointer group"
            onClick={() => handleThemeChange("system")}
          >
            <div
              className={`aspect-video bg-gradient-to-br from-white to-slate-900 border rounded-xl mb-3 flex items-center justify-center ${selectedTheme === "system" ? "border-primary" : "border-slate-200 hover:border-indigo-300 transition-colors"}`}
            >
              <Monitor
                className={`size-6 ${selectedTheme === "system" ? "text-primary" : "text-slate-600"}`}
              />
            </div>
            <p
              className={`text-xs font-bold text-center uppercase tracking-wider ${selectedTheme === "system" ? "text-primary" : "text-slate-400 group-hover:text-slate-600"}`}
            >
              System
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

export default Preferences;
