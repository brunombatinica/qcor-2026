// The book's last pages: the assets already built for the deck and demo (they used to be ../gallery.html).
// Each item has a key so it can be picked with ★ like a style.
import { ICON_NAMES, lineIcon } from "../shared/icons.js";

const S = "../shared/";

const PORTRAITS = [
  ["rosa-default", "Default", "generic woman icon; shared/rosa.svg, in use"],
  ["rosa-flat", "Flat", "simple shapes"],
  ["rosa-memphis", "Corporate Memphis", "exaggerated, playful"],
  ["rosa-academic", "Academic figure", "outlined, like a paper figure"],
  ["rosa-line", "Line", "matches the line icons"],
  ["rosa-pixel", "8-bit", "pixel art"],
  ["rosa-badge", "Badge", "initials only"],
];

// each colour means one thing everywhere; three icons show it in use
const COLOURS = [
  ["#ffb547", "Amber", "emphasis, the model", ["llm", "agent", "sparkle"]],
  ["#6ea8fe", "Blue", "context, data", ["note", "database", "echo"]],
  ["#b794f6", "Violet", "tools, harness", ["tool", "harness", "search"]],
  ["#4ade80", "Green", "right", ["check", "shield", "quote"]],
  ["#ff6b6b", "Red", "wrong, invented", ["x", "warning", "ghost"]],
  ["#8e8e93", "Grey", "secondary text", ["clock", "calendar", "link"]],
];

// lobehub/icons (MIT) and simple-icons (si-*, CC0); the marks belong to their owners
const LOGOS = [
  ["Labs", "who makes the frontier models", [["openai", "OpenAI"], ["anthropic", "Anthropic"], ["google-color", "Google"], ["meta-color", "Meta"], ["xai", "xAI"], ["microsoft-color", "Microsoft"], ["nvidia-color", "NVIDIA"], ["apple", "Apple"]]],
  ["Assistants", "the chat products people already know", [["claude-color", "Claude"], ["gemini-color", "Gemini"], ["grok", "Grok"], ["copilot-color", "Copilot"], ["perplexity-color", "Perplexity"], ["poe-color", "Poe"]]],
  ["Open-weight models", "weights you can download and run inside the hospital", [["gemma-color", "Gemma"], ["qwen-color", "Qwen"], ["deepseek-color", "DeepSeek"], ["mistral-color", "Mistral"], ["cohere-color", "Cohere"], ["stability-color", "Stability"]]],
  ["Run your own", "where open models are hosted and served", [["huggingface-color", "Hugging Face"], ["ollama", "Ollama"], ["vllm-color", "vLLM"], ["openrouter-color", "OpenRouter"], ["groq", "Groq"], ["together-color", "Together"], ["fireworks-color", "Fireworks"]]],
  ["Coding agents", "harnesses: a model in a loop with tools", [["claudecode-color", "Claude Code"], ["codex-color", "Codex"], ["cursor", "Cursor"], ["githubcopilot", "GitHub Copilot"], ["windsurf", "Windsurf"]]],
  ["Frameworks", "libraries for building agents", [["langchain-color", "LangChain"], ["langgraph-color", "LangGraph"], ["llamaindex-color", "LlamaIndex"]]],
  ["Sources", "where a model's training text and a search tool's answers come from", [["si-pubmed", "PubMed"], ["si-googlescholar", "Google Scholar"], ["si-arxiv", "arXiv"], ["si-wikipedia", "Wikipedia"], ["si-stackoverflow", "Stack Overflow"], ["si-github", "GitHub"], ["si-reddit", "Reddit"], ["si-youtube", "YouTube"], ["si-newyorktimes", "New York Times"]]],
];

const CHARTS = [
  ["charts/metr-length-of-tasks-log.png", "METR, task-completion time horizons (2026 update)"],
  ["charts/metr-time-horizons-domains.png", "METR, time horizons across domains"],
  ["charts/owid-ai-test-scores.svg", "Our World in Data (CC BY), Kiela et al. 2023"],
  ["charts/owid-ai-training-compute.svg", "Our World in Data (CC BY), Epoch AI"],
];
const SITES = [
  ["sites/aha-gwtg-hf.jpg", "AHA Get With The Guidelines – Heart Failure"],
  ["sites/acc-ncdr.jpg", "ACC NCDR registries"],
  ["sites/cms-hrrp.jpg", "CMS Hospital Readmissions Reduction Program"],
  ["karpathy.jpg", "Andrej Karpathy's avatar, for the “ghosts” tweet"],
];

export const ASSET_PAGES = [
  { id: "a-rosa", name: "People" },
  { id: "a-icons", name: "Icons and colour" },
  { id: "a-logos", name: "Logos" },
  { id: "a-charts", name: "Charts and screenshots" },
];

export const ASSET_LABELS = {};

