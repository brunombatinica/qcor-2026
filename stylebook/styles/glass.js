// Glass: visionOS / "liquid glass". Frosted translucent panes over soft colour, specular rims, depth.
const SF = `"SF Pro Display", -apple-system, system-ui, BlinkMacSystemFont, "Helvetica Neue", sans-serif`;
const BASE = "#160f33", PINK = "#ff5fa2", ORANGE = "#ff9a3c", CYAN = "#33d1ff", VIOLET = "#7b5cff", W = "#ffffff";

// one glyph family on a 24 grid, 2 px white strokes
const GLY = {
  man: `<circle cx="12" cy="8" r="3.6"/><path d="M5 19.5 C5.6 15.6 8.4 13.8 12 13.8 S18.4 15.6 19 19.5"/>`,
  woman: `<path d="M10.6 4.9 A3.6 3.6 0 1 0 13.4 4.9 A1.9 1.9 0 1 0 10.6 4.9 Z"/><path d="M5 19.5 C5.6 15.6 8.4 13.8 12 13.8 S18.4 15.6 19 19.5"/>`,
  heart: `<path d="M12 19.5 C5.5 15.5 3.5 12 3.5 9.2 3.5 6.6 5.5 4.6 8 4.6 9.7 4.6 11.1 5.5 12 7 12.9 5.5 14.3 4.6 16 4.6 18.5 4.6 20.5 6.6 20.5 9.2 20.5 12 18.5 15.5 12 19.5 Z"/>`,
  pill: `<g transform="rotate(-45 12 12)"><rect x="4" y="8.5" width="16" height="7" rx="3.5"/><path d="M12 8.5 V15.5"/></g>`,
  note: `<path d="M7 3.5 H14 L18.5 8 V19.5 A1 1 0 0 1 17.5 20.5 H7 A1 1 0 0 1 6 19.5 V4.5 A1 1 0 0 1 7 3.5 Z M14 3.5 V8 H18.5 M9 12.5 H15.5 M9 16 H13.5"/>`,
  search: `<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15 L20 20"/>`,
  database: `<ellipse cx="12" cy="6" rx="7" ry="2.6"/><path d="M5 6 V18 C5 19.4 8.1 20.6 12 20.6 S19 19.4 19 18 V6 M5 12 C5 13.4 8.1 14.6 12 14.6 S19 13.4 19 12"/>`,
  tool: `<path d="M15 4 A4.5 4.5 0 0 0 11.2 10.2 L4.6 16.8 A1.8 1.8 0 0 0 7.2 19.4 L13.8 12.8 A4.5 4.5 0 0 0 20 9 L17.2 10.2 L14.8 7.8 L16 5 Z"/>`,
  agent: `<path d="M19 11 A7.2 7.2 0 0 0 6.2 7.4 M5 13 A7.2 7.2 0 0 0 17.8 16.6 M19.6 6.4 L19 11 L14.6 10.2 M4.4 17.6 L5 13 L9.4 13.8"/>`,
  check: `<circle cx="12" cy="12" r="8.5"/><path d="M8.2 12.3 L10.9 15 L16 9.5"/>`,
  warning: `<path d="M10.3 4.6 A2 2 0 0 1 13.7 4.6 L20.6 16.8 A2 2 0 0 1 18.9 19.8 H5.1 A2 2 0 0 1 3.4 16.8 Z M12 9.5 V13.2 M12 16.4 V16.5"/>`,
};

// a glass tile over two soft colours: the frost is a blurred copy of the colour, clipped to the tile
const tile = (p, k, size = 48) => {
  const s = size / 48;
  return `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="${p}-a"><stop offset="0" stop-color="${PINK}"/><stop offset="1" stop-color="${PINK}" stop-opacity="0"/></radialGradient>
      <radialGradient id="${p}-b"><stop offset="0" stop-color="${VIOLET}"/><stop offset="1" stop-color="${VIOLET}" stop-opacity="0"/></radialGradient>
      <g id="${p}-bd"><circle cx="17" cy="16" r="16" fill="url(#${p}-a)"/><circle cx="32" cy="32" r="16" fill="url(#${p}-b)"/></g>
      <filter id="${p}-f" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/><feColorMatrix type="saturate" values="1.5"/></filter>
      <filter id="${p}-s" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4"/></filter>
      <clipPath id="${p}-c"><rect x="6" y="6" width="36" height="36" rx="11"/></clipPath>
      <linearGradient id="${p}-r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".5" stop-color="#fff" stop-opacity=".15"/><stop offset="1" stop-color="#fff" stop-opacity=".5"/></linearGradient>
      <linearGradient id="${p}-t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".36"/><stop offset="1" stop-color="#fff" stop-opacity=".08"/></linearGradient>
    </defs>
    <use href="#${p}-bd"/>
    <rect x="7" y="10" width="36" height="36" rx="11" fill="#0a0420" opacity=".35" filter="url(#${p}-s)"/>
    <g clip-path="url(#${p}-c)"><rect width="48" height="48" fill="${BASE}" opacity=".5"/><use href="#${p}-bd" filter="url(#${p}-f)"/></g>
    <rect x="6" y="6" width="36" height="36" rx="11" fill="url(#${p}-t)" stroke="url(#${p}-r)" stroke-width="${(1.2 / s).toFixed(2)}"/>
    <g transform="translate(12 12)" fill="none" stroke="#fff" stroke-width="${(2 / Math.sqrt(s)).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round">${GLY[k]}</g>
  </svg>`;
};

