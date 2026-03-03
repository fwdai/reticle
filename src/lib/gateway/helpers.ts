import { invoke } from '@tauri-apps/api/core';
import { PROVIDERS_LIST } from '@/constants/providers';
import { jsonSchema, tool, type ToolSet } from 'ai';
import { ANTHROPIC_VERSION, REASONING_MODEL_PREFIXES } from './constants';
import type { AttachedFile } from '@/contexts/StudioContext';
import type { Tool } from '@/components/Tools/types';
import {
  writeTempScript,
  deleteTempScript,
  runnerSpawn,
  runnerSend,
  runnerKill,
  onRunnerStdout,
  onRunnerStderr,
  onRunnerExit,
} from '@/lib/runner';

export function getProviderHeaders(providerId: string): Record<string, string> {
  const providerConfig = PROVIDERS_LIST.find((p) => p.id === providerId);

  if (!providerConfig) {
    throw new Error(`Provider "${providerId}" not found.`);
  }
  const headers: Record<string, string> = {
    'X-Api-Provider': providerConfig.id,
    'X-Api-Auth-Header': providerConfig.header,
    'X-Proxy-Target-Url': providerConfig.baseUrl,
  };

  if (providerId === 'anthropic') {
    headers['anthropic-version'] = ANTHROPIC_VERSION;
  }
  return headers;
}

export function isReasoningModel(modelId: string): boolean {
  if (modelId.startsWith('gpt-5-chat')) return false;
  return REASONING_MODEL_PREFIXES.some((p) => modelId.startsWith(p));
}

/** Load attachment blobs and build content parts for the user message. */
export async function loadAttachmentsAsContentParts(
  attachments: AttachedFile[]
): Promise<
  Array<
    | { type: 'text'; text: string }
    | { type: 'image'; image: string; mediaType?: string }
    | { type: 'file'; data: string; mediaType: string; filename?: string }
  >
> {
  const parts: Array<
    | { type: 'text'; text: string }
    | { type: 'image'; image: string; mediaType?: string }
    | { type: 'file'; data: string; mediaType: string; filename?: string }
  > = [];
  for (const att of attachments) {
    if (!att.path) continue;
    try {
      const base64 = await invoke<string>('read_attachment_blob', {
        blobPath: att.path,
      });
      const mediaType = att.type || 'application/octet-stream';
      const dataUrl = `data:${mediaType};base64,${base64}`;
      if (mediaType.startsWith('image/')) {
        parts.push({ type: 'image', image: dataUrl, mediaType });
      } else {
        parts.push({
          type: 'file',
          data: dataUrl,
          mediaType,
          filename: att.name,
        });
      }
    } catch (err) {
      console.warn(`Failed to load attachment ${att.name}:`, err);
    }
  }
  return parts;
}

const HANDLER_BOILERPLATE = `
const raw = await new Promise((resolve) => {
  let buf = "";
  const decoder = new TextDecoder();
  async function read() {
    for await (const chunk of Deno.stdin.readable) {
      buf += decoder.decode(chunk);
      if (buf.includes("\\n")) { resolve(buf.trim()); return; }
    }
  }
  read();
});
const args = JSON.parse(raw);
const result = await handler(args);
console.log(JSON.stringify(result));
`;

/** Execute a code-mode tool by writing the code to a temp file and running it in Deno.
 *  User code must export an \`async function handler(args)\` — args are injected via stdin
 *  and the return value is written to stdout as JSON. */
async function executeCodeTool(
  toolName: string,
  code: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  const runnerId = crypto.randomUUID();
  const scriptPath = await writeTempScript(runnerId, code + HANDLER_BOILERPLATE);

  let stdout = '';
  let stderr = '';

  // resolveRun / rejectRun are assigned synchronously inside the Promise constructor
  // before any async operations begin, so the exit handler can safely call them.
  let resolveRun!: (value: unknown) => void;
  let rejectRun!: (reason: unknown) => void;
  const done = new Promise<unknown>((res, rej) => {
    resolveRun = res;
    rejectRun = rej;
  });

  // Register listeners before spawning so no events are missed.
  const unlistenOut = await onRunnerStdout((p) => {
    if (p.id === runnerId) stdout += p.data;
  });
  const unlistenErr = await onRunnerStderr((p) => {
    if (p.id === runnerId) stderr += p.data;
  });

  const unlistenExit = await onRunnerExit((p) => {
    if (p.id !== runnerId) return;
    unlistenOut();
    unlistenErr();
    unlistenExit();
    deleteTempScript(scriptPath).catch(() => {/* best-effort cleanup */});
    if (p.code === 0) {
      try {
        resolveRun(JSON.parse(stdout));
      } catch {
        resolveRun(stdout.trim());
      }
    } else {
      const detail = stderr.trim() || `exit code ${p.code}`;
      rejectRun(new Error(`Tool '${toolName}' failed: ${detail}`));
    }
  });

  try {
    await runnerSpawn({
      id: runnerId,
      script: scriptPath,
      permissions: { allow_net: '*', allow_env: true },
    });
    await runnerSend(runnerId, JSON.stringify(args) + '\n');
  } catch (err) {
    unlistenOut();
    unlistenErr();
    unlistenExit();
    await runnerKill(runnerId).catch(() => {});
    await deleteTempScript(scriptPath).catch(() => {});
    throw err;
  }

  return done;
}

/** Convert scenario tools to AI SDK tool format.
 *  JSON-mode tools return their mockResponse directly.
 *  Code-mode tools execute their code block in a Deno sandbox. */
export function toolConfigToAiSdkTools(tools: Tool[]): ToolSet {
  const result: ToolSet = {};
  for (const t of tools) {
    const properties: Record<string, Record<string, unknown>> = {};
    const required: string[] = [];
    for (const p of t.parameters) {
      const prop: Record<string, unknown> = { type: p.type };
      if (p.description) prop.description = p.description;
      if (p.type === 'array') prop.items = {};
      if (p.type === 'object') {
        prop.properties = {};
        prop.additionalProperties = true;
      }
      properties[p.name] = prop;
      if (p.required) required.push(p.name);
    }

    const mockMode = t.mockMode ?? 'json';

    result[t.name] = tool({
      description: t.description,
      inputSchema: jsonSchema({
        type: 'object',
        properties: Object.keys(properties).length ? properties : {},
        required,
        additionalProperties: false,
      }),
      execute: async (args: Record<string, unknown>) => {
        if (mockMode === 'code' && t.code?.trim()) {
          return executeCodeTool(t.name, t.code, args);
        }
        // JSON mock — return static response
        try {
          return JSON.parse(t.mockResponse);
        } catch {
          return t.mockResponse;
        }
      },
    });
  }
  return result;
}
