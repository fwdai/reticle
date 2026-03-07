import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('ai', () => ({ generateText: vi.fn() }));
vi.mock('@/lib/gateway', () => ({ createModel: vi.fn(() => 'mock-model') }));

import * as aiSdk from 'ai';
import {
  evaluateScenarioAssertion,
  evaluateAgentAssertion,
  type AgentAssertion,
} from '@/lib/evals/evalAssertions';

const mockGenerateText = vi.mocked(aiSdk.generateText);

beforeEach(() => {
  vi.clearAllMocks();
});

function makeAssertion(overrides: Partial<AgentAssertion>): AgentAssertion {
  return { id: 'a-1', type: 'contains', target: '', description: '', ...overrides };
}

// ===========================================================================
// evaluateScenarioAssertion
// ===========================================================================

describe('evaluateScenarioAssertion', () => {
  describe('contains', () => {
    it('returns true when actual includes expected', () => {
      expect(evaluateScenarioAssertion('contains', 'Hello world', 'world')).toBe(true);
    });

    it('returns false when actual does not include expected', () => {
      expect(evaluateScenarioAssertion('contains', 'Hello world', 'foo')).toBe(false);
    });

    it('is case-insensitive', () => {
      expect(evaluateScenarioAssertion('contains', 'Hello World', 'WORLD')).toBe(true);
    });

    it('trims the expected value before matching', () => {
      expect(evaluateScenarioAssertion('contains', 'Hello world', '  world  ')).toBe(true);
    });
  });

  describe('equals', () => {
    it('returns true for an exact match (after trim)', () => {
      expect(evaluateScenarioAssertion('equals', '  hello  ', 'hello')).toBe(true);
    });

    it('returns false when strings differ', () => {
      expect(evaluateScenarioAssertion('equals', 'hello', 'Hello')).toBe(false);
    });

    it('is case-sensitive', () => {
      expect(evaluateScenarioAssertion('equals', 'Hello', 'hello')).toBe(false);
    });
  });

  describe('not_contains', () => {
    it('returns true when actual does not include expected', () => {
      expect(evaluateScenarioAssertion('not_contains', 'Hello world', 'foo')).toBe(true);
    });

    it('returns false when actual includes expected', () => {
      expect(evaluateScenarioAssertion('not_contains', 'Hello world', 'world')).toBe(false);
    });

    it('is case-insensitive', () => {
      expect(evaluateScenarioAssertion('not_contains', 'Hello World', 'WORLD')).toBe(false);
    });
  });
});

// ===========================================================================
// evaluateAgentAssertion
// ===========================================================================

