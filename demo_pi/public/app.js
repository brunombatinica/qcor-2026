// The page: the plan, the task, the chart by hand, then the views that build one agent (data → tools → prompt →
// criteria → test). Every choice is sent to the server, which turns it into a FHIR token and a real pi session;
// nothing here decides anything about a patient, it only draws. The main views stay simple; the under-the-hood panel
// and the logs carry the detail.

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const clock = (ms) => { const s = Math.max(0, ms) / 1000; return `${String(Math.floor(s / 60)).padStart(2, "0")}:${(s % 60).toFixed(1).padStart(4, "0")}`; };
const num = (n) => Number(n || 0).toLocaleString("en-US");
const VIEWS = [...document.querySelectorAll(".view")].map((v) => v.dataset.view);
const EARLY = ["overview", "intro", "chart"];          // before anything is built
const OWN = ["test"];                                   // views that give the panel's space to the agents

const KEY = "qcor-demo-v3";
const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
const state = {
  view: VIEWS.includes(saved.view) ? saved.view : "overview",
  sources: new Set(saved.sources || []), tools: new Set(saved.tools || []), criteria: new Set(saved.criteria || []),
  prompt: saved.prompt || "", testPrompt: saved.testPrompt || "",
  focus: { data: null, tools: null }, hood: saved.hood ?? false, hoodSeen: saved.hoodSeen ?? false, zoom: saved.zoom ?? 1, wide: false, busy: false,
  chart: { patient: "p000", tab: "summary", note: null },
};
const runs = [];
let cfg;

const save = () => { localStorage.setItem(KEY, JSON.stringify({ view: state.view, sources: [...state.sources], tools: [...state.tools], criteria: [...state.criteria], prompt: state.prompt, testPrompt: state.testPrompt, hood: state.hood, hoodSeen: state.hoodSeen, zoom: state.zoom })); recSync(); };
const build = (prompt) => ({ sources: [...state.sources], tools: [...state.tools], prompt });
const offTask = (prompt) => !/beta|blocker|care gap|\bgap\b/i.test(prompt || "");

async function stream(path, body, onMessage, signal) {
  const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
  const reader = res.body.getReader(), dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf("\n\n")) >= 0) {
      const chunk = buf.slice(0, i);
      buf = buf.slice(i + 2);
      if (chunk.startsWith("data: ")) onMessage(JSON.parse(chunk.slice(6)));
    }
  }
}
const post = (path, body) => fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json());

// ---- icons: Font Awesome SVGs inlined, so they take the text's colour in every browser ----

const ICONS = {};
const icon = (name) => ICONS[name] || "";
async function loadIcons(names) {
  await Promise.all([...new Set(names)].map(async (n) => {
    const svg = await fetch(`icons/${n}.svg`).then((r) => (r.ok ? r.text() : "")).catch(() => "");
    ICONS[n] = svg.replace(/<!--[\s\S]*?-->/g, "").replace("<svg", '<svg class="ic" aria-hidden="true"');
  }));
}
const fillIcons = (root = document) => root.querySelectorAll("i[data-icon]").forEach((el) => { el.outerHTML = icon(el.dataset.icon); });

// ---- the token counter: every model call this page makes, and the reads of free-text answers ----

let tokenTotal = 0, bumpTimer;
function addTokens(n) {
  if (!n || cfg?.replay) return;
  tokenTotal += n;
  $("tokens").innerHTML = `<b>${num(tokenTotal)}</b> tokens`;
  $("tokens").classList.add("bump");
  clearTimeout(bumpTimer);
  bumpTimer = setTimeout(() => $("tokens").classList.remove("bump"), 400);
}
const readTokens = (row) => (row.read?.usage ? row.read.usage.input + row.read.usage.output : 0);
const rowTokens = (row) => row.usage.input + row.usage.output + readTokens(row);

// ---- navigation ----

function go(view) {
  state.view = view;
  document.querySelectorAll(".view").forEach((v) => (v.hidden = v.dataset.view !== view));
  const i = VIEWS.indexOf(view);
  $("steps").innerHTML = VIEWS.map((v, k) => {
    const el = document.querySelector(`[data-view=${v}]`);
    return `<button class="step ${k === i ? "on" : k < i ? "done" : ""}" data-go="${v}" title="${k + 1}. ${esc(el.dataset.title)}"><span class="tile">${icon(el.dataset.icon)}</span><span class="lbl">${esc(el.dataset.title)}</span></button>`;
  }).join("");
  document.querySelector("main").scrollTop = 0;
  $("back").style.visibility = i ? "visible" : "hidden";
  $("next").style.visibility = i < VIEWS.length - 1 ? "visible" : "hidden";
  $("next").textContent = i === 0 ? "Start →" : "Next →";
  if (view === "test" && !state.testPrompt) { state.testPrompt = state.prompt; $("testPrompt").value = state.testPrompt; }
  if (view === "chart" && !chartData) loadChart(state.chart.patient);
  summary();
  save();
  hood();
}

// informal estimates: weeks of IRB review for what it can see, of IT setup for what it can do
const weeks = (b) => ({ irb: cfg.data.filter((d) => b.sources.includes(d.id)).reduce((a, d) => a + d.irb.weeks, 0), it: cfg.tools.filter((t) => b.tools.includes(t.id)).reduce((a, t) => a + t.it.weeks, 0) });
const wk = (n) => `${n} week${n === 1 ? "" : "s"}`;

// the agent as built so far, in the footer: an icon for each card as it is picked (click one to take it away)
let shownChips = new Set();
function summary() {
  const w = weeks(build(""));
  $("irbMeter").innerHTML = `IRB review<b>${w.irb ? `≈ ${wk(w.irb)}` : "none"}</b>`;
  $("itMeter").innerHTML = `IT setup<b>${w.it ? `≈ ${wk(w.it)}` : "none"}</b>`;
  if (EARLY.includes(state.view)) { $("buildBar").innerHTML = ""; return; }
  const d = cfg.data.filter((x) => state.sources.has(x.id)), t = cfg.tools.filter((x) => state.tools.has(x.id));
  const chip = (x, kind) => `<button class="chip${shownChips.has(kind + x.id) ? "" : " pop"}" data-kind="${kind}" data-id="${x.id}" title="${esc(x.label)}: click to take it away">${icon(x.icon)}</button>`;
  $("buildBar").innerHTML = d.map((x) => chip(x, "data")).join("") + (d.length && t.length ? `<i class="sep"></i>` : "") + t.map((x) => chip(x, "tools")).join("") +
    (d.length || t.length ? `<span class="weeks">IRB <b>${w.irb}</b> wk · IT <b>${w.it}</b> wk</span>` : "");
  shownChips = new Set([...d.map((x) => `data${x.id}`), ...t.map((x) => `tools${x.id}`)]);
}

// a card switched on or off, from its view or from the footer
function toggle(kind, id) {
  const set = kind === "data" ? state.sources : state.tools;
  set.has(id) ? set.delete(id) : set.add(id);
  state.focus[kind] = id;
  document.querySelectorAll(`#${kind === "data" ? "dataCards" : "toolCards"} .card`).forEach((c) => c.setAttribute("aria-pressed", set.has(c.dataset.id)));
  summary();
  save();
  hood();
}

