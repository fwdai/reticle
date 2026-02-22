import { ToolLoopAgent, stepCountIs } from 'ai';
import { createModel } from '@/lib/gateway';
import { streamWithEvents } from './streamWithEvents';

import type { AgentEventCallback, ToolSet } from './types';


export interface CreateAgentOptions {
  provider: string;
  model: string;
  instructions?: string;
  maxSteps?: number;
  maxRetries?: number;
  tools?: ToolSet;
  timeout?: number; // milliseconds
  abortSignal?: AbortSignal;
  /** Callback invoked for each execution event */
  onEvent: AgentEventCallback;
}

export interface AgentStreamOptions {
  /** User prompt */
  prompt?: string;
  /** Message array (alternative to prompt) */
  messages?: Array<{ role: string; content: unknown }>;
  abortSignal?: AbortSignal;
}

export interface Agent {
  /** Run the agent with the given prompt. Emits events to the onEvent callback. */
  stream(options: AgentStreamOptions): ReturnType<typeof streamWithEvents>;
}

export function createAgent(options: CreateAgentOptions): Agent {
  const { provider, model, instructions, tools, timeout, maxSteps = 10, maxRetries = 3, onEvent } = options;

  const agent = new ToolLoopAgent({
    id: 'reticle-agent',
    model: createModel({ provider, model }),
    instructions: instructions,
    tools: tools,
    maxRetries: maxRetries,
    stopWhen: stepCountIs(maxSteps),
    timeout: { totalMs: timeout },
  });

  return {
    stream: (streamOptions: AgentStreamOptions) => streamWithEvents(agent as unknown as Parameters<typeof streamWithEvents>[0], {
      prompt: streamOptions.prompt,
      messages: streamOptions.messages,
      modelId: model,
      onEvent,
      abortSignal: streamOptions.abortSignal,
    }),
  };
};

// USAGE
// const agent = createAgent({
//   provider: 'openai',
//   model: 'gpt-4o',
//   instructions: 'You are a helpful assistant.',
//   maxSteps: 10,
//   tools: {
//     get_price: tool({
//       description: 'Get the price of a cryptocurrency',
//       inputSchema: jsonSchema({
//         type: 'object',
//         properties: {},
//         additionalProperties: false,
//       }),
//       execute: async () => ({ price: 56000 }), // placeholder
//     }),
//   },
//   onEvent: (event) => {
//     console.log('Event:', event);
//   },
// });

// // Run it
// const stream = await agent.stream({
//   prompt: 'What is the price of bitcoin in USD?',
// });

// // Consume the stream
// for await (const chunk of stream.textStream) {
//   console.log(chunk);
// }