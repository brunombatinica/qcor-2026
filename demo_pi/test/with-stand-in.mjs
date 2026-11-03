// The demo server wired to the stand-in model (test/fake-llm.mjs) instead of vLLM: for checking the page and the
// plumbing on a laptop with no GPU. The header says "stand-in-regex", so nobody mistakes it for a model.
//
//   node test/with-stand-in.mjs [--port 8771] [--locked]
//
// --locked starts it locked behind a throwaway workshop key (agent/workshop-key.mjs) whose code is test-code, to
// check the page's unlock box.

import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { start } from "./fake-llm.mjs";

await start(8799);
if (process.argv.includes("--locked")) {
  for (const v of ["DEMO_BASE_URL", "DEMO_API_KEY", "VLLM_BASE_URL", "VLLM_API_KEY"]) delete process.env[v];
  process.env.DEMO_KEY_FILE = join(mkdtempSync(join(tmpdir(), "qcor-key-")), "workshop-key.json");
  const { encryptKey } = await import("../agent/workshop-key.mjs");
  writeFileSync(process.env.DEMO_KEY_FILE, JSON.stringify(await encryptKey({ apiKey: "sk-stand-in", baseUrl: "http://127.0.0.1:8799/v1", model: "stand-in-regex", code: "test-code" })));
  console.log("locked: the workshop code is test-code");
} else {
  process.env.DEMO_BASE_URL = "http://127.0.0.1:8799/v1";
}
await import("../server.mjs");
