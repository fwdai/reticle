// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('ai', () => ({
  streamText: vi.fn(),
  stepCountIs: vi.fn(() => () => false),
  tool: vi.fn((config) => config),
  jsonSchema: vi.fn((schema) => schema),
}));

vi.mock('@/lib/gateway', () => ({
  createModel: vi.fn(() => 'mock-model'),
}));

vi.mock('@/lib/gateway/helpers', () => ({
  toolConfigToAiSdkTools: vi.fn(() => ({})),
}));

vi.mock('@/lib/storage', () => ({
  insertExecution: vi.fn(),
  updateExecution: vi.fn(),
  listToolsForEntity: vi.fn(),
  listEnvVariables: vi.fn(),
  listAgentMemories: vi.fn(),
  saveAgentMemory: vi.fn(),
}));

// Mock telemetry — has its own test suite; we don't assert on it here.
vi.mock('@/lib/telemetry', () => ({
  trackEvent: vi.fn(),
  TELEMETRY_EVENTS: {
    AGENT_RUN_STARTED: 'agent.run.started',
    AGENT_RUN_SUCCEEDED: 'agent.run.succeeded',
    AGENT_RUN_FAILED: 'agent.run.failed',
  },
}));

import { runAgentAction } from '@/actions/agentActions';
import * as aiSdk from 'ai';
import * as storage from '@/lib/storage';
import * as gatewayHelpers from '@/lib/gateway/helpers';
import type { AgentRecord } from '@/types';

const mockAiStreamText = vi.mocked(aiSdk.streamText);
const mockInsertExecution = vi.mocked(storage.insertExecution);
const mockUpdateExecution = vi.mocked(storage.updateExecution);
const mockListEnvVariables = vi.mocked(storage.listEnvVariables);
const mockListAgentMemories = vi.mocked(storage.listAgentMemories);
const mockToolConfigToAiSdkTools = vi.mocked(gatewayHelpers.toolConfigToAiSdkTools);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Simulates React's dispatch by applying each updater (function or object) to
 * the accumulated state — lets us assert on final state without caring about
 * call order or count.
 */
function makeDispatch(initial: Record<string, any> = {}) {
  let state = structuredClone(initial);
  const dispatch = vi.fn().mockImplementation((updater: any) => {
    state = typeof updater === 'function' ? updater(state) : { ...state, ...updater };
  });
  return { dispatch, getState: () => state };
}

function makeAgent(overrides: Partial<AgentRecord> = {}): AgentRecord {
  return {
    id: 'agent-1',
    name: 'Test Agent',
    provider: 'openai',
    model: 'gpt-4o',
    params_json: '{}',
    agent_goal: 'Do stuff',
    system_instructions: null,
    tools_json: '[]',
    max_iterations: 10,
    timeout_seconds: 0,
    retry_policy: 'default',
    tool_call_strategy: 'auto',
    memory_enabled: 0,
    memory_source: 'local',
    ...overrides,
  };
}

/**
 * Creates a mock return value for the mocked AI SDK streamText.
 * `chunks` are yielded in order from fullStream; `text` is what `await result.text` resolves to.
 */
function makeFullStream(chunks: object[] = [], text = '') {
  return {
    fullStream: (async function* () {
      for (const c of chunks) yield c;
    })(),
    text: Promise.resolve(text),
  };
}

/** Stream that throws an AbortError from the generator — simulates user cancellation. */
function makeAbortStream() {
  const err = Object.assign(new Error('Aborted'), { name: 'AbortError' });
  return {
    fullStream: (async function* () { throw err; })(),
    text: Promise.resolve(''), // never reached
  };
}

/** Stream that throws a regular error from the generator. */
function makeErrorStream(message: string) {
  const err = new Error(message);
  return {
    fullStream: (async function* () { throw err; })(),
    text: Promise.resolve(''), // never reached
  };
}

const INITIAL: Record<string, any> = { status: 'idle', steps: [] };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});

  mockInsertExecution.mockResolvedValue('exec-1');
  mockUpdateExecution.mockResolvedValue(undefined as any);
  vi.mocked(storage.listToolsForEntity).mockResolvedValue([]);
  mockListEnvVariables.mockResolvedValue([]);
  mockListAgentMemories.mockResolvedValue([]);
  mockToolConfigToAiSdkTools.mockReturnValue({});
  mockAiStreamText.mockReturnValue(makeFullStream() as any);
});

