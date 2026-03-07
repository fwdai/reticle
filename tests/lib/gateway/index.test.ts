import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('@/lib/runner', () => ({
  writeTempScript: vi.fn(),
  deleteTempScript: vi.fn(),
  runnerSpawn: vi.fn(),
  runnerSend: vi.fn(),
  runnerKill: vi.fn(),
  onRunnerStdout: vi.fn(),
  onRunnerStderr: vi.fn(),
  onRunnerExit: vi.fn(),
}));
vi.mock('@/lib/storage', () => ({ listEnvVariables: vi.fn() }));

import { extractStepsAndToolCalls, listModels } from '@/lib/gateway/index';

// ── extractStepsAndToolCalls ──────────────────────────────────────────────────

function makeStep(overrides: Partial<{
  text: string;
  finishReason: string;
  usage: Record<string, number>;
  toolCalls: any[];
  toolResults: any[];
}> = {}) {
  return {
    text: 'Hello',
    finishReason: 'stop',
    usage: {},
    toolCalls: [],
    toolResults: [],
    ...overrides,
  };
}

describe('extractStepsAndToolCalls', () => {
  it('returns empty arrays for empty input', () => {
    expect(extractStepsAndToolCalls([])).toEqual({ modelSteps: [], toolCalls: [] });
  });

  it('extracts text and finishReason from a step', () => {
    const { modelSteps } = extractStepsAndToolCalls([
      makeStep({ text: 'answer', finishReason: 'stop' }),
    ]);
    expect(modelSteps[0].text).toBe('answer');
    expect(modelSteps[0].finishReason).toBe('stop');
  });

  it('assigns stepIndex as the array index', () => {
    const { modelSteps } = extractStepsAndToolCalls([makeStep(), makeStep(), makeStep()]);
    expect(modelSteps.map((s) => s.stepIndex)).toEqual([0, 1, 2]);
  });

  it('maps inputTokens and outputTokens to prompt and completion tokens', () => {
    const { modelSteps } = extractStepsAndToolCalls([
      makeStep({ usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 } }),
    ]);
    expect(modelSteps[0].usage).toEqual({
      prompt_tokens: 10,
      completion_tokens: 20,
      total_tokens: 30,
    });
  });

  it('falls back to 0 when token counts are missing', () => {
    const { modelSteps } = extractStepsAndToolCalls([makeStep({ usage: {} })]);
    expect(modelSteps[0].usage).toEqual({
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    });
  });

  it('computes totalTokens as inputTokens + outputTokens when totalTokens is absent', () => {
    const { modelSteps } = extractStepsAndToolCalls([
      makeStep({ usage: { inputTokens: 5, outputTokens: 7 } }),
    ]);
    expect(modelSteps[0]!.usage!.total_tokens).toBe(12);
  });

  it('does not include a toolCalls property on the model step when there are none', () => {
    const { modelSteps } = extractStepsAndToolCalls([makeStep({ toolCalls: [] })]);
    expect(modelSteps[0]).not.toHaveProperty('toolCalls');
  });

  it('includes a toolCalls summary on the model step when tool calls are present', () => {
    const { modelSteps } = extractStepsAndToolCalls([
      makeStep({
        toolCalls: [{ toolCallId: 'tc-1', toolName: 'search', input: { q: 'test' } }],
        toolResults: [{ toolCallId: 'tc-1', output: { results: [] } }],
      }),
    ]);
    expect(modelSteps[0].toolCalls).toEqual([
      { id: 'tc-1', name: 'search', arguments: { q: 'test' } },
    ]);
  });

  it('extracts tool calls into the flat toolCalls array with correct fields', () => {
    const { toolCalls } = extractStepsAndToolCalls([
      makeStep({
        toolCalls: [{ toolCallId: 'tc-1', toolName: 'search', input: { q: 'hello' } }],
        toolResults: [{ toolCallId: 'tc-1', output: { hits: 3 } }],
      }),
    ]);
    expect(toolCalls).toHaveLength(1);
    expect(toolCalls[0]).toMatchObject({
      id: 'tc-1',
      name: 'search',
      arguments: { q: 'hello' },
      stepIndex: 0,
      result: { hits: 3 },
      elapsed_ms: 0,
    });
  });

  it('sets result to undefined when there is no matching tool result', () => {
    const { toolCalls } = extractStepsAndToolCalls([
      makeStep({
        toolCalls: [{ toolCallId: 'tc-x', toolName: 'lookup', input: {} }],
        toolResults: [],
      }),
    ]);
    expect(toolCalls[0].result).toBeUndefined();
  });

  it('increments elapsed_ms by 100 per step for tool calls', () => {
    const { toolCalls } = extractStepsAndToolCalls([
      makeStep({
        toolCalls: [{ toolCallId: 'tc-1', toolName: 'a', input: {} }],
        toolResults: [],
      }),
      makeStep({
        toolCalls: [{ toolCallId: 'tc-2', toolName: 'b', input: {} }],
        toolResults: [],
      }),
    ]);
    expect(toolCalls[0].elapsed_ms).toBe(0);
    expect(toolCalls[1].elapsed_ms).toBe(100);
  });

  it('collects tool calls from all steps into one flat array', () => {
    const { toolCalls } = extractStepsAndToolCalls([
      makeStep({
        toolCalls: [{ toolCallId: 'tc-1', toolName: 'a', input: {} }],
        toolResults: [],
      }),
      makeStep({
        toolCalls: [
          { toolCallId: 'tc-2', toolName: 'b', input: {} },
          { toolCallId: 'tc-3', toolName: 'c', input: {} },
        ],
        toolResults: [],
      }),
    ]);
    expect(toolCalls).toHaveLength(3);
  });
});

// ── listModels ────────────────────────────────────────────────────────────────

describe('listModels', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function mockFetch(body: unknown, ok = true, status = 200) {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok,
      status,
      text: () => Promise.resolve(JSON.stringify(body)),
      json: () => Promise.resolve(body),
    });
  }

  it('returns data.data when the response has a data array', async () => {
    const models = [{ id: 'gpt-4' }, { id: 'gpt-3.5' }];
    mockFetch({ data: models });
    const result = await listModels('openai');
    expect(result).toEqual(models);
  });

  it('returns data.models when the response has a models array', async () => {
    const models = [{ id: 'gemini-pro' }];
    mockFetch({ models });
    const result = await listModels('google');
    expect(result).toEqual(models);
  });

  it('returns the array directly when the response body is an array', async () => {
    const models = [{ id: 'claude-3' }];
    mockFetch(models);
    const result = await listModels('anthropic');
    expect(result).toEqual(models);
  });

  it('throws for an unrecognised response format', async () => {
    mockFetch({ unexpected: 'shape' });
    await expect(listModels('openai')).rejects.toThrow('Unexpected response format');
  });

  it('throws when the response is not ok', async () => {
    mockFetch('Bad Request', false, 400);
    await expect(listModels('openai')).rejects.toThrow('Failed to fetch models from openai');
  });

  it('rethrows network-level errors', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network down'));
    await expect(listModels('openai')).rejects.toThrow('network down');
  });
});
