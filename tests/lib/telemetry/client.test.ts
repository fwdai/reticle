import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/storage', () => ({
  insertTelemetryEvent: vi.fn().mockResolvedValue('evt-1'),
  getSetting: vi.fn().mockResolvedValue(null),
}));

vi.mock('@opentelemetry/api', () => ({
  trace: {
    getTracer: vi.fn().mockReturnValue({
      startSpan: vi.fn().mockReturnValue({
        spanContext: vi.fn().mockReturnValue({ traceId: 'trace-1', spanId: 'span-1' }),
        end: vi.fn(),
      }),
    }),
  },
}));

vi.mock('@opentelemetry/sdk-trace-web', () => ({
  // vi.fn() is not constructable in Vite SSR/node mode; use a real function.
  WebTracerProvider: function MockWebTracerProvider() {
    return { register: function() {} };
  },
  SimpleSpanProcessor: vi.fn(),
  ConsoleSpanExporter: vi.fn(),
}));

import type { insertTelemetryEvent, getSetting } from '@/lib/storage';
import type { initTelemetry, trackEvent, trackEventOnce, reloadTelemetrySettings } from '@/lib/telemetry/client';

// Re-imports the module with fresh module-level state for each test.
async function setup(telemetrySetting: string | null = null): Promise<{
  initTelemetry: typeof initTelemetry;
  trackEvent: typeof trackEvent;
  trackEventOnce: typeof trackEventOnce;
  reloadTelemetrySettings: typeof reloadTelemetrySettings;
  mockInsert: ReturnType<typeof vi.mocked<typeof insertTelemetryEvent>>;
  mockGetSetting: ReturnType<typeof vi.mocked<typeof getSetting>>;
}> {
  vi.resetModules();

  const storage = await import('@/lib/storage');
  const mockGetSetting = vi.mocked(storage.getSetting);
  const mockInsert = vi.mocked(storage.insertTelemetryEvent);
  mockGetSetting.mockResolvedValue(telemetrySetting);
  mockInsert.mockResolvedValue('evt-1');

  const client = await import('@/lib/telemetry/client');
  return { ...client, mockInsert, mockGetSetting };
}

// clearAllMocks (not resetAllMocks) so mockReturnValue/mockImplementation set up in
// vi.mock factories are preserved; module state is isolated via vi.resetModules() in setup().
beforeEach(() => vi.clearAllMocks());

// ── parseTelemetrySetting (private — tested via initTelemetry behaviour) ───────

describe('parseTelemetrySetting', () => {
  it('treats null as enabled (default on)', async () => {
    const { initTelemetry, trackEvent, mockInsert } = await setup(null);
    await initTelemetry();
    mockInsert.mockClear();
    trackEvent('scenario.run.started');
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });

  it('treats "false" (valid JSON) as disabled', async () => {
    const { initTelemetry, trackEvent, mockInsert } = await setup('false');
    await initTelemetry();
    mockInsert.mockClear();
    trackEvent('scenario.run.started');
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('treats "0" (valid JSON) as disabled', async () => {
    const { initTelemetry, trackEvent, mockInsert } = await setup('0');
    await initTelemetry();
    mockInsert.mockClear();
    trackEvent('scenario.run.started');
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('treats "true" (valid JSON) as enabled', async () => {
    const { initTelemetry, trackEvent, mockInsert } = await setup('true');
    await initTelemetry();
    mockInsert.mockClear();
    trackEvent('scenario.run.started');
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });

  it('treats invalid JSON that is not "false" as enabled (catch branch)', async () => {
    const { initTelemetry, trackEvent, mockInsert } = await setup('not-json');
    await initTelemetry();
    mockInsert.mockClear();
    trackEvent('scenario.run.started');
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });
});

// ── initTelemetry ──────────────────────────────────────────────────────────────

describe('initTelemetry', () => {
  it('reads telemetry_enabled from settings', async () => {
    const { initTelemetry, mockGetSetting } = await setup();
    await initTelemetry();
    expect(mockGetSetting).toHaveBeenCalledWith('telemetry_enabled');
  });

  it('emits the telemetry_initialized event when enabled', async () => {
    const { initTelemetry, mockInsert } = await setup();
    await initTelemetry();
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      name: 'telemetry.initialized',
    }));
  });

  it('does not emit any event when telemetry is disabled', async () => {
    const { initTelemetry, mockInsert } = await setup('false');
    await initTelemetry();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('is idempotent — getSetting is called only once on repeated calls', async () => {
    const { initTelemetry, mockGetSetting } = await setup();
    await initTelemetry();
    await initTelemetry();
    await initTelemetry();
    expect(mockGetSetting).toHaveBeenCalledTimes(1);
  });

  it('concurrent calls are collapsed into one initialisation', async () => {
    const { initTelemetry, mockGetSetting } = await setup();
    await Promise.all([initTelemetry(), initTelemetry(), initTelemetry()]);
    expect(mockGetSetting).toHaveBeenCalledTimes(1);
  });
});

// ── trackEvent ─────────────────────────────────────────────────────────────────

describe('trackEvent — pre-init queuing', () => {
  it('queues events called before initTelemetry and dispatches them after init', async () => {
    const { initTelemetry, trackEvent, mockInsert } = await setup();

    // Call before init — should queue, not persist immediately
    trackEvent('scenario.run.started');
    expect(mockInsert).not.toHaveBeenCalledWith(expect.objectContaining({ name: 'scenario.run.started' }));

    await initTelemetry();

    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ name: 'scenario.run.started' }));
  });

  it('discards queued events when telemetry is disabled at init time', async () => {
    const { initTelemetry, trackEvent, mockInsert } = await setup('false');

    trackEvent('scenario.run.started');
    await initTelemetry();

    expect(mockInsert).not.toHaveBeenCalled();
  });
});

