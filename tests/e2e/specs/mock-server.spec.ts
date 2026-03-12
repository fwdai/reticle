/**
 * Smoke tests for the mock server.
 *
 * These verify the mock registration API from the Node.js test process.
 * Tauri's W3C WebDriver doesn't support async functions in browser.execute
 * (Promise is not a serializable return type), so we test the mock server
 * directly via fetch from the test runner instead.
 *
 * Browser-level proof that mocked data reaches the app will come from
 * feature tests that navigate the UI and assert on rendered model names.
 */

import { mockResponse, resetMocks } from "../helpers/mock";

const PROXY = "http://localhost:11513";

interface ModelsResponse {
  object: string;
  data: Array<{ id: string; object: string }>;
}

describe("mock server", () => {
  afterEach(async () => {
    await resetMocks();
  });

  it("returns fixture data for a registered path", async () => {
    await mockResponse("/v1/models", "tests/e2e/fixtures/openai/models.json");

    const res = await fetch(`${PROXY}/v1/models`);
    const body = (await res.json()) as ModelsResponse;

    expect(res.status).toBe(200);
    expect(body.data).toContainEqual({ id: "gpt-4o", object: "model" });
    expect(body.data).toContainEqual({ id: "gpt-4o-mini", object: "model" });
  });

  it("returns 404 for an unregistered path", async () => {
    const res = await fetch(`${PROXY}/v1/unregistered`);
    expect(res.status).toBe(404);
  });

  it("resetMocks clears registered responses", async () => {
    await mockResponse("/v1/models", "tests/e2e/fixtures/openai/models.json");
    await resetMocks();

    const res = await fetch(`${PROXY}/v1/models`);
    expect(res.status).toBe(404);
  });
});
