import { describe, it, expect } from 'vitest';
import {
  parseScenarioTestCases,
  exportScenarioTestCasesAsJSON,
  exportScenarioTestCasesAsCSV,
  parseAgentTestCases,
  exportAgentTestCasesAsJSON,
  exportAgentTestCasesAsCSV,
  exportScenarioAsJSON,
  exportAgentAsJSON,
  type ScenarioTestCase,
  type AgentTestCase,
  type ScenarioConfigExport,
  type AgentConfigExport,
} from '@/lib/evals';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// --- parseScenarioTestCases ---

describe('parseScenarioTestCases', () => {
  it('returns empty array for empty content', () => {
    expect(parseScenarioTestCases('', 'test.csv')).toEqual([]);
    expect(parseScenarioTestCases('   \n\n  ', 'test.csv')).toEqual([]);
  });

  it('parses CSV with input, expected, assertion columns', () => {
    const content = `input,expected,assertion
hello,world,contains
foo,bar,equals`;
    const cases = parseScenarioTestCases(content, 'test.csv');
    expect(cases).toHaveLength(2);
    expect(cases[0]).toMatchObject({
      inputs: { input: 'hello' },
      expected: 'world',
      assertion: 'contains',
    });
    expect(cases[0].id).toMatch(UUID_REGEX);
    expect(cases[1]).toMatchObject({
      inputs: { input: 'foo' },
      expected: 'bar',
      assertion: 'equals',
    });
  });

  it('handles CSV with quoted fields containing commas', () => {
    const content = `input,expected,assertion
"hello, world","foo, bar",contains`;
    const cases = parseScenarioTestCases(content, 'test.csv');
    expect(cases).toHaveLength(1);
    expect(cases[0]).toMatchObject({
      inputs: { input: 'hello, world' },
      expected: 'foo, bar',
      assertion: 'contains',
    });
  });

  it('handles CSV with quoted fields (double-quote toggle; "" does not produce literal quote)', () => {
    const content = `input,expected,assertion
"say ""hi""",ok,contains`;
    const cases = parseScenarioTestCases(content, 'test.csv');
    expect(cases).toHaveLength(1);
    // parseCSVLine toggles on each "; "" toggles off then on, so no literal " is added
    expect(cases[0]).toMatchObject({
      inputs: { input: 'say hi' },
      expected: 'ok',
      assertion: 'contains',
    });
  });

  it('returns empty array for CSV with only header row', () => {
    const content = 'input,expected,assertion';
    expect(parseScenarioTestCases(content, 'test.csv')).toEqual([]);
  });

  it('parses JSON array format', () => {
    const content = `[
  { "inputs": { "input": "hello" }, "expected": "world", "assertion": "contains" },
  { "inputs": { "input": "foo" }, "expected": "bar", "assertion": "equals" }
]`;
    const cases = parseScenarioTestCases(content, 'test.json');
    expect(cases).toHaveLength(2);
    expect(cases[0]).toMatchObject({
      inputs: { input: 'hello' },
      expected: 'world',
      assertion: 'contains',
    });
    expect(cases[1]).toMatchObject({
      inputs: { input: 'foo' },
      expected: 'bar',
      assertion: 'equals',
    });
  });

  it('parses JSONL (one JSON object per line)', () => {
    const content = `{"inputs":{"input":"a"},"expected":"b","assertion":"contains"}
{"inputs":{"input":"x"},"expected":"y","assertion":"equals"}`;
    const cases = parseScenarioTestCases(content, 'test.jsonl');
    expect(cases).toHaveLength(2);
    expect(cases[0]).toMatchObject({
      inputs: { input: 'a' },
      expected: 'b',
      assertion: 'contains',
    });
    expect(cases[1]).toMatchObject({
      inputs: { input: 'x' },
      expected: 'y',
      assertion: 'equals',
    });
  });

  it('uses CSV parser when filename has .csv extension regardless of content', () => {
    const content = 'input,expected,assertion\nx,y,contains';
    const cases = parseScenarioTestCases(content, 'data.CSV');
    expect(cases).toHaveLength(1);
    expect(cases[0]).toMatchObject({
      inputs: { input: 'x' },
      expected: 'y',
      assertion: 'contains',
    });
  });

  it('defaults missing fields to empty string or "contains"', () => {
    const content = '[{"inputs":{},"expected":"x"}]';
    const cases = parseScenarioTestCases(content, 'test.json');
    expect(cases).toHaveLength(1);
    expect(cases[0]).toMatchObject({
      inputs: { input: '' },
      expected: 'x',
      assertion: 'contains',
    });
  });

  it('skips invalid JSON lines in JSONL', () => {
    const content = `{"inputs":{"input":"a"},"expected":"b"}
not json
{"inputs":{"input":"c"},"expected":"d"}`;
    const cases = parseScenarioTestCases(content, 'test.jsonl');
    expect(cases).toHaveLength(2);
    expect(cases[0]).toMatchObject({ inputs: { input: 'a' }, expected: 'b' });
    expect(cases[1]).toMatchObject({ inputs: { input: 'c' }, expected: 'd' });
  });
});

