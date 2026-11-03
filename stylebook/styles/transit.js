// Transit map: Beck / Vignelli diagram. Lines at 0/45/90°, ticks for stations, white interchanges,
// parallel lines where routes share a corridor; Helvetica; symbol-sign pictograms.
const RED = "#e1251b", BLU = "#0b4ea2", GRN = "#00965e", ORG = "#f47a20", YEL = "#fcc30b", GRY = "#8d9093";
const K = "#161616", W = "#ffffff", WALL = "#e9e8e4";
const F = `font-family="'Helvetica Neue', Helvetica, Arial, sans-serif"`;
const r1 = (v) => Math.round(v * 10) / 10;

// polygon with rounded (quadratic) corners
function roundPoly(pts, r, close = true) {
  const n = pts.length;
  const toward = (v, p) => { const dx = p[0] - v[0], dy = p[1] - v[1], L = Math.hypot(dx, dy); return `${r1(v[0] + (dx / L) * r)} ${r1(v[1] + (dy / L) * r)}`; };
  let d = "";
  for (let i = 0; i < n; i++) {
    const p = pts[(i - 1 + n) % n], v = pts[i], q = pts[(i + 1) % n];
    d += `${i ? " L" : "M"}${toward(v, p)} Q${v[0]} ${v[1]} ${toward(v, q)}`;
  }
  return d + (close ? " Z" : "");
}
const chev = (x, y, deg) => `<path d="M-3.5 -4.5 L2 0 L-3.5 4.5" transform="translate(${r1(x)} ${r1(y)}) rotate(${deg})" fill="none" stroke="${W}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`;

// ---- pictograms: white on a black rounded square, 48 grid, solid forms ----
const sign = (body, bg = K) => `<rect x="2" y="2" width="44" height="44" rx="8" fill="${bg}"/>${body}`;
const bust = (cx, bun) => `<circle cx="${cx}" cy="19" r="6.5" fill="${W}"/>${bun ? `<circle cx="${cx}" cy="10.2" r="3.4" fill="${W}"/>` : ""}<path d="M${cx - 12} 38 C${cx - 12} 30.5 ${cx - 7} 27 ${cx} 27 C${cx + 7} 27 ${cx + 12} 30.5 ${cx + 12} 38 Z" fill="${W}"/>`;
const P = {
  patient: sign(`<circle cx="13" cy="22" r="4.4" fill="${W}"/><rect x="19.5" y="18.5" width="20.5" height="9" rx="4.5" fill="${W}"/>
    <rect x="8" y="30" width="32" height="3.6" fill="${W}"/><rect x="8" y="16" width="3.6" height="22" rx="1" fill="${W}"/><rect x="36.4" y="27" width="3.6" height="11" rx="1" fill="${W}"/>`),
  heart: sign(`<path d="M24 37 C14.5 30 10 24.8 10 19.2 C10 15 13.2 12 17 12 C20 12 22.5 13.8 24 16.4 C25.5 13.8 28 12 31 12 C34.8 12 38 15 38 19.2 C38 24.8 33.5 30 24 37 Z" fill="${W}"/>`),
  pill: sign(`<g transform="rotate(-45 24 24)"><path d="M23 17 H17 A7 7 0 0 0 17 31 H23 Z" fill="${W}"/><path d="M25 17 H31 A7 7 0 0 1 31 31 H25 Z" fill="${W}" opacity=".55"/></g>`),
  note: sign(`<path d="M13 10 H28 L35 17 V38 H13 Z" fill="${W}"/><rect x="17.5" y="22" width="13" height="2.8" fill="${K}"/><rect x="17.5" y="28" width="13" height="2.8" fill="${K}"/><rect x="17.5" y="34" width="8" height="2.8" fill="${K}"/>`),
  search: sign(`<circle cx="21" cy="21" r="8.5" fill="none" stroke="${W}" stroke-width="4.4"/><path d="M27.5 27.5 L36 36" stroke="${W}" stroke-width="5.4" stroke-linecap="round"/>`),
  database: sign(`<g fill="${W}"><ellipse cx="24" cy="14" rx="11.5" ry="4"/><path d="M12.5 18 Q24 24 35.5 18 V23.5 Q24 29.5 12.5 23.5 Z"/><path d="M12.5 26.5 Q24 32.5 35.5 26.5 V32 Q24 38 12.5 32 Z"/></g>`),
  tool: sign(`<path d="M33 10.5 A7.5 7.5 0 0 0 25.6 20.2 L12 33.8 A2.7 2.7 0 0 0 15.8 37.6 L29.4 24 A7.5 7.5 0 0 0 39.1 16.6 L34.7 21 L30.6 20 L29.6 15.9 Z" fill="${W}"/>`),
  agent: sign(`<path d="M34.5 24 A10.5 10.5 0 1 1 29.9 15.3" fill="none" stroke="${W}" stroke-width="4.4"/><path d="M26 9.6 L35.2 12.4 L29.8 19.9 Z" fill="${W}"/>`),
  check: sign(`<path d="M13 24.5 L20.5 32 L35.5 16" fill="none" stroke="${W}" stroke-width="5" stroke-linecap="square"/>`),
  warning: sign(`<path d="M24 10 L38.5 36 H9.5 Z" fill="${YEL}" stroke="${YEL}" stroke-width="2.4" stroke-linejoin="round"/><rect x="22.2" y="18" width="3.6" height="10" rx="1" fill="${K}"/><circle cx="24" cy="32" r="2.1" fill="${K}"/>`),
};

