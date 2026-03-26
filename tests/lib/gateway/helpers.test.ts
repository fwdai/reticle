import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

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

import { invoke } from '@tauri-apps/api/core';
import {
  getProviderHeaders,
  isReasoningModel,
  loadAttachmentsAsContentParts,
  toolConfigToAiSdkTools,
} from '@/lib/gateway/helpers';
import { ANTHROPIC_VERSION } from '@/lib/gateway/constants';
import type { Tool } from '@/components/Tools/types';

const mockInvoke = vi.mocked(invoke);

beforeEach(() => vi.clearAllMocks());

// ── getProviderHeaders ─────────────────────────────────────────────────────────

describe('getProviderHeaders', () => {
  it('returns correct routing headers for openai', () => {
    const headers = getProviderHeaders('openai');
    expect(headers['X-Api-Provider']).toBe('openai');
    expect(headers['X-Api-Auth-Header']).toBe('Authorization');
    expect(headers['X-Proxy-Target-Url']).toBe('https://api.openai.com');
  });

  it('returns correct routing headers for anthropic and adds anthropic-version', () => {
    const headers = getProviderHeaders('anthropic');
    expect(headers['X-Api-Provider']).toBe('anthropic');
    expect(headers['X-Api-Auth-Header']).toBe('X-Api-Key');
    expect(headers['X-Proxy-Target-Url']).toBe('https://api.anthropic.com');
    expect(headers['anthropic-version']).toBe(ANTHROPIC_VERSION);
  });

  it('does not add anthropic-version for non-anthropic providers', () => {
    const headers = getProviderHeaders('openai');
    expect(headers).not.toHaveProperty('anthropic-version');
  });

  it('returns correct routing headers for google', () => {
    const headers = getProviderHeaders('google');
    expect(headers['X-Api-Provider']).toBe('google');
    expect(headers['X-Api-Auth-Header']).toBe('Authorization');
    expect(headers['X-Proxy-Target-Url']).toBe('https://generativelanguage.googleapis.com');
  });

  it('throws when the provider is not found', () => {
    expect(() => getProviderHeaders('unknown-provider')).toThrow(
      'Provider "unknown-provider" not found.'
    );
  });
});

// ── isReasoningModel ───────────────────────────────────────────────────────────

describe('isReasoningModel', () => {
  it('returns true for models starting with each reasoning prefix', () => {
    expect(isReasoningModel('o1-mini')).toBe(true);
    expect(isReasoningModel('o3-high')).toBe(true);
    expect(isReasoningModel('o4-mini-preview')).toBe(true);
    expect(isReasoningModel('codex-mini-latest')).toBe(true);
    expect(isReasoningModel('computer-use-preview')).toBe(true);
    expect(isReasoningModel('gpt-5-turbo')).toBe(true);
  });

  it('returns false for gpt-5-chat despite gpt-5 being a reasoning prefix', () => {
    expect(isReasoningModel('gpt-5-chat')).toBe(false);
  });

  it('returns false for standard non-reasoning models', () => {
    expect(isReasoningModel('gpt-4o')).toBe(false);
    expect(isReasoningModel('gpt-4-turbo')).toBe(false);
    expect(isReasoningModel('claude-3-5-sonnet')).toBe(false);
    expect(isReasoningModel('gemini-pro')).toBe(false);
  });
});

// ── loadAttachmentsAsContentParts ─────────────────────────────────────────────

describe('loadAttachmentsAsContentParts', () => {
  it('skips attachments that have no path', async () => {
    const parts = await loadAttachmentsAsContentParts([
      { name: 'file.png' } as any,
    ]);
    expect(parts).toEqual([]);
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('returns an image part for image/* media types', async () => {
    mockInvoke.mockResolvedValue('abc123');
    const parts = await loadAttachmentsAsContentParts([
      { path: '/tmp/img.png', type: 'image/png', name: 'img.png' } as any,
    ]);
    expect(parts).toEqual([
      { type: 'image', image: 'data:image/png;base64,abc123', mediaType: 'image/png' },
    ]);
  });

  it('returns a file part for non-image media types', async () => {
    mockInvoke.mockResolvedValue('base64data');
    const parts = await loadAttachmentsAsContentParts([
      { path: '/tmp/doc.pdf', type: 'application/pdf', name: 'doc.pdf' } as any,
    ]);
    expect(parts).toEqual([
      {
        type: 'file',
        data: 'data:application/pdf;base64,base64data',
        mediaType: 'application/pdf',
        filename: 'doc.pdf',
      },
    ]);
  });

  it('defaults mediaType to application/octet-stream when type is absent', async () => {
    mockInvoke.mockResolvedValue('bytes');
    const parts = await loadAttachmentsAsContentParts([
      { path: '/tmp/bin', name: 'bin' } as any,
    ]);
    expect((parts[0] as any).mediaType).toBe('application/octet-stream');
  });

  it('skips an attachment and warns when invoke throws', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockInvoke.mockRejectedValue(new Error('read error'));
    const parts = await loadAttachmentsAsContentParts([
      { path: '/tmp/file.png', type: 'image/png', name: 'file.png' } as any,
    ]);
    expect(parts).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('file.png'),
      expect.any(Error)
    );
    warnSpy.mockRestore();
  });

  it('processes multiple attachments in order', async () => {
    mockInvoke.mockResolvedValueOnce('img-data').mockResolvedValueOnce('pdf-data');
    const parts = await loadAttachmentsAsContentParts([
      { path: '/tmp/a.png', type: 'image/png', name: 'a.png' } as any,
      { path: '/tmp/b.pdf', type: 'application/pdf', name: 'b.pdf' } as any,
    ]);
    expect(parts).toHaveLength(2);
    expect(parts[0].type).toBe('image');
    expect(parts[1].type).toBe('file');
  });
});

