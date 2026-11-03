// The page: six views that build one agent (data → tools → prompt → criteria → test). Every choice is sent to the
// server, which turns it into a FHIR token and a real pi session; nothing here decides anything about a patient, it
// only draws. The under-the-hood panel shows, for the current view, exactly what a choice switched on.

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const clock = (ms) => { const s = Math.max(0, ms) / 1000; return `${String(Math.floor(s / 60)).padStart(2, "0")}:${(s % 60).toFixed(1).padStart(4, "0")}`; };
const VIEWS = [...document.querySelectorAll(".view")].map((v) => v.dataset.view);

const saved = JSON.parse(localStorage.getItem("qcor-build") || "{}");
const state = {
  view: VIEWS.includes(saved.view) ? saved.view : "brief",
  sources: new Set(saved.sources || []), tools: new Set(saved.tools || []), criteria: new Set(saved.criteria || []),
  prompt: saved.prompt || "", testPrompt: saved.testPrompt || "",
  focus: { data: null, tools: null }, hood: saved.hood ?? matchMedia("(min-width: 861px)").matches, zoom: saved.zoom ?? 1, wide: false, busy: false, cms: false,
};
const runs = [];
let cfg;

const save = () => { localStorage.setItem("qcor-build", JSON.stringify({ view: state.view, sources: [...state.sources], tools: [...state.tools], criteria: [...state.criteria], prompt: state.prompt, testPrompt: state.testPrompt, hood: state.hood, zoom: state.zoom })); recSync(); };
const build = (prompt) => ({ sources: [...state.sources], tools: [...state.tools], prompt });

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

// ---- navigation ----

