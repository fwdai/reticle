import Header from "./Header";
import { Key, LayoutDashboard, CheckSquare, ArrowRight, ExternalLink } from "lucide-react";

function HomePage() {
  return (
    <main className="flex-1 flex flex-col min-w-0 bg-white border border-border-light rounded-xl">
      <Header />

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-5xl mx-auto px-10 py-12 space-y-12">
          <section className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
              <span className="size-1.5 bg-indigo-600 rounded-full animate-pulse"></span>
              Reticle Dashboard
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              Welcome to Reticle Hub
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Build, test, and deploy AI scenarios in minutes. We've prepared everything you need to get your first model running.
            </p>
          </section>

          <section>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-slate-800">Quick Start</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="border-2 border-indigo-100 bg-indigo-50/30 rounded-xl p-6 hover:border-indigo-200 transition-colors group cursor-pointer">
                <div className="size-12 bg-primary text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-200">
                  <Key className="size-6" />
                </div>
                <h4 className="font-bold text-slate-900 mb-2">1. Setup API Keys</h4>
                <p className="text-sm text-slate-500 mb-6">
                  Connect your AI provider accounts by adding API keys for OpenAI, Anthropic, or Google.
                </p>
                <span className="text-xs font-bold text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                  Setup Keys <ArrowRight className="size-3" />
                </span>
              </div>

              <div className="border border-slate-200 bg-white rounded-xl p-6 hover:border-slate-300 transition-colors group cursor-pointer">
                <div className="size-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                  <LayoutDashboard className="size-6" />
                </div>
                <h4 className="font-bold text-slate-900 mb-2">2. Configure LLM Call</h4>
                <p className="text-sm text-slate-500 mb-6">
                  Set up your system prompt, choose your model, write your prompt, and configure tool calls.
                </p>
                <span className="text-xs font-bold text-slate-400 group-hover:text-primary transition-colors flex items-center gap-1">
                  Configure <ArrowRight className="size-3" />
                </span>
              </div>

              <div className="border border-slate-200 bg-white rounded-xl p-6 hover:border-slate-300 transition-colors group cursor-pointer">
                <div className="size-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-6">
                  <CheckSquare className="size-6" />
                </div>
                <h4 className="font-bold text-slate-900 mb-2">3. Inspect Results</h4>
                <p className="text-sm text-slate-500 mb-6">
                  Review token usage, costs, and tool invocations to understand your LLM call performance.
                </p>
                <span className="text-xs font-bold text-slate-400 group-hover:text-primary transition-colors flex items-center gap-1">
                  View Results <ArrowRight className="size-3" />
                </span>
              </div>
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
                <span className="size-1.5 bg-blue-500 rounded-full"></span> v2.4.0 Stable
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
    </main>
  );
}

export default HomePage;
