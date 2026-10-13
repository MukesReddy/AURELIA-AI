export interface AppConfig {
  lyzrApiKey: string | undefined;
  lyzrAgentId: string | undefined;
  lyzrEndpoint: string;
  port: number;
  frontendOrigins: string[];
  timeoutMs: number;
  maxMessageLength: number;
  rateLimitPerMinute: number;
  serveClientDir?: string;
}

export const LYZR_CHAT_ENDPOINT = "https://agent-prod.studio.lyzr.ai/v3/inference/chat/";

function intFromEnv(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    lyzrApiKey: env.LYZR_API_KEY?.trim() || undefined,
    lyzrAgentId: env.LYZR_AGENT_ID?.trim() || undefined,
    lyzrEndpoint: LYZR_CHAT_ENDPOINT,
    port: intFromEnv(env.PORT, 5000),
    frontendOrigins: (env.FRONTEND_ORIGIN ?? "http://localhost:5173")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean),
    timeoutMs: intFromEnv(env.LYZR_TIMEOUT_MS, 90_000),
    maxMessageLength: 4000,
    rateLimitPerMinute: intFromEnv(env.RATE_LIMIT_PER_MINUTE, 20),
  };
}

/** Names of required variables that are missing. Never returns values. */
export function missingConfig(config: AppConfig): string[] {
  const missing: string[] = [];
  if (!config.lyzrApiKey) missing.push("LYZR_API_KEY");
  if (!config.lyzrAgentId) missing.push("LYZR_AGENT_ID");
  return missing;
}
