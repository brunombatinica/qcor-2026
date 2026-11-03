// The demo server wired to the stand-in model (test/fake-llm.mjs) instead of vLLM: for checking the page and the
// plumbing on a laptop with no GPU. The header says "stand-in-regex", so nobody mistakes it for a model.
//
//   node test/with-stand-in.mjs [--port 8771]

import { start } from "./fake-llm.mjs";

await start(8799);
process.env.DEMO_BASE_URL = "http://127.0.0.1:8799/v1";
await import("../server.mjs");
