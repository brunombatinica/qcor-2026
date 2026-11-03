// One agent session: the build chosen on the page (data, tools, prompt) becomes a headless pi run against the model
// endpoint, and pi's JSON event stream becomes the trace the page shows and the answer.
//
//   const result = await runSession({ patientId: "p000", build, onEvent, signal })
//
// pi (@earendil-works/pi-coding-agent, ../docs/pi-notes.md) runs as its own process with this folder's
// extension only, no built-in tools, no skills or context files and no saved session: the model sees our system
// prompt, the room's prompt, the tools the page switched on, and nothing else. Its tools read the chart from the FHIR
// server (ehr/fhir.mjs) with a token scoped to the data cards.

import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { issueToken } from "../ehr/fhir.mjs";
import { PATIENTS, TODAY } from "../ehr/patients.mjs";
import { PI_TOOLS, normalize } from "./catalog.mjs";
import { MODEL, reasoningOff } from "./model.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const PI = join(HERE, "..", "node_modules", "@earendil-works", "pi-coding-agent", "dist", "cli.js");
const EXTENSION = join(HERE, "extension.ts");
const SETTINGS = join(HERE, "..", ".pi-agent");     // PI_CODING_AGENT_DIR: our settings, not the user's ~/.pi
const WORKDIR = join(tmpdir(), "qcor-demo-pi");      // pi needs a cwd; with no file tools nothing is written there
const TIMEOUT_MS = Number(process.env.DEMO_SESSION_TIMEOUT_MS || 180_000);

export const FHIR = { base: "" };                     // set by server.mjs once it listens: http://127.0.0.1:<port>/fhir

mkdirSync(SETTINGS, { recursive: true });
mkdirSync(WORKDIR, { recursive: true });
writeFileSync(join(SETTINGS, "settings.json"), JSON.stringify({ compaction: { enabled: false }, retry: { maxRetries: 1 } }, null, 1) + "\n");

// an instruction file, with its hard-wrapped lines joined back into paragraphs
const instruction = (name) => readFileSync(join(HERE, "instructions", `${name}.md`), "utf8").trim().replace(/(?<!\n)\n(?!\n)/g, " ").replace("{today}", TODAY);
export const byPatientId = (id) => PATIENTS.find((p) => p.id === id) || PATIENTS[0];

export function systemPrompt(build) {
  const { tools } = normalize(build);
  const parts = [instruction("harness"), instruction(tools.includes("structured") ? "answer-structured" : "answer-text")];
  if (tools.includes("check_quote")) parts.push(instruction("check-quote"));
  if (tools.includes("confidence")) parts.push(instruction("check-confidence"));
  return parts.join("\n\n");
}

/** Who the patient is, as far as this build may know: the FHIR id always, name and age only with Demographics. */
export function header(patient, build) {
  const { sources } = normalize(build);
  return sources.includes("demographics") ? `${patient.name}, ${patient.age}, ${patient.sex} (FHIR id ${patient.id})` : `FHIR id ${patient.id}`;
}

export function userPrompt(patient, build) {
  return `Patient: ${header(patient, build)}\n\n${normalize(build).prompt || "(no prompt)"}`;
}

/** The tools pi activates: the page's tool cards that are pi tools, plus submit_answer for a structured answer. */
export function piTools(build) {
  const { tools } = normalize(build);
  return [...tools.filter((t) => PI_TOOLS.includes(t)), ...(tools.includes("structured") ? ["submit_answer"] : [])];
}

export function command(patient, build) {
  const tools = piTools(build);
  return ["--mode", "json", "--no-session", "--no-extensions", "-e", EXTENSION, "--no-skills", "--no-prompt-templates",
    "--no-themes", "--no-context-files", "--no-approve", ...(tools.length ? ["--tools", tools.join(",")] : ["--no-tools"]),
    "--provider", "demo", "--model", MODEL.id, "--thinking", "off", "--system-prompt", systemPrompt(build), userPrompt(patient, build)];
}

export function answerFields(build) {
  const { tools } = normalize(build);
  return [tools.includes("check_quote") && "quote", tools.includes("confidence") && "confidence"].filter(Boolean);
}