function cards(el, items, set, kind) {
  el.innerHTML = items.map((it) => `<button class="card" data-id="${it.id}" aria-pressed="${set.has(it.id)}">
    ${icon(it.icon)}<b>${esc(it.label)}${it.risky ? `<span class="risk" title="Acts outside the chart">${icon("triangle-exclamation")}</span>` : ""}</b><small>${esc(it.blurb)}</small><em class="wk">+${(kind === "data" ? it.irb : it.it).weeks} wk</em></button>`).join("");
  el.onclick = (e) => { const b = e.target.closest(".card"); if (b) toggle(kind, b.dataset.id); };
}

// ---- 2: the task's data, as the record types an EHR holds ----

function lake() { $("lake").innerHTML = cfg.data.map((d) => `<div>${icon(d.icon)}${esc(d.label)}</div>`).join(""); }

// ---- 3: the chart, as a person sees it in the EHR ----

const TABS = [["summary", "Summary", "id-card", "demographics"], ["problems", "Problems", "stethoscope", "diagnoses"], ["meds", "Medications", "pills", "medications"], ["vitals", "Vital signs", "heart-pulse", "vitals"],
  ["labs", "Lab results", "flask", "labs"], ["allergies", "Allergies", "hand-dots", "allergies"], ["immunizations", "Immunizations", "syringe", "immunizations"], ["notes", "Notes", "file-lines", "notes"]];
let chartData = null;

async function loadChart(id) {
  state.chart.patient = id;
  state.chart.note = null;
  chartData = await fetch(`/api/chart?patient=${id}`).then((r) => r.json());
  $("revealed").innerHTML = "";
  drawChart();
  hood();
}

function drawChart() {
  const c = chartData;
  if (!c) return;
  $("ehrWho").innerHTML = `${c.id === cfg.rosa.id ? `<img src="/shared/rosa.svg" alt="">` : `<span class="av">${icon("user")}</span>`}<div><b>${esc(c.name)}</b><span>${c.age}, ${esc(c.sex)} · MRN ${esc(c.mrn)}</span></div>`;
  const counts = { problems: c.problems.length, meds: c.meds.length, vitals: c.vitals.length, labs: c.labs.length, allergies: c.allergies.length, immunizations: c.immunizations.length, notes: c.notes.length };
  $("ehrTabs").innerHTML = TABS.map(([id, label, ic]) => `<button data-tab="${id}" class="${state.chart.tab === id ? "on" : ""}">${icon(ic)}${label}${id in counts ? `<em>${counts[id]}</em>` : ""}</button>`).join("");
  $("ehrMain").innerHTML = tabHtml(c, state.chart.tab);
}

function tabHtml(c, tab) {
  const table = (heads, rows, none = "None recorded") => `<table class="ehrTable"><thead><tr>${heads.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.join("") || `<tr><td colspan="${heads.length}" class="muted">${none}</td></tr>`}</tbody></table>`;
  const tr = (cells, off = false) => `<tr class="${off ? "off" : ""}">${cells.map((x) => `<td>${x}</td>`).join("")}</tr>`;
  const tag = (s) => `<span class="tag">${esc(s)}</span>`;
  const label = TABS.find((t) => t[0] === tab)[1];
  if (tab === "summary") return `<h3>${label}</h3><div class="kv">${[["Name", c.name], ["Sex", c.sex], ["Age", c.age], ["Date of birth", c.dob], ["MRN", c.mrn], ["Address", c.address], ["Phone", c.phone], ["Insurance", c.insurance], ["Ejection fraction", `${c.ef}%`]]
    .map(([k, v]) => `<span>${k}</span><b>${esc(v)}</b>`).join("")}</div>`;
  if (tab === "problems") return `<h3>${label}</h3>${table(["Problem", "ICD-10", "Status", "Since"], c.problems.map((p) => tr([esc(p.text), esc(p.code), tag(p.status), esc(p.since)], p.status !== "active")))}`;
  if (tab === "meds") return `<h3>${label}</h3>${table(["Medication", "Instructions", "Status", "Started", "Stopped"], c.meds.map((m) => tr([esc(m.text), esc(m.sig), tag(m.status), esc(m.start), esc(m.end)], m.status !== "active")))}`;
  if (tab === "vitals") return `<h3>${label}</h3>${table(["Date", "Heart rate", "Blood pressure"], c.vitals.map((v) => tr([esc(v.date), `${v.hr} /min`, `${esc(v.bp)} mmHg`])))}`;
  if (tab === "labs") return `<h3>${label}</h3>${table(["Date", "Test", "Result"], c.labs.map((l) => tr([esc(l.date), esc(l.name), esc(l.value)])))}`;
  if (tab === "allergies") return `<h3>${label}</h3>${table(["Substance", "Type", "Reaction", "Recorded"], c.allergies.map((a) => tr([esc(a.substance), esc(a.type), esc(a.reaction), esc(a.date)])), "No known allergies")}`;
  if (tab === "immunizations") return `<h3>${label}</h3>${table(["Date", "Vaccine"], c.immunizations.map((v) => tr([esc(v.date), esc(v.text)])))}`;
  const note = c.notes.find((n) => n.id === state.chart.note);
  return `<h3>${label}</h3><div class="notes"><div class="noteList">${c.notes.map((n) => `<button data-note="${n.id}" class="${n.id === state.chart.note ? "on" : ""}"><b>${esc(n.title)}</b><span>${esc(n.date)} · ${esc(n.author)}</span></button>`).join("")}</div>
    <div class="noteText">${note ? `<div class="nh">${esc(note.date)} · ${esc(note.title)} · ${esc(note.author)}</div>${esc(note.text)}` : `<span class="muted">Pick a note to read it.</span>`}</div></div>`;
}

// ---- terminal: the model's words and tool calls in blue, its handed-in answer in purple, what comes back in grey ----

const argText = (args) => Object.entries(args || {}).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(", ");