export function assetsCSS() {
  return `
  .apage .sec { margin: 30px 0 10px; display: flex; align-items: baseline; gap: 12px; }
  .apage .sec h3 { margin: 0; font-size: 18px; letter-spacing: -0.01em; }
  .apage .sec span { color: var(--muted); font-size: 13px; }
  .apage .tiles { display: grid; gap: 12px; }
  .apage .tile { position: relative; background: #1d1d1c; border-radius: 14px; padding: 16px 12px 12px; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; box-shadow: 0 0 0 1px rgba(255,255,255,0.06); }
  .apage .tile .t-name { font-weight: 600; font-size: 13px; } .apage .tile .t-sub { color: var(--muted); font-size: 11.5px; }
  .apage .tile .star { top: 6px; right: 6px; width: 26px; height: 26px; line-height: 26px; font-size: 13px; }
  .apage .tile:hover .star { opacity: 1; }
  .portraits { grid-template-columns: repeat(7, minmax(0, 1fr)); } .portraits img { width: 100%; max-width: 120px; aspect-ratio: 1; opacity: .85; }
  .peoplegrid { grid-template-columns: repeat(3, minmax(0, 1fr)); } .peoplegrid .tile { padding: 34px 12px 18px; }
  .pair { display: flex; gap: 22px; align-items: center; justify-content: center; margin-bottom: 10px; }
  .duo.big { width: 120px; height: 120px; border-radius: 30px; } .duo.big svg { width: 72px; height: 72px; }
  .duo { width: 56px; height: 56px; display: grid; place-items: center; border-radius: 16px; background: color-mix(in srgb, var(--c, #ffb547) 15%, transparent); color: var(--c, #ffb547); }
  .duo svg { width: 30px; height: 30px; }
  .icongrid { grid-template-columns: repeat(auto-fill, minmax(92px, 1fr)); gap: 8px; }
  .icongrid .tile { background: transparent; box-shadow: none; padding: 10px 4px 8px; }
  .icongrid .tile:hover { background: #1d1d1c; }
  .icongrid .t-sub { font-size: 10.5px; }
  .colours { grid-template-columns: repeat(6, minmax(0, 1fr)); }
  .colours .tile { align-items: stretch; text-align: left; padding: 0; overflow: hidden; }
  .colours .bar { height: 54px; } .colours .body { padding: 10px 12px 14px; } .colours .row { display: flex; gap: 8px; margin-top: 10px; }
  .colours .duo { width: 44px; height: 44px; border-radius: 12px; } .colours .duo svg { width: 24px; height: 24px; }
  .logos { grid-template-columns: repeat(auto-fill, minmax(118px, 1fr)); }
  .logos .mark { width: 52px; height: 52px; display: grid; place-items: center; color: var(--ink); } .logos .mark svg { width: 100%; height: 100%; }
  .apage.light .logos .tile { background: #f5f5f2; } .apage.light .logos .t-name { color: #111; } .apage.light .logos .mark { color: #111; }
  .flip { margin-left: auto; border: 1px solid #444; background: #232322; color: var(--ink); border-radius: 999px; padding: 6px 14px; font-size: 12px; cursor: pointer; }
  .charts { grid-template-columns: repeat(2, minmax(0, 1fr)); } .charts img { width: 100%; height: auto; border-radius: 8px; background: #fff; }
  .sites { grid-template-columns: repeat(4, minmax(0, 1fr)); } .sites img { width: 100%; height: 190px; object-fit: cover; object-position: top; border-radius: 8px; }
  .credit { color: var(--muted); font-size: 12px; margin-top: 26px; }`;
}

const head = (num, name, after, note, extra = "") => `<div class="head"><div class="num">${num}</div><div><h2>${name}</h2><div class="after">${after}</div><p class="note">${note}</p></div><div>${extra}</div></div>`;

