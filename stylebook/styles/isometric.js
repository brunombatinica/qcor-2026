// Isometric: true 30° isometric projection, three tones per solid (top light, left mid, right dark),
// a calm Monument-Valley palette. Every solid is generated from world coordinates by one projection function.
const C = Math.cos(Math.PI / 6);
const INK = "#3b3561", BG1 = "#fbe6d6", BG2 = "#f1c6c8";
// [top, left, right]
const SAND = ["#fbf1e6", "#e7d3c1", "#cfb7a3"], TEAL = ["#9fe0d4", "#62b9ad", "#3f938b"], CORAL = ["#ffb39a", "#ee8a70", "#cc6a58"];
const LAV = ["#d6cbf2", "#a999da", "#8474bb"], GOLD = ["#fbe39a", "#ecc56a", "#c9a14a"], IND = ["#6e68a8", "#4d4785", "#37326a"];
const SKIN = ["#ffe0c8", "#f4c3a2", "#dca383"], SILV = ["#f5f6fa", "#d6d9e3", "#b4b8c8"], CREAM = ["#ffffff", "#efe8f4", "#d9cfe4"];
const F = `font-family="'Gill Sans', 'Gill Sans MT', 'Avenir Next', sans-serif"`;

const iso = (OX, OY, S) => (x, y, z = 0) => [OX + (x - y) * C * S, OY + (x + y) * 0.5 * S - z * S];
const pts = (P, list) => list.map(([x, y, z]) => P(x, y, z).map((v) => v.toFixed(1)).join(",")).join(" ");
const poly = (P, list, fill) => `<polygon points="${pts(P, list)}" fill="${fill}" stroke="${fill}" stroke-width=".7" stroke-linejoin="round"/>`;
// a box with its three visible faces
const box = (P, x, y, z, w, d, h, [t, l, r]) =>
  poly(P, [[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]], r) +
  poly(P, [[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]], l) +
  poly(P, [[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]], t);
// content laid onto a face: left face (plane y = const, u along +x), right face (plane x = const, u along -y), top
const onLeft = (P, x, y, z, body) => { const [X, Y] = P(x, y, z); return `<g transform="matrix(${C} .5 0 1 ${X.toFixed(1)} ${Y.toFixed(1)})">${body}</g>`; };
const onRight = (P, x, y, z, body) => { const [X, Y] = P(x, y, z); return `<g transform="matrix(${C} -.5 0 1 ${X.toFixed(1)} ${Y.toFixed(1)})">${body}</g>`; };
const onTop = (P, x, y, z, body) => { const [X, Y] = P(x, y, z); return `<g transform="matrix(${C} .5 ${-C} .5 ${X.toFixed(1)} ${Y.toFixed(1)})">${body}</g>`; };
// a pipe along a world polyline: dark rim, side tone, light top, and chevrons showing the direction of flow
const pipe = (P, path, z, tones = CREAM, chev = []) => {
  const d = "M" + path.map(([x, y]) => P(x, y, z).map((v) => v.toFixed(1)).join(" ")).join(" L");
  const ch = chev.map(([i, t]) => {
    const [a, b] = [path[i], path[i + 1]], m = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]), u = [(b[0] - a[0]) / len, (b[1] - a[1]) / len], n = [-u[1], u[0]];
    const q = (k, s) => [m[0] + u[0] * k + n[0] * s, m[1] + u[1] * k + n[1] * s, z + 0.12];
    return `<polyline points="${pts(P, [q(-0.18, 0.2), q(0.12, 0), q(-0.18, -0.2)])}" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`;
  }).join("");
  return `<path d="${d}" fill="none" stroke="${tones[2]}" stroke-width="17" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="${d}" fill="none" stroke="${tones[1]}" stroke-width="13" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="${d}" fill="none" stroke="${tones[0]}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round" transform="translate(0 -3)"/>${ch}`;
};

