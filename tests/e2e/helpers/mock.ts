import fs from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "../../..");
const ADMIN_URL = "http://localhost:11513/__mock";

interface MockOptions {
  /** Restrict this mock to requests with a matching X-Api-Provider header.
   *  When omitted, the mock matches any (or no) provider. */
  provider?: "openai" | "anthropic" | "google";
  status?: number;
  /** Override the response Content-Type (default: application/json). */
  contentType?: string;
}

/**
 * Register a mock response for a URL path.
 * The fixture path is resolved relative to the project root.
 *
 * @example
 * // Matches all providers
 * await mockResponse("/v1/models", "tests/e2e/fixtures/openai/models.json")
 *
 * // Provider-specific (takes priority over wildcard)
 * await mockResponse("/v1/models", "tests/e2e/fixtures/openai/models.json", { provider: "openai" })
 * await mockResponse("/v1/models", "tests/e2e/fixtures/anthropic/models.json", { provider: "anthropic" })
 * await mockResponse("/v1/models", "tests/e2e/fixtures/google/models.json", { provider: "google" })
 */
export async function mockResponse(
  urlPath: string,
  fixturePath: string,
  options: MockOptions = {},
): Promise<void> {
  const { provider, status = 200, contentType } = options;
  const body = fs.readFileSync(path.resolve(ROOT, fixturePath), "utf-8");
  const res = await fetch(`${ADMIN_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: urlPath, body, status, provider, content_type: contentType }),
  });
  if (!res.ok) {
    throw new Error(`[mock] Failed to register mock for ${urlPath}: ${res.status}`);
  }
}

/**
 * Clear all registered mocks. Call in afterEach to isolate tests.
 */
export async function resetMocks(): Promise<void> {
  await fetch(`${ADMIN_URL}/reset`, { method: "DELETE" });
}
