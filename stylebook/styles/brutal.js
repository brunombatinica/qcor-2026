// Neo-brutalism: thick black borders, hard offset shadows, flat saturated colour, a chunky sans and a mono. Disciplined.
const K = "#111111", Y = "#ffd23f", PK = "#ff7ac6", MT = "#7ef0c0", LL = "#b9a6ff", CR = "#fff8ea", W = "#ffffff";
const CHUNK = `"Arial Black", "Helvetica Neue", Arial, sans-serif`;
const MONO = `Menlo, "PT Mono", "Courier New", monospace`;

// one glyph family on a 48 grid, 3.4 px black strokes
const GLY = {
  man: `<circle cx="24" cy="19" r="6"/><path d="M12 38 C12 31 17 28 24 28 C31 28 36 31 36 38 Z"/>`,
  woman: `<path d="M22.09 13.31 A6 6 0 1 0 25.91 13.31 A3 3 0 1 0 22.09 13.31 Z"/><path d="M12 38 C12 31 17 28 24 28 C31 28 36 31 36 38 Z"/>`,
  heart: `<path d="M24 37 C13.5 30 10.5 25 10.5 20 C10.5 15.8 13.6 13 17.3 13 C20.2 13 22.6 14.6 24 17 C25.4 14.6 27.8 13 30.7 13 C34.4 13 37.5 15.8 37.5 20 C37.5 25 34.5 30 24 37 Z"/>`,
  pill: `<g transform="rotate(-45 24 24)"><rect x="11" y="18" width="26" height="12" rx="6"/><path d="M24 18 V30"/></g>`,
  note: `<path d="M14 10 H28 L34 16 V38 H14 Z M28 10 V16 H34 M19 23 H29 M19 29 H29"/>`,
  search: `<circle cx="22" cy="22" r="8.5"/><path d="M28.5 28.5 L36 36"/>`,
  database: `<ellipse cx="24" cy="14" rx="11" ry="4"/><path d="M13 14 V34 C13 36.2 18 38 24 38 S35 36.2 35 34 V14 M13 24 C13 26.2 18 28 24 28 S35 26.2 35 24"/>`,
  tool: `<path d="M29.5 11 A6.5 6.5 0 0 0 23.6 19.6 L12.5 30.7 A2.5 2.5 0 0 0 16 34.2 L27.1 23.1 A6.5 6.5 0 0 0 35.7 17.2 L31.6 18.6 L28.9 15.9 L30.3 11.8 Z"/>`,
  agent: `<path d="M34 21 A10.5 10.5 0 0 0 15 16.5 M14 27 A10.5 10.5 0 0 0 33 31.5 M35.5 14.5 L34 21 L27.8 19.5 M12.5 33.5 L14 27 L20.2 28.5"/>`,
  check: `<path d="M13 24.5 L20.5 32 L35 16.5"/>`,
  warning: `<path d="M24 10 L38.5 36 H9.5 Z M24 20 V27 M24 31.5 V31.6"/>`,
};
const TILE = [Y, PK, MT, LL];
const tile = (k, fill, size = 48) => `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <rect x="6" y="6" width="38" height="38" rx="6" fill="${K}"/>
  <rect x="3" y="3" width="38" height="38" rx="6" fill="${fill}" stroke="${K}" stroke-width="${(3 * 48 / size * (size > 48 ? 1.6 : 1)).toFixed(2)}"/>
  <g transform="translate(-2 -2)" fill="none" stroke="${K}" stroke-width="${size > 48 ? 2.6 : 3.4}" stroke-linecap="round" stroke-linejoin="round">${GLY[k]}</g></svg>`;

// ---------- people: two of the tiles, larger ----------
const people = `<div style="display:grid; grid-template-columns:1fr 1fr; gap:6%; padding:0 3%">${tile("man", LL, 160)}${tile("woman", MT, 160)}</div>`.replace('padding:0 3%', 'padding:0 8%');