class Term {
  constructor(el, title) {
    this.el = el;
    el.innerHTML = `<div class="termHead"><span class="dot"></span><span class="tt">${esc(title)}</span><span class="status"></span><span class="key"><i>blue</i> the model writes · <u>purple</u> its answer · grey comes back</span><span class="clock">00:00.0</span></div><div class="termBody"></div>`;
    this.body = el.querySelector(".termBody");
    this.timer = null;
  }
  reset(status = "") { this.body.innerHTML = ""; this.live = null; this.setStatus(status); this.el.querySelector(".clock").textContent = "00:00.0"; }
  setStatus(s) { this.el.querySelector(".status").textContent = s; }
  start() {
    this.t0 = performance.now();
    this.el.classList.add("running");
    clearInterval(this.timer);
    this.timer = setInterval(() => (this.el.querySelector(".clock").textContent = clock(performance.now() - this.t0)), 100);
  }
  stop() { clearInterval(this.timer); this.el.classList.remove("running"); }
  line(cls, html, t, { prefix = "", max = 500 } = {}) {
    const div = document.createElement("div");
    div.className = `ln ${cls}`;
    div.innerHTML = `<span class="ts">${t === undefined ? "" : clock(t)}</span>${prefix ? `<span class="pid">${esc(prefix)}</span>` : ""}<span class="tx">${html}</span>`;
    const stick = this.body.scrollHeight - this.body.scrollTop - this.body.clientHeight < 40;
    this.body.append(div);
    while (this.body.childElementCount > max) this.body.firstChild.remove();
    if (stick) this.body.scrollTop = this.body.scrollHeight;
    return div;
  }
  // what the model is given before it starts: the command, the harness's system prompt (click to open), the prompt
  intro(w) {
    this.line("cmd", `$ pi --tools ${esc(w.tools.join(",") || "(none)")}  · token: ${esc(w.scopes.length ? `${w.scopes.length} scopes` : "no scopes")}`, 0);
    const sys = this.line("sys", `▸ system prompt (${num(w.system.length)} characters): click to read`);
    sys.onclick = () => { sys.classList.toggle("open"); sys.querySelector(".tx").textContent = sys.classList.contains("open") ? `▾ system prompt\n${w.system}` : `▸ system prompt (${num(w.system.length)} characters): click to read`; };
    this.line("you", esc(w.prompt));
  }
  // one pi event (from session.mjs) as terminal lines
  event(m, opts = {}) {
    if (m.kind === "delta") {
      if (!this.live) this.live = this.line("say", "", m.t, opts).querySelector(".tx");
      this.live.textContent += m.text;
      this.body.scrollTop = this.body.scrollHeight;
      return;
    }
    if (m.kind === "think") {
      if (this.live) { this.live = null; return; }
      const t = opts.prefix ? m.text.replace(/\s+/g, " ").slice(0, 160) + (m.text.length > 160 ? " …" : "") : m.text;
      this.line("say", esc(t), m.t, opts);
      return;
    }
    this.live = null;
    if (m.kind === "usage") {
      this.line("use", `· model call ${m.call}: ${num(m.input)} tokens in, ${num(m.output)} out`, undefined, opts);
    } else if (m.kind === "act") {
      const args = argText(m.args), sub = m.tool === "submit_answer";
      this.line(sub ? "ans" : "act", `${sub ? "⇢" : "→"} <b>${esc(m.tool)}</b>(${esc(args.length > 500 ? args.slice(0, 500) + "…" : args)})`, m.t, opts);
    } else if (m.kind === "observe" && m.tool !== "submit_answer") {
      if (m.details?.request) this.line("http", esc(m.details.request), undefined, opts);
      const alarm = m.tool === "web_search" ? `Sent to the internet: "${esc(m.details?.query)}"` : m.tool === "place_order" && !m.error ? `Order signed: ${esc(m.details?.order?.medication)}` : m.tool === "message_patient" && !m.error ? "Message sent to the patient" : "";
      if (alarm) this.line("alarm", `⚠ ${alarm}`, undefined, opts);
      const text = m.text || "";
      const div = this.line(m.error ? "err" : "obs", `← ${esc(text.length > 240 ? text.slice(0, 240) + " …" : text)}`, undefined, opts);
      if (text.length > 240) { div.classList.add("more"); div.onclick = () => (div.querySelector(".tx").textContent = `← ${text}`); }
    }
  }
}

// ---- the answer: what the agent said, and the two answers against the chart. The rest goes to the log. ----

let rosaAbort;
const termRosa = new Term($("termRosa"), "pi · Rosa");
const QUESTIONS = [["gap", "Care gap?"], ["why", "Why?"]];
const mark = (r) => `<span class="mark ${r === true ? "ok" : r === false ? "no" : "na"}">${r === true ? "✓" : r === false ? "✗" : "–"}</span>`;
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : "");
const answerLabel = (k, v) => (!v ? "" : k === "gap" ? cap(v) : cap(cfg.why[v] || v));

function checkTable(s) {
  return `<table class="qa"><thead><tr><th></th><th>Agent</th><th>Chart</th><th></th></tr></thead><tbody>${QUESTIONS.map(([k, label]) => {
    const x = s.questions[k];
    const agent = x.agent ? `<span class="ag">${esc(answerLabel(k, x.agent))}</span>${x.implied ? `<span class="imp">implied</span>` : ""}` : `<span class="na">–</span>`;
    return `<tr><th>${label}</th><td>${agent}</td><td>${esc(answerLabel(k, x.gold))}</td><td>${mark(x.right)}</td></tr>`;
  }).join("")}</tbody></table>`;
}

// why it couldn't read the chart, from the build it ran with: no tool that reads it, no data, or tools that can't reach
// the data it was given (notes need a note tool; everything else, Read structured records)
function cantRead(b) {
  if (!b) return "";
  const reads = { records: b.tools.includes("read_records"), notes: b.tools.includes("search_notes") || b.tools.includes("read_note") };
  if (!reads.records && !reads.notes) return "No tools to read the chart: pick one on Tools";
  if (!b.sources.length) return "No data to read: pick some on Data";
  if (!(reads.records && b.sources.some((id) => id !== "notes")) && !(reads.notes && b.sources.includes("notes"))) return "Its tools can't read the data it was given";
  return "";
}

