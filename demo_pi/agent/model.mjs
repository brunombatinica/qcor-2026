// The model endpoint: any OpenAI-compatible /v1. The default is the vLLM server in the dev container; point
// DEMO_BASE_URL at any other (a cloud API, Ollama, a hospital gateway) and nothing else changes.
//
//   DEMO_BASE_URL        default $VLLM_BASE_URL, else http://bb2238_vllm:8002/v1 (the lab vLLM, vllm-extract in the agents repo)
//   DEMO_API_KEY         default $VLLM_API_KEY, else "none" (vLLM and Ollama ignore it unless launched with --api-key)
//   DEMO_MODEL           default $VLLM_MODEL (when DEMO_BASE_URL is unset), else the first model GET /models lists
//   DEMO_CONTEXT_WINDOW  the server's window, input + output (default 131072, vLLM's --max-model-len)
//   DEMO_MAX_TOKENS      output cap per model call (default 2048)

const env = process.env;

export const MODEL = {
  baseUrl: (env.DEMO_BASE_URL || env.VLLM_BASE_URL || "http://bb2238_vllm:8002/v1").replace(/\/$/, ""),
  apiKey: env.DEMO_API_KEY || env.VLLM_API_KEY || "none",
  id: env.DEMO_MODEL || (env.DEMO_BASE_URL ? "" : env.VLLM_MODEL || ""),
  contextWindow: Number(env.DEMO_CONTEXT_WINDOW || 131072),
  maxTokens: Number(env.DEMO_MAX_TOKENS || 2048),
  ok: false,
  error: null,
};
// pi asks for max_tokens = window - its own estimate of the input; the server counts input + output with its own
// tokenizer, so tell pi a window that leaves room for one full generation (the agents repo's hfq/agent/pi.py has the long version).
MODEL.agentWindow = Math.max(MODEL.contextWindow - MODEL.maxTokens - 1024, Math.floor(MODEL.contextWindow / 2));

export async function connect() {
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