describe('evaluateAgentAssertion', () => {
  // ── contains ──────────────────────────────────────────────────────────────

  describe('contains', () => {
    it('passes when the output contains the target', async () => {
      const result = await evaluateAgentAssertion(
        makeAssertion({ type: 'contains', target: 'Paris' }),
        'The capital of France is Paris.',
        [], 1,
      );
      expect(result.passed).toBe(true);
    });

    it('fails when the output does not contain the target', async () => {
      const result = await evaluateAgentAssertion(
        makeAssertion({ type: 'contains', target: 'Berlin' }),
        'The capital of France is Paris.',
        [], 1,
      );
      expect(result.passed).toBe(false);
    });

    it('is case-insensitive', async () => {
      const result = await evaluateAgentAssertion(
        makeAssertion({ type: 'contains', target: 'PARIS' }),
        'The capital is paris.',
        [], 1,
      );
      expect(result.passed).toBe(true);
    });
  });

  // ── exact_match ───────────────────────────────────────────────────────────

  describe('exact_match', () => {
    it('passes when the output exactly matches the target (trimmed)', async () => {
      const result = await evaluateAgentAssertion(
        makeAssertion({ type: 'exact_match', target: 'Yes' }),
        '  Yes  ',
        [], 1,
      );
      expect(result.passed).toBe(true);
    });

    it('fails when the output differs', async () => {
      const result = await evaluateAgentAssertion(
        makeAssertion({ type: 'exact_match', target: 'Yes' }),
        'Yes, definitely.',
        [], 1,
      );
      expect(result.passed).toBe(false);
    });

    it('is case-sensitive', async () => {
      const result = await evaluateAgentAssertion(
        makeAssertion({ type: 'exact_match', target: 'yes' }),
        'Yes',
        [], 1,
      );
      expect(result.passed).toBe(false);
    });
  });

  // ── tool_called ───────────────────────────────────────────────────────────

  describe('tool_called', () => {
    it('passes when the target tool was called', async () => {
      const result = await evaluateAgentAssertion(
        makeAssertion({ type: 'tool_called', target: 'search' }),
        '', ['search', 'calculator'], 1,
      );
      expect(result.passed).toBe(true);
    });

    it('fails when the target tool was not called', async () => {
      const result = await evaluateAgentAssertion(
        makeAssertion({ type: 'tool_called', target: 'search' }),
        '', ['calculator'], 1,
      );
      expect(result.passed).toBe(false);
    });

    it('lists the actually called tools in the actual message on failure', async () => {
      const result = await evaluateAgentAssertion(
        makeAssertion({ type: 'tool_called', target: 'search' }),
        '', ['calculator', 'lookup'], 1,
      );
      expect(result.actual).toContain('calculator');
      expect(result.actual).toContain('lookup');
    });

    it('fails cleanly when no tools were called', async () => {
      const result = await evaluateAgentAssertion(
        makeAssertion({ type: 'tool_called', target: 'search' }),
        '', [], 1,
      );
      expect(result.passed).toBe(false);
      expect(result.actual).toContain('none');
    });
  });

  // ── tool_not_called ───────────────────────────────────────────────────────

  describe('tool_not_called', () => {
    it('passes when the target tool was not called', async () => {
      const result = await evaluateAgentAssertion(
        makeAssertion({ type: 'tool_not_called', target: 'delete' }),
        '', ['search'], 1,
      );
      expect(result.passed).toBe(true);
    });

    it('fails when the target tool was called', async () => {
      const result = await evaluateAgentAssertion(
        makeAssertion({ type: 'tool_not_called', target: 'delete' }),
        '', ['search', 'delete'], 1,
      );
      expect(result.passed).toBe(false);
    });
  });

  // ── loop_count ────────────────────────────────────────────────────────────

  describe('loop_count', () => {
    it('passes when loopCount is within the limit', async () => {
      const result = await evaluateAgentAssertion(
        makeAssertion({ type: 'loop_count', target: '5' }),
        '', [], 3,
      );
      expect(result.passed).toBe(true);
    });

    it('passes when loopCount equals the limit exactly', async () => {
      const result = await evaluateAgentAssertion(
        makeAssertion({ type: 'loop_count', target: '3' }),
        '', [], 3,
      );
      expect(result.passed).toBe(true);
    });

    it('fails when loopCount exceeds the limit', async () => {
      const result = await evaluateAgentAssertion(
        makeAssertion({ type: 'loop_count', target: '2' }),
        '', [], 5,
      );
      expect(result.passed).toBe(false);
      expect(result.actual).toContain('5');
      expect(result.actual).toContain('2');
    });

    it('fails when the target is not a valid number', async () => {
      const result = await evaluateAgentAssertion(
        makeAssertion({ type: 'loop_count', target: 'many' }),
        '', [], 1,
      );
      expect(result.passed).toBe(false);
    });

    it('uses singular "loop" when count is 1', async () => {
      const result = await evaluateAgentAssertion(
        makeAssertion({ type: 'loop_count', target: '5' }),
        '', [], 1,
      );
      expect(result.actual).toMatch(/1 loop[^s]/);
    });
  });

  // ── tool_sequence ─────────────────────────────────────────────────────────

  describe('tool_sequence', () => {
    it('passes when tools were called in the specified order', async () => {
      const result = await evaluateAgentAssertion(
        makeAssertion({ type: 'tool_sequence', target: 'search → summarise' }),
        '', ['search', 'summarise'], 1,
      );
      expect(result.passed).toBe(true);
    });

    it('fails when the order is reversed', async () => {
      const result = await evaluateAgentAssertion(
        makeAssertion({ type: 'tool_sequence', target: 'search → summarise' }),
        '', ['summarise', 'search'], 1,
      );
      expect(result.passed).toBe(false);
    });

    it('passes when extra tools appear between the required ones', async () => {
      const result = await evaluateAgentAssertion(
        makeAssertion({ type: 'tool_sequence', target: 'search → summarise' }),
        '', ['search', 'calculator', 'summarise'], 1,
      );
      expect(result.passed).toBe(true);
    });

    it('fails when a required tool in the sequence is missing', async () => {
      const result = await evaluateAgentAssertion(
        makeAssertion({ type: 'tool_sequence', target: 'search → summarise → write' }),
        '', ['search', 'summarise'], 1,
      );
      expect(result.passed).toBe(false);
    });

    it('lists the called tools in the actual message on failure', async () => {
      const result = await evaluateAgentAssertion(
        makeAssertion({ type: 'tool_sequence', target: 'a → b' }),
        '', ['b', 'a'], 1,
      );
      expect(result.actual).toContain('b');
      expect(result.actual).toContain('a');
    });
  });

  // ── json_schema ───────────────────────────────────────────────────────────

  describe('json_schema', () => {
    const schema = JSON.stringify({
      type: 'object',
      properties: { name: { type: 'string' }, age: { type: 'number' } },
      required: ['name'],
    });

    it('passes when the output is valid JSON matching the schema', async () => {
      const result = await evaluateAgentAssertion(
        makeAssertion({ type: 'json_schema', target: schema }),
        '{"name":"Alice","age":30}',
        [], 1,
      );
      expect(result.passed).toBe(true);
    });

    it('fails when the output is valid JSON but violates the schema', async () => {
      const result = await evaluateAgentAssertion(
        makeAssertion({ type: 'json_schema', target: schema }),
        '{"age":30}', // missing required "name"
        [], 1,
      );
      expect(result.passed).toBe(false);
    });

    it('extracts JSON from a markdown code fence', async () => {
      const result = await evaluateAgentAssertion(
        makeAssertion({ type: 'json_schema', target: schema }),
        '```json\n{"name":"Bob"}\n```',
        [], 1,
      );
      expect(result.passed).toBe(true);
    });

    it('fails when the target contains invalid JSON schema', async () => {
      const result = await evaluateAgentAssertion(
        makeAssertion({ type: 'json_schema', target: '{ bad json }' }),
        '{"name":"Alice"}',
        [], 1,
      );
      expect(result.passed).toBe(false);
      expect(result.actual).toContain('Invalid JSON Schema');
    });

    it('fails when the output contains no valid JSON', async () => {
      const result = await evaluateAgentAssertion(
        makeAssertion({ type: 'json_schema', target: schema }),
        'Sorry, I cannot provide that.',
        [], 1,
      );
      expect(result.passed).toBe(false);
      expect(result.actual).toContain('no valid JSON');
    });
  });

  // ── llm_judge ─────────────────────────────────────────────────────────────

  describe('llm_judge', () => {
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('fails immediately when no criteria are provided', async () => {
      const result = await evaluateAgentAssertion(
        makeAssertion({ type: 'llm_judge', target: '', description: '' }),
        'Some output', [], 1,
      );
      expect(result.passed).toBe(false);
      expect(result.actual).toContain('LLM Judge requires criteria');
      expect(mockGenerateText).not.toHaveBeenCalled();
    });

    it('uses the description as criteria when target is empty', async () => {
      mockGenerateText.mockResolvedValue({ text: 'PASS\nLooks good.' } as any);
      const result = await evaluateAgentAssertion(
        makeAssertion({ type: 'llm_judge', target: '', description: 'Output is helpful' }),
        'Very helpful output.', [], 1, 'Do something helpful',
      );
      expect(result.passed).toBe(true);
      expect(mockGenerateText).toHaveBeenCalled();
    });

    it('passes when the LLM responds with PASS', async () => {
      mockGenerateText.mockResolvedValue({ text: 'PASS\nThe output is correct.' } as any);
      const result = await evaluateAgentAssertion(
        makeAssertion({ type: 'llm_judge', target: 'Output is concise' }),
        'Yes.', [], 1, 'Be concise',
      );
      expect(result.passed).toBe(true);
    });

    it('fails when the LLM responds with FAIL', async () => {
      mockGenerateText.mockResolvedValue({ text: 'FAIL\nToo verbose.' } as any);
      const result = await evaluateAgentAssertion(
        makeAssertion({ type: 'llm_judge', target: 'Output is concise' }),
        'A very long answer indeed...', [], 1,
      );
      expect(result.passed).toBe(false);
    });

    it('fails gracefully when the LLM call throws', async () => {
      mockGenerateText.mockRejectedValue(new Error('API error'));
      const result = await evaluateAgentAssertion(
        makeAssertion({ type: 'llm_judge', target: 'Output is helpful' }),
        'Some output', [], 1,
      );
      expect(result.passed).toBe(false);
      expect(result.actual).toContain('LLM Judge error');
      expect(result.actual).toContain('API error');
    });

    it('uses the judgeModel provider and model when specified', async () => {
      mockGenerateText.mockResolvedValue({ text: 'PASS' } as any);
      const mockCreateModel = vi.mocked((await import('@/lib/gateway')).createModel);

      await evaluateAgentAssertion(
        makeAssertion({
          type: 'llm_judge',
          target: 'Is correct',
          judgeModel: { provider: 'anthropic', model: 'claude-sonnet-4' },
        }),
        'output', [], 1,
      );

      expect(mockCreateModel).toHaveBeenCalledWith({ provider: 'anthropic', model: 'claude-sonnet-4' });
    });
  });

  // ── guardrail ─────────────────────────────────────────────────────────────

  describe('guardrail', () => {
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('fails immediately when no constraint is provided', async () => {
      const result = await evaluateAgentAssertion(
        makeAssertion({ type: 'guardrail', target: '', description: '' }),
        'Some output', [], 1,
      );
      expect(result.passed).toBe(false);
      expect(result.actual).toContain('Guardrail requires a constraint');
      expect(mockGenerateText).not.toHaveBeenCalled();
    });

    it('passes when the LLM responds with PASS (no violation)', async () => {
      mockGenerateText.mockResolvedValue({ text: 'PASS\nNo violation detected.' } as any);
      const result = await evaluateAgentAssertion(
        makeAssertion({ type: 'guardrail', target: 'Must not reveal API keys' }),
        'Here is how to do it safely.', [], 1,
      );
      expect(result.passed).toBe(true);
    });

    it('fails when the LLM responds with FAIL (violation detected)', async () => {
      mockGenerateText.mockResolvedValue({ text: 'FAIL\nAPI key was revealed.' } as any);
      const result = await evaluateAgentAssertion(
        makeAssertion({ type: 'guardrail', target: 'Must not reveal API keys' }),
        'The key is sk-abc123.', [], 1,
      );
      expect(result.passed).toBe(false);
    });

    it('fails gracefully when the LLM call throws', async () => {
      mockGenerateText.mockRejectedValue(new Error('Timeout'));
      const result = await evaluateAgentAssertion(
        makeAssertion({ type: 'guardrail', target: 'Must not be rude' }),
        'Some output', [], 1,
      );
      expect(result.passed).toBe(false);
      expect(result.actual).toContain('Guardrail error');
      expect(result.actual).toContain('Timeout');
    });
  });

  // ── unknown type ──────────────────────────────────────────────────────────

  describe('unknown assertion type', () => {
    it('fails with "Unknown assertion type" for an unrecognised type', async () => {
      const result = await evaluateAgentAssertion(
        makeAssertion({ type: 'not_a_real_type' as any }),
        'output', [], 1,
      );
      expect(result.passed).toBe(false);
      expect(result.actual).toBe('Unknown assertion type');
    });
  });
});
