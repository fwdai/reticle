// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/storage', () => ({
  insertExecution: vi.fn(),
  updateExecution: vi.fn(),
  insertScenario: vi.fn(),
  updateScenario: vi.fn(),
  upsertToolsForScenario: vi.fn(),
  upsertAttachmentsForScenario: vi.fn(),
  listToolsForEntity: vi.fn(),
  listEnvVariables: vi.fn(),
}));

vi.mock('@/lib/gateway', () => ({
  streamText: vi.fn(),
  extractStepsAndToolCalls: vi.fn(),
}));

// Mock the whole telemetry module — we don't assert on telemetry events here
// (they have their own test suite). We just need the import to work.
vi.mock('@/lib/telemetry', () => ({
  trackEvent: vi.fn(),
  TELEMETRY_EVENTS: {
    SCENARIO_SAVE_STARTED: 'scenario.save.started',
    SCENARIO_SAVE_SUCCEEDED: 'scenario.save.succeeded',
    SCENARIO_SAVE_FAILED: 'scenario.save.failed',
    SCENARIO_RUN_STARTED: 'scenario.run.started',
    SCENARIO_RUN_SUCCEEDED: 'scenario.run.succeeded',
    SCENARIO_RUN_FAILED: 'scenario.run.failed',
  },
}));

import { saveScenarioAction, runScenarioAction } from '@/actions/scenarioActions';
import * as storage from '@/lib/storage';
import * as gateway from '@/lib/gateway';

const mockInsertScenario = vi.mocked(storage.insertScenario);
const mockUpdateScenario = vi.mocked(storage.updateScenario);
const mockInsertExecution = vi.mocked(storage.insertExecution);
const mockUpdateExecution = vi.mocked(storage.updateExecution);
const mockListEnvVariables = vi.mocked(storage.listEnvVariables);
const mockListToolsForEntity = vi.mocked(storage.listToolsForEntity);
const mockStreamText = vi.mocked(gateway.streamText);
const mockExtractSteps = vi.mocked(gateway.extractStepsAndToolCalls);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Simulates React's dispatch by applying each updater (function or value) to
 * the accumulated state. This lets us check the *final* state regardless of
 * how many times setStudioState is called internally — safe to refactor.
 */
function makeDispatch(initial: Record<string, any> = {}) {
  let state = structuredClone(initial);
  const dispatch = vi.fn().mockImplementation((updater: any) => {
    state = typeof updater === 'function' ? updater(state) : { ...state, ...updater };
  });
  return { dispatch, getState: () => state };
}

function makeScenarioState(overrides: Record<string, any> = {}) {
  const { currentScenario: csOverrides, ...rest } = overrides;
  return {
    scenarioId: null,
    savedScenarios: [],
    historyViewMode: 'visual',
    historyJsonDraft: '[]',
    isSaving: false,
    isSaved: false,
    currentScenario: {
      id: null,
      name: 'My Scenario',
      collection_id: 'col-1',
      systemPrompt: 'You are helpful.',
      userPrompt: 'Hello',
      history: [],
      tools: [],
      attachments: [],
      systemVariables: [],
      userVariables: [],
      createdAt: null,
      configuration: { provider: 'openai', model: 'gpt-4o', temperature: 0.7, topP: 1, maxTokens: 1000 },
      ...csOverrides,
    },
    ...rest,
  };
}

function makeRunState(overrides: Record<string, any> = {}) {
  const { currentScenario: csOverrides, ...rest } = overrides;
  return {
    isLoading: false,
    response: null,
    currentExecutionId: null,
    currentScenario: {
      id: 'scenario-1',
      name: 'Test Scenario',
      systemPrompt: 'You are helpful.',
      userPrompt: 'Tell me something.',
      history: [],
      tools: [],
      attachments: [],
      systemVariables: [],
      userVariables: [],
      configuration: { provider: 'openai', model: 'gpt-4o', temperature: 0.7, topP: 1, maxTokens: 1000 },
      ...csOverrides,
    },
    ...rest,
  };
}