// a person: a body block and a head block; the woman adds a bun block (the icon's construction, drawn larger)
const figure = (P, cx, cy, bun, body) => box(P, cx - 0.9, cy - 0.6, 0, 1.8, 1.2, 2.4, body) + box(P, cx - 0.6, cy - 0.6, 2.6, 1.2, 1.2, 1.2, SKIN) + (bun ? box(P, cx - 0.25, cy - 0.25, 3.8, 0.5, 0.5, 0.5, SKIN) : "");
const people = (() => {
  const P = iso(200, 176, 30);
  return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  ${box(P, 0, 0, -0.5, 6, 6, 0.5, SAND)}
  ${figure(P, 4.5, 1.5, true, CORAL)}${figure(P, 1.5, 4.5, false, IND)}
</svg>`;
})();

const slide = (() => {
  const S = 34, P = iso(640, 110, S);
  const T = (x, y, s, t, extra = "") => `<text x="${x}" y="${y}" font-size="${s}" ${F} ${extra}>${t}</text>`;
  const DISPLAY = 56, NAME = 18, TEXT = 15, LABEL = 13;
  // four equal blocks on one line (x + y = 20), each on its own tile
  const nodes = [
    { c: [2, 18], tones: TEAL, name: "Rosa’s chart", lines: ["612 notes"] },
    { c: [7.11, 12.89], tones: CORAL, name: "Model", lines: ["reads, decides", "the next step"] },
    { c: [12.89, 7.11], tones: LAV, name: "Tools", lines: ["search · read a note", "· labs"] },
    { c: [18, 2], tones: IND, name: "Answer", lines: ["EF 30% · metoprolol tartrate", "→ a gap", "“LVEF 30%” · Echo, 10/02"] },
  ];
  const block = ({ c: [x, y], tones }) => box(P, x - 2, y - 2, -0.4, 4, 4, 0.4, SAND) + box(P, x - 1.5, y - 1.5, 0, 3, 3, 3, tones);
  const label = ({ c: [x, y], name, lines }) => { const [X] = P(x, y, 0);
    return T(X, 572, NAME, name, `text-anchor="middle" font-weight="600" fill="${INK}"`) + lines.map((l, i) => T(X, 594 + i * 19, TEXT, l, `text-anchor="middle" fill="${INK}"`)).join(""); };
  const [m, t] = [nodes[1].c, nodes[2].c];
  // the score: iso bars rising up and away, own projection
  const Q = iso(916, 236, 20), bars = [1, 2, 4, 5].map((v, i) => ({ v, i, x: 0, y: -(i * 2.1) - 1.4, h: v * 0.8 }));
  const scoreLabels = ["alone", "+ chart", "+ tools", "+ checks"];
  const chart = `${box(Q, -0.5, -8.2, -0.4, 2.4, 9.0, 0.4, SAND)}
    ${bars.map((b) => box(Q, b.x, b.y, 0, 1.4, 1.4, b.h, [LAV, TEAL, GOLD, CORAL][b.i])).join("")}
    ${bars.map((b) => { const [X, Y] = Q(b.x + 0.7, b.y + 0.7, b.h); return T(X, Y - 10, NAME, b.v, `text-anchor="middle" font-weight="600" fill="${INK}"`); }).join("")}
    ${bars.map((b) => { const [X, Y] = Q(b.x + 1.9, b.y + 0.7, -0.4); return T(X + 6, Y + 8, LABEL, scoreLabels[b.i], `fill="${INK}"`); }).join("")}`;
  const top = P(m[0], t[1], 1.5), bot = P(t[0], m[1], 1.5);

  return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="isometric-s-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${BG1}"/><stop offset="1" stop-color="${BG2}"/></linearGradient></defs>
  <rect width="1280" height="720" fill="url(#isometric-s-bg)"/>
  <g stroke="#fff" stroke-opacity=".28" stroke-width="1">
    ${Array.from({ length: 34 }, (_, k) => { const a = P(-12 + k, -14, 0), b = P(-12 + k, 30, 0); return `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`; }).join("")}
    ${Array.from({ length: 34 }, (_, k) => { const a = P(-14, -12 + k, 0), b = P(30, -12 + k, 0); return `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`; }).join("")}
  </g>

  ${T(64, 72, LABEL, "PART 4 · AGENTS", `font-weight="600" letter-spacing="5" fill="${INK}"`)}
  ${T(60, 138, DISPLAY, "An agent is", `font-weight="300" fill="${INK}"`)}
  ${T(60, 200, DISPLAY, `a model in a <tspan fill="${CORAL[2]}">loop</tspan>`, `font-weight="300" fill="${INK}"`)}

  ${T(916, 52, LABEL, "QUESTIONS RIGHT, OF 5", `font-weight="600" letter-spacing="3" fill="${INK}"`)}
  ${chart}

  <!-- the loop's far pipe runs behind the blocks -->
  ${pipe(P, [[m[0], m[1] - 1.5], [m[0], t[1]], [t[0] - 1.5, t[1]]], 1.5, CREAM, [[0, 0.5], [1, 0.5]])}
  ${nodes.map(block).join("")}
  <!-- the near pipes: the loop's return, and the feed in and out -->
  ${pipe(P, [[t[0], t[1] + 1.5], [t[0], m[1]], [m[0] + 1.5, m[1]]], 1.5, CREAM, [[0, 0.5], [1, 0.5]])}
  ${pipe(P, [[3.5, 18], [m[0], 18], [m[0], m[1] + 1.5]], 1.5, CREAM, [[0, 0.5], [1, 0.45]])}
  ${pipe(P, [[t[0] + 1.5, t[1]], [18, t[1]], [18, 3.5]], 1.5, CREAM, [[0, 0.5], [1, 0.45]])}

  ${nodes.map(label).join("")}
  ${T(top[0], top[1] - 22, LABEL, "THINK → ACT", `text-anchor="middle" font-weight="600" letter-spacing="4" fill="${INK}"`)}
  ${T(bot[0], 572, LABEL, "← OBSERVE", `text-anchor="middle" font-weight="600" letter-spacing="4" fill="${INK}"`)}

  ${T(64, 690, LABEL, "QCOR 2026 · BUILD AN AGENT, LIVE", `letter-spacing="3" fill="${INK}"`)}
  ${T(1216, 690, LABEL, "14", `text-anchor="end" font-weight="600" letter-spacing="2" fill="${INK}"`)}
</svg>`;
})();

