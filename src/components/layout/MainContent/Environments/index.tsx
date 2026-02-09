import { Eye, EyeOff, Trash2, ChevronDown } from "lucide-react";
import { useState } from "react";

interface EnvironmentVariable {
  name: string;
  value: string;
  description: string;
  isSecret: boolean;
  isVisible?: boolean;
}

function Environments() {
  const [selectedEnvironment] = useState("Production");
  const [variables, setVariables] = useState<EnvironmentVariable[]>([
    {
      name: "OPENAI_API_KEY",
      value: "sk-proj-abc123xyz789...",
      description: "Primary API key for LLM provider authentication.",
      isSecret: true,
      isVisible: false,
    },
    {
      name: "DATABASE_URL",
      value: "postgresql://db_user:pwd@host...",
      description: "Connection string for the production vector database.",
      isSecret: true,
      isVisible: true,
    },
    {
      name: "DEBUG_MODE",
      value: "false",
      description: "Enables verbose logging for scenario execution.",
      isSecret: false,
    },
    {
      name: "MAX_TOKENS_LIMIT",
      value: "4096",
      description: "Global safety cap for token usage per request.",
      isSecret: false,
    },
  ]);

  const toggleVisibility = (index: number) => {
    setVariables((prev) =>
      prev.map((v, i) => (i === index ? { ...v, isVisible: !v.isVisible } : v))
    );
  };

  const displayValue = (variable: EnvironmentVariable) => {
    if (variable.isSecret && !variable.isVisible) {
      return "••••••••••••••••••••";
    }
    return variable.value;
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white border border-border-light rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-sm font-bold text-text-main uppercase tracking-widest mb-1">Overview</h3>
              <p className="text-sm text-text-muted">
                Manage your deployment secrets and configuration variables for the {selectedEnvironment.toLowerCase()} environment.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="text-right">
                <span className="block text-[10px] font-bold text-text-muted uppercase tracking-tighter">
                  Total Variables
                </span>
                <span className="text-xl font-mono font-bold text-text-main">{variables.length}</span>
              </div>
              <div className="text-right">
                <span className="block text-[10px] font-bold text-text-muted uppercase tracking-tighter">
                  Last Modified
                </span>
                <span className="text-xl font-mono font-bold text-text-main">2h ago</span>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white border border-border-light rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-sidebar-light/50 border-b border-border-light">
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest w-1/4">
                  Variable Name
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest w-1/3">
                  Value
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">
                  Description
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {variables.map((variable, index) => (
                <tr key={variable.name} className="table-row-hover">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm font-medium text-text-main">{variable.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg flex items-center justify-between">
                        <span
                          className={`text-sm font-mono ${variable.isSecret && !variable.isVisible ? "text-text-muted" : "text-text-main"
                            }`}
                        >
                          {displayValue(variable)}
                        </span>
                        {variable.isSecret && (
                          <button
                            className="text-text-muted hover:text-primary transition-colors"
                            onClick={() => toggleVisibility(index)}
                          >
                            {variable.isVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-text-muted">{variable.description}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-text-muted hover:text-red-500 transition-colors">
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-6 py-4 bg-sidebar-light/30 border-t border-border-light flex justify-center">
            <button className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
              <ChevronDown className="size-3" />
              SHOW 20 MORE VARIABLES
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between text-[10px] text-text-muted font-medium uppercase tracking-widest px-2">
          <div className="flex gap-6">
            <span>REGION: US-EAST-1</span>
            <span>ENCRYPTION: AES-256</span>
          </div>
          <span>SYNCED WITH CLOUD PROVIDER • SECONDS AGO</span>
        </div>
      </div>
    </div>
  );
}

export default Environments;
