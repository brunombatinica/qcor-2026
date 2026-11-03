// What a reasoning model is sent (agent/model.mjs reasoningOff): OpenAI's gpt-6-luna and other GPT-5.1+ models get
// reasoning_effort "none" from both pi and the grader, and the grader drops temperature and max_tokens, which they
// refuse; other endpoints get neither. Checked against the stand-in model, with DEMO_REASONING_OFF in for OpenAI.
//
//   node test/openai-request.mjs        (part of npm test)

import assert from "node:assert/strict";
import { requests, start } from "./fake-llm.mjs";

const model = await start(0);
for (const v of ["DEMO_API_KEY", "DEMO_MODEL", "VLLM_BASE_URL", "VLLM_API_KEY", "VLLM_MODEL", "DEMO_REPLAY", "DEMO_REASONING_OFF"]) delete process.env[v];
process.env.DEMO_BASE_URL = `http://127.0.0.1:${model.address().port}/v1`;
process.env.PORT = "0";
process.env.HOST = "127.0.0.1";
const { MODEL, reasoningOff } = await import("../agent/model.mjs");

// which models get which value
const saved = { baseUrl: MODEL.baseUrl, id: MODEL.id };
const off = (baseUrl, id) => { Object.assign(MODEL, { baseUrl, id }); return reasoningOff(); };
const OPENAI = "https://api.openai.com/v1";
assert.equal(off(OPENAI, "gpt-6-luna"), "none");
assert.equal(off(OPENAI, "gpt-5.6-luna"), "none");
assert.equal(off(OPENAI, "gpt-5.4-nano"), "none");
assert.equal(off(OPENAI, "gpt-5-nano"), "minimal");
assert.equal(off(OPENAI, "gpt-5-mini-2025-08-07"), "minimal");
assert.equal(off(OPENAI, "gpt-4.1-mini"), "");
assert.equal(off("http://bb2238_vllm:8002/v1", "Qwen/Qwen3.6-35B-A3B-FP8"), "");
Object.assign(MODEL, saved);
assert.equal(reasoningOff(), "", "the stand-in is not OpenAI");

const { server, ready } = await import("../server.mjs");
const base = `http://127.0.0.1:${await ready}`;
const build = { sources: ["medications"], tools: ["read_records"], prompt: "Is this patient on a beta blocker?" };
async function run() {
  requests.length = 0;
  const text = await (await fetch(`${base}/api/run`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ build, patient: "p000" }) })).text();
  assert.ok(text.includes('"kind":"result"'));
  const agent = requests.filter((r) => r.tools?.length), grader = requests.filter((r) => !r.tools?.length && !r.stream);
  assert.ok(agent.length > 0 && grader.length === 1, "pi's calls, with tools, and one grader call");
  return { agent, grader: grader[0] };
}

// elsewhere: nothing new
let { agent, grader } = await run();
assert.ok(agent.every((r) => r.reasoning_effort === undefined));
assert.equal(grader.reasoning_effort, undefined);
assert.equal(grader.temperature, 0);
assert.equal(grader.max_tokens, 200);

// a reasoning model
process.env.DEMO_REASONING_OFF = "none";
({ agent, grader } = await run());
assert.ok(agent.every((r) => r.reasoning_effort === "none"), "pi sends reasoning_effort none with --thinking off");
assert.ok(agent.every((r) => r.max_tokens === undefined && r.max_completion_tokens > 0), "pi caps output with max_completion_tokens");
assert.equal(grader.reasoning_effort, "none");
assert.equal(grader.temperature, undefined);
assert.equal(grader.max_tokens, undefined);
assert.equal(grader.max_completion_tokens, 400);

server.close();
model.close();
console.log("openai-request: all checks passed");
