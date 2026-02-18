import type { RunRecord } from "./types";

export const mockRuns: RunRecord[] = [
  { id: "run-1", status: "success", loops: 3, tokens: "2.3k", cost: "$0.014", latency: "4.2s", timestamp: "2h ago" },
  { id: "run-2", status: "error", loops: 5, tokens: "5.1k", cost: "$0.032", latency: "12.4s", timestamp: "5h ago" },
  { id: "run-3", status: "success", loops: 2, tokens: "1.1k", cost: "$0.007", latency: "2.8s", timestamp: "1d ago" },
  { id: "run-4", status: "success", loops: 4, tokens: "3.4k", cost: "$0.021", latency: "6.1s", timestamp: "2d ago" },
];