// icons: small isometric solids, three tones each, no strokes
const ic = (body) => `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
const ring = (cx, cy, rx, ry, w) => `M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${2 * rx} 0 a${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z M${cx - rx + w} ${cy} a${rx - w} ${ry - w} 0 1 1 ${2 * (rx - w)} 0 a${rx - w} ${ry - w} 0 1 1 ${-2 * (rx - w)} 0 Z`;
const icons = [
  ["patient", (() => { const P = iso(24, 17, 7); return ic(`${box(P, 0.5, 0.5, -0.5, 3, 3, 0.5, SAND)}${figure(P, 2, 2, false, IND)}`); })()],
  ["heart", (() => { const h = "M24 40 C15 34 7 27.5 7 19 C7 13.5 11 9.5 16 9.5 C19.6 9.5 22.5 11.6 24 14.6 C25.5 11.6 28.4 9.5 32 9.5 C37 9.5 41 13.5 41 19 C41 27.5 33 34 24 40 Z";
    const face = (fill) => `<g transform="matrix(${C} -.5 0 1 6 21) scale(.85)"><path d="${h}" fill="${fill}"/></g>`;
    return ic(`${[7, 6, 5, 4, 3, 2, 1].map((k) => `<g transform="translate(${(-C * k * 0.85).toFixed(2)} ${(-0.5 * k * 0.85).toFixed(2)})">${face(CORAL[2])}</g>`).join("")}${face(CORAL[1])}`); })()],
  ["pill", ic(`<ellipse cx="24" cy="35" rx="16" ry="4.5" fill="${SAND[2]}"/><g transform="rotate(-30 24 24)"><rect x="6" y="16" width="36" height="16" rx="8" fill="${LAV[2]}"/><rect x="6" y="15" width="36" height="13" rx="6.5" fill="${LAV[1]}"/><path d="M24 16 H34 A8 8 0 0 1 34 32 H24 Z" fill="${GOLD[2]}"/><path d="M24 15 H35.5 A6.5 6.5 0 0 1 35.5 28 H24 Z" fill="${GOLD[1]}"/></g>`)],
  ["note", (() => { const P = iso(24, 8, 6); return ic(`${box(P, 0, 0, 0, 4.2, 5.2, 0.35, CREAM)}${onTop(P, 0, 0, 0.35, `<g fill="${LAV[1]}"><rect x="4.5" y="6" width="16" height="2"/><rect x="4.5" y="12" width="16" height="2"/><rect x="4.5" y="18" width="10" height="2"/></g>`)}`); })()],
  ["search", ic(`<path d="M27 27 L42 40" stroke="${IND[2]}" stroke-width="7" stroke-linecap="round"/><path d="M27 25 L42 38" stroke="${IND[1]}" stroke-width="5" stroke-linecap="round"/><path d="${ring(19, 20, 14, 14, 4)}" fill="${TEAL[2]}" fill-rule="evenodd"/><path d="${ring(19, 18, 14, 14, 4)}" fill="${TEAL[1]}" fill-rule="evenodd"/><circle cx="19" cy="18" r="10" fill="${TEAL[0]}" fill-opacity=".6"/>`)],
  ["database", ic(`${[0, 1, 2].map((k) => { const y = 34 - k * 11; return `<path d="M8 ${y - 8} V${y} A16 6 0 0 0 40 ${y} V${y - 8}" fill="${[TEAL, LAV, GOLD][k][1]}"/><path d="M24 ${y + 6} A16 6 0 0 0 40 ${y} V${y - 8} H24 Z" fill="${[TEAL, LAV, GOLD][k][2]}"/><ellipse cx="24" cy="${y - 8}" rx="16" ry="6" fill="${[TEAL, LAV, GOLD][k][0]}"/>`; }).join("")}`)],
  ["tool", (() => { const P = iso(24, 18, 5.4); return ic(`${box(P, 0, 0, 0, 5, 3, 2.9, CORAL)}${box(P, 1.4, 1.2, 2.9, 0.4, 0.6, 1.3, IND)}${box(P, 1.4, 1.2, 4.0, 2.2, 0.6, 0.35, IND)}${box(P, 3.2, 1.2, 2.9, 0.4, 0.6, 1.3, IND)}`); })()],
  ["agent", (() => { const P = iso(24, 27, 5); return ic(`<path d="${ring(24, 32, 20, 11, 3.2)}" fill="${LAV[1]}" fill-rule="evenodd"/>${box(P, -1.6, -1.6, 0, 3.2, 3.2, 3.2, CORAL)}<path d="M4 32 A20 11 0 0 0 44 32 L40.8 32 A16.8 7.8 0 0 1 7.2 32 Z" fill="${LAV[2]}"/><path d="M38 22.5 L46 27 L37.5 30 Z" fill="${LAV[2]}"/>`); })()],
  ["check", (() => { const P = iso(24, 16, 5.6); return ic(`${box(P, 0, 0, 0, 4.6, 4.6, 1.1, TEAL)}<path d="M-9 -1 L-6 -3.5 L-2.5 -0.5 L6 -5.5 L9 -3 L-2.5 4 Z" fill="#fff" transform="translate(24 22.7)"/>`); })()],
  ["warning", ic(`<ellipse cx="24" cy="40" rx="18" ry="5.5" fill="${SAND[2]}"/><path d="M24 4 L8 40 A16 5 0 0 0 40 40 Z" fill="${GOLD[1]}"/><path d="M24 4 L24 45 A16 5 0 0 0 40 40 Z" fill="${GOLD[2]}"/><path d="M14.5 27 A10 3.2 0 0 0 33.5 27 L31 21 A7 2.2 0 0 1 17 21 Z" fill="#fff"/><path d="M11.2 34.5 A13 4 0 0 0 36.8 34.5 L35.3 31 A11.4 3.5 0 0 1 12.7 31 Z" fill="#fff"/>`)],
];

export default {
  id: "isometric",
  name: "Isometric",
  after: "isometric game worlds (Monument Valley), axonometric architecture drawings and isometric infographics",
  note: "A small, calm world in true 30° projection: four equal blocks on their own tiles, joined by pipes, and the loop is a rhombus of pipe round the model and the tools. Labels stay flat and readable beneath the solids; every solid is generated from world coordinates, so the scene can be rebuilt or animated.",
  palette: [[CORAL[1], "coral"], [TEAL[1], "teal"], [LAV[1], "lavender"], [IND[1], "indigo"], [GOLD[1], "ochre"], [BG1, "dawn"]],
  type: "Gill Sans Light for the title, Gill Sans and SemiBold for labels",
  ground: BG1,
  peopleGround: `linear-gradient(180deg, ${BG1}, ${BG2})`,
  iconGround: `linear-gradient(180deg, ${BG1}, ${BG2})`,
  iconInk: INK,
  people,
  slide,
  icons,
};
