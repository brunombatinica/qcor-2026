// Animations for the deck. Everything is declarative in the HTML:
//   data-t="1200"            the element gets class "on" 1.2 s after the slide appears (CSS does the movement)
//   data-type="text" data-t  typewriter
//   data-count="612" data-t  count up to a number
//   <div class="gen" data-gen="NAME" data-t>   next-token generation widget, configured in GENS below
//   <div class="train" data-t>                 the training widget
//   <div class="roadmap" data-active="2">     the signpost
// Entering a slide replays it; ?review jumps every slide to its end state (for printing and screenshots).

import { injectSprite } from "../shared/icons.js";

const REVIEW = new URLSearchParams(location.search).has("review");
const sleep = (ms, run) => new Promise((res, rej) => { if (REVIEW) return res(); const id = setTimeout(() => (run.dead ? rej("dead") : res()), ms); run.timers.push(id); });
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const icon = (n, cls = "i") => `<svg class="${cls}"><use href="#i-${n}"/></svg>`;

// ── next-token generation scripts ────────────────────────────────────────────────────────────────────────────────
const GENS = {
  nextword: {
    prompt: "The cat sat on the",
    steps: [
      [[" mat", 61], [" floor", 12], [" couch", 9], [" chair", 7], [" windowsill", 4]],
      [[" and", 38], [".", 31], [",", 14], [" in", 8], [" while", 5]],
      [[" purred", 33], [" fell", 21], [" looked", 15], [" watched", 12], [" went", 8]],
      [[" softly", 29], [".", 26], [" happily", 14], [" loudly", 9], [" quietly", 8]],
      [[".", 81], [",", 9], [" as", 5], [" while", 3], [" for", 2]],
    ],
  },
  guess: {
    prompt: "What was Rosa Delgado's most recent ejection fraction?",
    lead: " Her most recent ejection fraction was",
    steps: [[[" 35", 24], [" 40", 21], [" 25", 17], [" 30", 12], [" 45", 9]], [["%", 88], [" percent", 9], ["-", 2], [",", 1], [".", 0.5]]],
  },
  context: {
    context: "[Echo report · 29 Aug 2026]\nLeft ventricle moderately dilated with global hypokinesis. LVEF 30% (biplane Simpson's). Moderate mitral regurgitation.",
    prompt: "What was Rosa Delgado's most recent ejection fraction?",
    lead: " Her most recent ejection fraction was",
    steps: [[[" 30", 97], [" 35", 1], [" 25", 0.8], [" 40", 0.5], [" 45", 0.2]], [["%", 92], [" percent", 7], ["-", 0.5], [",", 0.3], [".", 0.2]]],
  },
  toolcall: {
    context: "Tools you can use: search_notes(query), read_note(id), get_medications()",
    prompt: "Why is Rosa not on spironolactone?",
    steps: [[[" search", 71], [" She", 12], [" get", 9], [" I", 6], [" read", 2]], [["_notes", 96], ["(", 2], [" notes", 2]], [["(\"", 94], ["(", 4], [" for", 2]], [["spironolactone", 82], ["hyperkalemia", 9], ["MRA", 6], ["potassium", 3]], [["\")", 97], [" stopped", 2], ["\"", 1]]],
    mono: true,
  },
};

function renderGen(el) {
  const g = GENS[el.dataset.gen];
  el.innerHTML = `
    <div class="g-prompt">
      ${g.context ? `<div class="g-ctx"><div class="g-tag">${icon("note")} context</div>${esc(g.context)}</div>` : ""}
      <div class="g-q"><span class="g-you">${esc(g.prompt)}</span><span class="g-out ${g.mono ? "mono" : ""}"></span><span class="caret"></span></div>
    </div>
    ${g.steps ? `<div class="g-dist"><div class="g-tag">${icon("llm")} next word</div><div class="g-bars"></div></div>` : ""}`;
}