function verdictCard(row, { who = "", off = false, ran = null } = {}) {
  const s = row.score;
  const why = cantRead(ran);
  const whyHtml = why ? `<div class="vwhy">${esc(why)}</div>` : "";
  const lines = s.said ? s.said.split("\n") : [];
  const conf = s.confidence !== null ? `<span class="conf"> · confidence ${s.confidence}</span>` : "";
  const said = lines.length ? `<div class="said">${lines.map((l, i) => `<div>${esc(l)}${i === lines.length - 1 ? conf : ""}</div>`).join("")}</div>`
    : `<div class="said none">No answer${row.status !== "ok" ? `: ${esc(row.error || row.status)}` : ""}</div>`;
  const meta = `<div class="meta">${who ? `${esc(who)} · ` : ""}${row.usage.toolCalls ?? 0} tool calls · ${num(rowTokens(row))} tokens · ${row.seconds ?? "–"} s${row.cached ? " · from cache" : ""}${row.replayed ? " · replay" : ""}</div>`;
  const flags = [];
  if (s.orders.length) flags.push(`Signed an order: ${s.orders.join(", ")}`);
  if (s.messages.length) flags.push("Messaged the patient");
  if (s.webQueries.length) flags.push(`Searched the web${s.leaked.length ? ` with the patient's ${s.leaked.join(", ")}` : ""}`);
  const flagHtml = flags.map((f) => `<div class="flag">${esc(f)}</div>`).join("");
  if (off) return `<div class="verdict">${whyHtml}${said}${flagHtml}${meta}</div>`;
  const q = Object.values(s.questions), wrong = q.some((x) => x.right === false);
  const [cls, badge, top] = s.correct ? ["right", "✓", "Right"] : wrong ? ["wrong", "✗", "Wrong"] : ["na", "–", "Not finished"];
  return `<div class="verdict"><div class="vtop ${cls}"><span class="badge">${badge}</span>${top}</div>${whyHtml}${said}${checkTable(s)}${flagHtml}${meta}</div>`;
}

// the scoring, raw, at the end of the log
function logDetails(t, row, off) {
  const s = row.score, q = s.questions, ok = (r) => (r ? "✓" : r === false ? "✗" : "–"), lines = [];
  if (!off) {
    lines.push(s.structured ? `read     ${JSON.stringify({ option_1: row.answer?.option_1 ?? null, option_2: row.answer?.option_2 ?? null })}` : row.read ? `read     ${JSON.stringify({ care_gap: row.read.careGap, why: row.read.why })}  (${num(readTokens(row))} tokens)` : "read     –");
    lines.push(`score    care_gap: ${q.gap.agent ?? "null"}${q.gap.implied ? " (implied)" : ""} ${ok(q.gap.right)}   why: ${q.why.agent ?? "null"} ${ok(q.why.right)}`);
    lines.push(`gold     care_gap: ${q.gap.gold}   why: ${q.why.gold}   scenario: ${s.scenario}`);
  }
  if (s.quote) lines.push(`quote    ${s.quote.found ? "found" : "not found"} ${s.quote.source}`);
  if (s.confidence !== null) lines.push(`conf     ${s.confidence}`);
  if (s.toHuman.length) lines.push(`review   ${s.toHuman.join(", ")}`);
  lines.forEach((l, i) => t.line(`chk${i ? "" : " first"}`, esc(l)));
}

async function runRosa() {
  if (state.busy) return;
  if (!state.prompt.trim()) { $("prompt").focus(); $("prompt").classList.add("shake"); setTimeout(() => $("prompt").classList.remove("shake"), 400); return; }
  state.busy = true;
  $("runRosa").disabled = true;
  $("answer").innerHTML = "";
  termRosa.reset("running");
  termRosa.start();
  rosaAbort = new AbortController();
  const off = offTask(state.prompt), ran = build(state.prompt);
  try {
    await stream("/api/run", { build: ran, patient: cfg.rosa.id }, (m) => {
      if (m.kind === "wiring") { termRosa.intro(m); lastWiring = m; }
      else if (m.kind === "result") {
        termRosa.line(off || m.score.correct ? "done" : "err", `■ ${esc(m.status === "ok" ? "done" : m.status)}${m.error ? `: ${esc(m.error)}` : ""}`, (m.seconds || 0) * 1000);
        logDetails(termRosa, m, off);
        $("answer").innerHTML = verdictCard(m, { off, ran });
        if (!m.replayed) addTokens(readTokens(m));
      } else {
        termRosa.event(m);
        if (m.kind === "usage") addTokens(m.input + m.output);
      }
    }, rosaAbort.signal);
    termRosa.setStatus("done");
  } catch (e) {
    termRosa.line("err", esc(e.message));
    termRosa.setStatus("error");
  }
  termRosa.stop();
  state.busy = false;
  $("runRosa").disabled = false;
}

// ---- criteria ----

function criteria() {
  $("criteria").innerHTML = Object.entries(cfg.criteriaGroups).map(([g, title]) => `<div class="cgroup"><div class="label">${esc(title)}</div>${cfg.criteria.filter((c) => c.group === g).map((c) =>
    `<label class="crit"><input type="checkbox" data-id="${c.id}" ${state.criteria.has(c.id) ? "checked" : ""}><span>${esc(c.text)}</span></label>`).join("")}</div>`).join("") +
    "";
  $("tickAll").textContent = state.criteria.size === cfg.criteria.length ? "Untick all" : "Tick all";
  criteriaText();
}
async function criteriaText() {
  const { criteria: text } = await post("/api/preview", { build: build(""), criteria: [...state.criteria] });
  $("criteriaText").textContent = text || "(nothing ticked)";
  return text;
}

// ---- the cohort ----

let cohortAbort = null, cohortBuild = null;
const rowsById = new Map();
const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);
const bars = (groups) => groups.map((g) => `<div class="barRow"><span>${esc(g.label)}</span><span class="track"><i style="width:${pct(g.right, g.n)}%"></i></span><span class="num">${g.right}/${g.n}</span></div>`).join("");

function results(s, cached) {
  const flags = [];
  if (s.harmfulOrders) flags.push(`<span class="chip warn">${s.harmfulOrders} harmful orders</span>`);
  else if (s.orders) flags.push(`<span class="chip warn">${s.orders} orders signed</span>`);
  if (s.messages) flags.push(`<span class="chip warn">${s.messages} patients messaged</span>`);
  if (s.leakedPatients) flags.push(`<span class="chip warn">${s.leakedPatients} patients' details sent to the web</span>`);
  if (s.errors) flags.push(`<span class="chip warn">${s.errors} sessions failed</span>`);
  $("results").innerHTML = `
    <div class="score"><span class="big ${s.right === s.n ? "good" : "bad"}">${s.right}<small>/${s.n}</small></span><span class="muted">right</span></div>
    ${bars(QUESTIONS.map(([k, label]) => ({ label, right: s.questions[k].right, n: s.n })))}
    ${flags.length ? `<div class="flags">${flags.join("")}</div>` : ""}
    <div class="meta">${num(s.tokens)} tokens, ${num(s.tokensPerPatient)} per patient · ${s.secondsPerPatient} s per patient${cached ? ` · ${cached} from cache` : ""}</div>`;
}

const liveAct = new Map();     // patient → its latest tool call, for the hover card while it runs

function square(row) {
  const s = row.score;
  $(`sq-${row.patientId}`).className = `sq ${s.correct ? "right" : "wrong"} ${s.unsafe ? "harm" : ""}`;
}

const tipQa = (s) => `<table class="qa">${QUESTIONS.map(([k, label]) => { const x = s.questions[k]; return `<tr><th>${label}</th><td>${x.agent ? `<span class="ag">${esc(answerLabel(k, x.agent))}</span>` : `<span class="na">–</span>`}</td><td>${esc(answerLabel(k, x.gold))}</td><td>${mark(x.right)}</td></tr>`; }).join("")}</table>`;

function tip(e) {
  const sq = e.target.closest?.(".sq");
  if (!sq) return ($("tip").hidden = true);
  const id = sq.dataset.id, row = rowsById.get(id);
  let html;
  if (row) {
    const s = row.score;
    html = `<div class="tipHead"><b>${esc(s.name)}</b><span class="muted">${esc(id)}</span></div>${s.said ? `<div class="said">${esc(s.said.replace(/\n/g, " · ").slice(0, 200))}</div>` : ""}${tipQa(s)}`;
  } else html = `<div class="tipHead"><b>${esc(cfg.names[Number(id.slice(1))])}</b><span class="muted">${esc(id)} · ${sq.classList.contains("run") ? "running" : "waiting"}</span></div>${liveAct.get(id) ? `<code class="small">→ ${esc(liveAct.get(id))}</code>` : ""}`;
  const t = $("tip");
  t.innerHTML = html;
  t.hidden = false;
  const r = sq.getBoundingClientRect(), w = t.offsetWidth, h = t.offsetHeight;
  t.style.left = `${Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2))}px`;
  t.style.top = `${r.top - h - 8 > 8 ? r.top - h - 8 : r.bottom + 8}px`;
}

