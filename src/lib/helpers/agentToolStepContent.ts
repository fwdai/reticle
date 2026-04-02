import type { StepType } from '@/types';

/**
 * `runAgentAction` sets tool step content to `JSON.stringify(input)`, then on `tool-result`
 * appends `\n\n` + `JSON.stringify(output)`. That is two JSON documents — not one value —
 * so `JSON.parse` on the full string fails unless we split.
 */
export function parseAgentToolCallContent(content: string): { input: unknown; output?: unknown } {
  const sep = '\n\n';
  const idx = content.indexOf(sep);
  if (idx === -1) {
    try {
      return { input: JSON.parse(content.trim()) };
    } catch {
      return { input: { raw: content } };
    }
  }
  const head = content.slice(0, idx).trim();
  const tail = content.slice(idx + sep.length).trim();
  try {
    const input = JSON.parse(head);
    try {
      return { input, output: JSON.parse(tail) };
    } catch {
      return { input, output: tail };
    }
  } catch {
    return { input: { raw: content } };
  }
}

/** Steps that use the args + `\n\n` + result concatenation from `runAgentAction`. */
export function isAgentToolConcatStepType(type: StepType): boolean {
  return type === 'tool_call' || type === 'memory_write' || type === 'human_input';
}

/**
 * Pretty JSON for a resolved tool step (matches run-detail trace: `tool`, `arguments`, optional `result`).
 */
export function formatAgentToolCallPayloadForDisplay(
  toolLabel: string,
  toolArguments: unknown,
  result?: unknown,
): string {
  const payload: Record<string, unknown> = {
    tool: toolLabel,
    arguments:
      toolArguments !== undefined &&
      toolArguments !== null &&
      typeof toolArguments === 'object' &&
      !Array.isArray(toolArguments)
        ? (toolArguments as Record<string, unknown>)
        : { value: toolArguments },
  };
  if (result !== undefined) payload.result = result;
  return JSON.stringify(payload, null, 2);
}

/** Parse stored step `content` and format for display/copy (agent runtime timeline). */
export function formatAgentToolCallStepContentForDisplay(toolLabel: string, content: string): string {
  const { input, output } = parseAgentToolCallContent(content);
  return formatAgentToolCallPayloadForDisplay(toolLabel, input, output);
}
