import dotenv from "dotenv";
dotenv.config();
import { askLyzr } from "../src/lyzr.js";
import { loadConfig } from "../src/config.js";

async function main() {
  const config = loadConfig();
  console.log("Testing with Agent ID:", config.lyzrAgentId);
  try {
    const res = await askLyzr(config, {
      userId: "test-user-1",
      sessionId: `test-${Date.now()}`,
      message: "Hello! What is your name and what do you do?",
    });
    console.log("Lyzr Response:\n", res);
  } catch (err) {
    console.error("Error from Lyzr:", err);
  }
}

main();