// --- exportScenarioTestCasesAsJSON ---

describe('exportScenarioTestCasesAsJSON', () => {
  it('serializes cases to pretty-printed JSON', () => {
    const cases: ScenarioTestCase[] = [
      {
        id: 'id-1',
        inputs: { input: 'hello' },
        expected: 'world',
        assertion: 'contains',
      },
    ];
    const out = exportScenarioTestCasesAsJSON(cases);
    expect(JSON.parse(out)).toEqual([
      { inputs: { input: 'hello' }, expected: 'world', assertion: 'contains' },
    ]);
    expect(out).toContain('\n');
  });

  it('omits id from exported structure', () => {
    const cases: ScenarioTestCase[] = [
      { id: 'id-1', inputs: { input: 'x' }, expected: 'y', assertion: 'equals' },
    ];
    const out = exportScenarioTestCasesAsJSON(cases);
    expect(JSON.parse(out)[0]).not.toHaveProperty('id');
  });
});

// --- exportScenarioTestCasesAsCSV ---

describe('exportScenarioTestCasesAsCSV', () => {
  it('exports cases as CSV with header', () => {
    const cases: ScenarioTestCase[] = [
      {
        id: 'id-1',
        inputs: { input: 'hello' },
        expected: 'world',
        assertion: 'contains',
      },
    ];
    const out = exportScenarioTestCasesAsCSV(cases);
    expect(out).toBe('input,expected,assertion\nhello,world,contains');
  });

  it('quotes fields containing commas', () => {
    const cases: ScenarioTestCase[] = [
      {
        id: 'id-1',
        inputs: { input: 'hello, world' },
        expected: 'foo',
        assertion: 'contains',
      },
    ];
    const out = exportScenarioTestCasesAsCSV(cases);
    expect(out).toContain('"hello, world"');
  });

  it('escapes double quotes in quoted fields', () => {
    const cases: ScenarioTestCase[] = [
      {
        id: 'id-1',
        inputs: { input: 'say "hi"' },
        expected: 'ok',
        assertion: 'contains',
      },
    ];
    const out = exportScenarioTestCasesAsCSV(cases);
    expect(out).toContain('"say ""hi"""');
  });

  it('round-trips with parseScenarioTestCases', () => {
    const cases: ScenarioTestCase[] = [
      {
        id: 'id-1',
        inputs: { input: 'hello' },
        expected: 'world',
        assertion: 'contains',
      },
    ];
    const csv = exportScenarioTestCasesAsCSV(cases);
    const parsed = parseScenarioTestCases(csv, 'test.csv');
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toMatchObject({
      inputs: { input: 'hello' },
      expected: 'world',
      assertion: 'contains',
    });
  });
});

// --- parseAgentTestCases ---

describe('parseAgentTestCases', () => {
  it('returns empty array for empty content', () => {
    expect(parseAgentTestCases('', 'test.csv')).toEqual([]);
  });

  it('parses CSV with task, assertion_type, assertion_target columns', () => {
    const content = `task,assertion_type,assertion_target
do something,contains,expected text
another task,equals,exact match`;
    const cases = parseAgentTestCases(content, 'test.csv');
    expect(cases).toHaveLength(2);
    expect(cases[0]).toMatchObject({
      task: 'do something',
      assertions: [{ type: 'contains', target: 'expected text' }],
    });
    expect(cases[0].id).toMatch(UUID_REGEX);
    expect(cases[1]).toMatchObject({
      task: 'another task',
      assertions: [{ type: 'equals', target: 'exact match' }],
    });
  });

  it('handles CSV row with empty assertion_type (no assertions)', () => {
    const content = `task,assertion_type,assertion_target
task only,,`;
    const cases = parseAgentTestCases(content, 'test.csv');
    expect(cases).toHaveLength(1);
    expect(cases[0]).toMatchObject({
      task: 'task only',
      assertions: [],
    });
  });

  it('parses JSON array format', () => {
    const content = `[
  { "task": "do X", "assertions": [{ "type": "contains", "target": "foo", "description": "desc" }] }
]`;
    const cases = parseAgentTestCases(content, 'test.json');
    expect(cases).toHaveLength(1);
    expect(cases[0]).toMatchObject({
      task: 'do X',
      assertions: [{ type: 'contains', target: 'foo', description: 'desc' }],
    });
  });

  it('parses assertions with expectedParams and expectedReturn', () => {
    const content = `[
  {
    "task": "call tool",
    "assertions": [
      { "type": "tool_call", "target": "myTool", "expectedParams": "{\\"x\\":1}", "expectedReturn": "ok" }
    ]
  }
]`;
    const cases = parseAgentTestCases(content, 'test.json');
    expect(cases).toHaveLength(1);
    expect(cases[0].assertions[0]).toMatchObject({
      type: 'tool_call',
      target: 'myTool',
      expectedParams: '{"x":1}',
      expectedReturn: 'ok',
    });
  });

  it('defaults missing assertion fields', () => {
    const content = '[{"task":"t","assertions":[{}]}]';
    const cases = parseAgentTestCases(content, 'test.json');
    expect(cases).toHaveLength(1);
    expect(cases[0].assertions[0]).toMatchObject({
      type: 'contains',
      target: '',
      description: '',
    });
  });
});