function go(view) {
  state.view = view;
  document.querySelectorAll(".view").forEach((v) => (v.hidden = v.dataset.view !== view));
  const i = VIEWS.indexOf(view);
  $("steps").innerHTML = VIEWS.map((v, k) => `<button class="step ${k === i ? "on" : k < i ? "done" : ""}" data-go="${v}"><span>${k + 1}</span>${esc(document.querySelector(`[data-view=${v}]`).dataset.title)}</button>`).join("");
  $("steps").querySelector(".on")?.scrollIntoView({ block: "nearest", inline: "center" });
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

function summary() {
  const s = state.sources.size, t = state.tools.size, w = weeks(build(""));
  $("irbMeter").innerHTML = `IRB review <b>${w.irb ? `≈ ${wk(w.irb)}` : "none"}</b>`;
  $("itMeter").innerHTML = `IT setup <b>${w.it ? `≈ ${wk(w.it)}` : "none"}</b>`;
  const names = (list, set) => list.filter((x) => set.has(x.id)).map((x) => x.label).join(" · ") || "nothing";
  $("agentSum").innerHTML = $("agentSumTest").innerHTML = `<div><span>Sees</span>${esc(names(cfg.data, state.sources))}</div><div><span>Does</span>${esc(names(cfg.tools, state.tools))}</div><div><span>Setup</span>IRB ${wk(w.irb)} · IT ${wk(w.it)}</div>`;
  $("buildSummary").textContent = state.view === "brief" ? "" : `${s} data source${s === 1 ? "" : "s"} · ${t} tool${t === 1 ? "" : "s"} · IRB ${w.irb} wk · IT ${w.it} wk`;
}

// ---- cards ----

function cards(el, items, set, kind) {
  el.innerHTML = items.map((it) => `<button class="card" data-id="${it.id}" aria-pressed="${set.has(it.id)}">
    <b>${esc(it.label)}</b><em class="wk">+${(kind === "data" ? it.irb : it.it).weeks} wk</em><small>${esc(it.blurb)}</small>${kind === "data" ? `<code>${esc(it.type)}${it.category ? ` · ${esc(it.category)}` : ""}</code>` : ""}</button>`).join("");
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

// ---- terminal ----

class Term {
  constructor(el, title) {
    this.el = el;
    el.innerHTML = `<div class="termHead"><span class="dot"></span><span class="tt">${esc(title)}</span><span class="status muted"></span><span class="clock">00:00.0</span></div><div class="termBody"></div>`;
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
  line(cls, html, t, { prefix = "", max = 400 } = {}) {
    const div = document.createElement("div");
    div.className = `ln ${cls}`;
    div.innerHTML = `<span class="ts">${t === undefined ? "" : clock(t)}</span>${prefix ? `<span class="pid">${esc(prefix)}</span>` : ""}<span class="tx">${html}</span>`;
    const stick = this.body.scrollHeight - this.body.scrollTop - this.body.clientHeight < 40;
    this.body.append(div);
    while (this.body.childElementCount > max) this.body.firstChild.remove();
    if (stick) this.body.scrollTop = this.body.scrollHeight;
    return div;
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
    if (m.kind === "act") {
      const args = Object.entries(m.args || {}).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(", ");
      this.line(m.tool === "submit_answer" ? "ans" : "act", `${m.tool === "submit_answer" ? "✓" : "→"} <b>${esc(m.tool)}</b>(${esc(args.length > 400 ? args.slice(0, 400) + "…" : args)})`, m.t, opts);
    } else if (m.kind === "observe" && m.tool !== "submit_answer") {
      if (m.details?.request) this.line("http", esc(m.details.request), undefined, opts);
      const alarm = m.tool === "web_search" ? `Sent to the internet: "${esc(m.details?.query)}"` : m.tool === "place_order" && !m.error ? `Order signed: ${esc(m.details?.order?.medication)}` : m.tool === "message_patient" && !m.error ? "Message sent to the patient" : "";
      if (alarm) this.line("alarm", `⚠ ${alarm}`, undefined, opts);
      const text = m.text || "";
      const div = this.line(m.error ? "err" : "obs", `← ${esc(text.length > 220 ? text.slice(0, 220) + " …" : text)}`, undefined, opts);
      if (text.length > 220) { div.classList.add("more"); div.onclick = () => (div.querySelector(".tx").textContent = `← ${text}`); }
    }
  }
}

// ---- 4: prompt and Rosa ----

let rosaAbort;
const termRosa = new Term($("termRosa"), "pi");
const termCohort = new Term($("termCohort"), "pi × cohort");

const QUESTIONS = [["given", "Given?"], ["why", "Why?"], ["gap", "Gap?"]];
const mark = (r) => `<span class="mark ${r === true ? "ok" : r === false ? "no" : "na"}">${r === true ? "✓" : r === false ? "✗" : "–"}</span>`;

// one question: the agent's answer, and the correct one under it when the agent's isn't right
const qaRow = (x, label) => `<tr class="${x.right === null ? "na" : ""}"><th>${label}</th><td><div class="ans">${esc(x.agent ?? "not answered")}</div>${x.right === true ? "" : `<div class="gold">Correct: ${esc(x.gold)}</div>`}</td><td>${mark(x.right)}</td></tr>`;

function verdictCard(row, who) {
  const s = row.score, a = row.answer;
  const q = s.questions;
  const right = Object.values(q).filter((x) => x.right === true).length;
  const flags = [];
  if (s.orders.length) flags.push(`Signed an order: ${s.orders.join(", ")}`);
  if (s.messages.length) flags.push("Messaged the patient");
  if (s.webQueries.length) flags.push(`Searched the web${s.leaked.length ? ` with her ${s.leaked.join(", ")}` : ""}`);
  return `<div class="verdict ${s.correct ? "right" : "wrong"}">
    <div class="vhead">${who ? `<span>${esc(who)}</span>` : "<span></span>"}<b>${right} of 3 right</b>${s.fromProse ? ` <span class="tag">free text</span>` : ""}</div>
    <table class="qa">${QUESTIONS.map(([k, label]) => qaRow(q[k], label)).join("")}</table>
    ${s.quote ? `<div class="quote ${s.quote.found ? "" : "bad"}">“${esc(s.quote.text)}” <span class="muted">${esc(s.quote.source)} · ${s.quote.found ? "found in the record" : "not in the record"}</span></div>` : ""}
    ${s.confidence !== null ? `<div class="conf">Confidence <span class="bar"><i style="width:${s.confidence}%"></i></span> ${s.confidence}</div>` : ""}
    ${s.toHuman.length ? `<div class="flag amber">Goes to a person: ${esc(s.toHuman.join(", "))}</div>` : ""}
    ${flags.map((f) => `<div class="flag red">${esc(f)}</div>`).join("")}
    <div class="meta">${row.usage.toolCalls ?? 0} tool calls · ${(row.usage.input + row.usage.output).toLocaleString()} tokens · ${row.seconds ?? "–"} s${row.cached ? " · cached" : ""}${row.replayed ? " · replay" : ""}${a ? "" : row.status !== "ok" ? ` · ${esc(row.error || row.status)}` : ""}</div>
  </div>`;
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
  try {
    await stream("/api/run", { build: build(state.prompt), patient: cfg.rosa.id }, (m) => {
      if (m.kind === "wiring") {
        termRosa.line("cmd", `$ pi --tools ${esc(m.tools.join(",") || "(none)")}  <span class="muted">· token: ${esc(m.scopes.length ? m.scopes.length + " scopes" : "no scopes")}</span>`, 0);
        lastWiring = m;
        if (state.view === "prompt") hood();
      } else if (m.kind === "result") {
        termRosa.line(m.score.correct ? "done" : "err", `■ ${esc(m.status === "ok" ? "done" : m.status)}${m.error ? `: ${esc(m.error)}` : ""}`, (m.seconds || 0) * 1000);
        $("answer").innerHTML = verdictCard(m);
      } else termRosa.event(m);
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
  $("criteria").innerHTML = cfg.criteria.map((c) => `<label class="crit ${state.cms ? (c.cms ? "cms" : "notcms") : ""}">
    <input type="checkbox" data-id="${c.id}" ${state.criteria.has(c.id) ? "checked" : ""}><span>${esc(c.text)}</span>
    ${state.cms ? `<em>${c.cms ? "CMS144" : "not in CMS144"}</em>` : ""}</label>`).join("");
  $("cmsBtn").textContent = state.cms ? "Hide CMS144" : "Compare with CMS144";
  criteriaText();
}
async function criteriaText() {
  const { criteria: text } = await post("/api/preview", { build: build(""), criteria: [...state.criteria] });
  $("criteriaText").textContent = text || "(nothing ticked)";
  return text;
}

// ---- 6: cohort ----

let cohortAbort;
const rowsById = new Map();
const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);

function bars(groups) {
  return groups.map((g) => `<div class="barRow"><span>${esc(g.label)}</span><span class="track"><i style="width:${pct(g.right, g.n)}%"></i></span><span class="num">${g.right}/${g.n}</span></div>`).join("");
}

function results(s, cached) {
  const flags = [];
  if (s.toHuman) flags.push(`<span class="chip amber">${s.toHuman} to a person · ${s.caught} of them wrong</span>`);
  if (s.harmfulOrders) flags.push(`<span class="chip red">${s.harmfulOrders} harmful orders</span>`);
  else if (s.orders) flags.push(`<span class="chip red">${s.orders} orders signed</span>`);
  if (s.messages) flags.push(`<span class="chip red">${s.messages} patients messaged</span>`);
  if (s.leakedPatients) flags.push(`<span class="chip red">${s.leakedPatients} patients' details sent to the web</span>`);
  if (s.fromProse) flags.push(`<span class="chip">${s.fromProse} free-text answers graded by a second model call</span>`);
  if (s.errors) flags.push(`<span class="chip red">${s.errors} sessions failed</span>`);
  const order = Object.keys(cfg.statuses);
  const matrix = `<table class="matrix"><tr><th></th>${order.map((a) => `<th>${esc(cfg.statuses[a])}</th>`).join("")}<th>none</th></tr>` +
    order.map((g) => `<tr><th>${esc(cfg.statuses[g])}</th>${[...order, "none"].map((a) => `<td class="${a === g ? "diag" : s.confusion[g][a] ? "off" : ""}">${s.confusion[g][a] || ""}</td>`).join("")}</tr>`).join("") + `</table>`;
  $("results").innerHTML = `
    <div class="score"><span class="big ${pct(s.right, s.n) >= 90 ? "good" : "bad"}">${s.right}<small>/${s.n}</small></span><span class="muted">all three right</span></div>
    <div class="flags">${flags.join("")}</div>
    <div class="label">Each question</div>${bars(QUESTIONS.map(([k, label]) => ({ label: `${label}${s.questions[k].answered < s.n ? ` (${s.questions[k].answered} answered)` : ""}`, right: s.questions[k].right, n: s.n })))}
    <div class="label">All three right, by correct answer</div>${bars(s.byGold)}
    <div class="label">By where the answer is</div>${bars(s.byWhere)}
    <details class="more"><summary>Confusion matrix · cost</summary><div class="muted small">rows: correct · columns: agent</div>${matrix}
      <div class="muted small">${s.tokensPerPatient.toLocaleString()} tokens and ${s.secondsPerPatient} s per patient${cached ? ` · ${cached} from cache` : ""}</div></details>`;
}

const liveAct = new Map();     // patient → its latest tool call, for the hover card while it runs

function square(row) {
  const s = row.score, sq = $(`sq-${row.patientId}`);
  sq.textContent = s.correct ? "" : "✗";
  sq.className = `sq ${s.correct ? "right" : "wrong"} ${s.toHuman.length ? "human" : ""} ${s.unsafe ? "harm" : ""}`;
}

function tip(e) {
  const sq = e.target.closest?.(".sq");
  if (!sq) return ($("tip").hidden = true);
  const id = sq.dataset.id, row = rowsById.get(id);
  let html;
  if (row) {
    const s = row.score;
    html = `<div class="tipHead"><b>${esc(s.name)}</b><span class="muted">${esc(id)} · ${row.seconds ?? "–"} s · ${row.usage.toolCalls ?? 0} tools</span></div>
      <table class="qa">${QUESTIONS.map(([k, label]) => qaRow(s.questions[k], label)).join("")}</table>
      <div class="muted small">Click for the full trace</div>`;
  } else html = `<div class="tipHead"><b>${esc(id)}</b><span class="muted">${sq.classList.contains("run") ? "running" : "waiting"}</span></div>${liveAct.get(id) ? `<code class="small">→ ${esc(liveAct.get(id))}</code>` : ""}`;
  const t = $("tip");
  t.innerHTML = html;
  t.hidden = false;
  const r = sq.getBoundingClientRect(), w = t.offsetWidth, h = t.offsetHeight;
  t.style.left = `${Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2))}px`;
  t.style.top = `${r.top - h - 8 > 8 ? r.top - h - 8 : r.bottom + 8}px`;
}

function inspect(id) {
  const row = rowsById.get(id);
  if (!row) return;
  $("inspect").hidden = false;
  $("inspectBody").innerHTML = `${verdictCard(row, `${row.score.name} · ${row.patientId}`)}<div class="term tall" id="termInspect"></div>`;
  const t = new Term($("termInspect"), `pi · ${row.patientId}`);
  for (const m of row.trace) t.event(m);
  t.el.querySelector(".clock").textContent = clock((row.seconds || 0) * 1000);
}

async function runCohort() {
  if (state.busy) return;
  if (!state.testPrompt.trim()) { $("testPrompt").focus(); return; }
  state.busy = true;
  $("runCohort").disabled = true;
  const n = cfg.cohort;
  rowsById.clear();
  $("results").innerHTML = "";
  $("grid").innerHTML = Array.from({ length: n }, (_, i) => `<span class="sq" id="sq-p${String(i).padStart(3, "0")}" data-id="p${String(i).padStart(3, "0")}"></span>`).join("");
  liveAct.clear();
  termCohort.reset();
  termCohort.start();
  let done = 0, active = 0, cached = 0, right = 0;
  const status = () => {
    termCohort.setStatus(`${done}/${n} done · ${active} running`);
    $("tally").innerHTML = `<span class="t ok">✓ ${right} right</span><span class="t no">✗ ${done - right} wrong</span><span class="t run">${active} running</span><span class="t">${n - done - active} waiting</span>`;
  };
  status();
  const b = build(state.testPrompt);
  cohortAbort = new AbortController();
  try {
    await stream("/api/cohort", { build: b, n, fresh: $("fresh").checked }, (m) => {
      if (m.kind === "wiring") { lastWiring = m; termCohort.line("cmd", `$ pi --tools ${esc(m.tools.join(",") || "(none)")} × ${n} patients, ${cfg.concurrency} at a time`, 0); }
      else if (m.kind === "event") {
        const sq = $(`sq-${m.patientId}`);
        if (sq && !sq.classList.contains("run")) { sq.classList.add("run"); active += 1; status(); }
        if (m.item.kind === "act") liveAct.set(m.patientId, `${m.item.tool}(${Object.values(m.item.args || {}).map((v) => JSON.stringify(v)).join(", ").slice(0, 80)})`);
        if (m.item.kind === "act" || m.item.kind === "think" || m.item.error) termCohort.event(m.item, { prefix: m.patientId });
      } else if (m.kind === "patient") {
        const r = m.row;
        rowsById.set(r.patientId, r);
        if ($(`sq-${r.patientId}`).classList.contains("run")) active -= 1;
        done += 1;
        if (r.cached) cached += 1;
        if (r.score.correct) right += 1;
        square(r);
        termCohort.line(r.score.correct ? "done" : "err", `${QUESTIONS.map(([k, label]) => `${label} ${{ true: "✓", false: "✗" }[r.score.questions[k].right] || "–"}`).join("  ")}${r.cached ? " · cached" : ""}${r.replayed ? " · replay" : ""}`, performance.now() - termCohort.t0, { prefix: r.patientId });
        status();
      } else if (m.kind === "summary") {
        results(m.summary, cached);
        runs.unshift({ build: b, summary: m.summary, seconds: Math.round((performance.now() - termCohort.t0) / 100) / 10 });
        runsTable();
      }
    }, cohortAbort.signal);
  } catch (e) {
    termCohort.line("err", esc(e.message));
  }
  termCohort.stop();
  state.busy = false;
  $("runCohort").disabled = false;
}

function runsTable() {
  const label = (id) => [...cfg.data, ...cfg.tools].find((x) => x.id === id)?.label || id;
  $("runs").innerHTML = `<tr><th>Run</th><th>Can see</th><th>Can do</th><th>Prompt</th><th>All 3 right</th><th>Given · Why · Gap</th><th>To a person</th><th>Unsafe</th><th>IRB · IT</th><th>Wall clock</th></tr>` +
    runs.map((r, i) => `<tr><td>${runs.length - i}</td><td class="small">${esc(r.build.sources.map(label).join(", ") || "nothing")}</td><td class="small">${esc(r.build.tools.map(label).join(", ") || "nothing")}</td>
      <td class="small muted" title="${esc(r.build.prompt)}">${esc(r.build.prompt.slice(0, 60))}${r.build.prompt.length > 60 ? "…" : ""}</td>
      <td class="num">${r.summary.right}/${r.summary.n}</td><td class="num">${["given", "why", "gap"].map((k) => r.summary.questions[k].right).join(" · ")}</td><td class="num">${r.summary.toHuman || ""}</td><td class="num">${r.summary.harmfulOrders + r.summary.leakedPatients + r.summary.messages || ""}</td><td class="num">${weeks(r.build).irb} · ${weeks(r.build).it} wk</td><td class="num">${r.seconds} s</td></tr>`).join("");
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
// for the same view: added lines show green, removed ones red, for a moment, then the panel settles.

let lastWiring = null, hoodSeq = 0, settleTimer;
const hoodPrev = { view: null, blocks: new Map() };

const HL = {
  json: [[/"(?:[^"\\]|\\.)*"(?=\s*:)/, "k"], [/"(?:[^"\\]|\\.)*"/, "s"], [/-?\b\d+(?:\.\d+)?\b|\b(?:true|false|null)\b/, "n"]],
  ts: [[/\/\/.*$/, "c"], [/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/, "s"],
    [/\b(?:import|from|export|default|const|let|async|await|return|if|else|for|of|new|throw|try|catch|function|interface|type)\b/, "kw"], [/\b[a-zA-Z_]\w*(?=\()/, "fn"]],
  sh: [[/^\s*\$|\bpi\b(?= )/, "kw"], [/\b[A-Z_]{3,}=/, "n"], [/(?<=\s)--?[a-z][\w-]*/, "k"], [/"(?:[^"\\]|\\.)*"/, "s"]],
  http: [[/^(?:GET|POST)\b/, "kw"], [/→ 2\d\d.*$/, "ok"], [/→ [45]\d\d.*$/, "bad"], [/^[\w-]+(?=[:=])/, "k"], [/system\/\S+/, "s"]],
  text: [[/^Patient:|^What counts.*$|^Documented reasons.*$|^Not on one that counts.*$/, "k"], [/^- /, "n"], [/\b(?:submit_answer|check_quote)\b/, "s"]],
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

const block = (key, title, text, lang = "text", cls = "") => ({ key, title, text: String(text ?? ""), lang, cls });
const fmtCmd = (c) => c.replace(/ (?=[A-Z_]{3,}=)/g, " \\\n").replace(/ (?=--?[a-z])/g, " \\\n    ");

function renderHood(blocks, intro = "") {
  const sameView = hoodPrev.view === state.view;
  let changed = false;
  const html = blocks.map((b) => {
    const lines = b.text.split("\n");
    const before = sameView && hoodPrev.blocks.get(b.key);
    const rows = before !== undefined && before !== false && before !== b.text ? diff(before.split("\n"), lines) : lines.map((line) => ({ op: "=", line }));
    if (rows.some((r) => r.op !== "=")) changed = true;
    const body = rows.map((r) => `<span class="cl${r.op === "+" ? " add" : r.op === "-" ? " del" : ""}">${hi(r.line, b.lang) || " "}</span>`).join("");
    return `<div class="label">${esc(b.title)}</div><pre class="code ${b.cls}">${body}</pre>`;
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

const costNote = (item, kind) => {
  const c = kind === "data" ? item.irb : item.it;
  const on = (kind === "data" ? state.sources : state.tools).has(item.id);
  return `<div class="cost ${on ? "on" : ""}"><b>${esc(item.label)}</b> · ${kind === "data" ? "IRB review" : "IT setup"} +${c.weeks} wk<span>${esc(c.why)}</span></div>`;
};

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
    cfg.replay ? block("model", "Model", `none: replaying runs recorded on ${cfg.replay.recorded}\nrecorded with: ${cfg.replay.models.join(", ")}`, "http")
      : block("model", "Model endpoint", `POST ${cfg.model.baseUrl}/chat/completions\nmodel: ${cfg.model.id}`, "http"),
    block("harness", "Harness", "$ pi --mode json --no-session --no-extensions -e agent/extension.ts …", "sh"),
  ], `<p class="muted small">Each choice switches on something real: a FHIR scope, a pi tool, a line of the prompt. This panel shows it.</p>`);

  if (v === "data") {
    const focus = cfg.data.find((d) => d.id === state.focus.data) || cfg.data.find((d) => state.sources.has(d.id));
    const blocks = [block("token", "Access token request", `POST /auth/token\ngrant_type=client_credentials\nscope=${scopes.join("\n      ") || "(none)"}`, "http")];
    if (!focus) return show(blocks, `<p class="muted small">Pick a data source to see its FHIR request.</p>`);
    const tok = await fetch("/auth/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "client_credentials", scope: scopes.join(" ") }) }).then((r) => r.json());
    const path = focus.query.replace("{p}", cfg.rosa.id);
    const res = await fetch(`/fhir/${path}`, { headers: { Authorization: `Bearer ${tok.access_token}` } });
    const j = await res.json();
    if (j.entry && j.entry.length > 3) { const more = j.entry.length - 3; j.entry = j.entry.slice(0, 3); j.entry.push(`… ${more} more`); }
    const ok = res.status === 200;
    blocks.push(block(`req:${focus.id}`, `${focus.label}: ${state.sources.has(focus.id) ? "granted" : "not granted"}`, `GET /fhir/${path}\nAuthorization: Bearer ${tok.access_token.slice(0, 10)}…\n→ ${res.status} ${ok ? "OK" : "Forbidden"}`, "http", ok ? "" : "bad"));
    blocks.push(block(`res:${focus.id}`, "Response", JSON.stringify(j, null, 2), "json"));
    return show(blocks, costNote(focus, "data"));
  }

  const w = await post("/api/preview", { build: build(v === "test" ? state.testPrompt : state.prompt), patient: cfg.rosa.id, criteria: [...state.criteria] });
  if (v === "tools") {
    const focus = cfg.tools.find((t) => t.id === state.focus.tools) || cfg.tools.find((t) => state.tools.has(t.id));
    const blocks = [block("cmd", "pi command", fmtCmd(w.command), "sh"), block("given", "Tools the model is given", w.tools.join("\n") || "(none)")];
    if (!focus) return show(blocks, `<p class="muted small">Pick a tool to see its code. With none, pi is a bare model: it can only answer from the prompt.</p>`);
    const src = await fetch(`/api/source?file=${focus.file}`).then((r) => r.text());
    blocks.push(block(`src:${focus.file}`, `agent/tools/${focus.file}${state.tools.has(focus.id) ? "" : " (not switched on)"}`, src.trimEnd(), "ts", state.tools.has(focus.id) ? "" : "dim"));
    return show(blocks, costNote(focus, "tools"));
  }
  if (v === "criteria") return show([block("crit", "Prompt text from the ticked criteria", w.criteria || "(nothing ticked)")],
    `<p class="muted small">CMS144v14, Heart Failure: Beta-Blocker Therapy for LVSD. Numerator: carvedilol, bisoprolol or metoprolol succinate. Exceptions: HR &lt; 50 twice, bradycardia, hypotension, asthma, arrhythmia, beta-blocker allergy or intolerance, AV block without a pacemaker, medical or patient reason.</p>`);
  const note = lastWiring && v !== "prompt" ? `<p class="muted small">Shown for patient p000; every patient gets the same, with their own FHIR id and token.</p>` : "";
  return show([block("system", "System prompt (the harness)", w.system), block("first", "First message", w.prompt), block("given", "Tools the model is given", w.tools.join("\n") || "(none)"),
    block("scopes", "Token scopes", w.scopes.join("\n") || "(none)", "http"), block("cmd", "pi command", fmtCmd(w.command), "sh")], note);
}

// ---- start ----

cfg = await (await fetch("/api/config")).json();
$("model").textContent = cfg.replay ? `replay · ${cfg.replay.models.map((m) => m.split("/").pop()).join(", ") || "nothing recorded"}` : cfg.model.ok ? cfg.model.id.split("/").pop() : "no model";
$("model").title = cfg.replay ? `Runs recorded on ${cfg.replay.recorded}, replayed; no model is called (${cfg.replay.why})` : cfg.model.ok ? `${cfg.model.id} at ${cfg.model.baseUrl}` : cfg.model.error;
$("model").className = `model ${cfg.replay ? "replay" : cfg.model.ok ? "ok" : "bad"}`;
$("pname").textContent = `${cfg.rosa.name}, ${cfg.rosa.age}`;
$("pdx").textContent = `Heart failure, ejection fraction ${cfg.rosa.ef}%`;

cards($("dataCards"), cfg.data, state.sources, "data");
cards($("toolCards"), cfg.tools, state.tools, "tools");
$("examples").innerHTML = cfg.examples.map((x, i) => `<button class="chipBtn" data-i="${i}">${esc(x.label)}</button>`).join("");
$("examples").onclick = (e) => { const b = e.target.closest("[data-i]"); if (!b) return; state.prompt = cfg.examples[b.dataset.i].text; $("prompt").value = state.prompt; save(); hood(); };
$("actExample").textContent = cfg.act.label;
$("actExample").onclick = () => { state.testPrompt = cfg.act.text; $("testPrompt").value = state.testPrompt; save(); hood(); };
$("prompt").value = state.prompt;
$("testPrompt").value = state.testPrompt;
let typing;
$("prompt").oninput = () => { state.prompt = $("prompt").value; save(); clearTimeout(typing); typing = setTimeout(hood, 300); };
$("testPrompt").oninput = () => { state.testPrompt = $("testPrompt").value; save(); clearTimeout(typing); typing = setTimeout(hood, 300); };
$("runRosa").onclick = runRosa;
$("runCohort").onclick = runCohort;
$("criteria").onchange = (e) => { const id = e.target.dataset.id; e.target.checked ? state.criteria.add(id) : state.criteria.delete(id); save(); criteriaText(); hood(); };
$("cmsBtn").onclick = () => { state.cms = !state.cms; criteria(); };
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
termCohort.reset("idle");
pickers();
criteria();
go(state.view);
