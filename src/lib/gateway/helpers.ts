import { invoke } from '@tauri-apps/api/core';
import { PROVIDERS_LIST } from '@/constants/providers';
import { jsonSchema, tool, type ToolSet } from 'ai';
import { ANTHROPIC_VERSION, REASONING_MODEL_PREFIXES } from './constants';
import type { AttachedFile } from '@/contexts/StudioContext';
import type { Tool } from '@/components/Tools/types';

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

/** Convert scenario tools to AI SDK tool format. Uses mockResponse for execute. */
export function scenarioToolsToAiSdkTools(tools: Tool[]): ToolSet {
  const result: ToolSet = {};
  for (const t of tools) {
    const properties: Record<
      string,
      {
        type: 'string' | 'number' | 'boolean' | 'object' | 'array';
        description?: string;
      }
    > = {};
    const required: string[] = [];
    for (const p of t.parameters) {
      properties[p.name] = {
        type: p.type,
        ...(p.description ? { description: p.description } : {}),
      };
      if (p.required) required.push(p.name);
    }
    const mockResponse = t.mockResponse;
    const mockMode = t.mockMode ?? 'json';
    result[t.name] = tool({
      description: t.description,
      inputSchema: jsonSchema({
        type: 'object',
        properties: Object.keys(properties).length ? properties : {},
        required,
        additionalProperties: false,
      }),
      execute: async () => {
        if (mockMode === 'json') {
          try {
            return JSON.parse(mockResponse);
          } catch {
            return mockResponse;
          }
        }
        return mockResponse;
      },
    });
  }
  return result;
}
