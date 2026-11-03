// Bruno's section of the QCOR 2026 talk as a PowerPoint: what an agent is, how it works, and how to set one up.
// Same look and the same Rosa story as talk/ (black, amber accent; blue = context, violet = tools, green/red =
// right/wrong). Run: node build.mjs  ->  qcor-bruno-agents.pptx
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { lineIcon } from "../shared/icons.js";
import { applyTheme } from "./theme.mjs";

const require = createRequire(import.meta.url);
const pptxgen = require("pptxgenjs");
const sharp = require("sharp");

const OUT = "qcor-bruno-agents.pptx";
const K = {
  bg: "000000", ink: "F5F5F7", muted: "8E8E93", line: "2C2C2E", border: "3A3A3E", card: "111113", card2: "1A1A1D",
  amber: "FFB547", blue: "6EA8FE", violet: "B794F6", green: "4ADE80", red: "FF6B6B",
};
// the talk's 14% tints, flattened onto black
const tint = (hex, a = 0.14) => hex.match(/../g).map((h) => Math.round(parseInt(h, 16) * a).toString(16).padStart(2, "0")).join("").toUpperCase();
const T = { amber: tint(K.amber), blue: tint(K.blue), violet: tint(K.violet), green: tint(K.green), red: tint(K.red) };
const FONT = "Arial", MONO = "Courier New";

const THEME = {
  name: "QCOR 2026 dark", headFontFace: FONT, bodyFontFace: FONT,
  // dk1/lt1 are swapped on purpose: text you add in PowerPoint comes out light on the black background
  colors: { dk1: K.ink, lt1: K.bg, dk2: K.muted, lt2: K.card, accent1: K.amber, accent2: K.blue, accent3: K.violet,
    accent4: K.green, accent5: K.red, accent6: K.border, hlink: K.blue, folHlink: K.violet },
};

// ---------- icons and logos, rasterised once ----------
const cache = new Map();
async function png(svg) {
  if (!cache.has(svg)) cache.set(svg, "image/png;base64," + (await sharp(Buffer.from(svg), { density: 600 }).resize(256, 256).png().toBuffer()).toString("base64"));
  return cache.get(svg);
}
const ic = (name, color = K.amber) => png(lineIcon(name, { size: 256, stroke: 1.75, color: "#" + color }));
const logo = (file) => png(readFileSync(new URL(`../shared/logos/${file}.svg`, import.meta.url), "utf8").replace(/width="1em"/, 'width="256"').replace(/height="1em"/, 'height="256"'));

// ---------- deck ----------
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 in
pres.author = "Bruno Batinica";
pres.title = "Under the hood: how an AI agent works (QCOR 2026)";
pres.theme = { headFontFace: FONT, bodyFontFace: FONT };

const PARTS = [["patient", "The case"], ["llm", "A model"], ["note", "Model + context"], ["agent", "An agent"], ["tool", "Setting one up"], ["shield", "Safety and the real world"]];

// The tracker (as in talk/): one icon per part, the current one in amber with its name.
async function trackerObjects(now) {
  const objs = []; let x = 0.45;
  for (const [i, [name, label]] of PARTS.entries()) {
    objs.push({ image: { x, y: 0.3, w: 0.2, h: 0.2, data: await ic(name, i === now ? K.amber : "5A5A5E") } });
    x += 0.28;
    if (i === now) {
      objs.push({ text: { text: label.toUpperCase(), options: { x, y: 0.27, w: 2.0, h: 0.26, margin: 0, fontFace: FONT, fontSize: 10, bold: true, color: K.amber, charSpacing: 1.5, valign: "middle" } } });
      x += label.length * 0.105 + 0.15;
    }
  }
  return objs;
}
const titlePh = { placeholder: { options: { name: "title", type: "title", x: 0.7, y: 0.75, w: 11.93, h: 0.9, margin: 0, fontFace: FONT, fontSize: 32, bold: true, color: K.ink, align: "left", valign: "top" }, text: "" } };
const slideNo = { x: 12.13, y: 7.0, w: 0.7, h: 0.25, fontFace: FONT, fontSize: 10, color: "5A5A5E", align: "right" };
pres.defineSlideMaster({ title: "Agent", background: { color: K.bg }, objects: [...(await trackerObjects(3)), titlePh], slideNumber: slideNo });
pres.defineSlideMaster({ title: "Setting one up", background: { color: K.bg }, objects: [...(await trackerObjects(4)), titlePh], slideNumber: slideNo });
pres.defineSlideMaster({ title: "Opener", background: { color: K.bg }, objects: [] });

// ---------- drawing helpers ----------
function box(s, x, y, w, h, o = {}) {
  s.addShape(o.shape || pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h, rectRadius: o.r ?? 0.12, fill: { color: o.fill || K.card },
    line: o.line === null ? { type: "none" } : { color: o.line || K.line, width: o.lw || 1, dashType: o.dash || "solid" },
    objectName: o.name,
  });
}
function text(s, t, x, y, w, h, o = {}) {
  s.addText(t, { x, y, w, h, margin: 0, isTextBox: true, fontFace: o.mono ? MONO : FONT, fontSize: 18, color: K.ink, valign: "top", ...o, mono: undefined });
}
function arrow(s, x1, y1, x2, y2, color = K.muted, w = 1.5) {
  s.addShape(pres.shapes.LINE, { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1) || 0.001, h: Math.abs(y2 - y1) || 0.001,
    flipH: x2 < x1, flipV: y2 < y1, line: { color, width: w, endArrowType: "triangle" } });
}
async function iconAt(s, name, x, y, size, color) { s.addImage({ x, y, w: size, h: size, data: await ic(name, color) }); }
async function iconDisc(s, name, x, y, d, color) {
  s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: tint(color) }, line: { color, width: 1 } });
  await iconAt(s, name, x + d * 0.25, y + d * 0.25, d * 0.5, color);
}
function pill(s, t, x, y, w, color, o = {}) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h: o.h || 0.4, rectRadius: (o.h || 0.4) / 2, fill: { color: o.fill || tint(color) }, line: o.line ? { color, width: 1 } : { type: "none" } });
  text(s, t, x, y, w, o.h || 0.4, { fontSize: o.size || 15, bold: true, color, align: "center", valign: "middle" });
}
const add = (layout) => pres.addSlide({ masterName: layout, sectionTitle: layout === "Setting one up" ? "Setting one up" : "An agent" });
const title = (s, t) => s.addText(t, { placeholder: "title" });