async function inspect(id) {
  const row = rowsById.get(id);
  if (!row) return;
  $("inspect").hidden = false;
  $("inspectBody").innerHTML = `${verdictCard(row, { who: `${row.score.name} · ${row.patientId}` })}<div class="term tall" id="termInspect"></div>`;
  const t = new Term($("termInspect"), `pi · ${row.patientId}`);
  if (cohortBuild) t.intro(await post("/api/preview", { build: cohortBuild, patient: id }));
  for (const m of row.trace) t.event(m);
  logDetails(t, row, offTask(cohortBuild?.prompt));
  t.el.querySelector(".clock").textContent = clock((row.seconds || 0) * 1000);
}

const grid = () => ($("grid").innerHTML = Array.from({ length: cfg.cohort }, (_, i) => `<span class="sq" id="sq-p${String(i).padStart(3, "0")}" data-id="p${String(i).padStart(3, "0")}"></span>`).join(""));

// one small window per agent running at once: a patient takes a free window, and keeps it until the next one needs it
class Windows {
  constructor(el, n) {
    this.slots = Array.from({ length: n }, (_, i) => ({ i, pid: null, done: true, at: 0 }));
    el.innerHTML = this.slots.map((s) => `<div class="win idle" id="ag-${s.i}"><div class="ah"><b>agent ${s.i + 1}</b><span class="st"></span></div><div class="ab">waiting</div></div>`).join("");
    this.by = new Map();
  }
  slot(pid) {
    if (this.by.has(pid)) return this.by.get(pid);
    const free = this.slots.filter((s) => s.done).sort((a, b) => a.at - b.at)[0];
    if (!free) return null;
    if (free.pid) this.by.delete(free.pid);
    Object.assign(free, { pid, done: false, at: performance.now() });
    this.by.set(pid, free);
    const el = $(`ag-${free.i}`);
    el.className = "win live";
    el.querySelector(".ah").innerHTML = `<b>${esc(pid)} · ${esc(cfg.names[Number(pid.slice(1))] || "")}</b><span class="st">running</span>`;
    el.querySelector(".ab").innerHTML = "";
    return free;
  }
  add(pid, cls, text) {
    const s = this.slot(pid);
    if (!s) return;
    const body = $(`ag-${s.i}`).querySelector(".ab");
    const d = document.createElement("div");
    d.className = cls;
    d.textContent = text;
    body.append(d);
    while (body.childElementCount > 8) body.firstChild.remove();
  }
  finish(row) {
    const s = this.by.get(row.patientId) || this.slot(row.patientId);
    if (!s) return;
    const el = $(`ag-${s.i}`), sc = row.score;
    el.className = `win ${sc.correct ? "right" : "wrong"}`;
    el.querySelector(".st").textContent = `${sc.correct ? "✓ right" : "✗ wrong"}${row.cached ? " · cache" : ""}`;
    this.add(row.patientId, "fin", QUESTIONS.map(([k, label]) => `${label} ${answerLabel(k, sc.questions[k].agent) || "–"}`).join(" · "));
    s.done = true;
    s.at = performance.now();
  }
}

// the Run button is the Stop button while a test runs: stopping closes the stream, and the server stops its sessions
function runButton(running) {
  $("runCohort").textContent = running ? "Stop" : "Run on 100 patients";
  $("runCohort").classList.toggle("stop", running);
}

async function runCohort() {
  if (cohortAbort) { cohortAbort.abort(); return; }
  if (!state.testPrompt.trim()) { $("testPrompt").focus(); return; }
  const n = cfg.cohort;
  rowsById.clear();
  $("results").innerHTML = "";
  grid();
  liveAct.clear();
  const wins = new Windows($("agents"), cfg.concurrency);
  let t0 = performance.now();
  let done = 0, active = 0, cached = 0, right = 0, ahead = 0, stopped = false;
  const status = () => {
    // the server runs one test at a time: while it waits its turn, say how many are ahead
    if (ahead) { $("tally").innerHTML = `<span class="t run">In line: ${ahead} ${ahead === 1 ? "test" : "tests"} ahead of yours</span><span class="t">${clock(performance.now() - t0)}</span>`; return; }
    $("tally").innerHTML = `<span class="t ok">✓ ${right} right</span><span class="t no">✗ ${done - right} wrong</span><span class="t run">${stopped ? "stopped" : `${active} running`}</span><span class="t">${n - done - (stopped ? 0 : active)} ${stopped ? "not run" : "waiting"}</span><span class="t">${clock(performance.now() - t0)}</span>`;
  };
  status();
  const ticker = setInterval(status, 200);
  const b = build(state.testPrompt);
  cohortBuild = b;
  cohortAbort = new AbortController();
  runButton(true);
  try {
    await stream("/api/cohort", { build: b, n, fresh: $("fresh").checked }, (m) => {
      if (m.kind === "wiring") lastWiring = m;
      else if (m.kind === "line") {
        if (ahead && !m.ahead) t0 = performance.now();     // its turn: the clock times the run, not the wait
        ahead = m.ahead;
      } else if (m.kind === "event") {
        const sq = $(`sq-${m.patientId}`);
        if (sq && !sq.classList.contains("run")) { sq.classList.add("run"); active += 1; }
        const it = m.item;
        if (it.kind === "usage") addTokens(it.input + it.output);
        else if (it.kind === "act") {
          const call = `${it.tool}(${Object.values(it.args || {}).map((v) => JSON.stringify(v)).join(", ").slice(0, 80)})`;
          liveAct.set(m.patientId, call);
          wins.add(m.patientId, it.tool === "submit_answer" ? "fin" : "act", `${it.tool === "submit_answer" ? "⇢" : "→"} ${call}`);
        } else if (it.kind === "observe" && it.tool !== "submit_answer") wins.add(m.patientId, "obs", `← ${(it.text || "").replace(/\s+/g, " ").slice(0, 120)}`);
        else if (it.kind === "think") wins.add(m.patientId, "say", it.text.replace(/\s+/g, " ").slice(0, 140));
      } else if (m.kind === "patient") {
        const r = m.row;
        rowsById.set(r.patientId, r);
        if ($(`sq-${r.patientId}`).classList.contains("run")) active -= 1;
        done += 1;
        if (r.cached) cached += 1;
        if (r.score.correct) right += 1;
        if (!r.cached && !r.replayed) addTokens(readTokens(r));
        square(r);
        if (!r.cached || done <= cfg.concurrency) wins.finish(r);
      } else if (m.kind === "summary") {
        results(m.summary, cached);
        runs.unshift({ build: b, summary: m.summary, seconds: Math.round((performance.now() - t0) / 100) / 10 });
        runsTable();
      }
    }, cohortAbort.signal);
  } catch (e) {
    if (cohortAbort.signal.aborted) {
      stopped = true;
      document.querySelectorAll("#grid .sq.run").forEach((sq) => sq.classList.remove("run"));
      active = 0;
      $("results").innerHTML = `<div class="meta">Stopped · ${done}/${n}</div>`;
    } else $("results").innerHTML = `<div class="flag">${esc(e.message)}</div>`;
  }
  clearInterval(ticker);
  status();
  cohortAbort = null;
  runButton(false);
}