// ---- people: two signs from the same set, drawn larger ----
const people = `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(44 130) scale(3.2)">${sign(bust(24, false))}</g>
  <g transform="translate(215 130) scale(3.2)">${sign(bust(24, true))}</g>
</svg>`;

// ---- slide ----
function slide() {
  const ty = 368, my = ty - 18;             // trunk (blue) and the loop's shared track (red), side by side
  const mx = 448, tx = 832, top = 232;      // Model, Tools, loop top
  const loop = [[mx, my], [mx + (my - top), top], [tx - (my - top), top], [tx, my]];
  const think = 584, act = 696, obs = 640;
  const stationLabel = (x, anchor, name, lines) => `<text x="${x}" y="${ty + 52}" text-anchor="${anchor}" font-size="24" font-weight="700" fill="${K}">${name}</text>
    ${lines.map((t, i) => `<text x="${x}" y="${ty + 76 + i * 22}" text-anchor="${anchor}" font-size="16" fill="${K}">${t}</text>`).join("")}`;
  const ix = (x) => `<rect x="${x - 13}" y="${my - 13}" width="26" height="${ty - my + 26}" rx="13" fill="${W}" stroke="${K}" stroke-width="5"/>`;
  const legend = [[1, GRY, "Model alone"], [2, BLU, "+ chart pasted"], [4, ORG, "+ tools"], [5, GRN, "+ checks"]];

  return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" ${F}>
  <rect width="1280" height="720" fill="${W}"/>
  <rect width="1280" height="168" fill="${K}"/>
  <rect y="12" width="1280" height="3" fill="${W}"/>
  <text x="64" y="68" font-size="20" font-weight="500" fill="${W}">Part 4 · Agents</text>
  <text x="62" y="136" font-size="56" font-weight="700" letter-spacing="-0.5" fill="${W}">An agent is a model in a loop</text>

  <!-- the loop line: out and over, back along the shared track -->
  <path d="${roundPoly(loop, 28)}" fill="none" stroke="${RED}" stroke-width="12" stroke-linejoin="round"/>
  <line x1="${think}" y1="${top}" x2="${think}" y2="${top + 18}" stroke="${RED}" stroke-width="6"/>
  <line x1="${act}" y1="${top}" x2="${act}" y2="${top + 18}" stroke="${RED}" stroke-width="6"/>
  <line x1="${obs}" y1="${my}" x2="${obs}" y2="${my - 18}" stroke="${RED}" stroke-width="6"/>
  ${chev(640, top, 0)}${chev(560, my, 180)}${chev(720, my, 180)}
  <g font-size="18" font-weight="500" fill="${K}" text-anchor="middle">
    <text x="${think}" y="${top + 44}">Think</text><text x="${act}" y="${top + 44}">Act</text><text x="${obs}" y="${my - 28}">Observe</text>
  </g>

  <!-- the trunk: Rosa's chart to the Answer -->
  <line x1="96" y1="${ty}" x2="1184" y2="${ty}" stroke="${BLU}" stroke-width="12"/>
  <rect x="90" y="${ty - 20}" width="12" height="40" fill="${BLU}"/><rect x="1178" y="${ty - 20}" width="12" height="40" fill="${BLU}"/>
  ${chev(272, ty, 0)}${chev(1008, ty, 0)}
  ${ix(mx)}${ix(tx)}

  ${stationLabel(88, "start", "Rosa's chart", ["612 notes"])}
  ${stationLabel(mx, "middle", "Model", ["reads, decides the next step"])}
  ${stationLabel(tx, "middle", "Tools", ["search · read a note · labs"])}
  ${stationLabel(1192, "end", "Answer", ["EF 30% · metoprolol tartrate", "→ a gap"])}
  <text x="1192" y="${ty + 128}" text-anchor="end" font-size="16" fill="${K}"><tspan font-weight="700">“LVEF 30%”</tspan> · Echo, 10/02</text>

  <!-- legend: questions right, of 5, as lines with that many stations -->
  <text x="64" y="536" font-size="13" font-weight="700" letter-spacing="1.4" fill="${K}">QUESTIONS RIGHT, OF 5</text>
  ${legend.map(([v, c, t], i) => {
    const y = 568 + i * 26;
    return `<line x1="96" y1="${y}" x2="${96 + v * 40}" y2="${y}" stroke="${c}" stroke-width="10"/>
      ${Array.from({ length: v }, (_, k) => `<circle cx="${116 + k * 40}" cy="${y}" r="3" fill="${W}"/>`).join("")}
      <circle cx="76" cy="${y}" r="11" fill="${c}"/><text x="76" y="${y + 5}" text-anchor="middle" font-size="14" font-weight="700" fill="${W}">${v}</text>
      <text x="${112 + v * 40}" y="${y + 5}" font-size="15" fill="${K}">${t}</text>`;
  }).join("")}

  <text x="64" y="692" font-size="15" font-weight="500" fill="${K}" opacity=".75">QCOR 2026 · Build an agent, live</text>
  <circle cx="1200" cy="687" r="16" fill="${K}"/>
  <text x="1200" y="692.5" text-anchor="middle" font-size="15" font-weight="700" fill="${W}">14</text>
</svg>`;
}

const ic = (body) => `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
const NAMES = ["patient", "heart", "pill", "note", "search", "database", "tool", "agent", "check", "warning"];

export default {
  id: "transit",
  name: "Transit map",
  after: "Harry Beck's 1933 Underground diagram, Massimo Vignelli's 1972 subway map and signage, the AIGA/DOT symbol signs",
  note: "The slide is a network: the chart line runs to the Answer terminus, and between Model and Tools the trip goes round a loop line whose stations are Think, Act and Observe. Coloured lines carry the argument; the questions-right chart is a legend of lines with 1, 2, 4 and 5 stations.",
  palette: [[BLU, "chart line"], [RED, "loop line"], [ORG, "orange"], [GRN, "green"], [YEL, "warning yellow"], [K, "sign black"]],
  type: "Helvetica Neue Bold and Medium",
  ground: WALL,
  people,
  slide,
  icons: NAMES.map((n) => [n, ic(P[n])]),
};
