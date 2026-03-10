import {
  Wrench,
  FileCode, Variable, MessageCircle,
  Braces, Zap,
  BookOpen,
  Library,
  Globe, Database, Bell,
  Tag, Code2, Terminal,
} from "lucide-react";
import type { StarterTemplate, StarterTemplatesProps } from "@/components/ui/EmptyState";
import type { Tool } from "@/components/Tools/types";
import type { PromptTemplate } from "@/types";

export type { StarterTemplate };

export type EntityEmptyStateConfig = Omit<StarterTemplatesProps, "onCreateBlank" | "onSelect">;

// ─── Agent config type ────────────────────────────────────────────────────────

export interface AgentStarterConfig {
  name: string;
  description: string;
  agentGoal: string;
  systemInstructions: string;
}

// ─── Scenario config type ─────────────────────────────────────────────────────

export interface ScenarioStarterConfig {
  title: string;
  system_prompt: string;
  user_prompt: string;
  history_json?: string;
  variables_json?: string;
}

// ─── Agents ───────────────────────────────────────────────────────────────────

export const AGENT_EMPTY_STATE: EntityEmptyStateConfig & {
  templates: (StarterTemplate & { config: AgentStarterConfig })[];
} = {
  badge: "Agents",
  badgeIcon: Zap,
  headline: "Your first agent, ready to build",
  subtitle:
    "Agents are AI workers you configure with a model, instructions, and tools. Define one here, then run it against scenarios to test and refine its behavior.",
  createLabel: "Create an agent",
  templates: [
    {
      icon: Tag,
      title: "Release Notes Generator",
      description:
        "Fetches merged pull requests from a public GitHub repo via the API and writes structured, categorized release notes.",
      tags: ["github", "tools", "multi-step"],
      config: {
        name: "Release Notes Generator",
        description:
          "Fetches recent merged pull requests from a public GitHub repo and generates structured release notes.",
        agentGoal:
          "Generate structured release notes from recent merged pull requests in a GitHub repository.",
        systemInstructions: `You are a release notes writer. When given a GitHub repository (e.g. "owner/repo"), you will:

1. Fetch the most recent merged pull requests using the fetch_webpage tool with this URL:
   https://api.github.com/repos/{owner}/{repo}/pulls?state=closed&per_page=20

2. Parse the JSON response and categorize each PR as:
   - ✨ Features — new capabilities or enhancements
   - 🐛 Bug Fixes — corrections to broken behavior
   - ⚡ Performance — speed or efficiency improvements
   - 🔧 Other — maintenance, deps, docs, chores

3. Write developer-friendly release notes in this format:

## Release Notes

### ✨ Features
- PR title (#number)

### 🐛 Bug Fixes
- PR title (#number)

### 🔧 Other Changes
- PR title (#number)

Rules:
- Skip automated dependency bumps (e.g. "Bump X from Y to Z")
- Skip merge commits
- Keep titles concise — rewrite if needed for clarity
- Omit empty sections`,
      },
    },
    {
      icon: Code2,
      title: "Code Reviewer",
      description:
        "Analyzes any code snippet and returns structured feedback across four categories: bugs, security, performance, and style.",
      tags: ["code", "no tools"],
      config: {
        name: "Code Reviewer",
        description:
          "Analyzes code snippets and returns structured feedback on quality, security, and correctness.",
        agentGoal: "Review the provided code snippet and return structured, actionable feedback.",
        systemInstructions: `You are a senior software engineer conducting code reviews. When given a code snippet, analyze it across these four categories:

- **Bugs** — logic errors, off-by-one, null/undefined risks, incorrect assumptions
- **Security** — injection risks, exposed credentials, unsafe eval, improper auth
- **Performance** — O(n²) operations, unnecessary re-renders, memory leaks, blocking calls
- **Style** — misleading names, unnecessary complexity, missing edge case handling

Format your response as:

## Code Review

### Summary
[1–2 sentence overall assessment]

### Issues
**[SEVERITY: Critical / Major / Minor]** · [Category]
> [Quote the problematic code]
[Clear explanation of the issue and why it matters]
✅ Fix: [corrected snippet]

### What Works Well
- [1–3 specific things done well]

Rules:
- If a category has no issues, skip it
- Be specific — never say "improve naming" without showing the fix
- Quote the exact line(s) in question`,
      },
    },
    {
      icon: BookOpen,
      title: "Content Summarizer",
      description:
        "Distills long-form content into a structured brief: one-sentence TL;DR, key points, and action items.",
      tags: ["content", "no tools"],
      config: {
        name: "Content Summarizer",
        description:
          "Distills long-form content into a structured summary with TL;DR, key points, and action items.",
        agentGoal: "Summarize the provided content into a clear, structured brief.",
        systemInstructions: `You are a professional editor. When given content to summarize, produce a structured brief in this exact format:

## Summary

**TL;DR**
[One sentence. Never more.]

**Key Points**
- [Specific, concrete point — no filler]
- [Another point]
- [Continue up to 7 max]

**Action Items** *(omit this section if none apply)*
- [ ] [Specific task]

**Context** *(omit unless essential background is needed)*
[1–2 sentences max]

Rules:
- TL;DR must be exactly one sentence
- Key points must be specific — never "the author discusses X"
- Omit any section that doesn't apply
- Do not editorialize or add your own opinions`,
      },
    },
  ],
};

