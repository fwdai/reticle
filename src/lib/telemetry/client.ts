import { trace, type Attributes } from '@opentelemetry/api';
import {
  ConsoleSpanExporter,
  SimpleSpanProcessor,
  WebTracerProvider,
} from '@opentelemetry/sdk-trace-web';
import {
  TELEMETRY_EVENTS,
  type TelemetryEventName,
} from '@/lib/telemetry/events';

type TelemetryAttributeValue = string | number | boolean | null | undefined;
type TelemetryAttributes = Record<string, TelemetryAttributeValue>;

const TELEMETRY_ENABLED = import.meta.env.DEV;
const TRACER_NAME = 'reticle.frontend';
const TRACER_VERSION = '0.1.0';

let isInitialized = false;
const emittedOnceKeys = new Set<string>();

function normalizeAttributes(attributes: TelemetryAttributes): Attributes {
  const normalized: Attributes = {};

  for (const [key, value] of Object.entries(attributes)) {
    if (value == null) {
      continue;
    }

    normalized[key] = value;
  }

  return normalized;
}

export function initTelemetry(): void {
  if (!TELEMETRY_ENABLED || isInitialized) {
    return;
  }

  const provider = new WebTracerProvider({
    spanProcessors: [new SimpleSpanProcessor(new ConsoleSpanExporter())],
  });

  provider.register();
  isInitialized = true;

  trackEventOnce(
    'telemetry_initialized',
    TELEMETRY_EVENTS.TELEMETRY_INITIALIZED,
    {
      env_mode: import.meta.env.MODE,
    }
  );
}

export function trackEvent(
  eventName: TelemetryEventName,
  attributes: TelemetryAttributes = {}
): void {
  if (!TELEMETRY_ENABLED) {
    return;
  }

  const tracer = trace.getTracer(TRACER_NAME, TRACER_VERSION);
  const span = tracer.startSpan(eventName, {
    attributes: normalizeAttributes(attributes),
  });

  span.end();
}

export function trackEventOnce(
  key: string,
  eventName: TelemetryEventName,
  attributes: TelemetryAttributes = {}
): void {
  if (!TELEMETRY_ENABLED || emittedOnceKeys.has(key)) {
    return;
  }

  emittedOnceKeys.add(key);
  trackEvent(eventName, attributes);
}
