import { Eye, EyeOff, Sun, Moon, Monitor } from "lucide-react";
import { useState } from "react";

function Settings() {
  const [openaiVisible, setOpenaiVisible] = useState(true);
  const [anthropicVisible, setAnthropicVisible] = useState(false);
  const [googleVisible, setGoogleVisible] = useState(true);
  const [telemetryEnabled, setTelemetryEnabled] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<"light" | "dark" | "system">("light");

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#FCFDFF]">
      <div className="max-w-3xl mx-auto px-10 py-12 space-y-10">
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Global API Keys</h2>
            <p className="text-sm text-slate-500 mt-1">
              Configure your LLM provider credentials. These keys are encrypted at rest and used as defaults across all workflows.
            </p>
          </div>
          <div className="space-y-4">
            <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                OpenAI API Key
              </label>
              <div className="relative">
                <input
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pr-12"
                  placeholder="sk-..."
                  type={openaiVisible ? "text" : "password"}
                  defaultValue="sk-proj-7a8b9c1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v"
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                  onClick={() => setOpenaiVisible(!openaiVisible)}
                >
                  {openaiVisible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Used for GPT-4o, GPT-3.5 Turbo, and DALL-E models.
              </p>
            </div>
            <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Anthropic API Key
              </label>
              <div className="relative">
                <input
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pr-12"
                  placeholder="sk-ant-..."
                  type={anthropicVisible ? "text" : "password"}
                  defaultValue="sk-ant-api03-L_9x_0kL2m3n4o5p6q7r8s9t0u1v2w3x4y5z"
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                  onClick={() => setAnthropicVisible(!anthropicVisible)}
                >
                  {anthropicVisible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Required for Claude 3.5 Sonnet and Opus models.
              </p>
            </div>
            <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Google Vertex/Gemini API Key
              </label>
              <div className="relative">
                <input
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pr-12"
                  placeholder="Enter Google Cloud API Key"
                  type={googleVisible ? "text" : "password"}
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                  onClick={() => setGoogleVisible(!googleVisible)}
                >
                  {googleVisible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Enables Gemini 1.5 Pro and Flash integration.
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
            className={`relative w-14 h-7 rounded-full transition-colors ${telemetryEnabled ? "bg-indigo-600" : "bg-slate-300"}`}
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
              <span className="size-1.5 bg-green-500 rounded-full"></span> Service: Active
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 bg-indigo-500 rounded-full"></span> Secure Enclave Enabled
            </span>
          </div>
          <div className="flex gap-6">
            <a className="hover:text-primary transition-colors" href="#">
              Security Docs
            </a>
            <a className="hover:text-primary transition-colors" href="#">
              Data Handling
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
