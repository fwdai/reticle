import { useState, useEffect } from "react";
import { FileCode, Zap, Play } from "lucide-react";
import { useAppContext } from "@/contexts/AppContext";
import { getOrCreateAccount } from "@/lib/storage";
import { ColorTile } from "./ColorTile";
import { ModelUsageCard } from "./ModelUsageCard";
import { TokenCostCard } from "./TokenCostCard";
import { RecentRunsList } from "./RecentRunsList";
import { tilePalettes } from "./constants";
import { useDashboardData } from "./useDashboardData";

export function DashboardView() {
  const { setCurrentPage } = useAppContext();
  const { stats, modelUsage, tokenCost, recentRuns, isLoading } =
    useDashboardData();
  const [accountName, setAccountName] = useState<string | null>(null);

  useEffect(() => {
    getOrCreateAccount()
      .then((acc) => {
        const name = (acc.first_name ?? "").trim();
        setAccountName(name || null);
      })
      .catch(console.error);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-muted-foreground">
        Loading dashboard…
      </div>
    );
  }

  const greeting = accountName
    ? `Welcome back, ${accountName}!`
    : "Welcome back!";

  return (
    <div className="mx-auto max-w-[1200px] animate-fade-in space-y-8 pb-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {greeting}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here's what's happening across your workflows and agents.
        </p>
      </div>

      {/* Colorful stat tiles row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <ColorTile
          palette={tilePalettes[0]}
          label="Scenarios"
          value={stats.scenariosCount}
          icon={FileCode}
          onClick={() => setCurrentPage("studio")}
        />
        <ColorTile
          palette={tilePalettes[1]}
          label="Agents"
          value={stats.agentsCount}
          icon={Zap}
          onClick={() => setCurrentPage("agents")}
        />
        <ColorTile
          palette={tilePalettes[2]}
          label="Runs this week"
          value={stats.runsLastWeek}
          icon={Play}
          subtitle={`${stats.successRate.toFixed(1)}% success`}
          onClick={() => setCurrentPage("runs")}
        />
      </div>

      {/* Middle row: Model Usage + Token & Cost */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ModelUsageCard models={modelUsage} />
        <TokenCostCard data={tokenCost} />
      </div>

      {/* Recent runs — no card wrapper, just on background */}
      <RecentRunsList
        runs={recentRuns}
        onViewAll={() => setCurrentPage("runs")}
      />
    </div>
  );
}
