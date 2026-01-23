import { Search, Plus, Globe, Cloud, Code, Settings, Trash2, Edit2, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";

interface Environment {
  id: string;
  name: string;
  type: "production" | "staging" | "development";
  status: "active" | "inactive";
  apiKey: string;
  baseUrl: string;
  createdAt: string;
  lastUsed: string;
}

function Environments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEnv, setEditingEnv] = useState<Environment | null>(null);

  const [environments, setEnvironments] = useState<Environment[]>([
    {
      id: "env_1",
      name: "Production",
      type: "production",
      status: "active",
      apiKey: "sk-••••••••••••••••••••",
      baseUrl: "https://api.production.example.com",
      createdAt: "2024-01-15",
      lastUsed: "Just now",
    },
    {
      id: "env_2",
      name: "Staging",
      type: "staging",
      status: "active",
      apiKey: "sk-••••••••••••••••••••",
      baseUrl: "https://api.staging.example.com",
      createdAt: "2024-01-20",
      lastUsed: "5 mins ago",
    },
    {
      id: "env_3",
      name: "Development",
      type: "development",
      status: "active",
      apiKey: "sk-••••••••••••••••••••",
      baseUrl: "http://localhost:3000",
      createdAt: "2024-02-01",
      lastUsed: "2 hours ago",
    },
  ]);

  const getTypeIcon = (type: Environment["type"]) => {
    switch (type) {
      case "production":
        return <Globe className="size-4 text-green-600" />;
      case "staging":
        return <Cloud className="size-4 text-blue-600" />;
      case "development":
        return <Code className="size-4 text-purple-600" />;
    }
  };

  const getTypeBadgeColor = (type: Environment["type"]) => {
    switch (type) {
      case "production":
        return "bg-green-50 text-green-700 border-green-200";
      case "staging":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "development":
        return "bg-purple-50 text-purple-700 border-purple-200";
    }
  };

  const filteredEnvironments = environments.filter((env) =>
    env.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden">
      <header className="h-auto min-h-16 border-b border-border-light flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 sm:px-8 py-3 sm:py-0 bg-white/80 backdrop-blur-md sticky top-0 z-10 flex-shrink-0">
        <div className="flex items-center gap-4 flex-shrink-0">
          <h1 className="text-lg font-bold text-text-main">Environments</h1>
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            <span className="size-2 bg-green-500 rounded-full"></span>
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">
              {environments.filter((e) => e.status === "active").length} Active
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted size-4" />
            <input
              className="pl-10 pr-4 py-2 bg-slate-50 border border-border-light rounded-xl text-sm w-full sm:w-80 focus:ring-primary-500 focus:border-primary-500 transition-all"
              placeholder="Search environments..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm flex-shrink-0"
          >
            <Plus className="size-4" />
            New Environment
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl">
          {filteredEnvironments.map((env) => (
            <div
              key={env.id}
              className="bg-white border border-border-light rounded-xl p-6 hover:shadow-lg transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getTypeIcon(env.type)}
                  <div>
                    <h3 className="text-base font-bold text-text-main group-hover:text-primary-600 transition-colors">
                      {env.name}
                    </h3>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border mt-1 ${getTypeBadgeColor(
                        env.type
                      )}`}
                    >
                      {env.type.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {env.status === "active" ? (
                    <CheckCircle className="size-5 text-green-500" />
                  ) : (
                    <XCircle className="size-5 text-gray-400" />
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1 block">
                    API Key
                  </label>
                  <div className="text-xs font-mono text-text-main bg-slate-50 px-3 py-2 rounded border border-border-light">
                    {env.apiKey}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1 block">
                    Base URL
                  </label>
                  <div className="text-xs font-mono text-text-main bg-slate-50 px-3 py-2 rounded border border-border-light">
                    {env.baseUrl}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border-light">
                <div className="text-xs text-text-muted">
                  <div>Created: {env.createdAt}</div>
                  <div>Last used: {env.lastUsed}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingEnv(env)}
                    className="p-2 rounded-lg text-text-muted hover:bg-slate-50 hover:text-primary-600 transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="size-4" />
                  </button>
                  <button
                    className="p-2 rounded-lg text-text-muted hover:bg-slate-50 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredEnvironments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <Globe className="size-12 text-text-muted mb-4" />
            <h3 className="text-lg font-semibold text-text-main mb-2">No environments found</h3>
            <p className="text-sm text-text-muted mb-4">
              {searchQuery ? "Try adjusting your search query" : "Create your first environment to get started"}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
              >
                <Plus className="size-4" />
                New Environment
              </button>
            )}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="p-6 border-b border-border-light">
              <h2 className="text-xl font-bold text-text-main">Create New Environment</h2>
              <p className="text-sm text-text-muted mt-1">Configure a new environment for your workflows</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2 block">
                  Environment Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-border-light rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Production, Staging"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2 block">
                  Type
                </label>
                <select className="w-full px-4 py-2 border border-border-light rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500">
                  <option>Production</option>
                  <option>Staging</option>
                  <option>Development</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2 block">
                  API Key
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-border-light rounded-lg text-sm font-mono focus:ring-primary-500 focus:border-primary-500"
                  placeholder="sk-..."
                />
              </div>
              <div>
                <label className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2 block">
                  Base URL
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-border-light rounded-lg text-sm font-mono focus:ring-primary-500 focus:border-primary-500"
                  placeholder="https://api.example.com"
                />
              </div>
            </div>
            <div className="p-6 border-t border-border-light flex items-center justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-main transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-lg transition-colors"
              >
                Create Environment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Environments;