// ===========================================================================
// runAgentAction
// ===========================================================================

describe('runAgentAction', () => {
  // ── Setup ──────────────────────────────────────────────────────────────────

  describe('setup', () => {
    it('inserts an execution record with type agent and status running', async () => {
      const { dispatch } = makeDispatch(INITIAL);
      await runAgentAction(makeAgent(), 'my task', dispatch);

      expect(mockInsertExecution).toHaveBeenCalledWith(expect.objectContaining({
        type: 'agent',
        runnable_id: 'agent-1',
        status: 'running',
      }));
    });

    it('sets provider and model on execution state from the agent record', async () => {
      const { dispatch, getState } = makeDispatch(INITIAL);
      await runAgentAction(makeAgent({ provider: 'anthropic', model: 'claude-sonnet-4' }), 'task', dispatch);

      expect(getState().provider).toBe('anthropic');
      expect(getState().model).toBe('claude-sonnet-4');
    });

    it('emits a task_input step with the task content before the first LLM call', async () => {
      // Capture each intermediate state to find the one with task_input
      const states: any[] = [];
      let prev = INITIAL;
      const capturingDispatch = vi.fn().mockImplementation((updater: any) => {
        prev = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
        states.push(structuredClone(prev));
      });

      await runAgentAction(makeAgent(), 'Say hello', capturingDispatch);

      const taskInputState = states.find(s => s.steps?.some((step: any) => step.type === 'task_input'));
      expect(taskInputState).toBeDefined();
      expect(taskInputState.steps[0].content).toBe('Say hello');
    });

    it('sets the executionId on state after inserting the execution', async () => {
      mockInsertExecution.mockResolvedValue('exec-abc');
      const { dispatch, getState } = makeDispatch(INITIAL);
      await runAgentAction(makeAgent(), 'task', dispatch);

      expect(getState().executionId).toBe('exec-abc');
    });
  });

  // ── Instructions / system prompt ──────────────────────────────────────────

  describe('instructions', () => {
    it('joins agent_goal and system_instructions into the system prompt', async () => {
      const agent = makeAgent({ agent_goal: 'Be helpful', system_instructions: 'Respond in JSON' });
      const { dispatch } = makeDispatch(INITIAL);

      await runAgentAction(agent, 'task', dispatch);

      const callArgs = mockAiStreamText.mock.calls[0][0] as any;
      expect(callArgs.system).toContain('Be helpful');
      expect(callArgs.system).toContain('Respond in JSON');
    });

    it('substitutes env vars in the instructions', async () => {
      mockListEnvVariables.mockResolvedValue([
        { id: 'ev-1', key: 'API_URL', value: 'https://example.com', is_secret: 0 },
      ]);
      const agent = makeAgent({ agent_goal: 'Call {{API_URL}}', system_instructions: null });
      const { dispatch } = makeDispatch(INITIAL);

      await runAgentAction(agent, 'task', dispatch);

      const callArgs = mockAiStreamText.mock.calls[0][0] as any;
      expect(callArgs.system).toContain('https://example.com');
      expect(callArgs.system).not.toContain('{{API_URL}}');
    });

    it('includes stored memories in the system prompt when memory is enabled', async () => {
      mockListAgentMemories.mockResolvedValue([
        { id: 'mem-1', agent_id: 'agent-1', key: 'user_name', value: 'Alice' } as any,
      ]);
      const agent = makeAgent({ memory_enabled: 1, memory_source: 'local' });
      const { dispatch } = makeDispatch(INITIAL);

      await runAgentAction(agent, 'task', dispatch);

      const callArgs = mockAiStreamText.mock.calls[0][0] as any;
      expect(callArgs.system).toContain('user_name');
      expect(callArgs.system).toContain('Alice');
    });

    it('does not call listAgentMemories when memory is disabled', async () => {
      const { dispatch } = makeDispatch(INITIAL);
      await runAgentAction(makeAgent({ memory_enabled: 0 }), 'task', dispatch);

      expect(mockListAgentMemories).not.toHaveBeenCalled();
    });
  });

  // ── Tool configuration ─────────────────────────────────────────────────────

  describe('tool configuration', () => {
    beforeEach(() => {
      // toolChoice is only applied when there are tools present
      mockToolConfigToAiSdkTools.mockReturnValue({ search: vi.fn() as any });
    });

    it('sets toolChoice to "required" when strategy is forced', async () => {
      const { dispatch } = makeDispatch(INITIAL);
      await runAgentAction(makeAgent({ tool_call_strategy: 'forced' }), 'task', dispatch);

      const callArgs = mockAiStreamText.mock.calls[0][0] as any;
      expect(callArgs.toolChoice).toBe('required');
    });

    it('sets toolChoice to "none" when strategy is restricted', async () => {
      const { dispatch } = makeDispatch(INITIAL);
      await runAgentAction(makeAgent({ tool_call_strategy: 'restricted' }), 'task', dispatch);

      const callArgs = mockAiStreamText.mock.calls[0][0] as any;
      expect(callArgs.toolChoice).toBe('none');
    });

    it('does not set toolChoice when strategy is auto', async () => {
      const { dispatch } = makeDispatch(INITIAL);
      await runAgentAction(makeAgent({ tool_call_strategy: 'auto' }), 'task', dispatch);

      const callArgs = mockAiStreamText.mock.calls[0][0] as any;
      expect(callArgs.toolChoice).toBeUndefined();
    });
  });

  // ── Retry policy ───────────────────────────────────────────────────────────

  describe('retry policy', () => {
    it('sets maxRetries to 0 when retry_policy is none', async () => {
      const { dispatch } = makeDispatch(INITIAL);
      await runAgentAction(makeAgent({ retry_policy: 'none' }), 'task', dispatch);

      const callArgs = mockAiStreamText.mock.calls[0][0] as any;
      expect(callArgs.maxRetries).toBe(0);
    });

    it('sets maxRetries to 3 when retry_policy is fixed', async () => {
      const { dispatch } = makeDispatch(INITIAL);
      await runAgentAction(makeAgent({ retry_policy: 'fixed' }), 'task', dispatch);

      const callArgs = mockAiStreamText.mock.calls[0][0] as any;
      expect(callArgs.maxRetries).toBe(3);
    });
  });

  // ── Streaming — text ───────────────────────────────────────────────────────

  describe('streaming — text', () => {
    it('adds an output step with the final text from result.text', async () => {
      mockAiStreamText.mockReturnValue(makeFullStream([], 'Hello world') as any);
      const { dispatch, getState } = makeDispatch(INITIAL);

      await runAgentAction(makeAgent(), 'task', dispatch);

      const outputStep = (getState().steps as any[]).find((s: any) => s.type === 'output');
      expect(outputStep).toBeDefined();
      expect(outputStep.content).toBe('Hello world');
    });

    it('creates a model_call step for each start-step chunk', async () => {
      mockAiStreamText.mockReturnValue(makeFullStream([
        { type: 'start-step' },
        { type: 'finish-step', usage: {} },
        { type: 'start-step' },
        { type: 'finish-step', usage: {} },
      ]) as any);
      const { dispatch, getState } = makeDispatch(INITIAL);

      await runAgentAction(makeAgent(), 'task', dispatch);

      const modelCallSteps = (getState().steps as any[]).filter((s: any) => s.type === 'model_call');
      expect(modelCallSteps).toHaveLength(2);
    });

    it('model_call step content contains text from text-delta chunks', async () => {
      mockAiStreamText.mockReturnValue(makeFullStream([
        { type: 'start-step' },
        { type: 'text-delta', text: 'Part one' },
        { type: 'text-delta', text: ' part two' },
        { type: 'finish-step', usage: {} },
      ], 'Part one part two') as any);
      const { dispatch, getState } = makeDispatch(INITIAL);

      await runAgentAction(makeAgent(), 'task', dispatch);

      const modelCallStep = (getState().steps as any[]).find((s: any) => s.type === 'model_call');
      const content = JSON.parse(modelCallStep.content);
      expect(content.text).toBe('Part one part two');
    });
  });

  // ── Streaming — tool calls ─────────────────────────────────────────────────

  describe('streaming — tool calls', () => {
    it('creates a tool_call step when a tool-call chunk arrives', async () => {
      mockAiStreamText.mockReturnValue(makeFullStream([
        { type: 'start-step' },
        { type: 'tool-call', toolName: 'search', toolCallId: 'tc-1', input: { q: 'test' } },
        { type: 'tool-result', toolCallId: 'tc-1', output: { hits: 3 } },
        { type: 'finish-step', usage: {} },
      ]) as any);
      const { dispatch, getState } = makeDispatch(INITIAL);

      await runAgentAction(makeAgent(), 'task', dispatch);

      const toolStep = (getState().steps as any[]).find((s: any) => s.type === 'tool_call');
      expect(toolStep).toBeDefined();
      expect(toolStep.label).toBe('search');
    });

    it('updates the tool_call step to success when the tool-result arrives', async () => {
      mockAiStreamText.mockReturnValue(makeFullStream([
        { type: 'start-step' },
        { type: 'tool-call', toolName: 'lookup', toolCallId: 'tc-1', input: {} },
        { type: 'tool-result', toolCallId: 'tc-1', output: { ok: true } },
        { type: 'finish-step', usage: {} },
      ]) as any);
      const { dispatch, getState } = makeDispatch(INITIAL);

      await runAgentAction(makeAgent(), 'task', dispatch);

      const toolStep = (getState().steps as any[]).find((s: any) => s.type === 'tool_call');
      expect(toolStep.status).toBe('success');
      expect(toolStep.content).toContain('"ok": true');
    });

    it('creates a memory_write step (not tool_call) for the memory_write tool', async () => {
      mockAiStreamText.mockReturnValue(makeFullStream([
        { type: 'start-step' },
        { type: 'tool-call', toolName: 'memory_write', toolCallId: 'tc-mem', input: { key: 'k', value: 'v' } },
        { type: 'tool-result', toolCallId: 'tc-mem', output: { stored: 'k' } },
        { type: 'finish-step', usage: {} },
      ]) as any);
      const { dispatch, getState } = makeDispatch(INITIAL);

      await runAgentAction(makeAgent({ memory_enabled: 1, memory_source: 'local' }), 'task', dispatch);

      const memStep = (getState().steps as any[]).find((s: any) => s.type === 'memory_write');
      expect(memStep).toBeDefined();
      expect(memStep.label).toBe('Memory Write');
    });
  });

  // ── Streaming — tokens ─────────────────────────────────────────────────────

  describe('streaming — tokens', () => {
    it('accumulates token counts across multiple finish-step chunks', async () => {
      mockAiStreamText.mockReturnValue(makeFullStream([
        { type: 'start-step' },
        { type: 'finish-step', usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 } },
        { type: 'start-step' },
        { type: 'finish-step', usage: { inputTokens: 5, outputTokens: 15, totalTokens: 20 } },
      ]) as any);
      const { dispatch, getState } = makeDispatch(INITIAL);

      await runAgentAction(makeAgent(), 'task', dispatch);

      expect(getState().tokens).toBe(50); // 30 + 20
    });

    it('stores per-step token counts on the model_call step', async () => {
      mockAiStreamText.mockReturnValue(makeFullStream([
        { type: 'start-step' },
        { type: 'finish-step', usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 } },
      ]) as any);
      const { dispatch, getState } = makeDispatch(INITIAL);

      await runAgentAction(makeAgent(), 'task', dispatch);

      const modelStep = (getState().steps as any[]).find((s: any) => s.type === 'model_call');
      expect(modelStep.tokens).toBe(30);
      expect(modelStep.inputTokens).toBe(10);
      expect(modelStep.outputTokens).toBe(20);
    });

    it('saves aggregated token usage in usage_json on the execution', async () => {
      mockAiStreamText.mockReturnValue(makeFullStream([
        { type: 'start-step' },
        { type: 'finish-step', usage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 } },
      ]) as any);
      const { dispatch } = makeDispatch(INITIAL);

      await runAgentAction(makeAgent(), 'task', dispatch);

      const saved = mockUpdateExecution.mock.calls.at(-1)![1] as any;
      const usage = JSON.parse(saved.usage_json);
      expect(usage.totalTokens).toBe(300);
      expect(usage.inputTokens).toBe(100);
      expect(usage.outputTokens).toBe(200);
    });
  });

  // ── Successful completion ──────────────────────────────────────────────────

  describe('successful completion', () => {
    it('saves execution as succeeded with result_json containing the final text', async () => {
      mockAiStreamText.mockReturnValue(makeFullStream([], 'Done!') as any);
      const { dispatch } = makeDispatch(INITIAL);

      await runAgentAction(makeAgent(), 'task', dispatch);

      expect(mockUpdateExecution).toHaveBeenCalledWith('exec-1', expect.objectContaining({
        status: 'succeeded',
        result_json: expect.stringContaining('Done!'),
      }));
    });

    it('final execution state has status success', async () => {
      const { dispatch, getState } = makeDispatch(INITIAL);
      await runAgentAction(makeAgent(), 'task', dispatch);

      expect(getState().status).toBe('success');
    });

    it('steps_json in the saved execution contains task_input and output steps', async () => {
      mockAiStreamText.mockReturnValue(makeFullStream([], 'Answer') as any);
      const { dispatch } = makeDispatch(INITIAL);

      await runAgentAction(makeAgent(), 'task', dispatch);

      const saved = mockUpdateExecution.mock.calls.at(-1)![1] as any;
      const steps = JSON.parse(saved.steps_json);
      expect(steps.some((s: any) => s.type === 'task_input')).toBe(true);
      expect(steps.some((s: any) => s.type === 'output')).toBe(true);
    });
  });

  // ── Abort ──────────────────────────────────────────────────────────────────

  describe('abort', () => {
    it('saves execution as failed with "Cancelled by user"', async () => {
      mockAiStreamText.mockReturnValue(makeAbortStream() as any);
      const { dispatch } = makeDispatch(INITIAL);

      await runAgentAction(makeAgent(), 'task', dispatch);

      expect(mockUpdateExecution).toHaveBeenCalledWith('exec-1', expect.objectContaining({
        status: 'failed',
        error_json: expect.stringContaining('Cancelled by user'),
      }));
    });

    it('final execution state has status cancelled', async () => {
      mockAiStreamText.mockReturnValue(makeAbortStream() as any);
      const { dispatch, getState } = makeDispatch(INITIAL);

      await runAgentAction(makeAgent(), 'task', dispatch);

      expect(getState().status).toBe('cancelled');
    });
  });

  // ── Stream error ───────────────────────────────────────────────────────────

  describe('stream error', () => {
    it('saves execution as failed with the error message', async () => {
      mockAiStreamText.mockReturnValue(makeErrorStream('Rate limit exceeded') as any);
      const { dispatch } = makeDispatch(INITIAL);

      await runAgentAction(makeAgent(), 'task', dispatch);

      expect(mockUpdateExecution).toHaveBeenCalledWith('exec-1', expect.objectContaining({
        status: 'failed',
        error_json: expect.stringContaining('Rate limit exceeded'),
      }));
    });

    it('final execution state has status error', async () => {
      mockAiStreamText.mockReturnValue(makeErrorStream('Timeout') as any);
      const { dispatch, getState } = makeDispatch(INITIAL);

      await runAgentAction(makeAgent(), 'task', dispatch);

      expect(getState().status).toBe('error');
    });

    it('marks any in-flight running steps as error', async () => {
      mockAiStreamText.mockReturnValue({
        fullStream: (async function* () {
          yield { type: 'start-step' }; // creates a model_call with status: 'running'
          throw new Error('Failed mid-stream');
        })(),
        text: Promise.resolve(''),
      } as any);
      const { dispatch, getState } = makeDispatch(INITIAL);

      await runAgentAction(makeAgent(), 'task', dispatch);

      const steps = getState().steps as any[];
      // The model_call step that was 'running' should now be 'error'
      expect(steps.filter((s: any) => s.status === 'running')).toHaveLength(0);
    });

    it('appends an error step with the error message', async () => {
      mockAiStreamText.mockReturnValue(makeErrorStream('Something went wrong') as any);
      const { dispatch, getState } = makeDispatch(INITIAL);

      await runAgentAction(makeAgent(), 'task', dispatch);

      const steps = getState().steps as any[];
      const errorStep = steps.find((s: any) => s.type === 'error');
      expect(errorStep).toBeDefined();
      expect(errorStep.content).toBe('Something went wrong');
    });

    it('handles an error chunk from the stream the same as a thrown error', async () => {
      mockAiStreamText.mockReturnValue({
        fullStream: (async function* () {
          yield { type: 'start-step' };
          yield { type: 'error', error: new Error('Model error') };
        })(),
        text: Promise.resolve(''),
      } as any);
      const { dispatch } = makeDispatch(INITIAL);

      await runAgentAction(makeAgent(), 'task', dispatch);

      expect(mockUpdateExecution).toHaveBeenCalledWith('exec-1', expect.objectContaining({
        status: 'failed',
        error_json: expect.stringContaining('Model error'),
      }));
    });
  });
});
