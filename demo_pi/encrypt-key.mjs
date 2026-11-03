// Encrypts the model's API key into workshop-key.json with a short code for the room (agent/workshop-key.mjs).
//
//   just key-encrypt [--code k7mp-ra3x]        (reads DEMO_API_KEY, DEMO_BASE_URL and DEMO_MODEL from .env)
//
// Prints the code. Commit workshop-key.json; put the code on a slide, never in the repo. Rerunning makes a new file
// and, unless --code is given, a new code.

import { encryptKey, decryptKey, newCode, normalizeCode, writeKeyFile, KEY_FILE } from "./agent/workshop-key.mjs";

const env = process.env;
const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : undefined; };
const fail = (msg) => { console.error(`encrypt-key: ${msg}`); process.exit(1); };

const apiKey = env.DEMO_API_KEY, baseUrl = (env.DEMO_BASE_URL || "").replace(/\/$/, ""), model = env.DEMO_MODEL;
if (!apiKey || apiKey === "none") fail("set DEMO_API_KEY (in .env), the key to encrypt");
if (!baseUrl || !model) fail("set DEMO_BASE_URL and DEMO_MODEL too: they are stored with the key, in the clear");

const code = arg("--code") || newCode();
if (normalizeCode(code).length < 8) console.error("encrypt-key: warning: codes under 8 characters can be guessed from the public file");

// check the key works before locking it away
const res = await fetch(`${baseUrl}/models`, { headers: { Authorization: `Bearer ${apiKey}` }, signal: AbortSignal.timeout(10_000) }).catch((e) => ({ ok: false, status: e.message }));
if (!res.ok) fail(`GET ${baseUrl}/models with this key: ${res.status}`);

const file = await encryptKey({ apiKey, baseUrl, model, code });
if ((await decryptKey(file, code)) !== apiKey) fail("round trip failed");
writeKeyFile(file);
console.log(`wrote ${KEY_FILE}: ${model} at ${baseUrl}`);
console.log(`workshop code: ${code}`);
