// The v2 answer key: Claude Opus 5.5, at high effort, reads every patient's whole chart against each definition of a
// care gap (agent/catalog.mjs RULES and its sentences) and labels it. The labels go to labels/answer-key.json, which the
// server then scores against (goldFor in agent/catalog.mjs); where they differ from how the chart was written, this
// prints both, to review before committing. The charts are synthetic: nothing real is sent.
//
//   ANTHROPIC_API_KEY=… node label.mjs [--rules cms144,esc] [--only p000,p001] [--redo] [--dry]
//
//   --rules   the definitions to label (default: all)
//   --only    these patients only (default: all 100)
//   --redo    label again patients the file already has (default: keep them, so a stopped run picks up where it was)
//   --dry     print the prompt for the first patient and stop; no call
//
// The key comes from the environment (ANTHROPIC_API_KEY, or an `ant auth login` profile), never the repo.

import Anthropic from "@anthropic-ai/sdk";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { CRITERIA, DATA, KEY_FILE, RULES, chartGold, criteriaPrompt } from "./agent/catalog.mjs";
import { visible } from "./ehr/fhir.mjs";
import { PATIENTS, TODAY, WHY } from "./ehr/patients.mjs";
import { fullText } from "./ehr/render.mjs";

const MODEL = "claude-opus-5-5", LABEL = "Claude Opus 5.5", EFFORT = "high", CONCURRENCY = 8;
const PROMPT_VERSION = 1;                                       // bump when the prompt below changes

const arg = (name) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : null; };
const flag = (name) => process.argv.includes(`--${name}`);
const rulesIds = (arg("rules") || Object.keys(RULES).join(",")).split(",").filter((id) => RULES[id]);
const only = arg("only")?.split(",");
const patients = PATIENTS.filter((p) => !only || only.includes(p.id));

// the whole chart, as the agent reads it with every data card on
const chartText = (p) => visible(p.id, DATA.map((d) => d.id)).map(fullText).join("\n");

const SYSTEM = `You are a cardiologist auditing a heart failure quality measure. You label one patient at a time: does this
patient have a beta-blocker care gap under the definition you are given? Read the whole chart, including every note.
Today is ${TODAY}. Judge what is true now: a medication that was stopped is not being taken, and a reason that has
resolved no longer applies. Use only the definition given, not other guidelines.`;

function definition(rules) {
  const r = RULES[rules], ids = CRITERIA.filter((c) => c.rules.includes(rules)).map((c) => c.id);
  return `The definition: ${r.label} (${r.sub}).
Every patient in this cohort has heart failure with reduced ejection fraction, so every one is in the measure.

${criteriaPrompt(ids)}

Answer with:
- status: "on_treatment" if the patient is now on a beta blocker that counts; "documented_reason" if not, and a valid
  exception above is documented and still applies; "gap" otherwise (including a reason this definition does not accept).
- exception: for "documented_reason", "medical_reason" or "declined"; otherwise "none".
- reason: one sentence on why, as you would tell the care team.
- evidence: the line or sentence from the chart that decides it, copied exactly.`;
}

const SCHEMA = {
  type: "object",
  properties: {
    status: { type: "string", enum: ["on_treatment", "documented_reason", "gap"] },
    exception: { type: "string", enum: ["none", "medical_reason", "declined"] },
    reason: { type: "string" },
    evidence: { type: "string" },
  },
  required: ["status", "exception", "reason", "evidence"],
  additionalProperties: false,
};

// the second answer (WHY) follows from the first: on one, a documented reason (medical or declined), or none
const whyOf = (o) => (o.status === "on_treatment" ? "on_beta_blocker" : o.status === "gap" ? "no_reason" : o.exception === "declined" ? "declined" : "medical_reason");