// --- exportAgentTestCasesAsJSON ---

describe('exportAgentTestCasesAsJSON', () => {
  it('serializes cases to pretty-printed JSON', () => {
    const cases: AgentTestCase[] = [
      {
        id: 'id-1',
        task: 'do X',
        assertions: [{ id: 'a-1', type: 'contains', target: 'foo', description: 'desc' }],
      },
    ];
    const out = exportAgentTestCasesAsJSON(cases);
    expect(JSON.parse(out)).toEqual([
      {
        task: 'do X',
        assertions: [{ type: 'contains', target: 'foo', description: 'desc' }],
      },
    ]);
  });

  it('includes expectedParams and expectedReturn when present', () => {
    const cases: AgentTestCase[] = [
      {
        id: 'id-1',
        task: 'call',
        assertions: [
          {
            id: 'a-1',
            type: 'tool_call',
            target: 'tool',
            description: '',
            expectedParams: '{"x":1}',
            expectedReturn: 'ok',
          },
        ],
      },
    ];
    const out = exportAgentTestCasesAsJSON(cases);
    const parsed = JSON.parse(out);
    expect(parsed[0].assertions[0]).toEqual({
      type: 'tool_call',
      target: 'tool',
      description: '',
      expectedParams: '{"x":1}',
      expectedReturn: 'ok',
    });
  });
});

// --- exportAgentTestCasesAsCSV ---

describe('exportAgentTestCasesAsCSV', () => {
  it('exports cases with assertions as CSV rows', () => {
    const cases: AgentTestCase[] = [
      {
        id: 'id-1',
        task: 'do X',
        assertions: [{ id: 'a-1', type: 'contains', target: 'foo', description: '' }],
      },
    ];
    const out = exportAgentTestCasesAsCSV(cases);
    expect(out).toBe('task,assertion_type,assertion_target\ndo X,contains,foo');
  });

  it('exports task with no assertions as single row with empty assertion columns', () => {
    const cases: AgentTestCase[] = [
      {
        id: 'id-1',
        task: 'task only',
        assertions: [],
      },
    ];
    const out = exportAgentTestCasesAsCSV(cases);
    expect(out).toBe('task,assertion_type,assertion_target\ntask only,,');
  });

  it('quotes task when it contains comma', () => {
    const cases: AgentTestCase[] = [
      {
        id: 'id-1',
        task: 'hello, world',
        assertions: [],
      },
    ];
    const out = exportAgentTestCasesAsCSV(cases);
    expect(out).toContain('"hello, world"');
  });
});

// --- exportScenarioAsJSON ---

describe('exportScenarioAsJSON', () => {
  it('serializes scenario config to pretty-printed JSON', () => {
    const scenario: ScenarioConfigExport = {
      name: 'My Scenario',
      configuration: {
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1000,
      },
      systemPrompt: 'You are helpful.',
      userPrompt: 'Hello {{name}}',
      systemVariables: [],
      userVariables: [{ key: 'name', value: 'World' }],
    };
    const out = exportScenarioAsJSON(scenario);
    expect(JSON.parse(out)).toEqual(scenario);
    expect(out).toContain('\n');
  });
});

// --- exportAgentAsJSON ---

describe('exportAgentAsJSON', () => {
  it('serializes agent config to pretty-printed JSON', () => {
    const agent: AgentConfigExport = {
      name: 'My Agent',
      description: 'Does things',
      configuration: {
        provider: 'anthropic',
        model: 'claude-3',
        temperature: 0.5,
        maxTokens: 2000,
      },
      agentGoal: 'Be helpful',
      systemInstructions: 'You are an agent.',
      maxIterations: 10,
      timeoutSeconds: 60,
      retryPolicy: 'exponential',
      toolCallStrategy: 'auto',
      memoryEnabled: false,
      memorySource: '',
    };
    const out = exportAgentAsJSON(agent);
    expect(JSON.parse(out)).toEqual(agent);
    expect(out).toContain('\n');
  });
});
