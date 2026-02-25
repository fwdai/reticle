import { useState, useEffect } from "react";
import { hasApiKeys } from "@/lib/storage";
import { listScenarios, listAgents, listExecutions } from "@/lib/storage";

export interface OnboardingStatus {
  isLoading: boolean;
  hasApiKey: boolean;
  hasScenarioOrAgent: boolean;
  hasCompletedRun: boolean;
  isComplete: boolean;
}

export function useOnboardingStatus(): OnboardingStatus {
  const [status, setStatus] = useState<OnboardingStatus>({
    isLoading: true,
    hasApiKey: false,
    hasScenarioOrAgent: false,
    hasCompletedRun: false,
    isComplete: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const [apiKeys, scenarios, agents, executions] = await Promise.all([
          hasApiKeys(),
          listScenarios(),
          listAgents(),
          listExecutions({ limit: 100 }),
        ]);

        if (cancelled) return;

        const hasScenarioOrAgent = scenarios.length > 0 || agents.length > 0;
        const hasCompletedRun = executions.some(
          (e) => e.status === "succeeded" && e.started_at != null
        );

        setStatus({
          isLoading: false,
          hasApiKey: apiKeys,
          hasScenarioOrAgent,
          hasCompletedRun,
          isComplete: apiKeys && hasScenarioOrAgent && hasCompletedRun,
        });
      } catch (err) {
        if (!cancelled) {
          setStatus({
            isLoading: false,
            hasApiKey: false,
            hasScenarioOrAgent: false,
            hasCompletedRun: false,
            isComplete: false,
          });
        }
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