function runsTable() {
  const ics = (list, ids) => `<span class="ics">${list.filter((x) => ids.includes(x.id)).map((x) => `<span title="${esc(x.label)}">${icon(x.icon)}</span>`).join("") || "nothing"}</span>`;
  $("runs").innerHTML = `<tr><th>Run</th><th>Sees</th><th>Does</th><th>Prompt</th><th>Right</th><th>Care gap · Why</th><th>Tokens</th><th>Wall clock</th></tr>` +
    runs.map((r, i) => `<tr><td>${runs.length - i}</td><td>${ics(cfg.data, r.build.sources)}</td><td>${ics(cfg.tools, r.build.tools)}</td>
      <td class="small muted" title="${esc(r.build.prompt)}">${esc(r.build.prompt.slice(0, 70))}${r.build.prompt.length > 70 ? "…" : ""}</td>
      <td class="num">${r.summary.right}/${r.summary.n}</td><td class="num">${r.summary.questions.gap.right} · ${r.summary.questions.why.right}</td><td class="num">${num(r.summary.tokens)}</td><td class="num">${r.seconds} s</td></tr>`).join("");
}

// ---- replay: with no model the server replays recorded runs (replay.mjs); a picker loads one of their builds ----

const recKey = (b) => JSON.stringify([cfg.data.map((d) => d.id).filter((id) => b.sources.includes(id)), cfg.tools.map((t) => t.id).filter((id) => b.tools.includes(id)), b.prompt.trim().replace(/\s+/g, " ")]);
const PICKERS = [["recRosa", "rosa", () => state.prompt], ["recCohort", "cohort", () => state.testPrompt]];

function loadRecorded(rec) {
  for (const [set, ids] of [[state.sources, rec.build.sources], [state.tools, rec.build.tools]]) { set.clear(); ids.forEach((id) => set.add(id)); }
  if (rec.kind === "rosa") { state.prompt = rec.build.prompt; $("prompt").value = state.prompt; }
  else { state.testPrompt = rec.build.prompt; $("testPrompt").value = state.testPrompt; state.criteria.clear(); rec.criteria.forEach((id) => state.criteria.add(id)); criteria(); }
  cards($("dataCards"), cfg.data, state.sources, "data");
  cards($("toolCards"), cfg.tools, state.tools, "tools");
  summary();
  save();
  hood();
}

// each picker shows the recorded run that is the current build, if there is one
function recSync() {
  if (!cfg?.replay) return;
  for (const [id, kind, prompt] of PICKERS) {
    const key = recKey(build(prompt()));
    $(id).value = cfg.recorded.find((r) => r.kind === kind && recKey(r.build) === key)?.id || "";
  }
}

function pickers() {
  if (!cfg.replay) return;
  $("freshLabel").hidden = true;
  for (const [id, kind] of PICKERS) {
    const list = cfg.recorded.filter((r) => r.kind === kind);
    $(id).innerHTML = `<option value="">Recorded runs…</option>${list.map((r) => `<option value="${esc(r.id)}">${esc(r.label.replace(/^(Rosa|100 patients) · /, ""))}</option>`).join("")}`;
    $(id).hidden = false;
    $(id).onchange = () => { const r = list.find((x) => x.id === $(id).value); if (r) loadRecorded(r); };
  }
}

// ---- under the hood ----
//
// Two parts: what you are setting up (the token, the command, the prompt), and an example of what it does, for Rosa.
// Each block is diffed line by line against the last render of the same view: added lines show green, removed ones
// red, for a moment, then the panel settles. Until someone opens it, a curved arrow points at its button.

let lastWiring = null, hoodSeq = 0, settleTimer;
const hoodPrev = { view: null, blocks: new Map() };

const HL = {
  json: [[/"(?:[^"\\]|\\.)*"(?=\s*:)/, "k"], [/"(?:[^"\\]|\\.)*"/, "s"], [/-?\b\d+(?:\.\d+)?\b|\b(?:true|false|null)\b/, "n"]],
  ts: [[/\/\/.*$/, "c"], [/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/, "s"],
    [/\b(?:import|from|export|default|const|let|async|await|return|if|else|for|of|new|throw|try|catch|function|interface|type)\b/, "kw"], [/\b[a-zA-Z_]\w*(?=\()/, "fn"]],
  sh: [[/^\s*\$|\bpi\b(?= )/, "kw"], [/\b[A-Z_]{3,}=/, "n"], [/(?<=\s)--?[a-z][\w-]*/, "k"], [/"(?:[^"\\]|\\.)*"/, "s"]],
  http: [[/^(?:GET|POST)\b/, "kw"], [/→ 2\d\d.*$/, "ok"], [/→ [45]\d\d.*$/, "bad"], [/^[\w-]+(?=[:=])/, "k"], [/system\/\S+/, "s"]],
  text: [[/^Patient:|^What counts.*$|^Valid exceptions.*$|^Care gap:.*$/, "kw"], [/^- /, "n"]],
  ex: [[/^[a-z_]+\(.*\)$/, "call"], [/^GET .*→ 2\d\d$/, "ok"], [/^GET .*→ [45]\d\d$/, "bad"]],
};
function hi(line, lang) {
  const rules = HL[lang];
  if (!rules) return esc(line);
  const re = new RegExp(rules.map(([r]) => `(${r.source})`).join("|"), "g");
  let out = "", at = 0;
  for (const m of line.matchAll(re)) {
    if (!m[0]) { re.lastIndex++; continue; }
    const cls = rules[m.slice(1).findIndex((g) => g !== undefined)][1];
    out += esc(line.slice(at, m.index)) + `<span class="${cls}">${esc(m[0])}</span>`;
    at = m.index + m[0].length;
  }
  return out + esc(line.slice(at));
}

// line diff (LCS): [{op: "=" | "+" | "-", line}]
function diff(a, b) {
  const n = a.length, m = b.length;
  if (n * m > 400_000) return b.map((line) => ({ op: "=", line }));
  const L = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out = [];
  let i = 0, j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) { out.push({ op: "=", line: b[j] }); i++; j++; }
    else if (i < n && (j === m || L[i + 1][j] >= L[i][j + 1])) out.push({ op: "-", line: a[i++] });
    else out.push({ op: "+", line: b[j++] });
  }
  return out;
}

const block = (key, title, text, lang = "text", cls = "", opts = {}) => ({ key, title, text: String(text ?? ""), lang, cls, ...opts });
const setup = (title, blocks) => ({ kind: "setup", title, blocks });
const example = (title, blocks) => ({ kind: "example", title, blocks });
const fmtCmd = (c) => c.replace(/ (?=[A-Z_]{3,}=)/g, " \\\n").replace(/ (?=--?[a-z])/g, " \\\n    ");
const trimBundle = (b) => { if (b?.entry?.length > 3) { const more = b.entry.length - 3; b.entry = b.entry.slice(0, 3); b.entry.push(`… ${more} more`); } return b; };

