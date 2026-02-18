export interface RunRecord {
  id: string;
  status: "success" | "error" | "running";
  loops: number;
  tokens: string;
  cost: string;
  latency: string;
  timestamp: string;
}
