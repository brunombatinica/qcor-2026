// Crouwel grid: Wim Crouwel's Stedelijk posters and New Alphabet. A visible 16 px dot grid, every form built on it,
// corners cut at 45°, black on white with one blue for the loop.
const W = "#ffffff", K = "#111111", BL = "#1f45e0", DOT = "#c9c9c9", GREY = "#6f6f6f";
const DIN = `'DIN Alternate', 'DIN Condensed', 'Avenir Next', sans-serif`;
const AV = `'Avenir Next', Avenir, 'Helvetica Neue', sans-serif`;
const M = 16; // the module

const dots = (id) => `<pattern id="${id}" x="-8" y="-8" width="${M}" height="${M}" patternUnits="userSpaceOnUse"><circle cx="8" cy="8" r="1.1" fill="${DOT}"/></pattern>`;
// a rectangle with its corners cut at 45° (c = cut per corner: [tl, tr, br, bl])
const cut = (x, y, w, h, [a, b, c, d]) => `M${x + a} ${y} H${x + w - b} L${x + w} ${y + b} V${y + h - c} L${x + w - c} ${y + h} H${x + d} L${x} ${y + h - d} V${y + a} Z`;

// ---------- people: an octagon head and a cut-shoulder block; her hair is a U set one half-module off the head ----------
const people = `<svg viewBox="0 0 400 432" xmlns="http://www.w3.org/2000/svg">
  <defs>${dots("crouwel-dots-people")}</defs>
  <rect width="400" height="432" fill="${W}"/><rect width="400" height="432" fill="url(#crouwel-dots-people)"/>
  <g transform="translate(0 -16)" fill="${K}">
    <path d="${cut(80, 176, 64, 64, [16, 16, 16, 16])}"/>
    <path d="${cut(32, 256, 160, 112, [32, 32, 0, 0])}"/>
    <path d="M240 248 V184 L264 160 H312 L336 184 V248" fill="none" stroke="${K}" stroke-width="16" stroke-linejoin="miter"/>
    <path d="${cut(256, 176, 64, 64, [16, 16, 16, 16])}"/>
    <path d="${cut(208, 256, 160, 112, [32, 32, 0, 0])}"/>
  </g>
</svg>`;