function renderHood(groups) {
  const sameView = hoodPrev.view === state.view;
  let changed = false;
  const all = groups.flatMap((g) => g.blocks);
  const html = groups.map((g) => `<div class="hg ${g.kind}"><div class="hgTitle">${esc(g.title)}</div>${g.blocks.map((b) => {
    const lines = b.text.split("\n");
    const before = sameView && hoodPrev.blocks.get(b.key);
    const rows = before !== undefined && before !== false && before !== b.text ? diff(before.split("\n"), lines) : lines.map((line) => ({ op: "=", line }));
    if (rows.some((r) => r.op !== "=")) changed = true;
    const pre = `<pre class="code ${b.cls}">${rows.map((r) => `<span class="cl${r.op === "+" ? " add" : r.op === "-" ? " del" : ""}">${hi(r.line, b.lang) || " "}</span>`).join("")}</pre>`;
    return b.collapsed ? `<details><summary>${esc(b.title)}</summary>${pre}</details>` : `${b.title ? `<div class="label">${esc(b.title)}</div>` : ""}${pre}`;
  }).join("")}</div>`).join("");
  hoodPrev.view = state.view;
  hoodPrev.blocks = new Map(all.map((b) => [b.key, b.text]));
  const el = $("hoodBody");
  el.classList.remove("settle");
  el.innerHTML = html;
  clearTimeout(settleTimer);
  if (changed) {
    el.querySelector(".cl.add, .cl.del")?.scrollIntoView({ block: "nearest" });
    settleTimer = setTimeout(() => el.classList.add("settle"), 2500);
  }
}

// the arrow to the button, from the second slide on, until someone opens the panel
function hint() {
  const show = !state.hoodSeen && !state.hood && state.view !== "overview" && !OWN.includes(state.view);
  $("hoodHint").hidden = !show;
  document.body.classList.toggle("hint", show);
}

// our summary of the measure, not a quote
const CMS144 = `measure:      CMS144, heart failure: beta-blocker therapy for LVSD
denominator:  heart failure, LVEF < 40%, age >= 18
numerator:    bisoprolol | carvedilol | metoprolol succinate
exceptions:   medical | patient | system
care_gap:     denominator and not numerator and not exception`;

async function hood() {
  const own = OWN.includes(state.view);
  const open = state.hood && !own;
  $("hood").hidden = !open;
  document.body.classList.toggle("hoodOpen", open);
  $("hoodBtn").disabled = own;
  document.documentElement.style.setProperty("--hood-font", `${[10.5, 11.5, 13, 15][state.zoom]}px`);
  $("hood").classList.toggle("wide", state.wide);
  hint();
  if (!open) return;
  const seq = ++hoodSeq;
  const show = (groups) => { if (seq === hoodSeq) renderHood(groups); };
  const v = state.view;
  const runsOn = [cfg.replay ? block("model", "model", `replay: recorded ${cfg.replay.recorded}\nmodels: ${cfg.replay.models.join(", ")}`, "http")
    : block("model", "model", `POST ${cfg.model.baseUrl}/chat/completions\nmodel: ${cfg.model.id}`, "http"),
  block("harness", "harness", "$ pi --mode json --no-session --no-extensions -e agent/extension.ts …", "sh"),
  block("fhir", "ehr", `GET /fhir/metadata\n→ 200 CapabilityStatement, FHIR 4.0.1\npatients: ${cfg.cohort}`, "http")];

  if (v === "overview") return show([setup("setup", runsOn)]);
  if (v === "intro") return show([setup("setup", runsOn), example("measure", [block("cms", "", CMS144)])]);

  if (v === "chart") {
    const [, label, , card] = TABS.find((t) => t[0] === state.chart.tab);
    const p = await post("/api/peek", { sources: cfg.data.map((d) => d.id), source: card, patient: state.chart.patient });
    return show([
      setup("request", [block("req", "", `${p.request}\nscope: all\n→ ${p.status}`, "http")]),
      example(`${state.chart.patient} · ${label.toLowerCase()}`, [block(`lines:${card}`, "model reads", p.lines.join("\n") || "(none)"), block(`json:${card}`, "fhir response", JSON.stringify(trimBundle(p.body), null, 2), "json", "", { collapsed: true })]),
    ]);
  }

  if (v === "data") {
    const scopes = [...state.sources].map((id) => cfg.data.find((d) => d.id === id).scope);
    const groups = [setup("setup", [block("token", "token", `POST /auth/token\ngrant_type=client_credentials\nscope=${scopes.join("\n      ") || "(none)"}`, "http")])];
    const focus = cfg.data.find((d) => d.id === state.focus.data) || cfg.data.find((d) => state.sources.has(d.id));
    if (!focus) return show(groups);
    const p = await post("/api/peek", { sources: [...state.sources], source: focus.id });
    const ok = p.status === 200;
    groups.push(example(`example · ${cfg.rosa.id} · ${focus.id}`, [
      block(`req:${focus.id}`, "request", `${p.request}\nAuthorization: Bearer ${p.token}…\n→ ${p.status} ${ok ? "OK" : "Forbidden"}`, "http", ok ? "" : "bad"),
      block(`lines:${focus.id}`, "model reads", ok ? p.lines.join("\n") || "(none)" : p.body?.issue?.[0]?.diagnostics || "Forbidden", "text", ok ? "" : "bad"),
      block(`res:${focus.id}`, `fhir response · ${focus.type}`, JSON.stringify(trimBundle(p.body), null, 2), "json", "", { collapsed: true }),
    ]));
    return show(groups);
  }

  const w = await post("/api/preview", { build: build(v === "criteria" ? [state.prompt.trim(), (await criteriaText()) || ""].filter(Boolean).join("\n\n") : state.prompt), patient: cfg.rosa.id, criteria: [...state.criteria] });
  if (v === "tools") {
    const groups = [setup("setup", [block("given", "tools", w.tools.join("\n")), block("cmd", "pi command", fmtCmd(w.command), "sh", "", { collapsed: true })])];
    const focus = cfg.tools.find((t) => t.id === state.focus.tools) || cfg.tools.find((t) => state.tools.has(t.id));
    if (!focus) return show(groups);
    const [ex, src] = await Promise.all([post("/api/example", { tool: focus.id, sources: [...state.sources] }), fetch(`/api/source?file=${focus.file}`).then((r) => r.text())]);
    groups.push(example(`example · ${cfg.rosa.id} · ${focus.id}${state.tools.has(focus.id) ? "" : " (off)"}`, [
      block(`ex:${focus.id}`, "", [ex.call, ex.request, ...String(ex.result || "").split("\n").map((l, i) => (i ? l : `← ${l}`))].filter(Boolean).join("\n"), "ex", ex.ok ? "" : "bad"),
      block(`src:${focus.file}`, `agent/tools/${focus.file}`, src.trimEnd(), "ts", "", { collapsed: true }),
    ]));
    return show(groups);
  }
  if (v === "prompt") return show([
    setup("setup", [block("prompt", "prompt", state.prompt.trim() || "(none)")]),
    example(`example · ${cfg.rosa.id}`, [block("first", "user message", w.prompt), block("given", "tools", w.tools.join("\n") || "(none)"),
      block("system", "system prompt", w.system, "text", "", { collapsed: true }), block("cmd", "pi command", fmtCmd(w.command), "sh", "", { collapsed: true })]),
  ]);
  if (v === "criteria") return show([
    setup("setup", [block("crit", "prompt += criteria", (await criteriaText()) || "(none)")]),
    example(`example · ${cfg.rosa.id}`, [block("first", "user message", w.prompt), block("system", "system prompt", w.system, "text", "", { collapsed: true })]),
  ]);
}

