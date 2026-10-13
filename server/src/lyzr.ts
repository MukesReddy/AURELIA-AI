import type { AppConfig } from "./config.js";

export type FetchLike = typeof fetch;

export interface LyzrChatInput {
  userId: string;
  sessionId: string;
  message: string;
}

/** Error with a status code and a message that is safe to show in the browser. */
export class ChatError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    public readonly publicMessage: string,
  ) {
    super(publicMessage);
    this.name = "ChatError";
  }
}

/**
 * Calls the configured Lyzr agent and returns its answer text.
 *
 * Verified response shape (live call): { "response": string, "module_outputs": {} }
 * Verified error shape: { "detail": string } with 403 (bad key) / 404 (unknown agent).
 */
export async function askLyzr(
  config: AppConfig,
  input: LyzrChatInput,
  fetchImpl: FetchLike = fetch,
): Promise<string> {
  if (!config.lyzrApiKey || !config.lyzrAgentId) {
    throw new ChatError(
      503,
      "not_configured",
      "AURELIA is not configured yet. Add LYZR_API_KEY and LYZR_AGENT_ID to server/.env and restart the server.",
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);

  let res: Response;
  try {
    res = await fetchImpl(config.lyzrEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.lyzrApiKey,
      },
      body: JSON.stringify({
        user_id: input.userId,
        agent_id: config.lyzrAgentId,
        session_id: input.sessionId,
        message: input.message,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (controller.signal.aborted) {
      throw new ChatError(504, "upstream_timeout", "The AI agent took too long to respond. Please try again.");
    }
    throw new ChatError(502, "upstream_unreachable", "Could not reach the AI agent. Check your connection and try again.");
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new ChatError(502, "upstream_auth", "The AI agent rejected the server's credentials. Check LYZR_API_KEY.");
    }
    if (res.status === 404) {
      throw new ChatError(502, "upstream_not_found", "The configured AI agent was not found. Check LYZR_AGENT_ID.");
    }
    if (res.status === 429) {
      throw new ChatError(429, "upstream_rate_limited", "The AI agent is receiving too many requests. Please wait a moment.");
    }
    throw new ChatError(502, "upstream_error", `The AI agent returned an error (HTTP ${res.status}). Please try again.`);
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new ChatError(502, "upstream_invalid", "The AI agent returned an unreadable response.");
  }

  const answer = extractAnswer(data);
  if (answer === null) {
    throw new ChatError(502, "upstream_invalid", "The AI agent returned an unexpected response.");
  }
  return answer;
}

export function extractAnswer(data: unknown): string | null {
  if (data && typeof data === "object" && "response" in data) {
    const value = (data as { response: unknown }).response;
    if (typeof value === "string" && value.trim().length > 0) return value;
  }
  return null;
}