/** The command as you'd type it (long prompts elided), for the page's under-the-hood panel. */
export function commandLine(patient, build) {
  const args = command(patient, build).map((a) => (a === EXTENSION ? "agent/extension.ts" : a.includes("\n") ? `"<${a.length} chars>"` : /[\s"]/.test(a) ? JSON.stringify(a) : a));
  const env = [`DEMO_PATIENT=${patient.id}`, "DEMO_FHIR_TOKEN=<scoped token>", `DEMO_STRUCTURED=${normalize(build).tools.includes("structured") ? 1 : 0}`];
  if (answerFields(build).length) env.push(`DEMO_ANSWER_FIELDS=${answerFields(build).join(",")}`);
  return `${env.join(" ")} \\\n  pi ${args.join(" ")}`;
}

const textOf = (content) => (content || []).filter((c) => c.type === "text").map((c) => c.text).join("").trim();

export function runSession({ patientId, build, onEvent = () => {}, signal, stream = false }) {
  const patient = byPatientId(patientId);
  const b = normalize(build);
  const grant = issueToken(b.sources);
  const env = {
    ...process.env,
    DEMO_BASE_URL: MODEL.baseUrl, DEMO_API_KEY: MODEL.apiKey, DEMO_MODEL: MODEL.id,
    DEMO_CONTEXT_WINDOW: String(MODEL.agentWindow), DEMO_MAX_TOKENS: String(MODEL.maxTokens), DEMO_REASONING_OFF: reasoningOff(),
    DEMO_FHIR_BASE: FHIR.base, DEMO_FHIR_TOKEN: grant.access_token, DEMO_PATIENT: patient.id,
    DEMO_STRUCTURED: b.tools.includes("structured") ? "1" : "0", DEMO_ANSWER_FIELDS: answerFields(b).join(","),
    PI_CODING_AGENT_DIR: SETTINGS,
  };
  const t0 = Date.now();
  const result = { patientId: patient.id, answer: null, text: "", trace: [], usage: { input: 0, output: 0, modelCalls: 0, toolCalls: 0 }, status: "ok", error: null, scope: grant.scope };
  const emit = (item) => { item.t = Date.now() - t0; result.trace.push(item); onEvent(item); };

  return new Promise((resolve) => {
    const child = spawn(process.execPath, [PI, ...command(patient, b)], { cwd: WORKDIR, env, stdio: ["ignore", "pipe", "pipe"], detached: true });
    const kill = () => { try { process.kill(-child.pid, "SIGKILL"); } catch {} };
    const timer = setTimeout(() => { result.status = "timeout"; kill(); }, TIMEOUT_MS);
    signal?.addEventListener("abort", () => { result.status = "cancelled"; kill(); }, { once: true });
    let buffer = "", stderr = "";
    child.stderr.on("data", (d) => (stderr = (stderr + d).slice(-4000)));
    child.stdout.on("data", (d) => {
      buffer += d;
      let nl;
      while ((nl = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!line) continue;
        let e;
        try { e = JSON.parse(line); } catch { continue; }
        if (stream && e.type === "message_update" && e.assistantMessageEvent?.type === "text_delta") {
          onEvent({ kind: "delta", text: e.assistantMessageEvent.delta, t: Date.now() - t0 });
        } else if (e.type === "message_end" && e.message?.role === "assistant") {
          const m = e.message;
          result.usage.modelCalls += 1;
          result.usage.input += m.usage?.input || 0;
          result.usage.output += m.usage?.output || 0;
          if (m.stopReason === "error") result.error = m.errorMessage || "model call failed";
          const said = textOf(m.content);
          if (said) { result.text = said; emit({ kind: "think", text: said }); }
        } else if (e.type === "tool_execution_start") {
          if (e.toolName !== "submit_answer") result.usage.toolCalls += 1;
          emit({ kind: "act", tool: e.toolName, args: e.args });
        } else if (e.type === "tool_execution_end") {
          const details = e.result?.details || {};
          if (e.toolName === "submit_answer" && !e.isError) result.answer = details.answer;
          emit({ kind: "observe", tool: e.toolName, text: textOf(e.result?.content), error: !!e.isError, details });
        }
      }
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      result.seconds = Math.round((Date.now() - t0) / 100) / 10;
      if (result.status === "ok" && code !== 0) { result.status = "error"; result.error ||= stderr.trim().split("\n").slice(-3).join(" ") || `pi exited with ${code}`; }
      if (result.status === "ok" && result.error && !result.answer && !result.text) result.status = "error";
      if (result.status === "ok" && !result.answer && !result.text) result.status = "no_answer";
      resolve(result);
    });
  });
}