// ================= slides =================
pres.addSection({ title: "An agent" });

// 1 · opener
{
  const s = add("Opener");
  text(s, "QCOR 2026 · AGENTIC AI IN CARDIOVASCULAR CARE", 0.7, 0.6, 9, 0.3, { fontSize: 12, bold: true, color: K.muted, charSpacing: 2 });
  text(s, "Under the hood: how an AI agent works", 0.7, 1.4, 11.9, 1.0, { fontSize: 44, bold: true });
  text(s, "Bruno Batinica, MD", 0.7, 2.55, 8, 0.45, { fontSize: 22, color: K.muted });
  const cx = (i) => 1.4 + i * 2.1, cy = 5.0, d = 0.9;
  s.addShape(pres.shapes.LINE, { x: cx(0), y: cy, w: cx(5) - cx(0), h: 0, line: { color: K.line, width: 3 } });
  for (const [i, [name, label]] of PARTS.entries()) {
    const now = i === 3 || i === 4, done = i < 3, col = now ? K.amber : done ? K.muted : "5A5A5E";
    s.addShape(pres.shapes.OVAL, { x: cx(i) - d / 2, y: cy - d / 2, w: d, h: d, fill: { color: now ? T.amber : K.card }, line: { color: now ? K.amber : K.border, width: 2 } });
    await iconAt(s, name, cx(i) - 0.22, cy - 0.22, 0.44, col);
    text(s, label, cx(i) - 1.0, cy + 0.6, 2.0, 0.6, { fontSize: 15, bold: now, color: col, align: "center" });
  }
  s.addNotes(`[~20 s] Thanks, Phyllis. Phyllis showed you the model, and what happens when you put the facts in front of it. My part is the last rung of that ladder: what an agent actually is, how it works underneath, and how you set one up. Same patient, Rosa (synthetic, like every patient today).`);
}

// 2 · who chooses the context
{
  const s = add("Agent"); title(s, "Who chooses the context?");
  const cards = [
    ["llm", "A model", "guesses from what it learned", K.ink, K.card, K.line, "Rosa's EF?  “35%”  invented", K.red],
    ["note", "A model + context", "reads what someone else chose to give it", K.blue, K.card, K.blue, "her echo pasted in:  30%", K.green],
    ["agent", "An agent", "decides what it needs, goes and gets it, reads it, decides again", K.amber, T.amber, K.amber, "finds the echo itself:  30%", K.green],
  ];
  for (const [i, [icn, h, body, col, fill, line, ex, exCol]] of cards.entries()) {
    const x = 0.7 + i * 4.15;
    box(s, x, 2.3, 3.65, 2.9, { fill, line });
    await iconAt(s, icn, x + 0.3, 2.6, 0.55, col);
    text(s, h, x + 0.3, 3.35, 3.1, 0.5, { fontSize: 21, bold: true, color: col });
    text(s, body, x + 0.3, 3.9, 3.1, 1.0, { fontSize: 17, color: K.muted });
    pill(s, ex, x, 5.65, 3.65, exCol, { h: 0.5, size: 15 });
    if (i < 2) arrow(s, x + 3.73, 3.75, x + 4.07, 3.75, K.muted, 2);
  }
  s.addNotes(`[~40 s] The ladder from Phyllis's part. A bare model guesses: ask it Rosa's ejection fraction and it invents a plausible number. Give it context, her echo report, and it reads the right answer, but only because someone chose the right document and pasted it in. An agent closes that gap: it chooses its own context. It decides what it needs, goes and gets it, reads it, and decides what to do next. That is the whole difference, and the rest of my talk is how that works.`);
}

// 3 · anatomy
{
  const s = add("Agent"); title(s, "An agent is a model, with tools, in a loop");
  pill(s, "Goal:  is Rosa on the right heart-failure medicines?", 2.4, 1.9, 8.53, K.amber, { h: 0.5, size: 17, line: true });
  const parts = [
    ["llm", "Model", K.amber, "reads and writes text", "the same next-word predictor"],
    ["tool", "Tools", K.violet, "ways to reach the chart", "search notes · read a note · medications · labs"],
    ["harness", "Harness", K.violet, "the software around the model", "runs the tools, sets the limits, logs every step"],
    ["loop", "Loop", K.blue, "repeat until the job is done", "think → act → observe"],
  ];
  for (const [i, [icn, h, col, role, ex]] of parts.entries()) {
    const x = 0.7 + i * 3.03;
    box(s, x, 2.75, 2.8, 3.4);
    await iconDisc(s, icn, x + 0.3, 3.05, 0.8, col);
    text(s, h, x + 0.3, 4.05, 2.3, 0.45, { fontSize: 24, bold: true, color: col });
    text(s, role, x + 0.3, 4.55, 2.3, 0.75, { fontSize: 16 });
    text(s, ex, x + 0.3, 5.4, 2.3, 0.95, { fontSize: 14, color: K.muted });
  }
  s.addNotes(`[~45 s] Four parts. The model is the same next-word predictor Phyllis described; nothing new there. Tools are the ways it can reach the chart: search the notes, open a note, pull the medication list, the labs. The harness is ordinary software wrapped around the model: it runs the tools, sets the limits, logs everything. And the loop: it keeps going, think, act, observe, until the goal is answered. Model, tools, harness, loop. Let me show each.
[Cut for the 5-minute version.]`);
}