async function label(p, rules) {
  // fallbacks "default": if a safety classifier declines, the API re-runs the request on its recommended model
  const res = await client.beta.messages.create({
    model: MODEL, max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"], fallbacks: "default",
    thinking: { type: "adaptive" },
    output_config: { effort: EFFORT, format: { type: "json_schema", schema: SCHEMA } },
    system: SYSTEM,
    messages: [{ role: "user", content: `${definition(rules)}\n\nThe chart:\n\n${chartText(p)}` }],
  });
  if (res.stop_reason === "refusal") throw new Error(`declined (${res.stop_details?.category ?? "no category"})`);
  if (res.stop_reason === "max_tokens") throw new Error("ran out of tokens");
  const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  const o = JSON.parse(text);
  if (o.status === "documented_reason" && o.exception === "none") o.exception = "medical_reason";
  return { status: o.status, why: whyOf(o), reason: o.reason, evidence: o.evidence, model: res.model, tokens: res.usage.input_tokens + res.usage.output_tokens };
}

if (flag("dry")) {
  const p = patients[0], r = rulesIds[0];
  console.log(`system:\n${SYSTEM}\n\nuser:\n${definition(r)}\n\nThe chart:\n\n${chartText(p)}`);
  process.exit(0);
}

const client = new Anthropic();
const file = fileURLToPath(KEY_FILE);
const saved = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : null;
const key = saved?.promptVersion === PROMPT_VERSION && saved?.model === MODEL ? saved : { rules: {} };
Object.assign(key, { model: MODEL, label: LABEL, effort: EFFORT, promptVersion: PROMPT_VERSION });
// in patient order, so a re-run's diff shows only the labels that changed
const sorted = () => Object.fromEntries(Object.entries(key.rules).map(([r, l]) => [r, Object.fromEntries(Object.entries(l).sort(([x], [y]) => x.localeCompare(y)))]));
const write = () => { mkdirSync(new URL(".", KEY_FILE), { recursive: true }); writeFileSync(file, JSON.stringify({ ...key, rules: sorted(), labelledAt: new Date().toISOString() }, null, 1) + "\n"); };

const jobs = rulesIds.flatMap((r) => patients.filter((p) => flag("redo") || !key.rules[r]?.[p.id]).map((p) => [p, r]));
console.log(`${LABEL} (${EFFORT} effort): ${jobs.length} labels to make, ${rulesIds.join(" and ")}, ${CONCURRENCY} at once`);
let done = 0, tokens = 0, failed = 0;
async function worker() {
  for (let job; (job = jobs.shift());) {
    const [p, r] = job;
    try {
      const l = await label(p, r);
      (key.rules[r] ||= {})[p.id] = l;
      tokens += l.tokens;
      write();
    } catch (e) {
      failed += 1;
      const what = e instanceof Anthropic.AuthenticationError ? "no valid key (set ANTHROPIC_API_KEY)" : e instanceof Anthropic.RateLimitError ? "rate limited" : e instanceof Anthropic.APIError ? `API error ${e.status}` : e.message;
      console.log(`  ${p.id} ${r}: ${what}`);
      if (e instanceof Anthropic.AuthenticationError) process.exit(1);
    }
    done += 1;
    if (done % 10 === 0) console.log(`  ${done} done · ${tokens.toLocaleString("en-US")} tokens`);
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

// where Opus and the chart differ: the patient, both answers, and what Opus read
for (const r of rulesIds) {
  const labels = key.rules[r] || {};
  const differ = PATIENTS.filter((p) => labels[p.id] && (labels[p.id].status === "gap") !== chartGold(p, r).gap);
  const gaps = PATIENTS.filter((p) => labels[p.id]?.status === "gap").length;
  console.log(`\n${RULES[r].label}: ${Object.keys(labels).length} labelled, ${gaps} care gaps; ${differ.length} differ from the chart`);
  for (const p of differ) {
    const c = chartGold(p, r), l = labels[p.id];
    console.log(`  ${p.id} ${p.name} · chart: ${c.gap ? "gap" : "no gap"} (${c.scenario}) · ${LABEL}: ${l.status === "gap" ? "gap" : "no gap"}, ${WHY[l.why]}\n    ${l.reason}\n    "${l.evidence}"`);
  }
}
console.log(`\n${tokens.toLocaleString("en-US")} tokens${failed ? ` · ${failed} failed: run it again to retry them` : ""} · wrote ${file}`);
