import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { createApp } from "./app.js";
import { loadConfig, missingConfig } from "./config.js";

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, "../.env") });

const config = loadConfig();
config.serveClientDir = path.resolve(here, "../../client/dist");

const missing = missingConfig(config);
if (missing.length > 0) {
  console.warn(
    `[aurelia] Missing ${missing.join(", ")}. Copy server/.env.example to server/.env and fill in your Lyzr credentials. ` +
      "The server will start, but /api/chat will return a setup error until they are set.",
  );
}

createApp(config).listen(config.port, () => {
  console.log(`[aurelia] API listening on http://localhost:${config.port}`);
  console.log(`[aurelia] Allowed origins: ${config.frontendOrigins.join(", ")}`);
});