// ---------- slide ----------
const slide = () => {
  const T = (x, y, s, size, fill = K, fam = AV, extra = "") => `<text x="${x}" y="${y}" font-family="${fam}" font-size="${size}" fill="${fill}" ${extra}>${s}</text>`;
  const D = (x, y, s, size, fill = K, extra = "") => T(x, y, s, size, fill, DIN, `font-weight="700" ${extra}`);
  const NW = 192, NH = 160, NY = 368, NX = [64, 368, 720, 1024], cy = NY + NH / 2;
  const head = (x, y, dir, c) => `<path d="M${x} ${y} l${-16 * dir} -12 v24 Z" fill="${c}"/>`; // tip at (x, y)
  const arrow = (x1, x2, y, c = K) => { const dir = x2 > x1 ? 1 : -1; return `<path d="M${x1} ${y} H${x2 - 14 * dir}" stroke="${c}" stroke-width="4"/>${head(x2, y, dir, c)}`; };
  const node = (i, name, lines) => `<path d="${cut(NX[i], NY, NW, NH, [16, 16, 16, 16])}" fill="${K}"/>
    ${D(NX[i] + 16, NY + 40, name, 26, W)}
    ${lines.map((l, k) => T(NX[i] + 16, NY + 72 + k * 20, l, 15, W, AV, 'font-weight="500"')).join("")}`;

  // chart: bars as runs of grid squares, three squares per question
  const rows = [["Model alone", 1], ["+ chart pasted", 2], ["+ tools", 4], ["+ checks", 5]];
  const chart = rows.map(([t, v], r) => { const y = 112 + r * 32;
    const sq = Array.from({ length: v * 3 }, (_, i) => `<rect x="${928 + i * M + 2}" y="${y + 2}" width="12" height="12" fill="${r === 3 ? BL : K}"/>`).join("");
    return T(768, y + 13, t, 15, K, AV, 'font-weight="500"') + sq + D(1216, y + 14, v, 18, K, 'text-anchor="end"'); }).join("")
    + [0, 1, 2, 3, 4, 5].map((v) => T(928 + v * 48, 248, v, 11, GREY, AV, 'text-anchor="middle" font-weight="500"')).join("");

  return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
  <defs>${dots("crouwel-dots-slide")}</defs>
  <rect width="1280" height="720" fill="${W}"/><rect width="1280" height="720" fill="url(#crouwel-dots-slide)"/>

  ${T(64, 80, "Part 4 · Agents", 16, K, AV, 'font-weight="600" letter-spacing="0.5"')}
  <g font-family="${DIN}" font-weight="700" font-size="68" fill="${K}" letter-spacing="-0.5">
    <text x="61" y="160">An agent is</text>
    <text x="61" y="224">a model in a loop</text>
  </g>
  ${T(768, 80, "Questions right, of 5", 16, K, AV, 'font-weight="600" letter-spacing="0.5"')}
  ${chart}

  ${node(0, "Rosa’s chart", ["612 notes"])}
  ${node(1, "Model", ["reads, decides", "the next step"])}
  ${node(2, "Tools", ["search", "read a note", "labs"])}
  <path d="${cut(NX[3], NY, NW, NH, [16, 16, 16, 16])}" fill="${K}"/>
  ${D(NX[3] + 16, NY + 40, "Answer", 26, W)}
  ${T(NX[3] + 16, NY + 72, "EF 30% · metoprolol", 15, W, AV, 'font-weight="500"')}
  ${T(NX[3] + 16, NY + 92, `tartrate <tspan font-weight="700">→ a gap</tspan>`, 15, W, AV, 'font-weight="500"')}
  ${T(NX[3] + 16, NY + 124, "“LVEF 30%”", 15, W, AV, 'font-weight="700"')}
  ${T(NX[3] + 16, NY + 144, "Echo, 10/02", 12, W, AV, 'font-weight="500" opacity=".75"')}

  ${arrow(NX[0] + NW + 16, NX[1] - 16, cy)}
  ${arrow(NX[1] + NW + 16, NX[2] - 16, cy - 32, BL)}
  ${arrow(NX[2] - 16, NX[1] + NW + 16, cy + 32, BL)}
  ${arrow(NX[2] + NW + 16, NX[3] - 16, cy)}
  ${T(640, cy - 56, "Think → Act", 15, BL, AV, 'text-anchor="middle" font-weight="600"')}
  ${T(640, cy + 68, "Observe", 15, BL, AV, 'text-anchor="middle" font-weight="600"')}

  <rect x="64" y="638" width="1152" height="4" fill="${K}"/>
  ${T(64, 672, "QCOR 2026 · Build an agent, live", 13, K, AV, 'font-weight="500"')}
  ${D(1216, 674, "14", 18, K, 'text-anchor="end"')}
</svg>`;
};

// ---------- icons: solid forms on a 6 px module (48 = 8 × 6), corners cut at 45° ----------
const ic = (b, c = K) => `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="${c}">${b}</svg>`;
const bar = (d, c = K) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="6" stroke-linejoin="miter" stroke-linecap="butt"/>`;
const icons = [
  ["patient", ic(`<path d="${cut(18, 6, 12, 12, [3, 3, 3, 3])}"/><path d="${cut(9, 24, 30, 18, [9, 9, 0, 0])}"/>`)],
  ["heart", ic(`<path d="M24 42 L6 24 V15 L12 9 H18 L24 15 L30 9 H36 L42 15 V24 Z"/>`)],
  ["pill", ic(`<g transform="rotate(-45 24 24)"><path d="M22.5 15 H12 L6 21 V27 L12 33 H22.5 Z"/><path d="M25.5 15 H36 L42 21 V27 L36 33 H25.5 Z" fill="none" stroke="${K}" stroke-width="3"/></g>`)],
  ["note", ic(`<path fill-rule="evenodd" d="M9 6 H30 L39 15 V42 H9 Z M15 18 H33 V21 H15 Z M15 24 H33 V27 H15 Z M15 30 H33 V33 H15 Z M15 36 H27 V39 H15 Z"/>`)],
  ["search", ic(`${bar(`M14 6 H26 L33 13 V25 L26 32 H14 L7 25 V13 Z`)}${bar("M29 29 L42 42")}`)],
  ["database", ic(`<path d="${cut(6, 6, 36, 9, [3, 3, 3, 3])}"/><path d="${cut(6, 19.5, 36, 9, [3, 3, 3, 3])}"/><path d="${cut(6, 33, 36, 9, [3, 3, 3, 3])}"/>`)],
  ["tool", ic(`<g transform="rotate(45 24 24)"><path d="M21 20 H27 V43 H21 Z"/><path fill-rule="evenodd" d="M18 4 H21 V13 H27 V4 H30 L35 9 V19 L30 24 H18 L13 19 V9 Z"/></g>`)],
  ["agent", ic(`${bar("M30 9 H33 L39 15 V33 L33 39 H15 L9 33 V15 L15 9 H18", BL)}<path d="M17 1 L28 9 L17 17 Z"/>`, BL)],
  ["check", ic(bar("M7 23 L18 34 L41 11"))],
  ["warning", ic(`<path fill-rule="evenodd" d="M24 4 L45 42 H3 Z M21.5 17 H26.5 V30 H21.5 Z M21.5 33 H26.5 V38 H21.5 Z"/>`)],
];

export default {
  id: "crouwel",
  name: "Crouwel grid",
  after: "Wim Crouwel's Stedelijk Museum posters and the New Alphabet (1967)",
  note: "The grid is part of the picture: a 16 px dot grid shows on every panel and every form is built on it, with corners cut at 45° as in the New Alphabet. Black on white, one blue for the loop; type stays real text (DIN Alternate on the grid). Rational and cool; it makes the agent look engineered.",
  palette: [[W, "white"], [K, "black"], [BL, "blue"], [DOT, "grid"]],
  type: "DIN Alternate Bold for display, Avenir Next Medium for text",
  ground: W,
  iconGround: `radial-gradient(circle, ${DOT} 1.1px, transparent 1.4px) -8px -8px / 16px 16px, ${W}`,
  iconInk: K,
  people,
  slide,
  icons,
};