async function runGen(el, run) {
  const g = GENS[el.dataset.gen];
  const out = el.querySelector(".g-out"), bars = el.querySelector(".g-bars"), ctx = el.querySelector(".g-ctx");
  out.textContent = "";
  if (ctx) { ctx.classList.remove("on"); await sleep(300, run); ctx.classList.add("on"); await sleep(1400, run); }
  if (g.lead) { for (const ch of g.lead) { out.textContent += ch; await sleep(22, run); } }
  if (g.stream) {
    for (const w of g.stream.split(/(?=[ \n])/)) { out.textContent += w; await sleep(85, run); }
    return;
  }
  for (const cands of g.steps) {
    const max = Math.max(...cands.map((c) => c[1]));
    bars.innerHTML = cands.map(([t, p]) => `<div class="g-row"><span class="g-tok">${esc(t.trim() || t)}</span><span class="g-track"><span class="g-fill" style="--w:${(70 * p) / max + 2}%"></span></span><span class="g-p">${p < 1 ? "<1" : Math.round(p)}%</span></div>`).join("");
    await sleep(60, run);
    bars.querySelectorAll(".g-row").forEach((r) => r.classList.add("on"));
    await sleep(1000, run);
    bars.querySelector(".g-row").classList.add("pick");
    await sleep(500, run);
    out.textContent += cands[0][0];
    await sleep(500, run);
  }
}

