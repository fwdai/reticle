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
import { getSetting } from '@/lib/storage';

type TelemetryAttributeValue = string | number | boolean | null | undefined;
type TelemetryAttributes = Record<string, TelemetryAttributeValue>;
type PendingTelemetryEvent = {
  eventName: TelemetryEventName;
  attributes: TelemetryAttributes;
};

// show telemetry events in console
const SHOW_TELEMETRY_IN_CONSOLE = false;

const TRACER_NAME = 'reticle.frontend';
const TRACER_VERSION = '0.1.0';

let isInitialized = false;
let isProviderRegistered = false;
let initPromise: Promise<void> | null = null;
let isTelemetryEnabled = true;
const pendingEvents: PendingTelemetryEvent[] = [];
const emittedOnceKeys = new Set<string>();

function parseTelemetrySetting(value: string | null): boolean {
  if (value === null) {
    return true;
  }

  try {
    return Boolean(JSON.parse(value));
  } catch {
    return value !== 'false';
  }
}

async function reloadTelemetryEnabledFromDb(): Promise<void> {
  const telemetrySetting = await getSetting('telemetry_enabled');
  isTelemetryEnabled = parseTelemetrySetting(telemetrySetting);
}

function ensureProviderRegistered(): void {
  if (isProviderRegistered) {
    return;
  }

  const provider = new WebTracerProvider(
    SHOW_TELEMETRY_IN_CONSOLE
      ? {
          spanProcessors: [new SimpleSpanProcessor(new ConsoleSpanExporter())],
        }
      : undefined
  );

  provider.register();
  isProviderRegistered = true;
}

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

export async function initTelemetry(): Promise<void> {
  if (isInitialized || initPromise) {
    return initPromise ?? Promise.resolve();
  }

  initPromise = (async () => {
    await reloadTelemetryEnabledFromDb();

    if (isTelemetryEnabled) {
      ensureProviderRegistered();
    }

    isInitialized = true;

    if (isTelemetryEnabled) {
      trackEventOnce(
        'telemetry_initialized',
        TELEMETRY_EVENTS.TELEMETRY_INITIALIZED,
        {
          env_mode: import.meta.env.MODE,
        }
      );

      const queuedEvents = pendingEvents.splice(0, pendingEvents.length);
      for (const queuedEvent of queuedEvents) {
        trackEvent(queuedEvent.eventName, queuedEvent.attributes);
      }
    } else {
      pendingEvents.length = 0;
    }

    initPromise = null;
  })().catch(() => {
    isInitialized = true;
    initPromise = null;
  });

  return initPromise;
}

export async function reloadTelemetrySettings(): Promise<void> {
  if (!isInitialized) {
    await initTelemetry();
    return;
  }

  await reloadTelemetryEnabledFromDb();

  if (isTelemetryEnabled) {
    ensureProviderRegistered();
  }
}

function persistEvent(
  eventName: TelemetryEventName,
  attributes: Attributes,
  traceId: string,
  spanId: string
): void {
  if (!isTelemetryEnabled) {
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
  if (!isInitialized) {
    pendingEvents.push({ eventName, attributes });
    void initTelemetry();
    return;
  }

  if (!isTelemetryEnabled) {
    return;
  }

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
