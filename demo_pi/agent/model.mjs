// The model endpoint: any OpenAI-compatible /v1. The default is the vLLM server in the dev container; point
// DEMO_BASE_URL at any other (a cloud API, Ollama, a hospital gateway) and nothing else changes.
//
//   DEMO_BASE_URL        default $VLLM_BASE_URL, else http://bb2238_vllm:8002/v1 (the lab vLLM, vllm-extract in the agents repo)
//   DEMO_API_KEY         default $VLLM_API_KEY, else "none" (vLLM and Ollama ignore it unless launched with --api-key)
//   DEMO_MODEL           default $VLLM_MODEL (when DEMO_BASE_URL is unset), else the first model GET /models lists
//   DEMO_CONTEXT_WINDOW  the server's window, input + output (default 131072, vLLM's --max-model-len)
//   DEMO_MAX_TOKENS      output cap per model call (default 2048)
//   DEMO_UNLOCK_CODE     the workshop code, to unlock workshop-key.json at start instead of on the page
//   DEMO_REASONING_OFF   the reasoning_effort that means "off" (reasoningOff below); "omit" sends none
//
// With no endpoint or key set (none of DEMO_BASE_URL, DEMO_API_KEY, VLLM_*) and a workshop-key.json
// (agent/workshop-key.mjs), the model is locked: the demo replays until someone types the workshop code on the page
// (POST /api/unlock), then runs on the endpoint and model in that file, for everyone on this server.

import { decryptKey, readKeyFile } from "./workshop-key.mjs";

const env = process.env;

export const MODEL = {
  baseUrl: (env.DEMO_BASE_URL || env.VLLM_BASE_URL || "http://bb2238_vllm:8002/v1").replace(/\/$/, ""),
  apiKey: env.DEMO_API_KEY || env.VLLM_API_KEY || "none",
  id: env.DEMO_MODEL || (env.DEMO_BASE_URL ? "" : env.VLLM_MODEL || ""),
  contextWindow: Number(env.DEMO_CONTEXT_WINDOW || 131072),
  maxTokens: Number(env.DEMO_MAX_TOKENS || 2048),
  ok: false,
  error: null,
  locked: false,
};

const configured = env.DEMO_BASE_URL || env.DEMO_API_KEY || env.VLLM_BASE_URL || env.VLLM_API_KEY;
const keyFile = configured ? null : readKeyFile();
if (keyFile) Object.assign(MODEL, { baseUrl: keyFile.baseUrl, id: keyFile.model, locked: true, error: "locked: enter the workshop code" });

// one guess at a time, and at least a second between wrong ones (scrypt already costs ~0.2 s each)
let guessing = Promise.resolve();
/** Unlocks the model with the workshop code: true if the code was right (or nothing was locked). */
export function unlock(code) {
  const attempt = guessing.then(async () => {
    if (!MODEL.locked) return true;
    const apiKey = await decryptKey(keyFile, code);
    if (!apiKey) { await new Promise((r) => setTimeout(r, 1000)); return false; }
    Object.assign(MODEL, { apiKey, locked: false });
    await connect();
    return true;
  });
  guessing = attempt.catch(() => {});
  return attempt;
}
// pi asks for max_tokens = window - its own estimate of the input; the server counts input + output with its own
// tokenizer, so tell pi a window that leaves room for one full generation (the agents repo's hfq/agent/pi.py has the long version).
MODEL.agentWindow = Math.max(MODEL.contextWindow - MODEL.maxTokens - 1024, Math.floor(MODEL.contextWindow / 2));

/**
 * The reasoning_effort to send so a reasoning model doesn't reason, or "" to send none. OpenAI's GPT-5.1 and later
 * (gpt-6-luna, ...) reason by default and, on /chat/completions, only call tools with reasoning_effort "none"; gpt-5,
 * -mini and -nano go no lower than "minimal". vLLM, Ollama and OpenAI's non-reasoning models (gpt-4.1) get nothing.
 * Read at each call: unlocking can change the model.
 */
export function reasoningOff() {
  if (env.DEMO_REASONING_OFF) return env.DEMO_REASONING_OFF === "omit" ? "" : env.DEMO_REASONING_OFF;
  if (!MODEL.baseUrl.includes("api.openai.com")) return "";
  if (/^gpt-5(-mini|-nano)?(-\d{4}-\d{2}-\d{2})?$/.test(MODEL.id)) return "minimal";
  return /^gpt-([5-9]|\d\d)/.test(MODEL.id) ? "none" : "";
}

export async function connect() {
  if (MODEL.locked) return MODEL;
  try {
    const res = await fetch(`${MODEL.baseUrl}/models`, { headers: { Authorization: `Bearer ${MODEL.apiKey}` }, signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`GET /models: HTTP ${res.status}`);
    const ids = ((await res.json()).data || []).map((m) => m.id);
    if (!MODEL.id) MODEL.id = ids[0] || "";
    if (!MODEL.id) throw new Error("the endpoint lists no models; set DEMO_MODEL");
    MODEL.ok = true;
    MODEL.error = null;
  } catch (e) {
    MODEL.ok = false;
    MODEL.error = `${MODEL.baseUrl}: ${e.cause?.code || e.message}`;
  }
  return MODEL;
}