// 4 · the tool call
{
  const s = add("Agent"); title(s, "It fetches by writing a request");
  box(s, 0.7, 2.0, 7.5, 2.75, { line: K.blue });
  text(s, "CONTEXT", 1.05, 2.25, 3, 0.3, { fontSize: 12, bold: true, color: K.blue, charSpacing: 2 });
  text(s, "Tools you can use: search_notes(query), read_note(id), get_medications()", 1.05, 2.65, 6.9, 0.65, { fontSize: 15, color: K.muted, mono: true });
  text(s, "Why is Rosa not on spironolactone?", 1.05, 3.35, 6.9, 0.45, { fontSize: 21 });
  text(s, 'search_notes("spironolactone")', 1.05, 3.95, 6.9, 0.5, { fontSize: 22, bold: true, color: K.amber, mono: true });
  box(s, 8.5, 2.0, 4.13, 2.75);
  text(s, "NEXT WORD", 8.85, 2.25, 3, 0.3, { fontSize: 12, bold: true, color: K.muted, charSpacing: 2 });
  for (const [i, [tok, p]] of [['")', 97], ["stopped", 2], ['"', 1]].entries()) {
    const y = 2.8 + i * 0.6;
    text(s, tok, 8.85, y, 1.2, 0.4, { fontSize: 17, mono: true, color: i ? K.ink : K.amber, valign: "middle" });
    box(s, 10.1, y + 0.12, 1.65, 0.16, { fill: K.card2, line: null, r: 0.08 });
    box(s, 10.1, y + 0.12, Math.max(0.05, 1.65 * p / 100), 0.16, { fill: K.amber, line: null, r: 0.08 });
    text(s, `${p}%`, 11.85, y, 0.6, 0.4, { fontSize: 15, color: K.muted, align: "right", valign: "middle" });
  }
  await iconAt(s, "token", 0.7, 5.35, 0.36, K.amber);
  text(s, "Still next-word prediction: with tools listed, the likeliest next words are a request", 1.3, 5.3, 11.3, 0.5, { fontSize: 19, valign: "middle" });
  await iconAt(s, "code", 0.7, 6.05, 0.36, K.amber);
  text(s, "The model never runs anything itself. It only writes the request.", 1.3, 6.0, 11.3, 0.5, { fontSize: 19, valign: "middle" });
  s.addNotes(`[~50 s] How does a text predictor "use a tool"? We tell it, in the prompt, which tools exist and how to call them. Then we ask: why isn't Rosa on spironolactone? The most likely continuation is no longer an English sentence; it is a request in the right format: search_notes, open bracket, spironolactone. You can see it on the right: the closing bracket is 97% likely. Same mechanism as writing a sentence; the output is just shaped like a command. And the model itself runs nothing.`);
}

// 5 · the harness
{
  const s = add("Agent"); title(s, "The harness reads the request and runs it");
  box(s, 0.7, 1.95, 7.9, 3.6, { fill: K.bg, line: K.violet, dash: "dash", lw: 1.5 });
  text(s, "HARNESS", 1.0, 2.15, 3, 0.3, { fontSize: 12, bold: true, color: K.violet, charSpacing: 2 });
  box(s, 1.1, 2.65, 2.1, 1.45, { fill: T.amber, line: K.amber, lw: 2 });
  await iconAt(s, "llm", 1.9, 2.8, 0.5, K.amber);
  text(s, "model", 1.1, 3.4, 2.1, 0.45, { fontSize: 20, bold: true, color: K.amber, align: "center" });
  for (const [i, [icn, t]] of [["search", "search notes"], ["note", "read a note"], ["pill", "medication list"], ["flask", "labs"]].entries()) {
    const y = 2.2 + i * 0.6;
    box(s, 6.0, y, 2.3, 0.44, { fill: T.violet, line: null, r: 0.08 });
    await iconAt(s, icn, 6.15, y + 0.09, 0.26, K.violet);
    text(s, t, 6.55, y, 1.7, 0.44, { fontSize: 15, bold: true, color: K.violet, valign: "middle" });
  }
  box(s, 1.1, 4.4, 3.5, 0.38, { fill: K.amber, line: null, r: 0.19 });
  s.addText('search_notes("spironolactone")', { x: 1.1, y: 4.4, w: 3.5, h: 0.38, margin: 0, isTextBox: true, fontFace: MONO, fontSize: 12, bold: true, color: "1A1206", align: "center", valign: "middle" });
  pill(s, "Nephrology, 14 Apr: “discontinued due to hyperkalemia”", 1.1, 4.95, 5.6, K.blue, { h: 0.38, size: 12 });
  arrow(s, 8.38, 3.37, 9.52, 3.37, K.blue, 2);
  box(s, 9.6, 2.65, 2.6, 1.45, { fill: T.blue, line: K.blue, lw: 2 });
  await iconAt(s, "notes", 10.65, 2.8, 0.5, K.blue);
  text(s, "the chart", 9.6, 3.4, 2.6, 0.45, { fontSize: 20, bold: true, color: K.blue, align: "center" });
  const steps = ["The model writes a request", "The harness checks it's allowed", "and runs the tool against the chart", "The result is pasted into the context", "The model carries on writing"];
  for (const [i, t] of steps.entries()) {
    const x = 0.7 + i * 2.43;
    box(s, x, 5.85, 2.21, 0.95);
    s.addShape(pres.shapes.OVAL, { x: x + 0.15, y: 6.0, w: 0.32, h: 0.32, fill: { color: K.violet }, line: { type: "none" } });
    text(s, String(i + 1), x + 0.15, 6.0, 0.32, 0.32, { fontSize: 13, bold: true, color: K.bg, align: "center", valign: "middle" });
    text(s, t, x + 0.6, 5.95, 1.5, 0.8, { fontSize: 14 });
  }
  s.addNotes(`[~50 s] The harness is ordinary software wrapped around the model. It watches what the model writes. When it sees a request, it checks the request is allowed, runs the tool against the chart, and pastes the result back into the context: here, the nephrology note, "discontinued due to hyperkalemia". Then the model carries on writing, now with that line in front of it. Permissions, limits and logging all live here, in code we control, not in the model.`);
}

