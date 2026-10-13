// Sends one real request through the running backend (not directly to Lyzr)
// to confirm the full path works. Usage: npm run check:live (server must be running).
const base = process.env.API_BASE ?? `http://localhost:${process.env.PORT ?? 5000}`;

const health = await fetch(`${base}/api/health`).then((r) => r.json());
console.log("health:", health);

const res = await fetch(`${base}/api/chat`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    message: "Reply with one short sentence confirming you are AURELIA's planning assistant.",
    sessionId: `check-${Date.now()}`,
    userId: "aurelia-live-check",
  }),
});
const body = await res.json();
console.log(`POST /api/chat -> HTTP ${res.status}`);
console.log(body);
process.exit(res.ok ? 0 : 1);
