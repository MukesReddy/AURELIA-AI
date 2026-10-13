import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { type AppConfig, LYZR_CHAT_ENDPOINT, loadConfig } from "../src/config.js";
import type { FetchLike } from "../src/lyzr.js";

const TEST_KEY = "sk-test-not-real-123";
const TEST_AGENT = "agent-test-456";

function makeConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    ...loadConfig({ LYZR_API_KEY: TEST_KEY, LYZR_AGENT_ID: TEST_AGENT }),
    rateLimitPerMinute: 1000,
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

const validBody = { message: "Help me plan my day", sessionId: "sess-abc_123", userId: "anon-xyz" };

function setup(fetchImpl: FetchLike, overrides: Partial<AppConfig> = {}) {
  const mock = vi.fn(fetchImpl);
  return { app: createApp(makeConfig(overrides), mock as unknown as FetchLike), mock };
}

describe("POST /api/chat — validation", () => {
  it.each([
    ["empty string", { ...validBody, message: "" }],
    ["whitespace only", { ...validBody, message: "   \n " }],
    ["missing message", { sessionId: "s", userId: "u" }],
    ["non-string message", { ...validBody, message: 42 }],
  ])("rejects %s with 400 and does not call Lyzr", async (_label, body) => {
    const { app, mock } = setup(async () => jsonResponse({ response: "x" }));
    const res = await request(app).post("/api/chat").send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/empty/i);
    expect(mock).not.toHaveBeenCalled();
  });

  it("rejects messages over the length limit", async () => {
    const { app, mock } = setup(async () => jsonResponse({ response: "x" }));
    const res = await request(app).post("/api/chat").send({ ...validBody, message: "a".repeat(4001) });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/too long/i);
    expect(mock).not.toHaveBeenCalled();
  });

  it("rejects invalid session IDs", async () => {
    const { app, mock } = setup(async () => jsonResponse({ response: "x" }));
    const res = await request(app).post("/api/chat").send({ ...validBody, sessionId: "bad id!" });
    expect(res.status).toBe(400);
    expect(mock).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON safely", async () => {
    const { app } = setup(async () => jsonResponse({ response: "x" }));
    const res = await request(app).post("/api/chat").set("Content-Type", "application/json").send("{not json");
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("invalid_request");
  });
});

describe("POST /api/chat — forwarding to Lyzr", () => {
  it("sends the correct URL, headers and payload", async () => {
    const { app, mock } = setup(async () => jsonResponse({ response: "Here is your plan", module_outputs: {} }));
    await request(app).post("/api/chat").send(validBody).expect(200);

    expect(mock).toHaveBeenCalledTimes(1);
    const [url, init] = mock.mock.calls[0]!;
    expect(url).toBe(LYZR_CHAT_ENDPOINT);
    expect(init?.method).toBe("POST");
    const headers = init?.headers as Record<string, string>;
    expect(headers["x-api-key"]).toBe(TEST_KEY);
    expect(headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(init?.body as string)).toEqual({
      user_id: "anon-xyz",
      agent_id: TEST_AGENT,
      session_id: "sess-abc_123",
      message: "Help me plan my day",
    });
  });

  it("forwards the user's actual message without rewriting it", async () => {
    const { app, mock } = setup(async () => jsonResponse({ response: "ok" }));
    const message = "Break down my thesis project into weekly milestones\n- due in May";
    await request(app).post("/api/chat").send({ ...validBody, message }).expect(200);
    expect(JSON.parse(mock.mock.calls[0]![1]?.body as string).message).toBe(message);
  });

  it("returns the parsed answer as { answer }", async () => {
    const { app } = setup(async () => jsonResponse({ response: "## Plan\n- Step 1", module_outputs: {} }));
    const res = await request(app).post("/api/chat").send(validBody);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ answer: "## Plan\n- Step 1" });
  });

  it("never leaks the API key in responses", async () => {
    const { app } = setup(async () => jsonResponse({ detail: "Invalid API Key" }, 403));
    const res = await request(app).post("/api/chat").send(validBody);
    expect(JSON.stringify(res.body)).not.toContain(TEST_KEY);
    expect(JSON.stringify(res.headers)).not.toContain(TEST_KEY);
  });
});

