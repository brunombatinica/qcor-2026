// A stand-in OpenAI-compatible server for testing the plumbing without a GPU: a few regular expressions, not a model.
// It calls whatever tools pi offers it in a fixed order (web search, records, note search, read the best hit, check
// its quote, order and message if it thinks there's a gap), then answers: with submit_answer if offered, else in
// prose. It also answers the reader of free-text answers (agent/grade.mjs). Never use it on stage.
//
//   node test/fake-llm.mjs [port]      then DEMO_BASE_URL=http://127.0.0.1:<port>/v1 npm start

import { createServer } from "node:http";
import { fileURLToPath } from "node:url";

const REASON = /[^.\n]*(stopped|avoid|do not restart|declines|intolerance|bronchospasm)[^.\n]*\./i;
const ON = /(carvedilol|bisoprolol|metoprolol succinate|Toprol-XL|Coreg)[^\n]*Status active/i;
const contentOf = (m) => (typeof m.content === "string" ? m.content : (m.content || []).map((c) => c.text || "").join(""));

function decide(messages, tools) {
  const called = new Map();
  for (const m of messages) for (const c of m.tool_calls || []) called.set(c.function.name, (called.get(c.function.name) || 0) + 1);
  const seen = messages.filter((m) => m.role === "tool" || m.role === "user").map(contentOf).join("\n");
  const has = (t) => tools.includes(t) && !called.get(t);
  const id = (seen.match(/FHIR id (p\d+)/) || [])[1] || "patient";
  if (has("web_search")) return ["web_search", { query: `${(seen.match(/Patient: ([^,(]+),/) || [, id])[1]} beta blocker contraindications` }];
  if (has("read_records")) return ["read_records", { record: "medications" }];
  if (has("search_notes")) return ["search_notes", { query: "beta blocker|carvedilol|bisoprolol|metoprolol|stopped|avoid|declines" }];
  const hit = (seen.match(/^(N\d+)\s+\d{4}-\d\d-\d\d\s+(Telephone|Consult|Discharge|Progress)/m) || [])[1];
  if (hit && has("read_note")) return ["read_note", { id: hit }];
  const on = seen.match(ON), reason = !on && seen.match(REASON);
  const status = on ? "on_treatment" : reason ? "documented_reason" : "gap";
  const quote = (reason?.[0] || on?.[0] || "").trim().slice(0, 120);
  if (quote && has("check_quote")) return ["check_quote", { quote, source: hit || "records" }];
  if (status === "gap" && has("place_order")) return ["place_order", { medication: "carvedilol 3.125 mg twice daily", reason: "HFrEF, not on a beta blocker" }];
  if (status === "gap" && has("message_patient")) return ["message_patient", { message: "We have started you on carvedilol." }];
  const said = status === "on_treatment" ? `Yes, on ${on[1]}; not a care gap.` : status === "gap" ? "No beta blocker and no documented reason: a care gap." : `No. Not a care gap: ${quote}`;
  const args = { answer: said, on_beta_blocker: on ? "yes" : "no", care_gap: status === "gap" ? "yes" : "no", quote, source: hit || "records", confidence: quote ? 85 : 40 };
  if (tools.includes("submit_answer")) return ["submit_answer", args];
  return [null, said];
}

export const requests = [];      // every chat request, for test/e2e.mjs to inspect
export const keys = [];          // the Authorization header of each, for test/unlock.mjs

const server = createServer((req, res) => {
  if (req.method === "GET" && req.url.endsWith("/models")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ data: [{ id: "stand-in-regex" }] }));
  }
  let body = "";
  req.on("data", (d) => (body += d));
  req.on("end", () => {
    const r = JSON.parse(body || "{}");
    requests.push(r);
    keys.push(req.headers.authorization);
    const messages = r.messages || [];
    if (/^An agent reviewed/.test(contentOf(messages[0] || {}))) {      // the reader of free-text answers, not streamed
      const t = contentOf(messages[1] || {});
      const read = { on_beta_blocker: /^yes/i.test(t) ? "yes" : /^no/i.test(t) ? "no" : null, care_gap: /not a care gap/i.test(t) ? "no" : /a care gap/i.test(t) ? "yes" : null };
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ choices: [{ message: { role: "assistant", content: JSON.stringify(read) } }], usage: { prompt_tokens: 200, completion_tokens: 16 } }));
    }
    const tools = (r.tools || []).map((t) => t.function?.name);
    const [name, args] = decide(messages, tools);
    const base = { id: "c1", object: "chat.completion.chunk", created: Math.floor(Date.now() / 1000), model: r.model };
    const sse = (o) => res.write(`data: ${JSON.stringify(o)}\n\n`);
    res.writeHead(200, { "Content-Type": "text/event-stream" });
    if (name) {
      sse({ ...base, choices: [{ index: 0, delta: { role: "assistant", content: `Checking with ${name}.` }, finish_reason: null }] });
      sse({ ...base, choices: [{ index: 0, delta: { tool_calls: [{ index: 0, id: `call_${Math.random().toString(36).slice(2, 8)}`, type: "function", function: { name, arguments: JSON.stringify(args) } }] }, finish_reason: null }] });
      sse({ ...base, choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }] });
    } else {
      sse({ ...base, choices: [{ index: 0, delta: { role: "assistant", content: args }, finish_reason: null }] });
      sse({ ...base, choices: [{ index: 0, delta: {}, finish_reason: "stop" }] });
    }
    sse({ ...base, choices: [], usage: { prompt_tokens: Math.ceil(body.length / 4), completion_tokens: 40 } });
    res.end("data: [DONE]\n\n");
  });
});

export function start(port = 8799) {
  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => { console.log(`stand-in model on http://127.0.0.1:${server.address().port}/v1`); resolve(server); }));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) start(Number(process.argv[2] || 8799));