// ---------- people: two of the glass tiles, larger ----------
const people = `<div style="display:grid; grid-template-columns:1fr 1fr; gap:4%; padding:0 2%">${tile("glass-pm", "man", 200)}${tile("glass-pw", "woman", 200)}</div>`;

// ---------- slide ----------
const css = `
.s-glass .s-glass-slide { position: relative; width: 1280px; height: 720px; overflow: hidden; font-family: ${SF}; color: ${W}; -webkit-font-smoothing: antialiased;
  background: radial-gradient(520px 420px at 12% 18%, ${PINK} 0%, transparent 70%), radial-gradient(560px 460px at 86% 14%, ${CYAN} 0%, transparent 70%),
    radial-gradient(600px 420px at 70% 92%, ${ORANGE} 0%, transparent 70%), radial-gradient(520px 420px at 22% 96%, ${VIOLET} 0%, transparent 70%), ${BASE}; }
.s-glass .s-glass-a { position: absolute; }
.s-glass .s-glass-pane { position: absolute; border-radius: 30px; box-sizing: border-box; background: linear-gradient(140deg, rgba(255,255,255,.24), rgba(255,255,255,.07) 45%, rgba(255,255,255,.05));
  -webkit-backdrop-filter: blur(30px) saturate(170%); backdrop-filter: blur(30px) saturate(170%);
  box-shadow: inset 0 1.5px 0 rgba(255,255,255,.6), inset 1px 0 0 rgba(255,255,255,.22), inset 0 -1px 0 rgba(255,255,255,.1), 0 30px 60px rgba(10,4,40,.32); }
.s-glass .s-glass-node { padding: 22px 24px; }
.s-glass .s-glass-h { font-size: 22px; font-weight: 700; letter-spacing: -.02em; margin-bottom: 6px; }
.s-glass .s-glass-t { font-size: 16px; font-weight: 500; line-height: 1.4; color: rgba(255,255,255,.82); }
.s-glass .s-glass-lab { font-size: 15px; font-weight: 600; color: rgba(255,255,255,.88); }
.s-glass .s-glass-cap { height: 30px; border-radius: 15px; padding: 0 14px; display: inline-flex; align-items: center; font-size: 15px; font-weight: 600;
  background: rgba(255,255,255,.16); box-shadow: inset 0 1px 0 rgba(255,255,255,.5); margin: 0 0 8px; white-space: nowrap; }
`;

const BARS = [[1, "Model alone"], [2, "+ chart pasted"], [4, "+ tools"], [5, "+ checks"]];
const NY = 352, NH = 204, NW = 216, X = [92, 356, 708, 972], MID = NY + NH / 2;