// ── the training widget: guess the next word, compare, push each word's probability, nudge, next example ─────────
// Causal, like GPT: the model only ever sees the words before the gap. After the real word is shown, every candidate
// gets an arrow: the real word is pushed up, the others down, each by how wrong it was (the gradient of the loss with
// respect to that word's score, p − 1 or p). The push flows back through the network and the bars move a little.
// Early examples are guessed badly and pushed hard; by the last ones the right word is the favourite and barely moves.
const TRAIN = [
  { prefix: "The capital of France is", truth: "Paris", seen: "1", p: { "the": 9, "a": 8, "beautiful": 2, "London": 0.6, "Paris": 0.4 } },
  { prefix: "Once upon a", truth: "time", seen: "1,000", p: { "the": 7, "time": 5, "day": 4, "hill": 3, "very": 2 } },
  { prefix: "Water boils at 100", truth: "degrees", seen: "1,000,000", p: { "degrees": 22, "years": 9, "people": 6, "times": 5, "miles": 3 } },
  { prefix: "def add(a, b): return a +", truth: "b", seen: "100,000,000", p: { "b": 52, "1": 11, "a": 8, "c": 4, "(": 2 } },
  { prefix: "To be or not to", truth: "be", seen: "1,000,000,000", p: { "be": 84, "go": 3, "do": 2, "say": 1, "see": 1 } },
];
const STEP = 0.8; // learning rate of the illustrated step
// one gradient step on the scores: z ← z − STEP·(p − y), then softmax again; the unlisted words (the rest of the
// vocabulary, each tiny) barely move, so their total is carried over unchanged
function afterStep(ex) {
  const q = Object.fromEntries(Object.entries(ex.p).map(([w, p]) => [w, p / 100]));
  const rest = 1 - Object.values(q).reduce((a, b) => a + b, 0);
  const u = Object.fromEntries(Object.entries(q).map(([w, p]) => [w, p * Math.exp(-STEP * (p - (w === ex.truth ? 1 : 0)))]));
  const z = rest + Object.values(u).reduce((a, b) => a + b, 0);
  return Object.fromEntries(Object.entries(u).map(([w, v]) => [w, (100 * v) / z]));
}
const pct = (p) => (p < 1.95 ? p.toFixed(1) : Math.round(p)) + "%";
function renderTrain(el) {
  el.innerHTML = `
    <div class="t-sent"><span class="t-pre"></span> <span class="t-blank"><span class="t-q">?</span><span class="t-truth"></span></span><span class="t-hidden">it never sees what comes next</span></div>
    <div class="t-body">
      <div class="t-net">${netSVG()}</div>
      <div class="t-dist"><div class="g-tag">${icon("llm")} model's guess for the next word</div><div class="g-bars"></div>
        <div class="t-key"><span class="up">make more likely</span><span class="down">make less likely</span></div></div>
      <div class="t-side"><div class="t-label">examples seen</div><div class="t-seen">0</div><div class="t-err"></div></div>
    </div>`;
}
function netSVG() {
  const cols = [[60, 140, 220, 300], [90, 180, 270], [60, 140, 220, 300]], xs = [30, 150, 270];
  let lines = "", dots = "";
  cols.forEach((ys, c) => ys.forEach((y) => {
    dots += `<circle cx="${xs[c]}" cy="${y}" r="11"/>`;
    // the nudge runs backwards, from the output side (right) to the input side (left)
    if (c < 2) cols[c + 1].forEach((y2) => { lines += `<line x1="${xs[c]}" y1="${y}" x2="${xs[c + 1]}" y2="${y2}" style="--d:${(1 - c) * 0.45 + ((y + y2) % 3) * 0.06}s"/>`; });
  }));
  return `<svg viewBox="0 0 300 360"><g class="t-lines">${lines}</g><g class="t-dots">${dots}</g><text x="150" y="352" text-anchor="middle">billions of adjustable numbers</text></svg>`;
}
async function runTrain(el, run) {
  const bars = el.querySelector(".g-bars"), blank = el.querySelector(".t-blank"), pre = el.querySelector(".t-pre"), truth = el.querySelector(".t-truth");
  const seen = el.querySelector(".t-seen"), err = el.querySelector(".t-err"), net = el.querySelector(".t-net"), key = el.querySelector(".t-key");
  for (const ex of TRAIN) {
    blank.classList.remove("shown"); key.classList.remove("on"); err.innerHTML = ""; net.classList.remove("nudge"); bars.innerHTML = "";
    pre.textContent = ""; truth.textContent = ex.truth; seen.textContent = ex.seen;
    for (const w of ex.prefix.split(" ")) { pre.textContent += (pre.textContent ? " " : "") + w; await sleep(150, run); }
    const next = afterStep(ex), cands = Object.entries(ex.p).sort((a, b) => b[1] - a[1]);
    const scale = Math.max(...cands.map(([w, p]) => Math.max(p, next[w])), 1), width = (p) => (70 * p) / scale + 2;
    bars.innerHTML = cands.map(([w, p]) => {
      const up = w === ex.truth, grad = up ? 1 - p / 100 : p / 100;
      return `<div class="g-row" data-truth="${up ? 1 : ""}"><span class="g-tok">${esc(w)}</span><span class="g-track"><span class="g-fill" style="--w:${width(p)}%"></span><span class="t-arrow ${up ? "up" : "down"}" style="--x:${width(p)}%;--len:${14 + 110 * grad}px"></span></span><span class="g-p">${pct(p)}</span></div>`;
    }).join("");
    await sleep(60, run);
    bars.querySelectorAll(".g-row").forEach((x) => x.classList.add("on"));
    await sleep(1300, run);
    blank.classList.add("shown");
    bars.querySelector('[data-truth="1"]').classList.add("truth");
    const p = ex.p[ex.truth];
    err.innerHTML = `<div class="${p > 40 ? "good" : "bad"}">right word got ${pct(p)}</div>`;
    await sleep(900, run);
    bars.querySelectorAll(".g-row").forEach((x) => x.classList.add("push")); key.classList.add("on");
    await sleep(1500, run);
    net.classList.add("nudge");
    await sleep(900, run);
    bars.querySelectorAll(".g-row").forEach((x, i) => {
      const w = cands[i][0];
      x.classList.remove("push");
      x.querySelector(".g-fill").style.setProperty("--w", `${width(next[w])}%`);
      x.querySelector(".g-p").textContent = pct(next[w]);
    });
    err.innerHTML += `<div class="t-after">after the nudge: ${pct(next[ex.truth])}</div>`;
    await sleep(1500, run);
  }
}