// ---------- slide ----------
const css = `
.s-brutal .s-brutal-slide { position: relative; width: 1280px; height: 720px; overflow: hidden; color: ${K}; font-family: ${CHUNK}; background: ${CR}; }
.s-brutal .s-brutal-a { position: absolute; }
.s-brutal .s-brutal-box { position: absolute; border: 4px solid ${K}; border-radius: 12px; box-shadow: 6px 6px 0 ${K}; background: ${W}; box-sizing: border-box; overflow: hidden; }
.s-brutal .s-brutal-mono { font-family: ${MONO}; font-weight: 700; }
.s-brutal .s-brutal-head { position: absolute; left: 0; top: 0; right: 0; height: 40px; border-bottom: 4px solid ${K}; font-family: ${MONO}; font-weight: 700; font-size: 14px; padding: 11px 16px; box-sizing: border-box; letter-spacing: .5px; }
.s-brutal .s-brutal-body { position: absolute; left: 16px; top: 56px; right: 16px; }
.s-brutal .s-brutal-t { font-size: 18px; line-height: 1.3; }
.s-brutal .s-brutal-s { font-family: ${MONO}; font-weight: 700; font-size: 14px; line-height: 1.45; }
.s-brutal .s-brutal-chip { display: inline-block; border: 3px solid ${K}; border-radius: 8px; padding: 2px 9px 3px; font-family: ${MONO}; font-weight: 700; font-size: 14px; background: ${W}; margin: 0 0 8px; white-space: nowrap; }
`;

const BARS = [[1, "Model<br>alone"], [2, "+ chart<br>pasted"], [4, "+ tools"], [5, "+ checks"]];
const NY = 360, NH = 208, NW = 232, X = [64, 344, 704, 984], MID = NY + NH / 2 + 20;

