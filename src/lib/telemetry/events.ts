export const TELEMETRY_EVENTS = {
  TELEMETRY_INITIALIZED: "telemetry.initialized",
  PAGE_NAVIGATED: "ui.navigation.page_changed",
  SCENARIO_SAVE_STARTED: "scenario.save.started",
  SCENARIO_SAVE_SUCCEEDED: "scenario.save.succeeded",
  SCENARIO_SAVE_FAILED: "scenario.save.failed",
  SCENARIO_RUN_STARTED: "scenario.run.started",
  SCENARIO_RUN_SUCCEEDED: "scenario.run.succeeded",
  SCENARIO_RUN_FAILED: "scenario.run.failed",
  AGENT_RUN_STARTED: "agent.run.started",
  AGENT_RUN_SUCCEEDED: "agent.run.succeeded",
  AGENT_RUN_FAILED: "agent.run.failed",
} as const;

export type TelemetryEventName =
  (typeof TELEMETRY_EVENTS)[keyof typeof TELEMETRY_EVENTS];