// 6 · the loop
{
  const s = add("Agent"); title(s, "In a loop: think, act, observe");
  const node = (t, x, y, col) => {
    s.addShape(pres.shapes.OVAL, { x, y, w: 1.35, h: 1.35, fill: { color: tint(col) }, line: { color: col, width: 2 } });
    text(s, t, x, y, 1.35, 1.35, { fontSize: 18, bold: true, color: col, align: "center", valign: "middle" });
  };
  node("Think", 2.15, 2.0, K.amber); node("Act", 3.55, 4.15, K.violet); node("Observe", 0.75, 4.15, K.blue);
  arrow(s, 3.35, 3.2, 3.95, 4.1, K.muted, 2); arrow(s, 3.5, 4.83, 2.15, 4.83, K.muted, 2); arrow(s, 1.55, 4.1, 2.15, 3.2, K.muted, 2);
  text(s, "until the job is done, or it hits a limit we set", 0.5, 5.8, 4.8, 0.7, { fontSize: 15, color: K.muted, align: "center" });
  box(s, 5.5, 1.95, 7.13, 4.8);
  await iconAt(s, "notes", 5.85, 2.2, 0.3, K.muted);
  text(s, "Rosa's chart · 612 notes", 6.25, 2.18, 4, 0.35, { fontSize: 15, color: K.muted, valign: "middle" });
  const rows = [["get_medications()", "spironolactone stopped"], ['search_notes("spironolactone")', "Nephrology: hyperkalemia"],
    ['search_notes("SGLT2")', "Cardiology: declines"], ['search_notes("LVEF echo")', "Echo 29 Aug: EF 30%"]];
  for (const [i, [call, res]] of rows.entries()) {
    const y = 2.75 + i * 0.6;
    text(s, "Act", 5.85, y, 0.5, 0.45, { fontSize: 15, bold: true, color: K.violet, valign: "middle" });
    text(s, call, 6.4, y, 3.5, 0.45, { fontSize: 13, mono: true, valign: "middle" });
    text(s, "→  " + res, 9.95, y, 2.6, 0.45, { fontSize: 13, color: K.muted, valign: "middle" });
  }
  const chips = [["EF 30%", K.green, 1.1], ["ACE inhibitor: on", K.green, 1.9], ["MRA: reason", K.green, 1.45], ["SGLT2i: reason", K.green, 1.6]];
  let cx = 5.85;
  for (const [t, col, w] of chips) { pill(s, t, cx, 5.25, w, col, { size: 13, h: 0.38 }); cx += w + 0.18; }
  pill(s, "Beta blocker: on?", 5.85, 5.85, 2.0, K.amber, { size: 13, h: 0.38 });
  text(s, [{ text: "4", options: { fontSize: 30, bold: true, color: K.amber } }, { text: "  of 612 notes read", options: { fontSize: 16, color: K.muted } }], 9.6, 5.77, 2.9, 0.55, { valign: "middle", align: "right" });
  s.addNotes(`[~60 s] Put that in a loop. Think: what do I still need? Act: write a request, the harness runs it. Observe: the result lands in the context. Repeat until it's done, or until it hits a limit we set. Here's Rosa. It pulled her medicines, saw spironolactone stopped, searched for why: hyperkalemia. Searched for SGLT2: she declined. Found the echo: 30%. It read 4 of her 612 notes. Every turn is the same next-word model with a little more context.
Four out of five right. But look at the beta blocker: it says she's on one. She's on metoprolol tartrate, which doesn't count for heart failure. Hold that thought; we fix it in a minute.`);
}

