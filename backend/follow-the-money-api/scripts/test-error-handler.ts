import express from "express";
import { errorHandler } from "../src/middleware/errorHandler";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

async function main() {
  console.log("Testing global error handler...");

  const app = express();
  app.use(express.json());
  app.post("/x", (_req, res) => { res.json({ ok: true }); });
  app.get("/boom", () => { throw new Error("unexpected"); });
  app.get("/cors", () => { throw new Error("CORS blocked: origin"); });
  app.get("/status-only", () => { throw Object.assign(new Error("secret detail"), { status: 404 }); });
  app.use(errorHandler);

  const server = app.listen(0);
  const port = (server.address() as any).port;
  const base = `http://localhost:${port}`;

  try {
    // iOS Shortcuts: Content-Type: application/json header on a plain-text body
    const badJson = await fetch(`${base}/x`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "Monzo ALL 4,300",
    });
    assert(badJson.status === 400, `malformed JSON body returns 400 (got ${badJson.status})`);
    const badJsonBody: any = await badJson.json();
    assert(typeof badJsonBody.error === "string" && badJsonBody.error.startsWith("Invalid request body:"), "malformed JSON body returns an invalid-body message");

    // Only body-parser errors (which carry a `type`) may surface their 4xx and message.
    const statusOnly = await fetch(`${base}/status-only`);
    assert(statusOnly.status === 500, `non-body-parser error with a 4xx status still returns 500 (got ${statusOnly.status})`);
    const statusOnlyBody: any = await statusOnly.json();
    assert(statusOnlyBody.error === "Internal server error", "non-body-parser error message is not leaked");

    const boom = await fetch(`${base}/boom`);
    assert(boom.status === 500, `unexpected error still returns 500 (got ${boom.status})`);

    const cors = await fetch(`${base}/cors`);
    assert(cors.status === 403, `CORS error still returns 403 (got ${cors.status})`);
  } finally {
    server.close();
  }

  console.log("All error handler tests passed successfully! 🎉");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
