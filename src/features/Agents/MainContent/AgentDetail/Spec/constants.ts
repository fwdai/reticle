export const panelBase =
  "bg-white border border-border-light rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] flex flex-col";
export const panelHeader =
  "h-10 px-5 border-b border-border-light bg-sidebar-light/50 flex justify-between items-center";
export const panelTitle = "text-[10px] font-bold text-text-muted uppercase tracking-widest";

export const availableTools = [
  { id: "web-search", name: "Web Search", description: "Search the internet for information" },
  { id: "code-exec", name: "Code Executor", description: "Execute Python or JS code snippets" },
  { id: "file-read", name: "File Reader", description: "Read and parse file contents" },
  { id: "api-call", name: "API Caller", description: "Make HTTP requests to external APIs" },
  { id: "db-query", name: "DB Query", description: "Run SQL queries against databases" },
  { id: "email-send", name: "Email Sender", description: "Send emails via SMTP or API" },
  { id: "slack-msg", name: "Slack Message", description: "Post messages to Slack channels" },
  { id: "scraper", name: "Web Scraper", description: "Extract structured data from URLs" },
];
