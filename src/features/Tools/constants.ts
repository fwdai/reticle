import type { RegistryTool, ToolParameter } from "./types";

export const CATEGORIES = [
  "All",
  "Data",
  "Communication",
  "DevOps",
  "Search",
  "Custom",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const PARAM_TYPES = [
  "string",
  "number",
  "boolean",
  "object",
  "array",
] as const;

export function createEmptyTool(): RegistryTool {
  return {
    id: crypto.randomUUID(),
    name: "",
    description: "",
    category: "Custom",
    parameters: [],
    mockResponse: '{\n  "result": "success"\n}',
    mockMode: "json",
    usedBy: 0,
    updatedAt: "Just now",
  };
}

export function createEmptyParam(): ToolParameter {
  return {
    id: crypto.randomUUID(),
    name: "",
    type: "string",
    description: "",
    required: true,
  };
}

export const SEED_TOOLS: RegistryTool[] = [
  {
    id: "1",
    name: "search_knowledge_base",
    description:
      "Search internal knowledge base for relevant documents and return matching results with relevance scores.",
    category: "Search",
    parameters: [
      { id: "p1", name: "query", type: "string", description: "Search query string", required: true },
      { id: "p2", name: "max_results", type: "number", description: "Maximum results to return", required: false },
      { id: "p3", name: "filters", type: "object", description: "Optional filter criteria", required: false },
    ],
    mockResponse: '{\n  "results": [\n    { "title": "Doc 1", "score": 0.95 }\n  ],\n  "total": 1\n}',
    mockMode: "json",
    usedBy: 4,
    updatedAt: "2 hours ago",
  },
  {
    id: "2",
    name: "send_notification",
    description:
      "Send a notification to a user or channel via the configured messaging provider.",
    category: "Communication",
    parameters: [
      { id: "p4", name: "channel", type: "string", description: "Target channel or user ID", required: true },
      { id: "p5", name: "message", type: "string", description: "Notification body", required: true },
      { id: "p6", name: "priority", type: "string", description: "Priority level: low, normal, high", required: false },
    ],
    mockResponse: '{ "sent": true, "messageId": "msg_abc123" }',
    mockMode: "json",
    usedBy: 3,
    updatedAt: "1 day ago",
  },
  {
    id: "3",
    name: "query_database",
    description:
      "Execute a read-only SQL query against the connected database and return results.",
    category: "Data",
    parameters: [
      { id: "p7", name: "sql", type: "string", description: "SQL query to execute", required: true },
      { id: "p8", name: "params", type: "array", description: "Parameterized query values", required: false },
    ],
    mockResponse: '{ "rows": [], "rowCount": 0 }',
    mockMode: "json",
    usedBy: 6,
    updatedAt: "3 hours ago",
  },
  {
    id: "4",
    name: "deploy_service",
    description:
      "Trigger a deployment pipeline for the specified service and environment.",
    category: "DevOps",
    parameters: [
      { id: "p9", name: "service", type: "string", description: "Service name", required: true },
      { id: "p10", name: "environment", type: "string", description: "Target environment", required: true },
      { id: "p11", name: "version", type: "string", description: "Version tag to deploy", required: false },
    ],
    mockResponse: '{ "deploymentId": "dep_xyz", "status": "queued" }',
    mockMode: "json",
    usedBy: 2,
    updatedAt: "5 days ago",
  },
  {
    id: "5",
    name: "fetch_webpage",
    description:
      "Fetch and parse a webpage URL, returning structured content and metadata.",
    category: "Search",
    parameters: [
      { id: "p12", name: "url", type: "string", description: "URL to fetch", required: true },
      { id: "p13", name: "extract_text", type: "boolean", description: "Extract plain text only", required: false },
    ],
    mockResponse: '{ "title": "Page Title", "content": "...", "status": 200 }',
    mockMode: "json",
    usedBy: 5,
    updatedAt: "12 hours ago",
  },
];
