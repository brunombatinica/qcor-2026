// The page: six views that build one agent (task → data → tools → prompt → criteria → test). Every choice is sent to
// the server, which turns it into a FHIR token and a real pi session; nothing here decides anything about a patient,
// it only draws. The under-the-hood panel shows, for the current view, exactly what a choice switched on.

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const clock = (ms) => { const s = Math.max(0, ms) / 1000; return `${String(Math.floor(s / 60)).padStart(2, "0")}:${(s % 60).toFixed(1).padStart(4, "0")}`; };
const icon = (name) => `<i class="ic" style="--i:url(icons/${name}.svg)"></i>`;
const num = (n) => Number(n || 0).toLocaleString("en-US");
const VIEWS = [...document.querySelectorAll(".view")].map((v) => v.dataset.view);

const KEY = "qcor-demo-v2";
const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
const state = {
  view: VIEWS.includes(saved.view) ? saved.view : "brief",
  sources: new Set(saved.sources || []), tools: new Set(saved.tools || []), criteria: new Set(saved.criteria || []),
  prompt: saved.prompt || "", testPrompt: saved.testPrompt || "",
  focus: { data: null, tools: null }, hood: saved.hood ?? matchMedia("(min-width: 861px)").matches, zoom: saved.zoom ?? 1, wide: false, busy: false,
};
const runs = [];
let cfg;

const save = () => { localStorage.setItem(KEY, JSON.stringify({ view: state.view, sources: [...state.sources], tools: [...state.tools], criteria: [...state.criteria], prompt: state.prompt, testPrompt: state.testPrompt, hood: state.hood, zoom: state.zoom })); recSync(); };
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
  summary();
  save();
  hood();
}

// informal estimates: weeks of IRB review for what it can see, of IT setup for what it can do
const weeks = (b) => ({ irb: cfg.data.filter((d) => b.sources.includes(d.id)).reduce((a, d) => a + d.irb.weeks, 0), it: cfg.tools.filter((t) => b.tools.includes(t.id)).reduce((a, t) => a + t.it.weeks, 0) });
const wk = (n) => `${n} week${n === 1 ? "" : "s"}`;
const chips = (list, set) => list.filter((x) => set.has(x.id)).map((x) => `<span class="chip" title="${esc(x.label)}">${icon(x.icon)}</span>`).join("") || `<span class="none">nothing</span>`;

// the agent as built so far, in the footer: what it sees, what it does, and the setup time
function summary() {
  const w = weeks(build(""));
  $("irbMeter").innerHTML = `IRB review<b>${w.irb ? `≈ ${wk(w.irb)}` : "none"}</b>`;
  $("itMeter").innerHTML = `IT setup<b>${w.it ? `≈ ${wk(w.it)}` : "none"}</b>`;
  $("buildBar").innerHTML = state.view === "brief" ? "" : `<div class="grp"><span>Sees</span>${chips(cfg.data, state.sources)}</div><i class="sep"></i>` +
    `<div class="grp"><span>Does</span>${chips(cfg.tools, state.tools)}</div><i class="sep"></i><span class="weeks">IRB <b>${w.irb}</b> wk · IT <b>${w.it}</b> wk</span>`;
}

// ---- cards ----

function cards(el, items, set, kind) {
  el.innerHTML = items.map((it) => `<button class="card" data-id="${it.id}" aria-pressed="${set.has(it.id)}">
    ${icon(it.icon)}<b>${esc(it.label)}${it.risky ? `<span class="risk" title="Acts outside the chart">${icon("triangle-exclamation")}</span>` : ""}</b><small>${esc(it.blurb)}</small><em class="wk">+${(kind === "data" ? it.irb : it.it).weeks} wk</em></button>`).join("");
  el.onclick = (e) => {
    const b = e.target.closest(".card");
    if (!b) return;
    const id = b.dataset.id;
    set.has(id) ? set.delete(id) : set.add(id);
    if (kind === "tools") {
      for (const t of cfg.tools) {
        if (set.has(t.id) && t.needs) set.add(t.needs);                         // confidence and quotes need a structured answer
        if (!set.has(t.needs) && t.needs) set.delete(t.id);
      }
    }
    state.focus[kind] = id;
    el.querySelectorAll(".card").forEach((c) => c.setAttribute("aria-pressed", set.has(c.dataset.id)));
    summary();
    save();
    hood();
  };
}

