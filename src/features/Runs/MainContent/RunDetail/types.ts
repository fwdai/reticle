/** Parse the error message stored in execution.error_json, returning undefined if absent or unparseable. */
export function parseExecutionError(error_json: string | null | undefined): string | undefined {
  if (!error_json) return undefined;
  try {
    const err = JSON.parse(error_json) as { message?: string };
    return err.message ?? undefined;
  } catch {
    return undefined;
  }
}

export interface RunDetailRun {
  id: string;
  scenarioName: string;
  status: "success" | "error";
  model: string;
  provider: string;
  latency: string;
  tokens: number;
  cost: string;
  timestamp: string;
}
