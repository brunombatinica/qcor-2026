// search_notes: keyword search over the patient's clinical notes (FHIR DocumentReference), with snippets.

import { defineTool } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { line, noteText } from "../../ehr/render.mjs";
import { PATIENT, search, text } from "./fhir.ts";

const AROUND = 100;

export default () => defineTool({
  name: "search_notes",
  label: "Search notes",
  description: "Search the text of this patient's clinical notes, case-insensitive. Separate alternatives with |, e.g. \"beta blocker|carvedilol|stopped\". Returns matching notes newest first with id, date, type and snippets. An empty query lists every note.",
  parameters: Type.Object({ query: Type.String({ description: "Words or phrases; alternatives separated by |." }) }),
  async execute(_id, { query }) {
    const { request, resources } = await search(`DocumentReference?patient=${PATIENT}`);
    const terms = query.split("|").map((s) => s.trim().toLowerCase()).filter(Boolean);
    const hits: string[] = [];
    for (const r of resources) {
      const body = noteText(r), lower = body.toLowerCase();
      const snippets = terms.length ? terms.map((t) => lower.indexOf(t)).filter((at) => at >= 0).map((at) => {
        const from = Math.max(0, at - AROUND), to = Math.min(body.length, at + AROUND);
        return `${from ? "…" : ""}${body.slice(from, to).replace(/\n/g, " ")}${to < body.length ? "…" : ""}`;
      }) : [];
      if (!terms.length || snippets.length) hits.push(`${line(r)}${snippets.length ? `\n  ${[...new Set(snippets)].join("\n  ")}` : ""}`);
    }
    return text(hits.length ? hits.join("\n\n") : `No note mentions ${terms.map((t) => `"${t}"`).join(" or ")}.`, { request, hits: hits.length });
  },
});
