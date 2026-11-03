/**
 * The pi extension for the demo. agent/session.mjs starts `pi --no-extensions -e agent/extension.ts --tools <list>`,
 * and everything this file needs arrives in DEMO_* environment variables:
 *
 *   DEMO_BASE_URL, DEMO_MODEL, DEMO_CONTEXT_WINDOW, DEMO_MAX_TOKENS  the model endpoint (any OpenAI-compatible /v1)
 *   DEMO_API_KEY                                                     its key ("$DEMO_API_KEY" is resolved by pi)
 *   DEMO_FHIR_BASE, DEMO_FHIR_TOKEN                                  the FHIR server and this run's scoped token
 *   DEMO_PATIENT                                                     the patient's FHIR id
 *   DEMO_ANSWER_FIELDS                                               extra answer fields, e.g. quote,confidence
 *
 * Every tool in tools/ is registered; pi's --tools flag decides which ones the model is given, so a card turned on in
 * the page is a tool switched on here. What the tools can read is decided by the token, on the FHIR server.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import checkQuote from "./tools/check_quote.ts";
import messagePatient from "./tools/message_patient.ts";
import placeOrder from "./tools/place_order.ts";
import readNote from "./tools/read_note.ts";
import readRecords from "./tools/read_records.ts";
import searchNotes from "./tools/search_notes.ts";
import submitAnswer from "./tools/submit_answer.ts";
import webSearch from "./tools/web_search.ts";

const TOOL_BUDGET = 6;      // tool calls before every result asks for the answer

function env(name: string): string {
  const value = process.env[name];
  if (value === undefined) throw new Error(`demo extension: ${name} is not set (agent/session.mjs sets it)`);
  return value;
}

export default function (pi: ExtensionAPI) {
  pi.registerProvider("demo", {
    baseUrl: env("DEMO_BASE_URL"),
    apiKey: "$DEMO_API_KEY",
    api: "openai-completions",
    models: [{
      id: env("DEMO_MODEL"), name: env("DEMO_MODEL"), reasoning: false, input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: Number(env("DEMO_CONTEXT_WINDOW")), maxTokens: Number(env("DEMO_MAX_TOKENS")),
    }],
  });

  for (const make of [readRecords, searchNotes, readNote, checkQuote, webSearch, placeOrder, messagePatient]) pi.registerTool(make());
  pi.registerTool(submitAnswer((process.env.DEMO_ANSWER_FIELDS || "").split(",").filter(Boolean)));
  const structured = (process.env.DEMO_STRUCTURED || "") === "1";

  // Two nudges, so a session ends: past the budget every result asks for the answer, and with a structured answer a
  // turn that ends in plain text is told once to use submit_answer.
  let calls = 0, submitted = false, nudged = false;
  pi.on("tool_result", (event) => {
    if (event.toolName === "submit_answer") { submitted = true; return; }
    calls += 1;
    if (calls >= TOOL_BUDGET)
      return { content: [...event.content, { type: "text" as const, text: `\n[${calls} tool calls: decide now and give your answer]` }] };
  });
  pi.on("turn_end", (event) => {
    const message = event.message as { role?: string };
    if (!structured || submitted || nudged || message.role !== "assistant" || event.toolResults.length) return;
    nudged = true;
    pi.sendUserMessage("Call submit_answer with your decision now. Do not answer in plain text.", { deliverAs: "followUp" });
  });
}