// ── the signpost ─────────────────────────────────────────────────────────────────────────────────────────────────
const PARTS = [["patient", "The case"], ["llm", "A model"], ["note", "Model + context"], ["agent", "An agent"], ["tool", "Setting one up"], ["shield", "Safety and the real world"]];
function renderRoadmap(el) {
  const a = +el.dataset.active;
  el.innerHTML = `<div class="rm-line"></div>` + PARTS.map(([ic, t], i) => `<div class="rm-stop ${i < a ? "done" : ""} ${i === a ? "now" : ""}" data-t="${300 + i * 220}"><div class="rm-dot">${icon(ic)}</div><div class="rm-t">${t}</div></div>`).join("");
}
function updateTracker(sec) {
  const part = sec?.closest("[data-part]")?.dataset.part ?? sec?.dataset.part;
  const tr = document.getElementById("tracker");
  if (part == null || sec.dataset.roadmap != null) { tr.classList.remove("show"); return; }
  tr.classList.add("show");
  tr.innerHTML = PARTS.map(([ic, t], i) => `<span class="${i == part ? "now" : i < part ? "done" : ""}">${icon(ic)}${i == part ? `<b>${t}</b>` : ""}</span>`).join("");
}

// ── per-slide runner ─────────────────────────────────────────────────────────────────────────────────────────────
let current = null;
async function play(sec) {
  if (current) { current.dead = true; current.timers.forEach(clearTimeout); }
  const run = (current = { dead: false, timers: [] });
  updateTracker(sec);
  const timed = [...sec.querySelectorAll("[data-t]")];
  for (const el of timed) {
    el.classList.remove("on");
    if (el.dataset.type != null) el.textContent = "";
    if (el.dataset.count != null) el.textContent = "0";
  }
  const start = (el) => (async () => {
    await sleep(+el.dataset.t || 0, run);
    el.classList.add("on");
    if (el.dataset.type != null) { const s = el.dataset.type; for (let i = 1; i <= s.length; i++) { el.textContent = s.slice(0, i); await sleep(+el.dataset.speed || 28, run); } }
    if (el.dataset.count != null) {
      const to = +el.dataset.count, dur = REVIEW ? 0 : +el.dataset.dur || 1400, t0 = performance.now();
      const fmt = (v) => Math.round(v).toLocaleString();
      if (!dur) el.textContent = fmt(to);
      else await new Promise((res) => { const f = (t) => { if (run.dead) return res(); const k = Math.min(1, (t - t0) / dur); el.textContent = fmt(to * (1 - Math.pow(1 - k, 3))); k < 1 ? requestAnimationFrame(f) : res(); }; requestAnimationFrame(f); });
    }
    if (el.classList.contains("gen")) await runGen(el, run);
    if (el.classList.contains("train")) await runTrain(el, run);
  })().catch(() => {});
  timed.forEach(start);
}

injectSprite();
document.querySelectorAll(".gen").forEach(renderGen);
document.querySelectorAll(".train").forEach(renderTrain);
document.querySelectorAll(".roadmap").forEach(renderRoadmap);
if (REVIEW) document.documentElement.classList.add("review");

Reveal.initialize({
  width: 1600, height: 900, margin: 0.03, center: false, hash: true, display: "flex",
  controls: true, controlsTutorial: false, progress: true, slideNumber: "c/t",
  transition: REVIEW ? "none" : "fade", transitionSpeed: "fast", backgroundTransition: "none",
  plugins: [RevealNotes],
}).then(() => play(Reveal.getCurrentSlide()));
Reveal.on("slidechanged", (e) => play(e.currentSlide));