// 7 · harnesses
{
  const s = add("Agent"); title(s, "Harnesses you may have heard of");
  const items = [["claudecode-color", "Claude Code", "Anthropic · for software"], ["codex-color", "Codex", "OpenAI · for software"], [null, "Pi", "open source · our study agents"],
    ["langgraph-color", "LangGraph", "LangChain · build your own"], ["openai", "Agents SDK", "OpenAI · build your own"], ["google-color", "ADK", "Google · build your own"]];
  for (const [i, [lg, name, by]] of items.entries()) {
    const x = 0.7 + (i % 3) * 4.07, y = 2.1 + Math.floor(i / 3) * 2.05;
    box(s, x, y, 3.79, 1.75, { fill: name === "Pi" ? T.amber : K.card, line: name === "Pi" ? K.amber : K.line });
    if (lg) s.addImage({ x: x + 0.35, y: y + 0.5, w: 0.75, h: 0.75, data: await logo(lg) });
    else text(s, "π", x + 0.35, y + 0.4, 0.75, 0.9, { fontSize: 44, bold: true, color: K.amber, align: "center", valign: "middle", fontFace: "Cambria" });
    text(s, name, x + 1.35, y + 0.45, 2.3, 0.45, { fontSize: 22, bold: true });
    text(s, by, x + 1.35, y + 0.95, 2.35, 0.6, { fontSize: 14, color: K.muted });
  }
  text(s, "The model is swappable; the design lives in the harness", 0.7, 6.35, 11.9, 0.45, { fontSize: 19, color: K.amber });
  s.addNotes(`[~30 s] You may have heard of some of these. Claude Code and Codex are agents for writing software, the most mature examples today. LangGraph, the OpenAI Agents SDK and Google's ADK are frameworks for building your own. Our study agents run in Pi, a small open-source harness. The point: the model is swappable. The design, and that's what you'll own, lives in the harness.
[Cut for the 5-minute version.]`);
}

// 8 · the five parts
pres.addSection({ title: "Setting one up" });
{
  const s = add("Setting one up"); title(s, "Set it up like a capable remote colleague");
  box(s, 0.7, 2.1, 3.4, 4.3);
  await iconDisc(s, "laptop", 1.75, 2.9, 1.3, K.amber);
  text(s, "can't walk down the hall to ask what you meant", 1.0, 4.55, 2.8, 1.2, { fontSize: 16, color: K.muted, align: "center" });
  const rows = [["target", "Task", "a clear, small job, not “review the chart”"], ["database", "Data", "access to the records the job needs, and no more"],
    ["tool", "Tools", "the software to do it: search notes, medications, labs"], ["book", "Rules", "the written protocol: what counts, what doesn't"],
    ["shield", "Checks", "show your sources; someone reviews the work"]];
  for (const [i, [icn, h, t]] of rows.entries()) {
    const y = 2.1 + i * 0.89;
    box(s, 4.45, y, 8.18, 0.72);
    await iconAt(s, icn, 4.7, y + 0.2, 0.32, K.amber);
    text(s, [{ text: h, options: { bold: true, fontSize: 20 } }, { text: "   " + t, options: { fontSize: 17, color: "C7C7CC" } }], 5.25, y, 7.2, 0.72, { valign: "middle" });
  }
  s.addNotes(`[~40 s] So how do you set one up? I'm going to anthropomorphise on purpose. Imagine onboarding a capable new colleague who can only work remotely: they can't walk down the hall to ask what you meant. You'd give them a clear task, access to the records they need, the right software, the written protocol, and a way for you to check their work. That's exactly how you set up an agent. These five words are also the blocks in the live demo.`);
}

// 9 · task
{
  const s = add("Setting one up"); title(s, "Task: small questions you can check");
  pill(s, "Is Rosa getting appropriate care?", 3.9, 1.9, 5.53, K.amber, { h: 0.55, size: 19, line: true });
  const cols = [
    [0.7, 5.2, "Guideline medicines", [["EF ≤ 40%?", "yes · 30%", K.green], ["ACEi / ARB / ARNI", "on", K.green], ["Beta blocker", "on?", K.amber], ["MRA", "reason: hyperkalemia", K.ink], ["SGLT2 inhibitor", "reason: declined", K.ink]]],
    [6.15, 3.1, "Follow-up", [["Visit within 7 days?", "?", K.muted], ["BMP within 1 week?", "?", K.muted]]],
    [9.5, 3.13, "Rehabilitation", [["Cardiac rehab referral?", "?", K.muted]]],
  ];
  for (const [x, w, h, rows] of cols) {
    box(s, x, 2.75, w, 3.35);
    text(s, h, x + 0.25, 2.92, w - 0.5, 0.4, { fontSize: 18, bold: true });
    for (const [i, [q, a, col]] of rows.entries()) {
      const y = 3.45 + i * 0.5;
      s.addShape(pres.shapes.LINE, { x: x + 0.25, y, w: w - 0.5, h: 0, line: { color: K.line, width: 1 } });
      text(s, q, x + 0.25, y + 0.05, w - 0.5, 0.42, { fontSize: 15, valign: "middle" });
      text(s, a, x + 0.25, y + 0.05, w - 0.5, 0.42, { fontSize: 15, bold: true, color: col, align: "right", valign: "middle" });
    }
  }
  text(s, "Each answer is one of:", 0.7, 6.4, 2.6, 0.4, { fontSize: 15, color: K.muted, valign: "middle" });
  pill(s, "on it", 3.25, 6.4, 1.1, K.green, { size: 14 }); pill(s, "documented reason", 4.6, 6.4, 2.2, K.ink, { size: 14, fill: K.card2 }); pill(s, "gap", 7.05, 6.4, 0.9, K.red, { size: 14 });
  s.addNotes(`[~45 s] The first design decision is the task. "Is Rosa getting appropriate care?" is too big to check. So we break it into small questions, each with a short list of possible answers: on it, a documented reason, or a gap. Is the EF 40% or less? Is she on an ACE inhibitor? A beta blocker? Small questions are checkable: we can measure accuracy question by question, and the agent's job at each step is narrow. This is also how the quality measures are already written.`);
}