describe("POST /api/chat — upstream failures", () => {
  it("maps upstream 403 authentication failure to a safe 502", async () => {
    const { app } = setup(async () => jsonResponse({ detail: "Invalid API Key" }, 403));
    const res = await request(app).post("/api/chat").send(validBody);
    expect(res.status).toBe(502);
    expect(res.body.code).toBe("upstream_auth");
    expect(res.body.error).toMatch(/credentials/i);
  });

  it("maps upstream 401 to upstream_auth", async () => {
    const { app } = setup(async () => jsonResponse({ detail: "Unauthorized" }, 401));
    const res = await request(app).post("/api/chat").send(validBody);
    expect(res.body.code).toBe("upstream_auth");
  });

  it("maps upstream 404 (unknown agent)", async () => {
    const { app } = setup(async () => jsonResponse({ detail: "Agent not found" }, 404));
    const res = await request(app).post("/api/chat").send(validBody);
    expect(res.status).toBe(502);
    expect(res.body.code).toBe("upstream_not_found");
  });

  it("maps upstream 500 to 502 without exposing upstream details", async () => {
    const { app } = setup(async () => jsonResponse({ detail: "internal trace /srv/secret.py" }, 500));
    const res = await request(app).post("/api/chat").send(validBody);
    expect(res.status).toBe(502);
    expect(JSON.stringify(res.body)).not.toContain("secret.py");
  });

  it("returns 504 when Lyzr times out", async () => {
    const hang: FetchLike = (_url, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
      });
    const { app } = setup(hang, { timeoutMs: 50 });
    const res = await request(app).post("/api/chat").send(validBody);
    expect(res.status).toBe(504);
    expect(res.body.code).toBe("upstream_timeout");
  });

  it("returns 502 on network failure", async () => {
    const { app } = setup(async () => {
      throw new TypeError("fetch failed: ECONNREFUSED 10.0.0.1");
    });
    const res = await request(app).post("/api/chat").send(validBody);
    expect(res.status).toBe(502);
    expect(res.body.code).toBe("upstream_unreachable");
    expect(JSON.stringify(res.body)).not.toContain("ECONNREFUSED");
  });

  it("returns 502 when upstream body is not JSON", async () => {
    const { app } = setup(async () => new Response("<html>gateway</html>", { status: 200 }));
    const res = await request(app).post("/api/chat").send(validBody);
    expect(res.status).toBe(502);
    expect(res.body.code).toBe("upstream_invalid");
  });

  it.each([
    ["missing response field", { module_outputs: {} }],
    ["non-string response", { response: { text: "hi" } }],
    ["empty response", { response: "   " }],
    ["array body", ["hi"]],
  ])("returns 502 for unexpected shape: %s", async (_label, body) => {
    const { app } = setup(async () => jsonResponse(body));
    const res = await request(app).post("/api/chat").send(validBody);
    expect(res.status).toBe(502);
    expect(res.body.code).toBe("upstream_invalid");
  });
});

describe("configuration", () => {
  it("returns 503 with setup guidance when env vars are missing, without calling Lyzr", async () => {
    const config = { ...loadConfig({}), rateLimitPerMinute: 1000 };
    const mock = vi.fn(async () => jsonResponse({ response: "x" }));
    const app = createApp(config, mock as unknown as FetchLike);
    const res = await request(app).post("/api/chat").send(validBody);
    expect(res.status).toBe(503);
    expect(res.body.code).toBe("not_configured");
    expect(res.body.error).toMatch(/LYZR_API_KEY/);
    expect(mock).not.toHaveBeenCalled();
  });

  it("health endpoint reports missing variable names but never values", async () => {
    const app = createApp({ ...loadConfig({ LYZR_API_KEY: TEST_KEY }) });
    const res = await request(app).get("/api/health");
    expect(res.body).toEqual({ ok: true, configured: false, missing: ["LYZR_AGENT_ID"] });
    expect(JSON.stringify(res.body)).not.toContain(TEST_KEY);
  });
});

describe("security middleware", () => {
  it("allows the configured frontend origin via CORS", async () => {
    const { app } = setup(async () => jsonResponse({ response: "x" }));
    const res = await request(app).post("/api/chat").set("Origin", "http://localhost:5173").send(validBody);
    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
  });

  it("does not grant CORS to unknown origins", async () => {
    const { app } = setup(async () => jsonResponse({ response: "x" }));
    const res = await request(app).post("/api/chat").set("Origin", "https://evil.example").send(validBody);
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("rate limits /api/chat", async () => {
    const { app } = setup(async () => jsonResponse({ response: "x" }), { rateLimitPerMinute: 2 });
    await request(app).post("/api/chat").send(validBody).expect(200);
    await request(app).post("/api/chat").send(validBody).expect(200);
    const res = await request(app).post("/api/chat").send(validBody);
    expect(res.status).toBe(429);
    expect(res.body.code).toBe("rate_limited");
  });
});
