// The workshop key (agent/workshop-key.mjs): with no endpoint or key set and an encrypted key file, the server starts
// locked and replays; a wrong code is refused; the right one makes the next run call the model with the decrypted key.
//
//   node test/unlock.mjs        (part of npm test)

import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { keys, start } from "./fake-llm.mjs";

const model = await start(0);
for (const v of ["DEMO_BASE_URL", "DEMO_API_KEY", "DEMO_MODEL", "VLLM_BASE_URL", "VLLM_API_KEY", "VLLM_MODEL", "DEMO_REPLAY", "DEMO_UNLOCK_CODE"]) delete process.env[v];
process.env.DEMO_KEY_FILE = join(mkdtempSync(join(tmpdir(), "qcor-key-")), "workshop-key.json");
process.env.PORT = "0";
process.env.HOST = "127.0.0.1";

const { encryptKey, decryptKey } = await import("../agent/workshop-key.mjs");
const file = await encryptKey({ apiKey: "sk-test-unlock", baseUrl: `http://127.0.0.1:${model.address().port}/v1`, model: "stand-in-regex", code: "Abcd-2345" });
assert.equal(await decryptKey(file, "abcd 2345"), "sk-test-unlock", "case, spaces and dashes don't matter");
assert.equal(await decryptKey(file, "abcd-2346"), null);
writeFileSync(process.env.DEMO_KEY_FILE, JSON.stringify(file));

const { server, ready } = await import("../server.mjs");
const base = `http://127.0.0.1:${await ready}`;
const post = (path, body) => fetch(base + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const config = () => fetch(`${base}/api/config`).then((r) => r.json());

let cfg = await config();
assert.equal(cfg.model.locked, true);
assert.equal(cfg.model.id, "stand-in-regex");
assert.ok(cfg.replay, "locked: replays");
assert.ok(!JSON.stringify(cfg).includes("sk-test"), "no key in the config");

assert.equal((await post("/api/unlock", { code: "wrong-code" })).status, 403);
assert.equal((await config()).model.locked, true);

const res = await post("/api/unlock", { code: "ABCD2345" });
assert.equal(res.status, 200);
assert.deepEqual(await res.json(), { ok: true, error: null });
cfg = await config();
assert.equal(cfg.model.locked, false);
assert.equal(cfg.model.ok, true);
assert.equal(cfg.replay, null, "unlocked: live");
assert.ok(!JSON.stringify(cfg).includes("sk-test"), "no key in the config");

keys.length = 0;
const text = await (await post("/api/run", { build: { sources: ["medications"], tools: ["read_records"], prompt: "Is this patient on a beta blocker?" }, patient: "p000" })).text();
assert.ok(text.includes('"kind":"result"'));
assert.ok(keys.length > 0 && keys.every((k) => k === "Bearer sk-test-unlock"), "pi and the grader call the model with the decrypted key");

server.close();
model.close();
console.log("unlock: all checks passed");
