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