function makeStreamResult({
  chunks = ['Hello', ' world'],
  inputTokens = 10,
  outputTokens = 20,
  totalTokens = 30,
  latency = 100,
  steps = [] as any[],
} = {}) {
  return {
    textStream: (async function* () { for (const c of chunks) yield c; })(),
    text: Promise.resolve(chunks.join('')),
    totalUsage: Promise.resolve({ inputTokens, outputTokens, totalTokens }),
    steps: Promise.resolve(steps),
    latency,
  } as unknown as Awaited<ReturnType<typeof gateway.streamText>>;
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});

  mockInsertScenario.mockResolvedValue('scenario-new');
  mockUpdateScenario.mockResolvedValue(undefined as any);
  mockInsertExecution.mockResolvedValue('exec-1');
  mockUpdateExecution.mockResolvedValue(undefined as any);
  mockListEnvVariables.mockResolvedValue([]);
  mockListToolsForEntity.mockResolvedValue([]);
  vi.mocked(storage.upsertToolsForScenario).mockResolvedValue(undefined as any);
  vi.mocked(storage.upsertAttachmentsForScenario).mockResolvedValue(undefined as any);
  mockExtractSteps.mockReturnValue({ modelSteps: [], toolCalls: [] });
});

// ===========================================================================
// saveScenarioAction
// ===========================================================================

describe('saveScenarioAction', () => {
  describe('creating a new scenario', () => {
    it('inserts the scenario with the correct fields', async () => {
      const state = makeScenarioState();
      const { dispatch } = makeDispatch(state);

      await saveScenarioAction(state as any, dispatch, vi.fn(), null);

      expect(mockInsertScenario).toHaveBeenCalledWith(expect.objectContaining({
        title: 'My Scenario',
        provider: 'openai',
        model: 'gpt-4o',
        system_prompt: 'You are helpful.',
        user_prompt: 'Hello',
      }));
      expect(mockUpdateScenario).not.toHaveBeenCalled();
    });

    it('uses the scenarioName argument as the title when provided', async () => {
      const state = makeScenarioState();
      const { dispatch } = makeDispatch(state);

      await saveScenarioAction(state as any, dispatch, vi.fn(), 'Override Name');

      expect(mockInsertScenario).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Override Name',
      }));
    });

    it('final state has isSaved: true with the new ID assigned to scenarioId', async () => {
      mockInsertScenario.mockResolvedValue('new-id-123');
      const state = makeScenarioState();
      const { dispatch, getState } = makeDispatch(state);

      await saveScenarioAction(state as any, dispatch, vi.fn(), null);

      expect(getState().isSaved).toBe(true);
      expect(getState().scenarioId).toBe('new-id-123');
    });

    it('persists the new scenario ID to localStorage', async () => {
      mockInsertScenario.mockResolvedValue('new-id-123');
      const state = makeScenarioState();
      const { dispatch } = makeDispatch(state);

      await saveScenarioAction(state as any, dispatch, vi.fn(), null);

      expect(localStorage.getItem('lastUsedScenarioId')).toBe('new-id-123');
    });
  });

  describe('updating an existing scenario', () => {
    function existingState() {
      return makeScenarioState({
        scenarioId: 'existing-id',
        savedScenarios: [{ id: 'existing-id' }],
        currentScenario: { id: 'existing-id', createdAt: '2024-01-01T00:00:00.000Z' },
      });
    }

    it('calls updateScenario and does not call insertScenario', async () => {
      const state = existingState();
      const { dispatch } = makeDispatch(state);

      await saveScenarioAction(state as any, dispatch, vi.fn(), null);

      expect(mockUpdateScenario).toHaveBeenCalledWith('existing-id', expect.objectContaining({
        title: 'My Scenario',
      }));
      expect(mockInsertScenario).not.toHaveBeenCalled();
    });

    it('final state keeps the existing scenarioId', async () => {
      const state = existingState();
      const { dispatch, getState } = makeDispatch(state);

      await saveScenarioAction(state as any, dispatch, vi.fn(), null);

      expect(getState().scenarioId).toBe('existing-id');
    });
  });

  describe('history saved to DB', () => {
    it('uses the JSON draft when historyViewMode is "json"', async () => {
      const draftHistory = [{ role: 'user', content: 'from draft' }];
      const state = makeScenarioState({
        historyViewMode: 'json',
        historyJsonDraft: JSON.stringify(draftHistory),
      });
      const { dispatch } = makeDispatch(state);

      await saveScenarioAction(state as any, dispatch, vi.fn(), null);

      const saved = JSON.parse(mockInsertScenario.mock.calls[0][0].history_json ?? '[]');
      expect(saved).toEqual(draftHistory);
    });

    it('falls back to visual history when the JSON draft is invalid', async () => {
      const visualHistory = [{ role: 'assistant', content: 'visual reply' }];
      const state = makeScenarioState({
        historyViewMode: 'json',
        historyJsonDraft: '{ bad json }}}',
        currentScenario: { history: visualHistory },
      });
      const { dispatch } = makeDispatch(state);

      await saveScenarioAction(state as any, dispatch, vi.fn(), null);

      const saved = JSON.parse(mockInsertScenario.mock.calls[0][0].history_json ?? '[]');
      expect(saved).toEqual(visualHistory);
    });

    it('uses visual history directly when historyViewMode is "visual"', async () => {
      const visualHistory = [{ role: 'user', content: 'visual message' }];
      const state = makeScenarioState({
        historyViewMode: 'visual',
        currentScenario: { history: visualHistory },
      });
      const { dispatch } = makeDispatch(state);

      await saveScenarioAction(state as any, dispatch, vi.fn(), null);

      const saved = JSON.parse(mockInsertScenario.mock.calls[0][0].history_json ?? '[]');
      expect(saved).toEqual(visualHistory);
    });
  });

  describe('error handling', () => {
    it('leaves isSaving: false when storage throws', async () => {
      mockInsertScenario.mockRejectedValue(new Error('db error'));
      const state = makeScenarioState();
      const { dispatch, getState } = makeDispatch(state);

      await saveScenarioAction(state as any, dispatch, vi.fn(), null);

      expect(getState().isSaving).toBe(false);
    });
  });
});