export function assetsHTML(firstNum, star) {
  const tile = (key, label, inner, cls = "") => { ASSET_LABELS[key] = label; return `<div class="tile ${cls}">${star(key)}${inner}</div>`; };
  const [n1, n2, n3, n4] = [0, 1, 2, 3].map((i) => firstNum + i);

  const pair = (f) => `<div class="pair">${f("man")}${f("woman")}</div>`;
  const rosa = `<section class="page apage" id="a-rosa">
    ${head(n1, "People", "shared/icons.js (man, woman); earlier Rosa portraits in shared/portraits/", "A man and a woman, drawn as plainly as the icon set. The Rosa portraits below are the earlier drafts the deck still uses (shared/rosa.svg is the default).")}
    <div class="sec"><h3>The pair</h3><span>the same two glyphs, three ways</span></div>
    <div class="tiles peoplegrid">
      ${tile("a-people:line", "People · line", `${pair((n) => lineIcon(n, { size: 120, stroke: 1.5, color: "#f2f1ed" }))}<div class="t-name">Line</div><div class="t-sub">1.5 px on the 24 grid</div>`)}
      ${tile("a-people:duotone", "People · duotone", `${pair((n) => `<span class="duo big" style="--c:${n === "man" ? "#6ea8fe" : "#ffb547"}">${lineIcon(n, { stroke: 1.5 })}</span>`)}<div class="t-name">Duotone</div><div class="t-sub">a soft tile in the icon's colour</div>`)}
      ${tile("a-people:solid", "People · amber line", `${pair((n) => lineIcon(n, { size: 120, stroke: 2.2, color: "#ffb547" }))}<div class="t-name">Amber</div><div class="t-sub">heavier, for the projector</div>`)}
    </div>
    <div class="sec"><h3>Earlier drafts</h3><span>Rosa, as the deck draws her now</span></div>
    <div class="tiles portraits">${PORTRAITS.map(([f, t, sub]) => tile(`a-rosa:${f}`, `Rosa portrait · ${t}`, `<img src="${S}portraits/${f}.svg" alt=""${f === "rosa-pixel" ? ' style="image-rendering:pixelated"' : ""}><div class="t-name">${t}</div><div class="t-sub">${sub}</div>`)).join("")}</div>
  </section>`;

  const icons = `<section class="page apage" id="a-icons">
    ${head(n2, "Icons and colour", "shared/icons.js, drawn duotone", "The whole set in the duotone style: a line icon on a soft tile of its own colour. Amber is the default; each colour below means one thing everywhere in the deck.")}
    <div class="sec"><h3>Colour</h3><span>black background; one meaning per colour</span></div>
    <div class="tiles colours">${COLOURS.map(([c, t, m, ns]) => tile(`a-colour:${t.toLowerCase()}`, `Colour · ${t}`, `<div class="bar" style="background:${c}"></div><div class="body"><div class="t-name">${t} <span class="t-sub">${c}</span></div><div class="t-sub">${m}</div><div class="row">${ns.map((n) => `<span class="duo" style="--c:${c}">${lineIcon(n)}</span>`).join("")}</div></div>`)).join("")}</div>
    <div class="sec"><h3>The set</h3><span>${ICON_NAMES.length} icons, duotone amber</span></div>
    <div class="tiles icongrid">${ICON_NAMES.map((n) => tile(`a-icon:${n}`, `Icon · ${n}`, `<span class="duo">${lineIcon(n)}</span><div class="t-sub">${n}</div>`)).join("")}</div>
  </section>`;

  const logos = `<section class="page apage" id="a-logos">
    ${head(n3, "Logos", "lobehub/icons (MIT) and simple-icons (CC0), in shared/logos/", "Grouped by what they stand for in the talk. The marks belong to their owners.", `<button class="flip" data-flip="a-logos">Show on white</button>`)}
    ${LOGOS.map(([t, sub, items]) => `<div class="sec"><h3>${t}</h3><span>${sub}</span></div>
      <div class="tiles logos">${items.map(([f, name]) => tile(`a-logo:${f}`, `Logo · ${name}`, `<div class="mark" data-logo="${f}"></div><div class="t-name">${name}</div>`)).join("")}</div>`).join("")}
  </section>`;

  const charts = `<section class="page apage" id="a-charts">
    ${head(n4, "Charts and screenshots", "shared/charts/, shared/sites/", "Published charts the talk uses, with their sources, and the screenshots for the quality-programme slides.")}
    <div class="sec"><h3>Charts</h3><span>check the METR licence before the day; OWID is CC BY</span></div>
    <div class="tiles charts">${CHARTS.map(([f, src]) => tile(`a-chart:${f}`, `Chart · ${src}`, `<img src="${S}${f}" alt=""><div class="t-sub">${src}</div>`)).join("")}</div>
    <div class="sec"><h3>Screenshots</h3><span>programme sites, and the Karpathy avatar (licence to check)</span></div>
    <div class="tiles sites">${SITES.map(([f, src]) => tile(`a-site:${f}`, `Screenshot · ${src}`, `<img src="${S}${f}" alt=""${f === "karpathy.jpg" ? ' style="object-fit:contain;background:#000"' : ""}><div class="t-sub">${src}</div>`)).join("")}</div>
  </section>`;

  return rosa + icons + logos + charts;
}

/** Inline each logo so single-colour marks take the page's text colour. */
export async function inlineLogos(root = document) {
  await Promise.all([...root.querySelectorAll("[data-logo]")].map(async (el) => {
    let svg = await fetch(`${S}logos/${el.dataset.logo}.svg`).then((r) => r.text());
    if (el.dataset.logo.startsWith("si-") && !/^<svg[^>]*\sfill=/.test(svg)) svg = svg.replace("<svg", '<svg fill="currentColor"');
    el.innerHTML = svg;
  }));
}