const slide = `<div class="s-glass-slide">
  <div class="s-glass-pane" style="left:40px; top:28px; width:1200px; height:596px; border-radius:46px"></div>
  <div class="s-glass-a s-glass-cap" style="left:92px; top:64px">Part 4 · Agents</div>
  <div class="s-glass-a" style="left:92px; top:118px; font-size:62px; font-weight:700; letter-spacing:-.03em; line-height:1.02">An agent is<br>a model in a loop</div>

  <div class="s-glass-pane" style="left:868px; top:64px; width:320px; height:232px"></div>
  <div class="s-glass-a s-glass-lab" style="left:892px; top:86px">Questions right, of 5</div>
  ${BARS.map(([v, t], i) => `
    <div class="s-glass-a" style="left:${900 + i * 72}px; top:124px; width:40px; height:110px; border-radius:20px; background:rgba(255,255,255,.1); box-shadow: inset 0 1px 0 rgba(255,255,255,.45)"></div>
    <div class="s-glass-a" style="left:${904 + i * 72}px; top:${128 + 102 - v * 20.4}px; width:32px; height:${v * 20.4}px; border-radius:16px; background:${i === 3 ? `linear-gradient(180deg, #ffc2dc, ${PINK})` : "rgba(255,255,255,.75)"}; box-shadow: 0 0 18px ${i === 3 ? PINK : "rgba(255,255,255,.35)"}"></div>
    <div class="s-glass-a" style="left:${900 + i * 72}px; top:${128 + 102 - v * 20.4 - 26}px; width:40px; text-align:center; font-size:16px; font-weight:700">${v}</div>
    <div class="s-glass-a" style="left:${884 + i * 72}px; top:242px; width:72px; text-align:center; font-size:11.5px; font-weight:600; line-height:1.15; color:rgba(255,255,255,.8)">${t.replace("chart pasted", "chart<br>pasted")}</div>`).join("")}

  <svg class="s-glass-a" style="left:0; top:0" width="1280" height="720" viewBox="0 0 1280 720">
    <defs><marker id="glass-ah" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M1 1 L8 5 L1 9" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>
    <g fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".92">
      <path d="M${X[0] + NW + 10} ${MID} H${X[1] - 12}" marker-end="url(#glass-ah)"/>
      <path d="M${X[1] + NW + 10} ${MID - 40} C${X[1] + NW + 56} ${MID - 96} ${X[2] - 56} ${MID - 96} ${X[2] - 12} ${MID - 40}" marker-end="url(#glass-ah)"/>
      <path d="M${X[2] - 10} ${MID + 40} C${X[2] - 56} ${MID + 96} ${X[1] + NW + 56} ${MID + 96} ${X[1] + NW + 12} ${MID + 40}" marker-end="url(#glass-ah)"/>
      <path d="M${X[2] + NW + 10} ${MID} H${X[3] - 12}" marker-end="url(#glass-ah)"/>
    </g>
  </svg>
  <div class="s-glass-a s-glass-lab" style="left:${X[1] + NW}px; top:${MID - 126}px; width:${X[2] - X[1] - NW}px; text-align:center; white-space:nowrap">Think → Act → Observe</div>

  <div class="s-glass-pane s-glass-node" style="left:${X[0]}px; top:${NY}px; width:${NW}px; height:${NH}px"><div class="s-glass-h">Rosa’s chart</div><div class="s-glass-t">612 notes</div></div>
  <div class="s-glass-pane s-glass-node" style="left:${X[1]}px; top:${NY}px; width:${NW}px; height:${NH}px; background:linear-gradient(140deg, rgba(255,95,162,.42), rgba(123,92,255,.3))"><div class="s-glass-h">Model</div><div class="s-glass-t">reads, decides<br>the next step</div></div>
  <div class="s-glass-pane s-glass-node" style="left:${X[2]}px; top:${NY}px; width:${NW}px; height:${NH}px"><div class="s-glass-h">Tools</div>
    <div class="s-glass-cap">search</div><br><div class="s-glass-cap">read a note</div><br><div class="s-glass-cap">labs</div></div>
  <div class="s-glass-pane s-glass-node" style="left:${X[3]}px; top:${NY}px; width:${NW}px; height:${NH}px"><div class="s-glass-h">Answer</div>
    <div style="font-size:22px; font-weight:700">EF 30%</div>
    <div class="s-glass-t">metoprolol tartrate<br>→ a gap</div>
    <div style="font-size:16px; font-weight:700; margin-top:8px">“LVEF 30%”</div><div class="s-glass-t" style="font-size:13.5px">Echo, 10/02</div></div>

  <div class="s-glass-a s-glass-lab" style="left:64px; top:660px; font-size:14px">QCOR 2026 · Build an agent, live</div>
  <div class="s-glass-a s-glass-lab" style="right:64px; top:660px; font-size:14px">14</div>
</div>`;

const icons = [["patient", "man"], ["heart"], ["pill"], ["note"], ["search"], ["database"], ["tool"], ["agent"], ["check"], ["warning"]]
  .map(([n, k], i) => [n, tile(`glass-i${i}`, k || n)]);

export default {
  id: "glass",
  name: "Glass",
  after: "visionOS windows; Apple’s 2025 “liquid glass”; frosted UI over colour",
  note: "Translucent, frosted panes floating over soft colour, with bright rims and real depth. Four equal panes; only the model is tinted, and only the best score glows pink. Feels like the future, stays readable because every pane is frosted.",
  palette: [[BASE, "deep violet"], [PINK, "pink"], [CYAN, "cyan"], [ORANGE, "orange"], [VIOLET, "violet"], [W, "white glass"]],
  type: "SF Pro (system-ui) Bold for titles, Semibold and Medium for text",
  ground: BASE,
  peopleGround: `radial-gradient(260px 220px at 25% 40%, ${PINK}66, transparent 70%), radial-gradient(260px 220px at 75% 60%, ${VIOLET}88, transparent 70%), ${BASE}`,
  iconGround: `radial-gradient(600px 160px at 15% 0%, ${VIOLET}55, transparent 70%), radial-gradient(600px 160px at 85% 100%, ${PINK}44, transparent 70%), ${BASE}`,
  iconInk: "#fff",
  css,
  people,
  slide,
  icons,
};