// ===========================================================================
// runScenarioAction
// ===========================================================================

describe('runScenarioAction', () => {
  describe('prompt variable substitution', () => {
    it('substitutes env vars and scenario-level variables before calling streamText', async () => {
      mockListEnvVariables.mockResolvedValue([{ id: 'ev-1', key: 'ENV', value: 'env-val', is_secret: 0 }]);
      mockStreamText.mockResolvedValue(makeStreamResult());

      const state = makeRunState({
        currentScenario: {
          systemPrompt: 'System: {{ENV}} {{SYS}}',
          userPrompt: 'User: {{ENV}} {{USR}}',
          systemVariables: [{ key: 'SYS', value: 'sys-val' }],
          userVariables: [{ key: 'USR', value: 'usr-val' }],
        },
      });
      const { dispatch } = makeDispatch(state);

      await runScenarioAction(state as any, dispatch);

      // streamText(userPrompt, systemPrompt, ...)
      expect(mockStreamText).toHaveBeenCalledWith(
        'User: env-val usr-val',
        'System: env-val sys-val',
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        undefined
      );
    });
  });

  describe('successful run', () => {
    it('final state has the accumulated response text and isLoading: false', async () => {
      mockStreamText.mockResolvedValue(makeStreamResult({ chunks: ['Hel', 'lo', ' world'] }));
      const state = makeRunState();
      const { dispatch, getState } = makeDispatch(state);

      await runScenarioAction(state as any, dispatch);

      expect(getState().response.text).toBe('Hello world');
      expect(getState().isLoading).toBe(false);
    });

    it('final state includes usage counters from the stream', async () => {
      mockStreamText.mockResolvedValue(
        makeStreamResult({ inputTokens: 5, outputTokens: 10, totalTokens: 15 })
      );
      const state = makeRunState();
      const { dispatch, getState } = makeDispatch(state);

      await runScenarioAction(state as any, dispatch);

      expect(getState().response.usage).toMatchObject({
        promptTokens: 5,
        completionTokens: 10,
        totalTokens: 15,
      });
    });

    it('final state includes latency from the stream', async () => {
      mockStreamText.mockResolvedValue(makeStreamResult({ latency: 250 }));
      const state = makeRunState();
      const { dispatch, getState } = makeDispatch(state);

      await runScenarioAction(state as any, dispatch);

      expect(getState().response.latency).toBe(250);
    });

    it('saves the execution as succeeded with the final text in result_json', async () => {
      mockStreamText.mockResolvedValue(makeStreamResult({ chunks: ['Done'] }));
      const state = makeRunState();
      const { dispatch } = makeDispatch(state);

      await runScenarioAction(state as any, dispatch);

      expect(mockUpdateExecution).toHaveBeenCalledWith('exec-1', expect.objectContaining({
        status: 'succeeded',
        result_json: expect.stringContaining('Done'),
      }));
    });

    it('includes latency in the saved usage_json', async () => {
      mockStreamText.mockResolvedValue(makeStreamResult({ latency: 321 }));
      const state = makeRunState();
      const { dispatch } = makeDispatch(state);

      await runScenarioAction(state as any, dispatch);

      const savedUsage = JSON.parse((mockUpdateExecution.mock.calls[0][1] as any).usage_json);
      expect(savedUsage.latency_ms).toBe(321);
    });

    it('stores tool_calls_json and steps_json in the execution when tool calls are present', async () => {
      const fakeSteps = [{ text: '', finishReason: 'tool_calls', usage: {}, toolCalls: [], toolResults: [] }];
      mockStreamText.mockResolvedValue(makeStreamResult({ steps: fakeSteps }));
      mockExtractSteps.mockReturnValue({
        modelSteps: [{ stepIndex: 0, text: '', finishReason: 'tool_calls', usage: {} }],
        toolCalls: [{ id: 'tc-1', name: 'search', arguments: {}, stepIndex: 0, elapsed_ms: 0 }],
      });
      const state = makeRunState();
      const { dispatch } = makeDispatch(state);

      await runScenarioAction(state as any, dispatch);

      const saved = mockUpdateExecution.mock.calls[0][1] as any;
      expect(JSON.parse(saved.tool_calls_json)).toHaveLength(1);
      expect(JSON.parse(saved.steps_json)).toHaveLength(1);
    });

    it('omits tool_calls_json and steps_json from the execution when there are no tool calls', async () => {
      mockStreamText.mockResolvedValue(makeStreamResult());
      const state = makeRunState();
      const { dispatch } = makeDispatch(state);

      await runScenarioAction(state as any, dispatch);

      const saved = mockUpdateExecution.mock.calls[0][1] as any;
      expect(saved.tool_calls_json).toBeUndefined();
      expect(saved.steps_json).toBeUndefined();
    });
  });

  describe('user abort', () => {
    it('saves the execution as failed with "Cancelled by user"', async () => {
      const abortErr = Object.assign(new Error('Aborted'), { name: 'AbortError' });
      mockStreamText.mockRejectedValue(abortErr);
      const state = makeRunState();
      const { dispatch } = makeDispatch(state);

      await runScenarioAction(state as any, dispatch);

      expect(mockUpdateExecution).toHaveBeenCalledWith('exec-1', expect.objectContaining({
        status: 'failed',
        error_json: expect.stringContaining('Cancelled by user'),
      }));
    });

    it('final state has the cancellation message and isLoading: false', async () => {
      mockStreamText.mockRejectedValue(Object.assign(new Error(), { name: 'AbortError' }));
      const state = makeRunState();
      const { dispatch, getState } = makeDispatch(state);

      await runScenarioAction(state as any, dispatch);

      expect(getState().response.error).toBe('Cancelled by user');
      expect(getState().isLoading).toBe(false);
    });
  });

  describe('stream error', () => {
    it('saves the execution as failed with the error message', async () => {
      mockStreamText.mockRejectedValue(new Error('API key invalid'));
      const state = makeRunState();
      const { dispatch } = makeDispatch(state);

      await runScenarioAction(state as any, dispatch);

      expect(mockUpdateExecution).toHaveBeenCalledWith('exec-1', expect.objectContaining({
        status: 'failed',
        error_json: expect.stringContaining('API key invalid'),
      }));
    });

    it('final state has the error message and isLoading: false', async () => {
      mockStreamText.mockRejectedValue(new Error('API key invalid'));
      const state = makeRunState();
      const { dispatch, getState } = makeDispatch(state);

      await runScenarioAction(state as any, dispatch);

      expect(getState().response.error).toBe('API key invalid');
      expect(getState().isLoading).toBe(false);
    });
  });
});