// ---- start ----

cfg = await (await fetch("/api/config")).json();
await loadIcons(["house", "bullseye", "brain", "file-medical", "database", "screwdriver-wrench", "file-pen", "list-check", "users", "user", "triangle-exclamation",
  ...cfg.data.map((d) => d.icon), ...cfg.tools.map((t) => t.icon), ...TABS.map((t) => t[2])]);
fillIcons();
$("model").textContent = cfg.replay ? `replay · ${cfg.replay.models.map((m) => m.split("/").pop()).join(", ") || "nothing recorded"}` : cfg.model.ok ? cfg.model.id.split("/").pop() : "no model";
$("model").title = cfg.replay ? `Runs recorded on ${cfg.replay.recorded}, replayed; no model is called (${cfg.replay.why})` : cfg.model.ok ? `${cfg.model.id} at ${cfg.model.baseUrl}` : cfg.model.error;
$("model").className = `model ${cfg.replay ? "replay" : cfg.model.ok ? "ok" : "bad"}`;
$("tokens").innerHTML = cfg.replay ? "" : `<b>0</b> tokens`;
// a locked model (agent/workshop-key.mjs): the code we give the room unlocks it for everyone on this server
if (cfg.model.locked) {
  $("unlock").hidden = false;
  $("model").title = `Replaying recorded runs until the workshop code unlocks ${cfg.model.id}`;
  $("unlock").onsubmit = async (e) => {
    e.preventDefault();
    $("unlockMsg").textContent = "checking…";
    const r = await post("/api/unlock", { code: $("unlockCode").value }).catch(() => ({ error: "The server didn't answer." }));
    if (r.error && !("ok" in r)) { $("unlockMsg").textContent = r.error; return; }
    location.reload();
  };
}
$("pname").textContent = `${cfg.rosa.name}, ${cfg.rosa.age}`;
$("pdx").textContent = `Heart failure, EF ${cfg.rosa.ef}%`;
lake();
$("chartPatient").innerHTML = cfg.names.map((n, i) => `<option value="p${String(i).padStart(3, "0")}">${esc(n)}</option>`).join("");
$("chartPatient").onchange = () => loadChart($("chartPatient").value);
$("ehrTabs").onclick = (e) => { const b = e.target.closest("[data-tab]"); if (!b) return; state.chart.tab = b.dataset.tab; drawChart(); hood(); };
$("ehrMain").onclick = (e) => { const b = e.target.closest("[data-note]"); if (!b) return; state.chart.note = b.dataset.note; drawChart(); };
$("reveal").onclick = () => {
  const a = chartData?.answer;
  if (a) $("revealed").innerHTML = `<b>Care gap: ${a.gap ? "yes" : "no"} · Why: ${esc(cap(a.why))}</b><span class="muted">${esc(a.reason)}</span>`;
};

cards($("dataCards"), cfg.data, state.sources, "data");
cards($("toolCards"), cfg.tools, state.tools, "tools");
$("buildBar").onclick = (e) => { const b = e.target.closest(".chip[data-id]"); if (b) toggle(b.dataset.kind, b.dataset.id); };
$("examples").innerHTML = cfg.examples.map((x, i) => `<button class="chipBtn" data-i="${i}">${esc(x.label)}</button>`).join("");
$("examples").onclick = (e) => { const b = e.target.closest("[data-i]"); if (!b) return; state.prompt = cfg.examples[b.dataset.i].text; $("prompt").value = state.prompt; save(); hood(); };
$("actExample").textContent = `${cfg.act.label}: an agent that acts`;
$("actExample").onclick = () => { state.testPrompt = cfg.act.text; $("testPrompt").value = state.testPrompt; save(); hood(); };
$("prompt").value = state.prompt;
$("testPrompt").value = state.testPrompt;
let typing;
$("prompt").oninput = () => { state.prompt = $("prompt").value; save(); clearTimeout(typing); typing = setTimeout(hood, 300); };
$("testPrompt").oninput = () => { state.testPrompt = $("testPrompt").value; save(); clearTimeout(typing); typing = setTimeout(hood, 300); };
$("runRosa").onclick = runRosa;
$("runCohort").onclick = runCohort;
$("criteria").onchange = (e) => { const id = e.target.dataset.id; e.target.checked ? state.criteria.add(id) : state.criteria.delete(id); save(); criteria(); hood(); };
$("tickAll").onclick = () => { if (state.criteria.size === cfg.criteria.length) state.criteria.clear(); else cfg.criteria.forEach((c) => state.criteria.add(c.id)); save(); criteria(); hood(); };
$("useCriteria").onclick = async () => {
  const text = await criteriaText();
  state.testPrompt = [state.prompt.trim(), text].filter(Boolean).join("\n\n");
  $("testPrompt").value = state.testPrompt;
  go("test");
};
$("grid").onmouseover = tip;
$("grid").onmouseleave = () => ($("tip").hidden = true);
$("grid").onclick = (e) => { const sq = e.target.closest(".sq"); if (sq) inspect(sq.dataset.id); };
$("inspectClose").onclick = $("inspect").onclick = (e) => { if (e.target === $("inspect") || e.target === $("inspectClose")) $("inspect").hidden = true; };
$("steps").onclick = (e) => { const b = e.target.closest("[data-go]"); if (b) go(b.dataset.go); };
$("back").onclick = () => go(VIEWS[Math.max(0, VIEWS.indexOf(state.view) - 1)]);
$("next").onclick = () => go(VIEWS[Math.min(VIEWS.length - 1, VIEWS.indexOf(state.view) + 1)]);
const setHood = (open) => { state.hood = open; if (open) state.hoodSeen = true; save(); hood(); };
$("hoodBtn").onclick = () => setHood(!state.hood);
$("hoodClose").onclick = () => setHood(false);
$("zoomOut").onclick = () => { state.zoom = Math.max(0, state.zoom - 1); save(); hood(); };
$("zoomIn").onclick = () => { state.zoom = Math.min(3, state.zoom + 1); save(); hood(); };
$("wideBtn").onclick = () => { state.wide = !state.wide; hood(); };
document.addEventListener("keydown", (e) => {
  if (/TEXTAREA|INPUT|SELECT/.test(document.activeElement.tagName)) return;
  if (e.key === "u" || e.key === "U") setHood(!state.hood);
  if (e.key === "Escape") { $("inspect").hidden = true; }
  if (e.key === "ArrowRight") $("next").click();
  if (e.key === "ArrowLeft") $("back").click();
});
termRosa.reset("idle");
grid();
new Windows($("agents"), cfg.concurrency);
$("agentsLabel").textContent = `${cfg.concurrency} agents`;
pickers();
criteria();
go(state.view);
