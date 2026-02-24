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
import { insertTelemetryEvent } from '@/lib/storage';

type TelemetryAttributeValue = string | number | boolean | null | undefined;
type TelemetryAttributes = Record<string, TelemetryAttributeValue>;

const TELEMETRY_CONSOLE_ENABLED = false; // console logging flag
const TELEMETRY_PERSIST_ENABLED = true; // database persistence flag
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
  if (isInitialized) {
    return;
  }

  const provider = new WebTracerProvider(
    TELEMETRY_CONSOLE_ENABLED
      ? {
          spanProcessors: [new SimpleSpanProcessor(new ConsoleSpanExporter())],
        }
      : undefined
  );

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

function persistEvent(
  eventName: TelemetryEventName,
  attributes: Attributes,
  traceId: string,
  spanId: string
): void {
  if (!TELEMETRY_PERSIST_ENABLED) {
    return;
  }

  void insertTelemetryEvent({
    name: eventName,
    attributes_json: JSON.stringify(attributes),
    trace_id: traceId,
    span_id: spanId,
    occurred_at: Date.now(),
  }).catch(() => {
    // Avoid breaking product flows due to telemetry persistence errors.
  });
}

export function trackEvent(
  eventName: TelemetryEventName,
  attributes: TelemetryAttributes = {}
): void {
  const normalizedAttributes = normalizeAttributes(attributes);

  const tracer = trace.getTracer(TRACER_NAME, TRACER_VERSION);
  const span = tracer.startSpan(eventName, {
    attributes: normalizedAttributes,
  });

  const spanContext = span.spanContext();

  span.end();
  persistEvent(
    eventName,
    normalizedAttributes,
    spanContext.traceId,
    spanContext.spanId
  );
}

export function trackEventOnce(
  key: string,
  eventName: TelemetryEventName,
  attributes: TelemetryAttributes = {}
): void {
  if (emittedOnceKeys.has(key)) {
    return;
  }

  emittedOnceKeys.add(key);
  trackEvent(eventName, attributes);
}
