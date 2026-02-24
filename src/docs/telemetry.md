# Telemetry Reference (Current Implementation)

This document describes the telemetry that is currently implemented in the Reticle frontend.

## Goal of current setup

- Use OpenTelemetry instrumentation in the Vite app.
- Emit telemetry to browser console (development only).
- Track selected product/domain events explicitly (navigation + scenario save/run lifecycle).

## Important mental model

There is **no automatic detection** of custom business events.

- `initTelemetry()` configures telemetry infrastructure (provider/exporter/tracer).
- `trackEvent(...)` emits a telemetry event.
- If you want to track a user action/domain event, you still add `trackEvent(...)` at the relevant code boundary.

Auto-instrumentation can exist for low-level APIs (like network), but this repo’s current setup tracks domain events manually.

## Current architecture

### 1) Bootstrap

File: `src/main.tsx`

- Calls `initTelemetry()` once at app startup.
- Runs before React render.

### 2) Telemetry module

Folder: `src/lib/telemetry`

- `events.ts`
  - Central registry of supported event names (`TELEMETRY_EVENTS`).
- `client.ts`
  - Initializes OpenTelemetry provider.
  - Uses `WebTracerProvider` + `SimpleSpanProcessor` + `ConsoleSpanExporter`.
  - Exposes:
    - `initTelemetry()`
    - `trackEvent(eventName, attributes?)`
    - `trackEventOnce(key, eventName, attributes?)`
- `index.ts`
  - Re-exports telemetry API.

### 3) Instrumentation points (where events are emitted)

- `src/contexts/AppContext.tsx`
  - Emits page navigation event on `setCurrentPage` transition.

- `src/actions/scenarioActions.ts`
  - Emits scenario save lifecycle events.
  - Emits scenario run lifecycle events.

## Environment behavior

Telemetry is enabled only in development:

- Guard: `const TELEMETRY_ENABLED = import.meta.env.DEV` in `client.ts`.
- In production builds, current telemetry emits nothing.

## Event catalog (current)

From `src/lib/telemetry/events.ts`:

- `telemetry.initialized`
- `ui.navigation.page_changed`
- `scenario.save.started`
- `scenario.save.succeeded`
- `scenario.save.failed`
- `scenario.run.started`
- `scenario.run.succeeded`
- `scenario.run.failed`

## Attributes currently emitted

### Navigation

Event: `ui.navigation.page_changed`

- `from_page`
- `to_page`
- `settings_section` (optional)

### Scenario save lifecycle

Event: `scenario.save.started`

- `save_mode` (`create` | `update`)
- `has_scenario_id`
- `history_view_mode`
- `tools_count`
- `attachments_count`

Event: `scenario.save.succeeded`

- `save_mode`
- `scenario_id`
- `tools_count`
- `attachments_count`

Event: `scenario.save.failed`

- `save_mode`
- `error_message`

### Scenario run lifecycle

Event: `scenario.run.started`

- `scenario_id`
- `provider`
- `model`
- `history_items`
- `tools_count`
- `attachments_count`

Event: `scenario.run.succeeded`

- `scenario_id`
- `provider`
- `model`
- `latency_ms`
- `prompt_tokens`
- `completion_tokens`
- `total_tokens`
- `tool_calls_count`
- `model_steps_count`

Event: `scenario.run.failed`

- `scenario_id`
- `provider`
- `model`
- `error_message`

## Why this works

When `trackEvent(...)` is called:

1. Tracer is retrieved via `trace.getTracer(...)`.
2. A span is created with the event name and attributes.
3. Span is ended immediately.
4. Console exporter prints span data in the browser dev console.

So the telemetry system does **not** infer domain events by itself; it exports events you explicitly emit.

## Duplicate/event-noise controls

`trackEventOnce(...)` exists to suppress duplicate one-time events by key.

Current usage:

- Used for `telemetry.initialized` in `initTelemetry()`.

## How to add a new event (recommended process)

1. Add event name constant in `src/lib/telemetry/events.ts`.
2. Add `trackEvent(...)` call at the domain boundary where intent is clear.
   - Prefer action/context/service boundaries over low-level UI leaf components.
3. Include stable, useful attributes (ids, mode, outcome, counts, latency).
4. Avoid PII/secrets in attributes.
5. Verify in dev console by reproducing the action.

## Example pattern

```ts
import { TELEMETRY_EVENTS, trackEvent } from '@/lib/telemetry';

trackEvent(TELEMETRY_EVENTS.SCENARIO_RUN_STARTED, {
  scenario_id: currentScenario.id,
  provider: configuration.provider,
  model: configuration.model,
});
```

## Future extension path (when needed)

If you later want remote collection (not only console):

- Keep `trackEvent(...)` usage unchanged.
- Replace/add span exporter in `initTelemetry()` (for example OTLP HTTP exporter).
- Add endpoint + auth config per environment.
- Optionally keep console exporter in dev for debugging.

## Ownership / source of truth

- Event names and schema source of truth: `src/lib/telemetry/events.ts`
- Runtime behavior source of truth: `src/lib/telemetry/client.ts`
- Instrumentation coverage source of truth:
  - `src/contexts/AppContext.tsx`
  - `src/actions/scenarioActions.ts`