describe('trackEvent — post-init', () => {
  it('persists the event with correct name and attributes', async () => {
    const { initTelemetry, trackEvent, mockInsert } = await setup();
    await initTelemetry();
    mockInsert.mockClear();

    trackEvent('scenario.run.started', { model: 'gpt-5', tokens: 100 });

    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      name: 'scenario.run.started',
      attributes_json: JSON.stringify({ model: 'gpt-5', tokens: 100 }),
    }));
  });

  it('includes trace_id and span_id from the span context', async () => {
    const { initTelemetry, trackEvent, mockInsert } = await setup();
    await initTelemetry();
    mockInsert.mockClear();

    trackEvent('scenario.run.started');

    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      trace_id: 'trace-1',
      span_id: 'span-1',
    }));
  });

  it('includes a numeric occurred_at timestamp', async () => {
    const { initTelemetry, trackEvent, mockInsert } = await setup();
    await initTelemetry();
    mockInsert.mockClear();

    trackEvent('scenario.run.started');

    const call = mockInsert.mock.calls[0][0] as { occurred_at: unknown };
    expect(typeof call.occurred_at).toBe('number');
  });

  it('does nothing when telemetry is disabled', async () => {
    const { initTelemetry, trackEvent, mockInsert } = await setup('false');
    await initTelemetry();
    mockInsert.mockClear();

    trackEvent('scenario.run.started');

    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('strips null attributes (normalizeAttributes)', async () => {
    const { initTelemetry, trackEvent, mockInsert } = await setup();
    await initTelemetry();
    mockInsert.mockClear();

    trackEvent('scenario.run.started', { model: 'gpt-5', error: null });

    const call = mockInsert.mock.calls[0][0] as { attributes_json: string };
    const attrs = JSON.parse(call.attributes_json);
    expect(attrs).not.toHaveProperty('error');
    expect(attrs.model).toBe('gpt-5');
  });

  it('strips undefined attributes (normalizeAttributes)', async () => {
    const { initTelemetry, trackEvent, mockInsert } = await setup();
    await initTelemetry();
    mockInsert.mockClear();

    trackEvent('scenario.run.started', { model: 'gpt-5', cost: undefined });

    const call = mockInsert.mock.calls[0][0] as { attributes_json: string };
    const attrs = JSON.parse(call.attributes_json);
    expect(attrs).not.toHaveProperty('cost');
  });

  it('keeps string, number and boolean attributes', async () => {
    const { initTelemetry, trackEvent, mockInsert } = await setup();
    await initTelemetry();
    mockInsert.mockClear();

    trackEvent('scenario.run.started', { model: 'gpt-5', tokens: 42, success: true });

    const call = mockInsert.mock.calls[0][0] as { attributes_json: string };
    expect(JSON.parse(call.attributes_json)).toEqual({ model: 'gpt-5', tokens: 42, success: true });
  });
});

// ── trackEventOnce ─────────────────────────────────────────────────────────────

describe('trackEventOnce', () => {
  it('emits the event on the first call', async () => {
    const { initTelemetry, trackEventOnce, mockInsert } = await setup();
    await initTelemetry();
    mockInsert.mockClear();

    trackEventOnce('my-key', 'scenario.run.started');

    expect(mockInsert).toHaveBeenCalledTimes(1);
  });

  it('does not emit again for the same key', async () => {
    const { initTelemetry, trackEventOnce, mockInsert } = await setup();
    await initTelemetry();
    mockInsert.mockClear();

    trackEventOnce('my-key', 'scenario.run.started');
    trackEventOnce('my-key', 'scenario.run.started');
    trackEventOnce('my-key', 'scenario.run.started');

    expect(mockInsert).toHaveBeenCalledTimes(1);
  });

  it('emits independently for different keys', async () => {
    const { initTelemetry, trackEventOnce, mockInsert } = await setup();
    await initTelemetry();
    mockInsert.mockClear();

    trackEventOnce('key-a', 'scenario.run.started');
    trackEventOnce('key-b', 'scenario.run.succeeded');

    expect(mockInsert).toHaveBeenCalledTimes(2);
  });
});

// ── reloadTelemetrySettings ────────────────────────────────────────────────────

describe('reloadTelemetrySettings', () => {
  it('calls initTelemetry (and reads the setting) when not yet initialised', async () => {
    const { reloadTelemetrySettings, mockGetSetting } = await setup();
    await reloadTelemetrySettings();
    expect(mockGetSetting).toHaveBeenCalledWith('telemetry_enabled');
  });

  it('re-reads telemetry_enabled when already initialised', async () => {
    const { initTelemetry, reloadTelemetrySettings, mockGetSetting } = await setup();
    await initTelemetry();
    mockGetSetting.mockClear();

    await reloadTelemetrySettings();

    expect(mockGetSetting).toHaveBeenCalledWith('telemetry_enabled');
  });

  it('disables subsequent events when setting is changed to false', async () => {
    const { initTelemetry, reloadTelemetrySettings, trackEvent, mockInsert, mockGetSetting } = await setup();
    await initTelemetry();

    // Simulate user disabling telemetry
    mockGetSetting.mockResolvedValue('false');
    await reloadTelemetrySettings();
    mockInsert.mockClear();

    trackEvent('scenario.run.started');

    expect(mockInsert).not.toHaveBeenCalled();
  });
});