const slide = `<div class="s-brutal-slide">
  <div class="s-brutal-a s-brutal-mono" style="left:64px; top:48px; border:3px solid ${K}; border-radius:8px; background:${PK}; padding:4px 12px; font-size:14px; box-shadow:4px 4px 0 ${K}">PART 4 · AGENTS</div>
  <div class="s-brutal-a" style="left:64px; top:104px; font-size:64px; line-height:1.06; letter-spacing:-2px">An agent is<br>a model in a <span style="background:${Y}; border:4px solid ${K}; border-radius:8px; box-shadow:6px 6px 0 ${K}; padding:0 12px 2px">loop</span></div>

  <div class="s-brutal-box" style="left:880px; top:40px; width:336px; height:256px">
    <div class="s-brutal-head" style="background:${MT}">QUESTIONS RIGHT, OF 5</div>
    ${BARS.map(([v, t], i) => `
      <div class="s-brutal-a" style="left:${28 + i * 74}px; top:${208 - v * 26}px; width:48px; height:${v * 26}px; background:${i === 3 ? Y : W}; border:3px solid ${K}; border-bottom:0; box-sizing:border-box"></div>
      <div class="s-brutal-a" style="left:${28 + i * 74}px; top:${208 - v * 26 - 30}px; width:48px; text-align:center; font-size:20px">${v}</div>
      <div class="s-brutal-a s-brutal-mono" style="left:${14 + i * 74}px; top:216px; width:76px; text-align:center; font-size:11.5px; line-height:1.2">${t}</div>`).join("")}
    <div class="s-brutal-a" style="left:16px; top:208px; width:296px; height:4px; background:${K}"></div>
  </div>

  <svg class="s-brutal-a" style="left:0; top:0" width="1280" height="720" viewBox="0 0 1280 720">
    <defs><marker id="brutal-ah" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3.4" markerHeight="3.4" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="${K}"/></marker></defs>
    <g fill="none" stroke="${K}" stroke-width="5" stroke-linecap="square">
      <path d="M${X[0] + NW + 14} ${MID} H${X[1] - 16}" marker-end="url(#brutal-ah)"/>
      <path d="M${X[1] + NW + 14} ${MID - 50} C${X[1] + NW + 56} ${MID - 108} ${X[2] - 56} ${MID - 108} ${X[2] - 16} ${MID - 50}" marker-end="url(#brutal-ah)"/>
      <path d="M${X[2] - 10} ${MID + 50} C${X[2] - 52} ${MID + 108} ${X[1] + NW + 60} ${MID + 108} ${X[1] + NW + 18} ${MID + 50}" marker-end="url(#brutal-ah)"/>
      <path d="M${X[2] + NW + 14} ${MID} H${X[3] - 16}" marker-end="url(#brutal-ah)"/>
    </g>
  </svg>
  <div class="s-brutal-a s-brutal-mono" style="left:${X[1] + NW - 40}px; top:${NY - 30}px; width:${X[2] - X[1] - NW + 80}px; text-align:center; font-size:14px">THINK → ACT → OBSERVE</div>

  <div class="s-brutal-box" style="left:${X[0]}px; top:${NY}px; width:${NW}px; height:${NH}px"><div class="s-brutal-head" style="background:${LL}">ROSA’S CHART</div>
    <div class="s-brutal-body"><div class="s-brutal-t">612 notes</div></div></div>
  <div class="s-brutal-box" style="left:${X[1]}px; top:${NY}px; width:${NW}px; height:${NH}px"><div class="s-brutal-head" style="background:${Y}">MODEL</div>
    <div class="s-brutal-body"><div class="s-brutal-t">reads, decides<br>the next step</div></div></div>
  <div class="s-brutal-box" style="left:${X[2]}px; top:${NY}px; width:${NW}px; height:${NH}px"><div class="s-brutal-head" style="background:${PK}">TOOLS</div>
    <div class="s-brutal-body"><span class="s-brutal-chip">search</span><br><span class="s-brutal-chip">read a note</span><br><span class="s-brutal-chip">labs</span></div></div>
  <div class="s-brutal-box" style="left:${X[3]}px; top:${NY}px; width:${NW}px; height:${NH}px"><div class="s-brutal-head" style="background:${MT}">ANSWER</div>
    <div class="s-brutal-body"><div class="s-brutal-t">EF 30%</div><div class="s-brutal-s">metoprolol tartrate<br>→ a gap</div>
      <div style="border-top:3px solid ${K}; margin-top:10px; padding-top:8px"><div class="s-brutal-s">“LVEF 30%”</div><div class="s-brutal-s" style="font-weight:400">Echo, 10/02</div></div></div></div>

  <div class="s-brutal-a" style="left:0; top:660px; width:1280px; height:60px; background:${K}"></div>
  <div class="s-brutal-a s-brutal-mono" style="left:64px; top:682px; font-size:14px; color:${Y}; letter-spacing:1px">QCOR 2026 · BUILD AN AGENT, LIVE</div>
  <div class="s-brutal-a s-brutal-mono" style="left:1176px; top:672px; width:40px; height:36px; box-sizing:border-box; border:3px solid ${Y}; border-radius:6px; color:${Y}; font-size:15px; text-align:center; line-height:30px">14</div>
</div>`;

const icons = [["patient", "man"], ["heart"], ["pill"], ["note"], ["search"], ["database"], ["tool"], ["agent"], ["check"], ["warning"]]
  .map(([n, k], i) => [n, tile(k || n, TILE[i % 4])]);

export default {
  id: "brutal",
  name: "Neo-brutalism",
  after: "Gumroad’s 2021 redesign and the neo-brutalist web",
  note: "Honest and loud but disciplined: four equal cards with 4 px borders and hard shadows, each headed by a flat colour bar, on one grid. Yellow marks the two things that matter, the loop and the best score. Every box looks clickable, like an interface you could poke during the demo.",
  palette: [[Y, "yellow"], [PK, "pink"], [MT, "mint"], [LL, "lilac"], [K, "black"], [CR, "cream"]],
  type: "Arial Black for the title and key values, Menlo Bold for labels",
  ground: CR,
  css,
  people,
  slide,
  icons,
};