// ─── Scenarios ────────────────────────────────────────────────────────────────

export const SCENARIO_EMPTY_STATE: EntityEmptyStateConfig & {
  templates: (StarterTemplate & { config: ScenarioStarterConfig })[];
} = {
  badge: "Scenarios",
  badgeIcon: FileCode,
  headline: "Start testing your models",
  subtitle:
    "Scenarios are structured prompts you run against a model. Build a library of cases to compare outputs, catch regressions, and measure quality over time.",
  createLabel: "Create a scenario",
  templates: [
    {
      icon: MessageCircle,
      title: "Sentiment Classifier",
      description:
        "A single-turn prompt that classifies text as Positive, Negative, or Neutral with a one-line explanation — a classic eval task.",
      tags: ["single-turn", "classification"],
      config: {
        title: "Sentiment Classifier",
        system_prompt:
          "You are a sentiment analysis model. Classify the sentiment of the provided text as exactly one of: Positive, Negative, or Neutral.\n\nRespond with the classification on the first line, then a single sentence explaining your reasoning.\n\nExample output:\nNegative\nThe text expresses clear frustration with both the product and the support experience.",
        user_prompt:
          "I've been using this product for a week and it keeps crashing every time I try to export. The support team hasn't responded in three days.",
      },
    },
    {
      icon: Variable,
      title: "Extract Structured Data",
      description:
        "Uses {{text}} and {{fields}} variables to extract JSON from any input — swap values to reuse the same prompt across different sources.",
      tags: ["variables", "json"],
      config: {
        title: "Extract Structured Data",
        system_prompt:
          "You are a data extraction assistant. Extract the requested fields from the provided text and return them as a valid JSON object. If a field cannot be found, set its value to null. Return only the JSON object with no additional text or markdown.",
        user_prompt:
          "Extract the following fields from this text:\n\nText: {{text}}\n\nFields to extract: {{fields}}",
        variables_json: JSON.stringify({
          system: [],
          user: [
            {
              key: "text",
              value:
                "Jane Smith, Senior Product Designer at Vercel. 7 years of experience in design systems and developer tooling. Based in New York. Open to remote opportunities starting Q2 2025. Contact: jane@example.com",
            },
            {
              key: "fields",
              value: "name, title, company, location, skills, availability, email",
            },
          ],
        }),
      },
    },
    {
      icon: Terminal,
      title: "Debugging Session",
      description:
        "A multi-turn conversation with a senior engineer. Pre-loaded with history so you can test how the model handles context from prior turns.",
      tags: ["multi-turn", "debugging"],
      config: {
        title: "Debugging Session",
        system_prompt:
          "You are a senior software engineer helping debug issues. Ask clarifying questions when needed. When you identify a problem, explain the root cause clearly before suggesting a fix.",
        user_prompt:
          "The fix worked! But now I'm seeing a new error: `TypeError: Cannot read properties of undefined (reading 'map')` on line 47. Here's the relevant code:\n\n```js\nconst items = response.data.items.map(item => item.name);\n```",
        history_json: JSON.stringify([
          {
            role: "user",
            content:
              "I'm getting a 401 error when calling my API endpoint. The token looks correct but it keeps failing.",
          },
          {
            role: "assistant",
            content:
              "Let's debug this step by step. A 401 with an apparently correct token usually means one of three things:\n\n1. **Token format** — Are you sending it as `Bearer <token>` in the Authorization header, or just the raw token?\n2. **Token expiry** — Has the token expired? Check if it has an `exp` claim.\n3. **Wrong token type** — Are you using an access token where a refresh token is expected?\n\nCan you share how you're attaching the token to the request?",
          },
          {
            role: "user",
            content:
              "I was sending just the raw token without 'Bearer'. Adding that prefix fixed the 401, thanks!",
          },
          {
            role: "assistant",
            content:
              "Classic one! The `Bearer` prefix is required by the OAuth 2.0 spec — many APIs enforce it strictly.\n\nAnything else throwing errors, or are you good to go?",
          },
        ]),
      },
    },
  ],
};