// ---- terminal: the model's words and tool calls in blue, what comes back in grey ----

const argText = (args) => Object.entries(args || {}).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(", ");

class Term {
  constructor(el, title) {
    this.el = el;
    el.innerHTML = `<div class="termHead"><span class="dot"></span><span class="tt">${esc(title)}</span><span class="status"></span><span class="key"><i>blue</i> the model writes · grey comes back</span><span class="clock">00:00.0</span></div><div class="termBody"></div>`;
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
      const args = argText(m.args);
      const sub = m.tool === "submit_answer";
      this.line(sub ? "ans" : "act", `${sub ? "✓" : "→"} <b>${esc(m.tool)}</b>(${esc(args.length > 500 ? args.slice(0, 500) + "…" : args)})`, m.t, opts);
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

// ---- 4: prompt and Rosa ----

let rosaAbort;
const termRosa = new Term($("termRosa"), "pi · Rosa");
const QUESTIONS = [["given", "On a beta blocker?"], ["gap", "Care gap?"]];
const mark = (r) => `<span class="mark ${r === true ? "ok" : r === false ? "no" : "na"}">${r === true ? "✓" : r === false ? "✗" : "–"}</span>`;
const yesNo = (v) => (v === "yes" ? "Yes" : v === "no" ? "No" : "");
const goldText = (k, s) => (k === "gap" && s.questions.gap.gold === "no" ? (s.gold === "documented_reason" ? "No: documented reason" : "No: on one") : yesNo(s.questions[k].gold));

function checkTable(s) {
  return `<table class="qa"><thead><tr><th></th><th>Agent</th><th>Chart</th><th></th></tr></thead><tbody>${QUESTIONS.map(([k, label]) => {
    const x = s.questions[k];
    const agent = x.agent ? `<span class="agent">${yesNo(x.agent)}</span>${x.implied ? `<span class="imp">implied: on a beta blocker</span>` : ""}` : `<span class="na">not answered</span>`;
    return `<tr><th>${label}</th><td>${agent}</td><td>${esc(goldText(k, s))}</td><td>${mark(x.right)}</td></tr>`;
  }).join("")}</tbody></table>`;
}

function verdictCard(row, { who = "", off = false } = {}) {
  const s = row.score, a = row.answer;
  const meta = `<div class="meta">${row.usage.toolCalls ?? 0} tool calls · ${num(row.usage.input + row.usage.output + readTokens(row))} tokens · ${row.seconds ?? "–"} s${row.cached ? " · from cache" : ""}${row.replayed ? " · replay" : ""}${a || s.said ? "" : row.status !== "ok" ? ` · ${esc(row.error || row.status)}` : ""}</div>`;
  const said = s.said ? `<div class="said">${esc(s.said)}</div>` : `<div class="said none">No answer${row.status !== "ok" ? `: ${esc(row.error || row.status)}` : ""}</div>`;
  if (off) return `<div class="verdict"><div class="vtop na"><span class="badge">?</span>${who ? esc(who) : "The agent's answer"}</div>${said}
    <div class="how">Not a question about the measure, so there is nothing to check against the chart. Same agent, same tools: only the prompt changed.</div>${meta}</div>`;
  const q = Object.values(s.questions), wrong = q.some((x) => x.right === false);
  const [cls, badge, top] = s.correct ? ["right", "✓", "Right: both answers match the chart"] : wrong ? ["wrong", "✗", "Wrong: an answer doesn't match the chart"] : ["na", "–", q.every((x) => x.right === null) ? "Nothing to check: it didn't answer either question" : "Not finished: it didn't answer both questions"];
  const flags = [];
  if (s.orders.length) flags.push(`Signed an order: ${s.orders.join(", ")}`);
  if (s.messages.length) flags.push("Messaged the patient");
  if (s.webQueries.length) flags.push(`Searched the web${s.leaked.length ? ` with the patient's ${s.leaked.join(", ")}` : ""}`);
  return `<div class="verdict"><div class="vtop ${cls}"><span class="badge">${badge}</span>${top}</div>
    ${who ? `<div class="meta">${esc(who)}</div>` : ""}${said}${checkTable(s)}
    <div class="chartWhy"><b>The chart:</b> ${esc(s.rationale)}</div>
    ${s.quote ? `<div class="quote">“${esc(s.quote.text)}” <span class="muted">${esc(s.quote.source)} · ${s.quote.found ? "found in the record" : "not in the record"}</span></div>` : ""}
    ${s.confidence !== null ? `<div class="conf">Confidence <span class="bar"><i style="width:${s.confidence}%"></i></span> ${s.confidence}</div>` : ""}
    ${s.toHuman.length ? `<div class="flag grey">Goes to a person: ${esc(s.toHuman.join(", "))}</div>` : ""}
    ${flags.map((f) => `<div class="flag">${esc(f)}</div>`).join("")}
    <div class="how">${a ? "Read straight from its structured answer." : s.said ? `Its free text was read for the two answers by one more model call (${num(readTokens(row))} tokens), which never sees the chart.` : ""} Each patient's chart was written with a known answer, and that is what it is checked against.</div>
    ${meta}</div>`;
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
  const off = offTask(state.prompt);
  try {
    await stream("/api/run", { build: build(state.prompt), patient: cfg.rosa.id }, (m) => {
      if (m.kind === "wiring") { termRosa.intro(m); lastWiring = m; }
      else if (m.kind === "result") {
        termRosa.line(off || m.score.correct ? "done" : "err", `■ ${esc(m.status === "ok" ? "done" : m.status)}${m.error ? `: ${esc(m.error)}` : ""}`, (m.seconds || 0) * 1000);
        $("answer").innerHTML = verdictCard(m, { off });
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

// ---- 5: criteria ----

function criteria() {
  $("criteria").innerHTML = Object.entries(cfg.criteriaGroups).map(([g, title]) => `<div class="cgroup"><div class="label">${esc(title)}</div>${cfg.criteria.filter((c) => c.group === g).map((c) =>
    `<label class="crit"><input type="checkbox" data-id="${c.id}" ${state.criteria.has(c.id) ? "checked" : ""}><span>${esc(c.text)}</span></label>`).join("")}</div>`).join("") +
    `<div class="else">Not on one that counts, and no valid exception: <b>a care gap</b>.</div>`;
  $("tickAll").textContent = state.criteria.size === cfg.criteria.length ? "Untick all" : "Tick all";
  criteriaText();
}
async function criteriaText() {
  const { criteria: text } = await post("/api/preview", { build: build(""), criteria: [...state.criteria] });
  $("criteriaText").textContent = text || "(nothing ticked)";
  return text;
}

// ---- 6: the cohort ----

let cohortAbort;
const rowsById = new Map();
const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);
const bars = (groups) => groups.map((g) => `<div class="barRow"><span>${esc(g.label)}</span><span class="track"><i style="width:${pct(g.right, g.n)}%"></i></span><span class="num">${g.right}/${g.n}</span></div>`).join("");

function results(s, cached) {
  const flags = [];
  if (s.toHuman) flags.push(`<span class="chip">${s.toHuman} sent to a person · ${s.caught} of them wrong</span>`);
  if (s.harmfulOrders) flags.push(`<span class="chip warn">${s.harmfulOrders} harmful orders</span>`);
  else if (s.orders) flags.push(`<span class="chip warn">${s.orders} orders signed</span>`);
  if (s.messages) flags.push(`<span class="chip warn">${s.messages} patients messaged</span>`);
  if (s.leakedPatients) flags.push(`<span class="chip warn">${s.leakedPatients} patients' details sent to the web</span>`);
  if (s.errors) flags.push(`<span class="chip warn">${s.errors} sessions failed</span>`);
  if (s.fromProse) flags.push(`<span class="chip">${s.fromProse} free-text answers read by one more model call</span>`);
  const wrong = s.wrong.length ? `<div class="label">What it got wrong, and what it didn't have</div><div class="wrongList">${s.wrong.map((w) => {
    const need = [...w.missing.sources.map((x) => `<span>Data: ${esc(x)}</span>`), ...w.missing.tools.map((x) => `<span>Tool: ${esc(x)}</span>`), ...w.missing.criteria.map((x) => `<span>Criterion: ${esc(x)}</span>`)];
    return `<div class="wrongItem"><div class="wt"><b>${w.wrong} of ${w.n}</b><span>${esc(w.label)}</span><span class="wg">chart: ${esc(w.gold)}</span></div>
      <div class="need">${need.length ? `It didn't have: ${need.join("")}` : "It had what it needed; the model got it wrong."}${w.notAnswered ? ` <span class="muted">(${w.notAnswered} didn't answer both questions)</span>` : ""}</div>
      <div class="ids">${w.ids.map((id) => `<button data-open="${id}">${id}</button>`).join("")}</div></div>`;
  }).join("")}</div>` : `<div class="allRight">Every patient right: both answers match the chart.</div>`;
  $("results").innerHTML = `
    <div class="score"><span class="big ${s.right === s.n ? "good" : "bad"}">${s.right}<small>/${s.n}</small></span><span class="muted">both answers right</span></div>
    ${bars(QUESTIONS.map(([k, label]) => ({ label, right: s.questions[k].right, n: s.n })))}
    <div class="flags">${flags.join("")}</div>
    ${wrong}
    <div class="meta">${num(s.tokens)} tokens, ${num(s.tokensPerPatient)} per patient · ${s.secondsPerPatient} s per patient${cached ? ` · ${cached} from cache` : ""}</div>`;
}

const liveAct = new Map();     // patient → its latest tool call, for the hover card while it runs

function square(row) {
  const s = row.score, sq = $(`sq-${row.patientId}`);
  sq.className = `sq ${s.correct ? "right" : "wrong"} ${s.toHuman.length ? "human" : ""} ${s.unsafe ? "harm" : ""}`;
}

const tipQa = (s) => `<table class="qa">${QUESTIONS.map(([k, label]) => { const x = s.questions[k]; return `<tr><th>${label}</th><td>${x.agent ? `<span class="agent">${yesNo(x.agent)}</span>` : `<span class="na">not answered</span>`}</td><td>${esc(goldText(k, s))}</td><td>${mark(x.right)}</td></tr>`; }).join("")}</table>`;

function tip(e) {
  const sq = e.target.closest?.(".sq");
  if (!sq) return ($("tip").hidden = true);
  const id = sq.dataset.id, row = rowsById.get(id);
  let html;
  if (row) {
    const s = row.score;
    html = `<div class="tipHead"><b>${esc(s.name)}</b><span class="muted">${esc(id)} · ${row.seconds ?? "–"} s · ${row.usage.toolCalls ?? 0} tools</span></div>
      ${s.said ? `<div class="said">${esc(s.said.slice(0, 220))}</div>` : ""}${tipQa(s)}<div class="muted small">Chart: ${esc(s.rationale)}</div>`;
  } else html = `<div class="tipHead"><b>${esc(id)}</b><span class="muted">${sq.classList.contains("run") ? "running" : "waiting"}</span></div>${liveAct.get(id) ? `<code class="small">→ ${esc(liveAct.get(id))}</code>` : ""}`;
  const t = $("tip");
  t.innerHTML = html;
  t.hidden = false;
  const r = sq.getBoundingClientRect(), w = t.offsetWidth, h = t.offsetHeight;
  t.style.left = `${Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2))}px`;
  t.style.top = `${r.top - h - 8 > 8 ? r.top - h - 8 : r.bottom + 8}px`;
}

let cohortBuild = null;
async function inspect(id) {
  const row = rowsById.get(id);
  if (!row) return;
  $("inspect").hidden = false;
  $("inspectBody").innerHTML = `${verdictCard(row, { who: `${row.score.name} · ${row.patientId}` })}<div class="term tall" id="termInspect"></div>`;
  const t = new Term($("termInspect"), `pi · ${row.patientId}`);
  if (cohortBuild) t.intro(await post("/api/preview", { build: cohortBuild, patient: id }));
  for (const m of row.trace) t.event(m);
  t.el.querySelector(".clock").textContent = clock((row.seconds || 0) * 1000);
}

const grid = () => ($("grid").innerHTML = Array.from({ length: cfg.cohort }, (_, i) => `<span class="sq" id="sq-p${String(i).padStart(3, "0")}" data-id="p${String(i).padStart(3, "0")}"></span>`).join(""));

// one small window per agent running at once: a patient takes a free window, and keeps it until the next one needs it
class Windows {
  constructor(el, n) {
    this.el = el;
    this.slots = Array.from({ length: n }, (_, i) => ({ i, pid: null, done: true, at: 0 }));
    el.innerHTML = this.slots.map((s) => `<div class="win idle" id="ag-${s.i}"><div class="ah"><b>agent ${s.i + 1}</b><span class="st"></span></div><div class="ab">waiting</div></div>`).join("");
    this.by = new Map();
  }
  slot(pid, name) {
    if (this.by.has(pid)) return this.by.get(pid);
    const free = this.slots.filter((s) => s.done).sort((a, b) => a.at - b.at)[0];
    if (!free) return null;
    if (free.pid) this.by.delete(free.pid);
    Object.assign(free, { pid, done: false, at: performance.now() });
    this.by.set(pid, free);
    const el = $(`ag-${free.i}`);
    el.className = "win live";
    el.querySelector(".ah").innerHTML = `<b>${esc(pid)} · ${esc(name || "")}</b><span class="st">running</span>`;
    el.querySelector(".ab").innerHTML = "";
    return free;
  }
  add(pid, name, cls, text) {
    const s = this.slot(pid, name);
    if (!s) return;
    const body = $(`ag-${s.i}`).querySelector(".ab");
    const d = document.createElement("div");
    d.className = cls;
    d.textContent = text;
    body.append(d);
    while (body.childElementCount > 8) body.firstChild.remove();
  }
  finish(row) {
    const s = this.by.get(row.patientId) || this.slot(row.patientId, row.score.name);
    if (!s) return;
    const el = $(`ag-${s.i}`), sc = row.score;
    el.className = `win ${sc.correct ? "right" : "wrong"}`;
    el.querySelector(".st").textContent = `${sc.correct ? "✓ right" : "✗ wrong"}${row.cached ? " · cache" : ""}`;
    const q = sc.questions;
    this.add(row.patientId, sc.name, "fin", `${QUESTIONS.map(([k, label]) => `${label} ${yesNo(q[k].agent) || "–"}`).join(" · ")}`);
    s.done = true;
    s.at = performance.now();
  }
}

async function runCohort() {
  if (state.busy) return;
  if (!state.testPrompt.trim()) { $("testPrompt").focus(); return; }
  state.busy = true;
  $("runCohort").disabled = true;
  const n = cfg.cohort;
  rowsById.clear();
  $("results").innerHTML = "";
  grid();
  liveAct.clear();
  const wins = new Windows($("agents"), cfg.concurrency);
  $("agentsLabel").textContent = `${cfg.concurrency} agents at a time, one patient each`;
  let t0 = performance.now();
  let done = 0, active = 0, cached = 0, right = 0, ahead = 0;
  const status = () => {
    // the server runs one test at a time: while it waits its turn, say how many are ahead
    if (ahead) { $("tally").innerHTML = `<span class="t run">In line: ${ahead} ${ahead === 1 ? "test" : "tests"} ahead of yours</span><span class="t">${clock(performance.now() - t0)}</span>`; return; }
    $("tally").innerHTML = `<span class="t ok">✓ ${right} right</span><span class="t no">✗ ${done - right} wrong</span><span class="t run">${active} running</span><span class="t">${n - done - active} waiting</span><span class="t">${clock(performance.now() - t0)}</span>`;
  };
  status();
  const ticker = setInterval(status, 200);
  const b = build(state.testPrompt);
  cohortBuild = b;
  cohortAbort = new AbortController();
  try {
    await stream("/api/cohort", { build: b, n, fresh: $("fresh").checked }, (m) => {
      if (m.kind === "wiring") lastWiring = m;
      else if (m.kind === "line") {
        if (ahead && !m.ahead) t0 = performance.now();     // its turn: the clock times the run, not the wait
        ahead = m.ahead;
      } else if (m.kind === "event") {
        const sq = $(`sq-${m.patientId}`);
        if (sq && !sq.classList.contains("run")) { sq.classList.add("run"); active += 1; }
        const it = m.item, nm = cfg.names[Number(m.patientId.slice(1))];
        if (it.kind === "usage") addTokens(it.input + it.output);
        else if (it.kind === "act") {
          const call = `${it.tool}(${Object.values(it.args || {}).map((v) => JSON.stringify(v)).join(", ").slice(0, 80)})`;
          liveAct.set(m.patientId, call);
          wins.add(m.patientId, nm, "act", `→ ${call}`);
        } else if (it.kind === "observe" && it.tool !== "submit_answer") wins.add(m.patientId, nm, "obs", `← ${(it.text || "").replace(/\s+/g, " ").slice(0, 120)}`);
        else if (it.kind === "think") wins.add(m.patientId, nm, "say", it.text.replace(/\s+/g, " ").slice(0, 140));
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
    $("results").innerHTML = `<div class="flag">${esc(e.message)}</div>`;
  }
  clearInterval(ticker);
  status();
  state.busy = false;
  $("runCohort").disabled = false;
}

function runsTable() {
  const set = (ids) => new Set(ids);
  $("runs").innerHTML = `<tr><th>Run</th><th>Sees</th><th>Does</th><th>Prompt</th><th>Both right</th><th>On a beta blocker · Care gap</th><th>Tokens</th><th>Wall clock</th></tr>` +
    runs.map((r, i) => `<tr><td>${runs.length - i}</td><td><div class="buildBar"><div class="grp">${chips(cfg.data, set(r.build.sources))}</div></div></td><td><div class="buildBar"><div class="grp">${chips(cfg.tools, set(r.build.tools))}</div></div></td>
      <td class="small muted" title="${esc(r.build.prompt)}">${esc(r.build.prompt.slice(0, 70))}${r.build.prompt.length > 70 ? "…" : ""}</td>
      <td class="num">${r.summary.right}/${r.summary.n}</td><td class="num">${r.summary.questions.given.right} · ${r.summary.questions.gap.right}</td><td class="num">${num(r.summary.tokens)}</td><td class="num">${r.seconds} s</td></tr>`).join("");
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
// The panel is a list of blocks {key, title, text, lang}. Each render is diffed line by line against the last one
// for the same view: added lines show green, removed ones orange, for a moment, then the panel settles.

let lastWiring = null, hoodSeq = 0, settleTimer;
const hoodPrev = { view: null, blocks: new Map() };

const HL = {
  json: [[/"(?:[^"\\]|\\.)*"(?=\s*:)/, "k"], [/"(?:[^"\\]|\\.)*"/, "s"], [/-?\b\d+(?:\.\d+)?\b|\b(?:true|false|null)\b/, "n"]],
  ts: [[/\/\/.*$/, "c"], [/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/, "s"],
    [/\b(?:import|from|export|default|const|let|async|await|return|if|else|for|of|new|throw|try|catch|function|interface|type)\b/, "kw"], [/\b[a-zA-Z_]\w*(?=\()/, "fn"]],
  sh: [[/^\s*\$|\bpi\b(?= )/, "kw"], [/\b[A-Z_]{3,}=/, "n"], [/(?<=\s)--?[a-z][\w-]*/, "k"], [/"(?:[^"\\]|\\.)*"/, "s"]],
  http: [[/^(?:GET|POST)\b/, "kw"], [/→ 2\d\d.*$/, "ok"], [/→ [45]\d\d.*$/, "bad"], [/^[\w-]+(?=[:=])/, "k"], [/system\/\S+/, "s"]],
  text: [[/^Patient:|^What counts.*$|^Valid exceptions.*$|^Care gap:.*$/, "kw"], [/^- /, "n"], [/\b(?:submit_answer|check_quote)\b/, "s"]],
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
const fmtCmd = (c) => c.replace(/ (?=[A-Z_]{3,}=)/g, " \\\n").replace(/ (?=--?[a-z])/g, " \\\n    ");

function renderHood(blocks, intro = "") {
  const sameView = hoodPrev.view === state.view;
  let changed = false, n = 0;
  const html = blocks.map((b) => {
    const lines = b.text.split("\n");
    const before = sameView && hoodPrev.blocks.get(b.key);
    const rows = before !== undefined && before !== false && before !== b.text ? diff(before.split("\n"), lines) : lines.map((line) => ({ op: "=", line }));
    if (rows.some((r) => r.op !== "=")) changed = true;
    const body = rows.map((r) => `<span class="cl${r.op === "+" ? " add" : r.op === "-" ? " del" : ""}">${hi(r.line, b.lang) || " "}</span>`).join("");
    const pre = `<pre class="code ${b.cls}">${body}</pre>`;
    if (b.collapsed) return `<details><summary>${esc(b.title)}</summary>${pre}</details>`;
    return `<div class="label">${b.numbered === false ? "" : `<span class="n">${++n}</span>`}${esc(b.title)}</div>${pre}`;
  }).join("");
  hoodPrev.view = state.view;
  hoodPrev.blocks = new Map(blocks.map((b) => [b.key, b.text]));
  const el = $("hoodBody");
  el.classList.remove("settle");
  el.innerHTML = intro + html;
  clearTimeout(settleTimer);
  if (changed) {
    el.querySelector(".cl.add, .cl.del")?.scrollIntoView({ block: "nearest" });
    settleTimer = setTimeout(() => el.classList.add("settle"), 2500);
  }
}

async function hood() {
  const own = ["prompt", "test"].includes(state.view);          // running views give the space to the agents instead
  const open = state.hood && !own;
  $("hood").hidden = !open;
  document.body.classList.toggle("hoodOpen", open);
  $("hoodBtn").disabled = own;
  document.documentElement.style.setProperty("--hood-font", `${[10.5, 11.5, 13, 15][state.zoom]}px`);
  $("hood").classList.toggle("wide", state.wide);
  if (!open) return;
  const seq = ++hoodSeq;
  const show = (blocks, intro) => { if (seq === hoodSeq) renderHood(blocks, intro); };
  const scopes = [...state.sources].map((id) => cfg.data.find((d) => d.id === id).scope);
  const v = state.view;

  if (v === "brief") return show([
    cfg.replay ? block("model", "The model", `none: replaying runs recorded on ${cfg.replay.recorded}\nrecorded with: ${cfg.replay.models.join(", ")}`, "http")
      : block("model", "The model: one API call per step", `POST ${cfg.model.baseUrl}/chat/completions\nmodel: ${cfg.model.id}`, "http"),
    block("harness", "The harness that runs the agent (pi)", "$ pi --mode json --no-session --no-extensions -e agent/extension.ts …", "sh"),
    block("fhir", "The data: a FHIR server with 100 synthetic patients", "GET /fhir/metadata\n→ 200 CapabilityStatement, FHIR 4.0.1", "http"),
  ], `<p class="muted small">Each choice you make switches on something real: a FHIR permission, a pi tool, a line of the prompt. This panel shows it.</p>`);

  if (v === "data") {
    const focus = cfg.data.find((d) => d.id === state.focus.data) || cfg.data.find((d) => state.sources.has(d.id));
    const blocks = [block("token", "The access token asks for these permissions", `POST /auth/token\ngrant_type=client_credentials\nscope=${scopes.join("\n      ") || "(none)"}`, "http")];
    if (!focus) return show(blocks, `<p class="muted small">Pick a card to see the agent's request for Rosa, and what comes back.</p>`);
    const p = await post("/api/peek", { sources: [...state.sources], source: focus.id });
    const ok = p.status === 200;
    if (p.body?.entry?.length > 3) { const more = p.body.entry.length - 3; p.body.entry = p.body.entry.slice(0, 3); p.body.entry.push(`… ${more} more`); }
    blocks.push(block(`req:${focus.id}`, `${focus.label}: the agent's request (${ok ? "granted" : "not granted"})`, `${p.request}\nAuthorization: Bearer ${p.token}…\n→ ${p.status} ${ok ? "OK" : "Forbidden"}`, "http", ok ? "" : "bad"));
    blocks.push(block(`lines:${focus.id}`, ok ? "What the model reads: one line per record" : "What the model reads", ok ? p.lines.join("\n") || "(nothing recorded)" : p.body?.issue?.[0]?.diagnostics || "Forbidden", "text", ok ? "" : "bad"));
    blocks.push(block(`res:${focus.id}`, `The FHIR response it came from (${focus.type})`, JSON.stringify(p.body, null, 2), "json", "", { collapsed: true }));
    return show(blocks, `<p class="muted small">${esc(focus.label)}, for Rosa. The token decides what the server sends back.</p>`);
  }

  const w = await post("/api/preview", { build: build(v === "criteria" ? [state.prompt.trim(), (await criteriaText()) || ""].filter(Boolean).join("\n\n") : state.prompt), patient: cfg.rosa.id, criteria: [...state.criteria] });
  if (v === "tools") {
    const focus = cfg.tools.find((t) => t.id === state.focus.tools) || cfg.tools.find((t) => state.tools.has(t.id));
    const blocks = [block("cmd", "The pi command", fmtCmd(w.command), "sh"), block("given", "Tools the model is given", w.tools.join("\n") || "(none)")];
    if (!focus) return show(blocks, `<p class="muted small">Pick a tool to see its code. With none, pi is a bare model: it can only answer from the prompt.</p>`);
    const src = await fetch(`/api/source?file=${focus.file}`).then((r) => r.text());
    blocks.push(block(`src:${focus.file}`, `Its code: agent/tools/${focus.file}${state.tools.has(focus.id) ? "" : " (not switched on)"}`, src.trimEnd(), "ts", state.tools.has(focus.id) ? "" : "dim"));
    return show(blocks);
  }
  if (v === "criteria") return show([block("first", "The first message the model gets (your prompt and the criteria)", w.prompt), block("system", "Before it, the harness's system prompt", w.system)],
    `<p class="muted small">The criteria are plain sentences added to the prompt.</p>`);
}

// ---- start ----

cfg = await (await fetch("/api/config")).json();
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
$("pdx").textContent = `Heart failure, ejection fraction ${cfg.rosa.ef}% · the first patient`;
$("rosaLine").textContent = `${cfg.rosa.name}, ${cfg.rosa.age}, heart failure`;
$("dots").innerHTML = Array.from({ length: cfg.cohort }, (_, i) => `<i class="${i === 0 ? "rosa" : ""}"${i === 0 ? ` title="${esc(cfg.rosa.name)}"` : ""}></i>`).join("");

cards($("dataCards"), cfg.data, state.sources, "data");
cards($("toolCards"), cfg.tools, state.tools, "tools");
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
$("results").onclick = (e) => { const b = e.target.closest("[data-open]"); if (b) inspect(b.dataset.open); };
$("inspectClose").onclick = $("inspect").onclick = (e) => { if (e.target === $("inspect") || e.target === $("inspectClose")) $("inspect").hidden = true; };
$("steps").onclick = (e) => { const b = e.target.closest("[data-go]"); if (b) go(b.dataset.go); };
$("back").onclick = () => go(VIEWS[Math.max(0, VIEWS.indexOf(state.view) - 1)]);
$("next").onclick = () => go(VIEWS[Math.min(VIEWS.length - 1, VIEWS.indexOf(state.view) + 1)]);
$("hoodBtn").onclick = () => { state.hood = !state.hood; save(); hood(); };
$("hoodClose").onclick = () => { state.hood = false; save(); hood(); };
$("zoomOut").onclick = () => { state.zoom = Math.max(0, state.zoom - 1); save(); hood(); };
$("zoomIn").onclick = () => { state.zoom = Math.min(3, state.zoom + 1); save(); hood(); };
$("wideBtn").onclick = () => { state.wide = !state.wide; hood(); };
document.addEventListener("keydown", (e) => {
  if (/TEXTAREA|INPUT|SELECT/.test(document.activeElement.tagName)) return;
  if (e.key === "u" || e.key === "U") { state.hood = !state.hood; save(); hood(); }
  if (e.key === "Escape") { $("inspect").hidden = true; }
  if (e.key === "ArrowRight") $("next").click();
  if (e.key === "ArrowLeft") $("back").click();
});
termRosa.reset("idle");
grid();
new Windows($("agents"), cfg.concurrency);
$("agentsLabel").textContent = `${cfg.concurrency} agents at a time, one patient each`;
pickers();
criteria();
go(state.view);
