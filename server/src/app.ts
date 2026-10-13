import fs from "node:fs";
import path from "node:path";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { type AppConfig, missingConfig } from "./config.js";
import { askLyzr, ChatError, type FetchLike } from "./lyzr.js";

const ID_PATTERN = /^[A-Za-z0-9_-]{1,100}$/;

interface ChatBody {
  message: string;
  sessionId: string;
  userId: string;
}

function validateBody(body: unknown, maxLength: number): ChatBody | string {
  if (!body || typeof body !== "object") return "Request body must be a JSON object.";
  const { message, sessionId, userId } = body as Record<string, unknown>;
  if (typeof message !== "string" || message.trim().length === 0) return "Message cannot be empty.";
  if (message.length > maxLength) return `Message is too long (maximum ${maxLength} characters).`;
  if (typeof sessionId !== "string" || !ID_PATTERN.test(sessionId)) return "A valid sessionId is required.";
  if (typeof userId !== "string" || !ID_PATTERN.test(userId)) return "A valid userId is required.";
  return { message: message.trim(), sessionId, userId };
}

export function createApp(config: AppConfig, fetchImpl: FetchLike = fetch) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, cb) => cb(null, !origin || config.frontendOrigins.includes(origin)),
      methods: ["GET", "POST"],
    }),
  );
  app.use(express.json({ limit: "32kb" }));

  app.get("/api/health", (_req, res) => {
    const missing = missingConfig(config);
    res.json({ ok: true, configured: missing.length === 0, missing });
  });

  app.use(
    "/api/chat",
    rateLimit({
      windowMs: 60_000,
      limit: config.rateLimitPerMinute,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      message: { error: "Too many requests. Please wait a minute and try again.", code: "rate_limited" },
    }),
  );

  app.post("/api/chat", async (req: Request, res: Response) => {
    const parsed = validateBody(req.body, config.maxMessageLength);
    if (typeof parsed === "string") {
      res.status(400).json({ error: parsed, code: "invalid_request" });
      return;
    }

    const started = Date.now();
    try {
      const answer = await askLyzr(config, parsed, fetchImpl);
      log(`chat ok in ${Date.now() - started}ms`);
      res.json({ answer });
    } catch (err) {
      if (err instanceof ChatError) {
        log(`chat failed: ${err.code} (${err.status}) in ${Date.now() - started}ms`);
        res.status(err.status).json({ error: err.publicMessage, code: err.code });
        return;
      }
      log("chat failed: unexpected error");
      res.status(500).json({ error: "Something went wrong on the server.", code: "internal_error" });
    }
  });

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Not found.", code: "not_found" });
  });

  // Optionally serve the built frontend (single-process production mode).
  if (config.serveClientDir && fs.existsSync(path.join(config.serveClientDir, "index.html"))) {
    const dir = config.serveClientDir;
    app.use(express.static(dir));
    app.get("*", (_req, res) => res.sendFile(path.join(dir, "index.html")));
  }

  // Malformed JSON bodies and other middleware errors.
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const status = (err as { status?: number }).status;
    if (status === 400 || status === 413) {
      res.status(status).json({
        error: status === 413 ? "Request is too large." : "Request body must be valid JSON.",
        code: "invalid_request",
      });
      return;
    }
    res.status(500).json({ error: "Something went wrong on the server.", code: "internal_error" });
  });

  return app;
}

function log(line: string) {
  if (process.env.NODE_ENV !== "test") console.log(`[aurelia] ${line}`);
}