// ── toolConfigToAiSdkTools ────────────────────────────────────────────────────

function makeTool(overrides: Partial<Tool> = {}): Tool {
  return {
    id: '1',
    name: 'my_tool',
    description: 'A test tool',
    parameters: [],
    mockResponse: '{"answer": 42}',
    mockMode: 'json',
    ...overrides,
  };
}

describe('toolConfigToAiSdkTools', () => {
  it('returns an empty ToolSet for an empty tools array', () => {
    const result = toolConfigToAiSdkTools([]);
    expect(Object.keys(result)).toHaveLength(0);
  });

  it('returns parsed JSON from mockResponse in json mode', async () => {
    const tools = toolConfigToAiSdkTools([makeTool()]);
    const result = await tools['my_tool'].execute!({} as any, {} as any);
    expect(result).toEqual({ answer: 42 });
  });

  it('returns the raw string when mockResponse is not valid JSON', async () => {
    const tools = toolConfigToAiSdkTools([makeTool({ mockResponse: 'not json' })]);
    const result = await tools['my_tool'].execute!({} as any, {} as any);
    expect(result).toBe('not json');
  });

  it('substitutes env vars in mockResponse before parsing', async () => {
    const tools = toolConfigToAiSdkTools(
      [makeTool({ mockResponse: '{"key": "{{API_KEY}}"}' })],
      { API_KEY: 'secret-123' }
    );
    const result = await tools['my_tool'].execute!({} as any, {} as any) as any;
    expect(result.key).toBe('secret-123');
  });

  it('uses an empty object when mockResponse is undefined', async () => {
    const tools = toolConfigToAiSdkTools([makeTool({ mockResponse: undefined as any })]);
    const result = await tools['my_tool'].execute!({} as any, {} as any);
    expect(result).toEqual({});
  });

  it('falls back to json mode when mockMode is code but code is empty', async () => {
    const tools = toolConfigToAiSdkTools([
      makeTool({ mockMode: 'code', code: '   ', mockResponse: '{"ok": true}' }),
    ]);
    const result = await tools['my_tool'].execute!({} as any, {} as any);
    expect(result).toEqual({ ok: true });
  });

  it('puts required params in schema.required and excludes optional ones', () => {
    const tools = toolConfigToAiSdkTools([
      makeTool({
        parameters: [
          { id: '1', name: 'req_param', type: 'string', description: '', required: true },
          { id: '2', name: 'opt_param', type: 'number', description: '', required: false },
        ],
      }),
    ]);
    const schema = (tools['my_tool'].inputSchema as any).jsonSchema;
    expect(schema.required).toContain('req_param');
    expect(schema.required).not.toContain('opt_param');
  });

  it('preserves parameter types in the JSON schema', () => {
    const tools = toolConfigToAiSdkTools([
      makeTool({
        parameters: [
          { id: '1', name: 'str', type: 'string', description: '', required: false },
          { id: '2', name: 'num', type: 'number', description: '', required: false },
          { id: '3', name: 'flag', type: 'boolean', description: '', required: false },
        ],
      }),
    ]);
    const props = (tools['my_tool'].inputSchema as any).jsonSchema.properties;
    expect(props.str.type).toBe('string');
    expect(props.num.type).toBe('number');
    expect(props.flag.type).toBe('boolean');
  });

  it('includes parameter descriptions in the schema', () => {
    const tools = toolConfigToAiSdkTools([
      makeTool({
        parameters: [
          { id: '1', name: 'q', type: 'string', description: 'The query', required: false },
        ],
      }),
    ]);
    const props = (tools['my_tool'].inputSchema as any).jsonSchema.properties;
    expect(props.q.description).toBe('The query');
  });

  it('registers each tool under its name in the ToolSet', () => {
    const tools = toolConfigToAiSdkTools([
      makeTool({ name: 'tool_a' }),
      makeTool({ name: 'tool_b', id: '2' }),
    ]);
    expect(Object.keys(tools)).toEqual(['tool_a', 'tool_b']);
  });
});
