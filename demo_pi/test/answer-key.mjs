// The v2 answer key (label.mjs → labels/answer-key.json): a patient Opus labelled is scored against its label, the
// rest against how the chart was written, and the page is told who the key is by and how often it differs.
//
//   node test/answer-key.mjs        (part of npm test)

import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const { PATIENTS } = await import("../ehr/patients.mjs");
const slow = PATIENTS.find((p) => p.gold.scenario === "reason_bradycardia_vitals"), onOne = PATIENTS.find((p) => p.gold.status === "on_treatment");
const file = join(mkdtempSync(join(tmpdir(), "qcor-answer-key-")), "answer-key.json");
writeFileSync(file, JSON.stringify({ model: "claude-opus-5-5", label: "Claude Opus 5.5", effort: "high", promptVersion: 1, rules: {
  cms144: { [slow.id]: { status: "gap", why: "no_reason", reason: "Heart rate is normal at the last visit.", evidence: "Heart rate 72 /min" } },
  esc: { [onOne.id]: { status: "on_treatment", why: "on_beta_blocker", reason: "On carvedilol.", evidence: "carvedilol" } },
} }));
process.env.DEMO_ANSWER_KEY = file;
const { goldFor, chartGold, keyInfo } = await import("../agent/catalog.mjs");

assert.equal(chartGold(slow, "cms144").gap, false, "the chart: a slow heart rate is an exception under CMS144");
assert.deepEqual([goldFor(slow, "cms144").gap, goldFor(slow, "cms144").category, goldFor(slow, "cms144").by], [true, "no_reason", "opus"], "Opus's label wins");
assert.equal(goldFor(slow, "esc").gap, chartGold(slow, "esc").gap, "a patient it didn't label keeps the chart's answer");
assert.equal(goldFor(slow, "cms144").scenario, slow.gold.scenario, "where the evidence is stays the chart's");
assert.deepEqual(keyInfo(PATIENTS), {
  cms144: { by: "opus", model: "Claude Opus 5.5", effort: "high", labelled: 1, disagree: 1 },
  esc: { by: "opus", model: "Claude Opus 5.5", effort: "high", labelled: 1, disagree: 0 },
});
console.log("answer key: all checks passed");