// ─── Tools ────────────────────────────────────────────────────────────────────

export const TOOL_EMPTY_STATE: EntityEmptyStateConfig & {
  templates: (StarterTemplate & { config: Partial<Tool> })[];
} = {
  badge: "Tools",
  badgeIcon: Wrench,
  headline: "Give your agents something to do",
  subtitle:
    "Tools are callable functions defined once and shared across agents and scenarios. Connect to external APIs, transform data, or encapsulate any logic your agents need.",
  createLabel: "Create a tool",
  templates: [
    {
      icon: Globe,
      title: "Fetch Webpage",
      description:
        "Retrieves the text content of any public URL. Ships with working Deno code — paste a URL and run it immediately.",
      tags: ["http", "code"],
      config: {
        name: "fetch_webpage",
        description: "Fetches the text content of a public webpage by URL.",
        parameters: [
          {
            id: "fetch-url",
            name: "url",
            type: "string",
            description: "The full URL to fetch (e.g. https://example.com)",
            required: true,
          },
          {
            id: "fetch-format",
            name: "format",
            type: "string",
            description: '"text" strips HTML tags (default), "html" returns raw markup',
            required: false,
          },
        ],
        mockResponse: `{
  "title": "Example Domain",
  "content": "This domain is for use in illustrative examples in documents.",
  "status_code": 200
}`,
        mockMode: "code",
        code: `async function handler(args) {
  const res = await fetch(args.url);
  if (!res.ok) {
    throw new Error(\`HTTP \${res.status}: \${res.statusText}\`);
  }
  const html = await res.text();
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "";
  if (args.format === "html") {
    return { title, content: html, status_code: res.status };
  }
  const text = html.replace(/<[^>]+>/g, " ").replace(/\\s+/g, " ").trim();
  return { title, content: text.slice(0, 5000), status_code: res.status };
}`,
      },
    },
    {
      icon: Database,
      title: "SQL Query",
      description:
        "Queries a database and returns results as structured rows. Pre-loaded with realistic mock data so agents can reason over it right away.",
      tags: ["sql", "mock"],
      config: {
        name: "run_sql_query",
        description: "Runs a read-only SQL SELECT query and returns results as a JSON array of rows.",
        parameters: [
          {
            id: "sql-query",
            name: "query",
            type: "string",
            description: "The SQL SELECT query to execute",
            required: true,
          },
          {
            id: "sql-database",
            name: "database",
            type: "string",
            description: 'Database name to query. Defaults to "main".',
            required: false,
          },
        ],
        mockResponse: `{
  "rows": [
    { "id": 1, "name": "Alice Johnson", "email": "alice@example.com", "status": "active" },
    { "id": 2, "name": "Bob Smith", "email": "bob@example.com", "status": "inactive" },
    { "id": 3, "name": "Carol White", "email": "carol@example.com", "status": "active" }
  ],
  "row_count": 3,
  "query_time_ms": 4
}`,
        mockMode: "json",
      },
    },
    {
      icon: Bell,
      title: "Send Notification",
      description:
        "Sends a message to email, Slack, or a webhook. Uses mock mode so you can test agent behavior before wiring up real credentials.",
      tags: ["notification", "mock"],
      config: {
        name: "send_notification",
        description: "Sends a notification message to email, a Slack channel, or a webhook URL.",
        parameters: [
          {
            id: "notif-channel",
            name: "channel",
            type: "string",
            description: 'Delivery channel: "email", "slack", or "webhook"',
            required: true,
          },
          {
            id: "notif-recipient",
            name: "recipient",
            type: "string",
            description: "Email address, Slack channel (e.g. #engineering), or webhook URL",
            required: true,
          },
          {
            id: "notif-message",
            name: "message",
            type: "string",
            description: "The notification message body",
            required: true,
          },
          {
            id: "notif-subject",
            name: "subject",
            type: "string",
            description: "Subject line (email only)",
            required: false,
          },
        ],
        mockResponse: `{
  "status": "sent",
  "message_id": "msg_abc123def456",
  "channel": "slack",
  "recipient": "#engineering",
  "timestamp": "2025-01-15T14:30:00Z"
}`,
        mockMode: "json",
      },
    },
  ],
};