// 10 · AI reads, code decides
{
  const s = add("Setting one up"); title(s, "Let the AI read; let ordinary code decide");
  box(s, 0.7, 2.1, 3.7, 3.3, { line: K.blue });
  await iconAt(s, "eye", 1.0, 2.35, 0.36, K.blue);
  text(s, "The AI reads", 1.5, 2.33, 3, 0.4, { fontSize: 19, bold: true, color: K.blue, valign: "middle" });
  text(s, ["EF = 30%", "beta blocker = metoprolol tartrate", "MRA stopped: hyperkalemia", "SGLT2i: declined"].map((t, i, a) => ({ text: t, options: { breakLine: i < a.length - 1 } })), 1.0, 3.0, 3.25, 2.2, { fontSize: 14, mono: true, paraSpaceAfter: 8 });
  arrow(s, 4.48, 3.75, 4.82, 3.75, K.muted, 2);
  box(s, 4.9, 2.1, 4.15, 3.3, { line: K.violet });
  await iconAt(s, "code", 5.2, 2.35, 0.36, K.violet);
  text(s, "Ordinary code decides", 5.7, 2.33, 3.5, 0.4, { fontSize: 19, bold: true, color: K.violet, valign: "middle" });
  text(s, ["if EF <= 40", "  and not qualifying(BB)", "  and not documented_reason(BB):", "    → gap"].map((t, i, a) => ({ text: t, options: { breakLine: i < a.length - 1 } })), 5.2, 3.0, 3.75, 2.2, { fontSize: 14, mono: true, paraSpaceAfter: 8 });
  arrow(s, 9.13, 3.75, 9.47, 3.75, K.muted, 2);
  box(s, 9.55, 2.1, 3.08, 3.3, { fill: T.red, line: K.red });
  await iconAt(s, "x", 10.79, 2.9, 0.6, K.red);
  text(s, "Beta-blocker gap", 9.65, 3.75, 2.88, 0.9, { fontSize: 20, bold: true, color: K.red, align: "center" });
  await iconAt(s, "check", 0.7, 5.9, 0.36, K.amber);
  text(s, "The measure logic stays fixed and auditable, like a CMS specification", 1.3, 5.82, 11.3, 0.55, { fontSize: 18, valign: "middle" });
  s.addNotes(`[~40 s] A principle from our study: don't ask the model for the verdict. Ask it for the facts a human abstractor would pull out, then compute the verdict in ordinary code that implements the measure definition. That keeps the logic fixed, testable and identical to what a QI team would apply by hand. When the measure changes, you change the code, not the prompt.
[Cut for the 5-minute version.]`);
}

// 11 · data and tools
{
  const s = add("Setting one up"); title(s, "Data and tools: only what the job needs");
  box(s, 0.7, 2.05, 5.8, 3.95);
  await iconAt(s, "database", 1.0, 2.3, 0.34, K.blue);
  text(s, "Data it may see", 1.5, 2.28, 4, 0.4, { fontSize: 19, bold: true, color: K.blue, valign: "middle" });
  const data = [["Medications", 1], ["Labs", 1], ["Echo reports", 1], ["Discharge summaries", 1], ["Clinic notes", 1], ["Specialist notes", 1], ["Psychiatry notes", 0], ["Billing", 0], ["Other patients", 0]];
  for (const [i, [t, ok]] of data.entries()) {
    const x = 1.0 + (i % 2) * 2.7, y = 2.95 + Math.floor(i / 2) * 0.58;
    await iconAt(s, ok ? "check" : "x", x, y + 0.08, 0.26, ok ? K.green : K.red);
    text(s, t, x + 0.38, y, 2.3, 0.42, { fontSize: 15, color: ok ? K.ink : K.muted, valign: "middle" });
  }
  box(s, 6.83, 2.05, 5.8, 3.95);
  await iconAt(s, "tool", 7.13, 2.3, 0.34, K.violet);
  text(s, "Tools it may use", 7.63, 2.28, 4, 0.4, { fontSize: 19, bold: true, color: K.violet, valign: "middle" });
  const tools = [["search_notes", "find sentences with a term", 1], ["read_note", "open one note in full", 1], ["get_medications", "active and stopped orders", 1],
    ["get_labs", "potassium, eGFR…", 1], ["place_order", "not given", 0], ["send_message", "not given", 0]];
  for (const [i, [t, d, ok]] of tools.entries()) {
    const y = 2.95 + i * 0.5;
    text(s, t, 7.13, y, 2.3, 0.42, { fontSize: 14, mono: true, bold: true, color: ok ? K.violet : K.muted, strike: ok ? undefined : "sngStrike", valign: "middle" });
    text(s, d, 9.5, y, 3.0, 0.42, { fontSize: 14, color: ok ? K.ink : K.red, valign: "middle" });
  }
  await iconAt(s, "warning", 0.7, 6.4, 0.36, K.amber);
  text(s, "A real boundary: if the answer sits outside it, the agent will miss it", 1.3, 6.32, 11.3, 0.55, { fontSize: 18, valign: "middle" });
  s.addNotes(`[~45 s] Data and tools are the boundary. Data: which parts of the record the agent can reach. For heart-failure medicines: medications, labs, echo, discharge summaries, clinic and specialist notes. Not psychiatry notes, not billing, and certainly not other patients. Minimum necessary: less to leak, less to confuse it, less to pay for. Tools are its hands: search, read, medications, labs. No ordering, no messaging. Every tool you add is a new capability and a new risk. And it's a real boundary: switch off specialist notes and the hyperkalemia reason disappears. You'll see that in the demo.`);
}

