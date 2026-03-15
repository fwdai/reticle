import { Key, LayoutDashboard, UserCircle, ArrowRight, ExternalLink, CheckCircle2 } from "lucide-react";
import { useAppContext } from "@/contexts/AppContext";
import type { SettingsSectionId } from "@/types";

interface OnboardingViewProps {
  appVersion: string | null;
  hasApiKey: boolean;
  hasCompletedRun: boolean;
  hasProfile: boolean;
  onSkipProfile: () => void;
}

const CURRENT_STEP_STYLE =
  "border-2 border-indigo-100 bg-indigo-50/30 rounded-xl p-6 hover:border-indigo-200 transition-colors";
const FINISHED_STEP_STYLE =
  "border border-slate-200 bg-white rounded-xl p-6 hover:border-slate-300 transition-colors";
const COMPLETED_STEP_STYLE =
  "border border-primary/20 bg-primary/5 rounded-xl p-6 transition-colors";

function OnboardingView({
  appVersion,
  hasApiKey,
  hasCompletedRun,
  hasProfile,
  onSkipProfile,
}: OnboardingViewProps) {
  const { setCurrentPage } = useAppContext();

  const openSettings = (section: SettingsSectionId) => {
    setCurrentPage("settings", { settingsSection: section });
  };

  const step1Done = hasApiKey;
  const step2Done = hasCompletedRun;
  const step3Done = hasProfile;

  const step1Current = !step1Done;
  const step2Current = step1Done && !step2Done;
  const step3Current = step1Done && step2Done && !step3Done;

  return (
    <>
      <section className="text-center space-y-4 mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium uppercase tracking-wider mb-4">
          Quick Start
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
          Welcome to Reticle!
        </h2>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Build, test, and deploy AI scenarios in minutes. We've prepared everything you need to get your first model running.
        </p>
      </section>

      <section className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <button
            type="button"
            onClick={() => openSettings("api-keys")}
            className={`${step1Done ? COMPLETED_STEP_STYLE : step1Current ? CURRENT_STEP_STYLE : FINISHED_STEP_STYLE} group cursor-pointer text-left`}
          >
            <div
              className={`size-12 rounded-2xl flex items-center justify-center mb-6 ${step1Done
                ? "bg-primary/10 text-primary"
                : step1Current
                  ? "bg-primary text-white shadow-lg shadow-indigo-200"
                  : "bg-slate-100 text-slate-500"
                }`}
            >
              {step1Done ? <CheckCircle2 className="size-6" /> : <Key className="size-6" />}
            </div>
            <h4 className="font-bold text-slate-900 mb-2">1. Connect an AI Provider</h4>
            <p className="text-sm text-slate-500 mb-6">
              Add an API key for OpenAI, Anthropic, or Google to unlock running scenarios and agents.
            </p>
            {step1Current && (
              <span className="text-xs font-bold text-primary flex items-center gap-1 group-hover:gap-2 transition-all cursor-pointer">
                Setup Keys <ArrowRight className="size-3" />
              </span>
            )}
            {step1Done && (
              <span className="text-xs font-bold text-primary">Completed</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage("scenarios")}
            className={`${step2Done ? COMPLETED_STEP_STYLE : step2Current ? CURRENT_STEP_STYLE : FINISHED_STEP_STYLE} group cursor-pointer text-left`}
          >
            <div
              className={`size-12 rounded-2xl flex items-center justify-center mb-6 ${step2Done
                ? "bg-primary/10 text-primary"
                : step2Current
                  ? "bg-primary text-white shadow-lg shadow-indigo-200"
                  : "bg-slate-100 text-slate-500"
                }`}
            >
              {step2Done ? <CheckCircle2 className="size-6" /> : <LayoutDashboard className="size-6" />}
            </div>
            <h4 className="font-bold text-slate-900 mb-2">2. Run Your First Scenario</h4>
            <p className="text-sm text-slate-500 mb-6">
              Write a prompt, pick a model, and run it — you'll see token usage and cost in real time.
            </p>
            {step2Current && (
              <span className="text-xs font-bold text-primary flex items-center gap-1 group-hover:gap-2 transition-all cursor-pointer">
                Open Studio <ArrowRight className="size-3" />
              </span>
            )}
            {step2Done && (
              <span className="text-xs font-bold text-primary">Completed</span>
            )}
          </button>

          <div
            className={`${step3Done ? COMPLETED_STEP_STYLE : step3Current ? CURRENT_STEP_STYLE : FINISHED_STEP_STYLE} text-left`}
          >
            <div
              className={`size-12 rounded-2xl flex items-center justify-center mb-6 ${step3Done
                ? "bg-primary/10 text-primary"
                : step3Current
                  ? "bg-primary text-white shadow-lg shadow-indigo-200"
                  : "bg-slate-100 text-slate-500"
                }`}
            >
              {step3Done ? <CheckCircle2 className="size-6" /> : <UserCircle className="size-6" />}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-bold text-slate-900">3. Complete Your Profile</h4>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                Optional
              </span>
            </div>
            <p className="text-sm text-slate-500 mb-6">
              Add your name and avatar so the dashboard greets you properly.
            </p>
            {step3Current && (
              <div className="flex items-center gap-3 justify-between">
                <button
                  type="button"
                  onClick={() => openSettings("account")}
                  className="text-xs font-bold text-primary flex items-center gap-1 hover:gap-2 transition-all cursor-pointer"
                >
                  Set this up <ArrowRight className="size-3" />
                </button>
                <button
                  type="button"
                  onClick={onSkipProfile}
                  className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  Skip for now
                </button>
              </div>
            )}
            {step3Done && (
              <span className="text-xs font-bold text-primary">Completed</span>
            )}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 rounded-3xl p-10 border border-slate-200">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-1">
            <h3 className="text-2xl font-bold text-slate-800 mb-4">Learning Path</h3>
            <p className="text-slate-500 leading-relaxed mb-6">
              Master the platform with our step-by-step guide designed to take you from novice to expert.
            </p>
            <a
              className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
              href="https://docs.reticle.run"
              target="_blank"
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
          <a className="hover:text-primary transition-colors" href="https://reticle.run/privacy">
            Privacy Policy
          </a>
          <a className="hover:text-primary transition-colors" href="https://reticle.run/terms">
            Terms of Service
          </a>
        </div>
      </div>
    </>
  );
}

export default OnboardingView;