// ─── Prompt Templates ─────────────────────────────────────────────────────────

export const TEMPLATE_EMPTY_STATE: EntityEmptyStateConfig & {
  templates: (StarterTemplate & { config: Partial<PromptTemplate> })[];
} = {
  badge: "Prompt Templates",
  badgeIcon: Library,
  headline: "Reuse what works",
  subtitle:
    "Prompt templates let you define and version your best prompts in one place. Use variables to keep them flexible, then attach them to scenarios and agents across your workspace.",
  createLabel: "Create a template",
  templates: [
    {
      icon: Braces,
      title: "JSON-Only Responder",
      description:
        "Forces the model to output valid JSON exclusively — no prose, no markdown. Essential for structured pipelines.",
      tags: ["system", "json"],
      config: {
        type: "system",
        name: "JSON-Only Responder",
        content: `You are a structured data assistant. You must respond with valid JSON only.

Rules:
- Output raw JSON only — no prose, no markdown, no code fences
- Never add text before or after the JSON object
- If you cannot fulfill the request, return: {"error": "reason"}
- Ensure all strings are properly escaped
- Never truncate the output

The expected JSON schema will be specified in each user message.`,
        variables_json: null,
      },
    },
    {
      icon: Variable,
      title: "Rewrite with Tone",
      description:
        "Rewrites any text in a chosen {{tone}}. A single template that covers formal, casual, technical, and more.",
      tags: ["user", "variables"],
      config: {
        type: "user",
        name: "Rewrite with Tone",
        content: `Rewrite the following text in a {{tone}} tone, preserving the core meaning and all key information. Return only the rewritten text with no commentary.

Text to rewrite:
{{text}}`,
        variables_json: JSON.stringify({
          system: [],
          user: [
            { key: "tone", value: "professional" },
            {
              key: "text",
              value:
                "hey so i looked at your pr and honestly it's kind of a mess, there's like 3 bugs i found and the naming is all over the place, can you fix it before we merge",
            },
          ],
        }),
      },
    },
    {
      icon: BookOpen,
      title: "Few-Shot Classifier",
      description:
        "Guides the model with labeled examples before asking it to classify {{input}}. Reliable, consistent categorization.",
      tags: ["user", "few-shot"],
      config: {
        type: "user",
        name: "Few-Shot Classifier",
        content: `Classify the following input into one of these categories: Bug Report, Feature Request, or General Question.

Examples:
Input: "The app crashes when I upload a file larger than 10MB"
Category: Bug Report

Input: "It would be great if we could export data to CSV format"
Category: Feature Request

Input: "How do I reset my password?"
Category: General Question

Input: "The dashboard doesn't load on Safari 16"
Category: Bug Report

Input: "Can you add dark mode support?"
Category: Feature Request

Now classify:
Input: {{input}}
Category:`,
        variables_json: JSON.stringify({
          system: [],
          user: [
            {
              key: "input",
              value: "The notifications keep showing up even after I mark them as read",
            },
          ],
        }),
      },
    },
  ],
};