// 12 · rules
{
  const s = add("Setting one up"); title(s, "Rules: a protocol in plain English");
  box(s, 0.7, 2.05, 6.1, 4.25);
  await iconAt(s, "note", 0.95, 2.25, 0.26, K.muted);
  text(s, "beta-blocker.md", 1.3, 2.22, 3, 0.32, { fontSize: 13, mono: true, color: K.muted, valign: "middle" });
  s.addShape(pres.shapes.LINE, { x: 0.7, y: 2.7, w: 6.1, h: 0, line: { color: K.line, width: 1 } });
  const md = [["# Heart-failure beta blocker", K.ink, true], ["", K.ink], ["Counts: carvedilol, bisoprolol,", K.ink], ["  metoprolol succinate (XL, ER)", K.ink], ["Does NOT count: metoprolol tartrate,", K.red], ["  atenolol, or any other beta blocker", K.red], ["", K.ink],
    ["If none: look for a documented reason", K.ink], ["  (bradycardia, hypotension, asthma,", K.ink], ["  or the patient declined).", K.ink]];
  text(s, md.map(([t, c, b], i) => ({ text: t || " ", options: { color: c, bold: !!b, breakLine: i < md.length - 1 } })), 1.0, 2.9, 5.7, 3.3, { fontSize: 14, mono: true });
  box(s, 7.15, 2.05, 5.48, 2.2);
  await iconDisc(s, "patient", 7.45, 2.35, 0.7, K.ink);
  text(s, "Rosa", 8.4, 2.33, 3, 0.4, { fontSize: 19, bold: true });
  text(s, "metoprolol tartrate 25 mg BID", 8.4, 2.75, 4.1, 0.4, { fontSize: 16 });
  text(s, [{ text: "on beta blocker ✓", options: { color: "2E8B57", strike: "sngStrike" } }, { text: "     gap ✗", options: { color: K.red, bold: true, fontSize: 24 } }], 7.45, 3.4, 5.0, 0.6, { fontSize: 20, valign: "middle" });
  box(s, 7.15, 4.55, 5.48, 1.75, { fill: T.amber, line: K.amber });
  await iconAt(s, "flag", 7.45, 4.85, 0.36, K.amber);
  text(s, "In our study, missing this one rule was the largest single error the models made", 8.0, 4.75, 4.4, 1.35, { fontSize: 16, valign: "middle" });
  s.addNotes(`[~45 s] Remember the beta blocker. Rules go in short documents of instructions the agent reads before it starts, often called "skills". This one is a few lines a cardiologist would write, mirroring the measure: carvedilol, bisoprolol and metoprolol succinate count; metoprolol tartrate doesn't. With it, Rosa's metoprolol tartrate is correctly a gap. In our study, missing this rule was the largest single error the models made. The most important "code" in the system is clinical knowledge in plain English, which clinicians can read, write and audit.`);
}

// 13 · checks
{
  const s = add("Setting one up"); title(s, "Checks: no quote, no answer");
  const cards = [[0.7, "MRA", "documented reason", "“Spironolactone discontinued due to hyperkalemia (K 5.9)”", "found in Nephrology, 14 Apr · accepted", K.green, "check"],
    [6.83, "Cardiac rehab", "referred", "“Patient referred to cardiac rehabilitation”", "not in the chart · sent to a person", K.red, "x"]];
  for (const [x, h, claim, quote, verdict, col, icn] of cards) {
    box(s, x, 2.05, 5.8, 3.6);
    text(s, h, x + 0.3, 2.3, 3, 0.45, { fontSize: 22, bold: true, valign: "middle" });
    pill(s, claim, x + 5.5 - 2.2, 2.33, 2.2, K.ink, { size: 13, fill: K.card2, h: 0.38 });
    box(s, x + 0.3, 2.95, 5.2, 1.0, { fill: K.card2, line: null, r: 0.08 });
    text(s, quote, x + 0.5, 2.95, 4.85, 1.0, { fontSize: 16, italic: true, valign: "middle" });
    await iconAt(s, "search", x + 0.3, 4.12, 0.26, K.muted);
    text(s, "the harness searches the chart for the quote…", x + 0.7, 4.05, 4.8, 0.4, { fontSize: 14, color: K.muted, valign: "middle" });
    box(s, x + 0.3, 4.65, 5.2, 0.7, { fill: tint(col, 0.18), line: null, r: 0.08 });
    await iconAt(s, icn, x + 0.5, 4.83, 0.32, col);
    text(s, verdict, x + 0.95, 4.65, 4.45, 0.7, { fontSize: 16, bold: true, color: col, valign: "middle" });
  }
  await iconAt(s, "code", 0.7, 6.05, 0.36, K.amber);
  text(s, "The check is ordinary code, not another question to the model", 1.3, 5.97, 11.3, 0.55, { fontSize: 18, valign: "middle" });
  s.addNotes(`[~40 s] Checks. Every answer must come with the exact words it relied on, and the harness checks those words exist in the chart. In code, not by asking the model. The MRA reason: the quote is found in the nephrology note, accepted. The cardiac rehab referral: the quote isn't anywhere in the chart, so the answer isn't accepted; it goes to a person. That's how you review a remote colleague's work in seconds, and how you catch invention.`);
}

