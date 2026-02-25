import { Key, LayoutDashboard, CheckSquare, ArrowRight, ExternalLink } from "lucide-react";
import { useAppContext } from "@/contexts/AppContext";
import type { SettingsSectionId } from "@/types";

interface OnboardingViewProps {
  appVersion: string | null;
  hasApiKey: boolean;
  hasScenarioOrAgent: boolean;
  hasCompletedRun: boolean;
}

const CURRENT_STEP_STYLE =
  "border-2 border-indigo-100 bg-indigo-50/30 rounded-xl p-6 hover:border-indigo-200 transition-colors";
const FINISHED_STEP_STYLE =
  "border border-slate-200 bg-white rounded-xl p-6 hover:border-slate-300 transition-colors";

function OnboardingView({
  appVersion,
  hasApiKey,
  hasScenarioOrAgent,
  hasCompletedRun,
}: OnboardingViewProps) {
  const { setCurrentPage } = useAppContext();

  const openSettings = (section: SettingsSectionId) => {
    setCurrentPage("settings", { settingsSection: section });
  };

  const step1Current = !hasApiKey;
  const step2Current = hasApiKey && !hasScenarioOrAgent;
  const step3Current = hasScenarioOrAgent && !hasCompletedRun;

  return (
    <>
      <section className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium uppercase tracking-wider mb-4">
          Get Started
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
          Welcome to Reticle!
        </h2>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Build, test, and deploy AI scenarios in minutes. We've prepared everything you need to get your first model running.
        </p>
      </section>

      <section className="mb-4">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold text-slate-800">Quick Start</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <button
            type="button"
            onClick={() => openSettings("api-keys")}
            className={`${step1Current ? CURRENT_STEP_STYLE : FINISHED_STEP_STYLE} group cursor-pointer text-left`}
          >
            <div
              className={`size-12 rounded-2xl flex items-center justify-center mb-6 ${
                step1Current
                  ? "bg-primary text-white shadow-lg shadow-indigo-200"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              <Key className="size-6" />
            </div>
            <h4 className="font-bold text-slate-900 mb-2">1. Setup API Keys</h4>
            <p className="text-sm text-slate-500 mb-6">
              Connect your AI provider accounts by adding API keys for OpenAI, Anthropic, or Google.
            </p>
            {step1Current && (
              <span className="text-xs font-bold text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                Setup Keys <ArrowRight className="size-3" />
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage("studio")}
            className={`${step2Current ? CURRENT_STEP_STYLE : FINISHED_STEP_STYLE} group cursor-pointer text-left`}
          >
            <div
              className={`size-12 rounded-2xl flex items-center justify-center mb-6 ${
                step2Current
                  ? "bg-primary text-white shadow-lg shadow-indigo-200"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              <LayoutDashboard className="size-6" />
            </div>
            <h4 className="font-bold text-slate-900 mb-2">2. Create Scenario or Agent</h4>
            <p className="text-sm text-slate-500 mb-6">
              Set up your system prompt, choose your model, write your prompt, and configure tool calls.
            </p>
            {step2Current && (
              <span className="text-xs font-bold text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                Create Scenario <ArrowRight className="size-3" />
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage("runs")}
            className={`${step3Current ? CURRENT_STEP_STYLE : FINISHED_STEP_STYLE} group cursor-pointer text-left`}
          >
            <div
              className={`size-12 rounded-2xl flex items-center justify-center mb-6 ${
                step3Current
                  ? "bg-primary text-white shadow-lg shadow-indigo-200"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              <CheckSquare className="size-6" />
            </div>
            <h4 className="font-bold text-slate-900 mb-2">3. Run & Inspect Results</h4>
            <p className="text-sm text-slate-500 mb-6">
              Run a scenario and review token usage, costs, and tool invocations.
            </p>
            {step3Current && (
              <span className="text-xs font-bold text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                View Results <ArrowRight className="size-3" />
              </span>
            )}
          </button>
        </div>
      </section>

      <section className="bg-slate-50 rounded-3xl p-10 border border-slate-100">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-1">
            <h3 className="text-2xl font-bold text-slate-800 mb-4">Learning Path</h3>
            <p className="text-slate-500 leading-relaxed mb-6">
              Master the platform with our step-by-step guide designed to take you from novice to expert.
            </p>
            <a
              className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
              href="#"
            >
              Full Documentation <ExternalLink className="size-3" />
            </a>
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div className="relative flex gap-6">
              <div className="size-8 rounded-full bg-white border-2 border-primary flex items-center justify-center flex-shrink-0 z-10 shadow-sm">
                <span className="text-xs font-bold text-primary">01</span>
              </div>
              <div>
                <h5 className="font-bold text-slate-800 mb-1">Configuration Basics</h5>
                <p className="text-sm text-slate-500">
                  Learn how to setup your environment variables and default models.
                </p>
              </div>
            </div>
            <div className="relative flex gap-6">
              <div className="size-8 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center flex-shrink-0 z-10 shadow-sm">
                <span className="text-xs font-bold text-slate-400">02</span>
              </div>
              <div>
                <h5 className="font-bold text-slate-800 mb-1">Prompt Engineering 101</h5>
                <p className="text-sm text-slate-500">
                  Best practices for writing effective prompts for Claude and GPT-4.
                </p>
              </div>
            </div>
            <div className="relative flex gap-6">
              <div className="size-8 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center flex-shrink-0 z-10 shadow-sm">
                <span className="text-xs font-bold text-slate-400">03</span>
              </div>
              <div>
                <h5 className="font-bold text-slate-800 mb-1">Testing & Latency</h5>
                <p className="text-sm text-slate-500">
                  How to run batch tests and analyze token consumption costs.
                </p>
              </div>
            </div>
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
    </>
  );
}

export default OnboardingView;