// 14 · orchestration
{
  const s = add("Setting one up"); title(s, "Bigger jobs: small agents in a workflow");
  box(s, 0.7, 3.3, 2.2, 1.9, { fill: T.amber, line: K.amber });
  await iconAt(s, "agent", 1.55, 3.55, 0.5, K.amber);
  text(s, "Coordinator", 0.7, 4.15, 2.2, 0.4, { fontSize: 18, bold: true, color: K.amber, align: "center" });
  text(s, "splits the job", 0.7, 4.55, 2.2, 0.4, { fontSize: 14, color: K.muted, align: "center" });
  text(s, "in parallel", 3.6, 2.05, 3.0, 0.35, { fontSize: 14, color: K.muted, align: "center" });
  const helpers = [["pill", "Medicines agent", "5 questions"], ["calendar", "Follow-up agent", "visit, labs"], ["heart", "Rehab agent", "referral"]];
  for (const [i, [icn, h, d]] of helpers.entries()) {
    const y = 2.55 + i * 1.2;
    box(s, 3.6, y, 3.0, 1.0);
    await iconAt(s, icn, 3.85, y + 0.3, 0.4, K.violet);
    text(s, h, 4.45, y + 0.15, 2.1, 0.4, { fontSize: 17, bold: true });
    text(s, d, 4.45, y + 0.53, 2.1, 0.35, { fontSize: 14, color: K.muted });
    arrow(s, 2.98, 4.25, 3.52, y + 0.5, K.muted, 1.5);
    arrow(s, 6.68, y + 0.5, 7.17, 4.25, K.muted, 1.5);
  }
  const tail = [["code", "Code combines", "the measure logic", K.violet], ["doctor", "A person reviews", "anything flagged", K.blue], ["clipboard", "Gap list", "for the QI team", K.green]];
  for (const [i, [icn, h, d, col]] of tail.entries()) {
    const x = 7.25 + i * 1.9;
    box(s, x, 3.3, 1.5, 1.9);
    await iconAt(s, icn, x + 0.5, 3.5, 0.5, col);
    text(s, h, x + 0.08, 4.1, 1.34, 0.6, { fontSize: 14, bold: true, color: col, align: "center" });
    text(s, d, x + 0.08, 4.68, 1.34, 0.45, { fontSize: 12, color: K.muted, align: "center" });
    if (i < 2) arrow(s, x + 1.58, 4.25, x + 1.82, 4.25, K.muted, 1.5);
  }
  await iconAt(s, "layers", 0.7, 6.5, 0.36, K.amber);
  text(s, "Each small agent has its own task, data, tools, rules and checks", 1.3, 6.42, 11.3, 0.55, { fontSize: 18, valign: "middle" });
  s.addNotes(`[~40 s] Real jobs are bigger than one question. The same building blocks compose: a coordinator splits the job and hands each piece to a small agent, here one for medicines, one for follow-up, one for rehab, running in parallel, each with its own task, data, tools, rules and checks. Ordinary code combines their answers using the measure logic, a person reviews anything flagged, and the output is a gap list for the QI team. Many small, checkable agents beat one big one.
[Cut for the 5-minute version.]`);
}

// 15 · summary
{
  const s = add("Setting one up"); title(s, "What's under the hood");
  const eq = [["llm", "Model", K.amber], ["tool", "Tools", K.violet], ["harness", "Harness", K.violet], ["loop", "Loop", K.blue]];
  let x = 0.7;
  text(s, "An agent is", 0.7, 1.95, 4, 0.4, { fontSize: 16, color: K.muted });
  for (const [i, [icn, h, col]] of eq.entries()) {
    box(s, x, 2.45, 2.2, 1.15);
    await iconAt(s, icn, x + 0.25, 2.83, 0.4, col);
    text(s, h, x + 0.8, 2.45, 1.35, 1.15, { fontSize: 20, bold: true, color: col, valign: "middle" });
    x += 2.2;
    text(s, i < 3 ? "+" : "=", x, 2.45, 0.45, 1.15, { fontSize: 26, color: K.muted, align: "center", valign: "middle" });
    x += 0.45;
  }
  box(s, x, 2.45, 1.33, 1.15, { fill: T.amber, line: K.amber });
  await iconAt(s, "agent", x + 0.46, 2.6, 0.4, K.amber);
  text(s, "agent", x, 3.05, 1.33, 0.4, { fontSize: 16, bold: true, color: K.amber, align: "center" });
  text(s, "You set it up like a remote colleague", 0.7, 4.1, 6, 0.4, { fontSize: 16, color: K.muted });
  for (const [i, [icn, h]] of [["target", "Task"], ["database", "Data"], ["tool", "Tools"], ["book", "Rules"], ["shield", "Checks"]].entries()) {
    const bx = 0.7 + i * 2.43;
    box(s, bx, 4.6, 2.23, 0.85);
    await iconAt(s, icn, bx + 0.3, 4.85, 0.35, K.amber);
    text(s, h, bx + 0.8, 4.6, 1.35, 0.85, { fontSize: 19, bold: true, valign: "middle" });
  }
  await iconAt(s, "send", 0.7, 6.25, 0.36, K.amber);
  text(s, [{ text: "Next: ", options: { color: K.muted } }, { text: "Lovedeep · can we rely on an agent in clinical practice?", options: { color: K.amber, bold: true } }], 1.3, 6.17, 11.3, 0.55, { fontSize: 19, valign: "middle" });
  s.addNotes(`[~25 s] So, under the hood: an agent is a model, with tools, run by a harness, in a loop. It reads; it doesn't decide the verdict. And you set it up the way you'd set up a remote colleague: a clear task, the data it needs, the tools to do it, the rules in plain English, and checks on every answer. You'll see all five in the live build. But first, how do we know it's working? Over to Lovedeep.`);
}

await pres.writeFile({ fileName: OUT });
await applyTheme(OUT, THEME);
console.log("wrote", OUT);
