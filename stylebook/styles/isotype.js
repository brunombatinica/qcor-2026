// 11 Isotype: Otto Neurath and Gerd Arntz. Flat silhouettes, no outlines, details cut out in negative space;
// more means more symbols, never a bigger symbol.
const K = "#1c1b19", R = "#c8372d", C = "#f0e8d5", BG = "#7f8c98", PALE = "#d9d3c2";
const GILL = `'Gill Sans', 'Gill Sans MT', Seravek, 'Helvetica Neue', sans-serif`;
const F = `font-family="${GILL}"`;
const f1 = (n) => n.toFixed(1);

// ---------- pictograms, each in a 40 × 40 box, placed with g(x, y, scale) ----------
const at = (x, y, s, body) => `<g transform="translate(${x} ${y}) scale(${s})">${body}</g>`;
const TXT = 18, LAB = 15;
const WRENCH = (col) => `<path d="M23.75 6.25 A8.33 8.33 0 0 0 17.17 18.67 L5.83 30 A3 3 0 0 0 10 34.17 L21.33 22.83 A8.33 8.33 0 0 0 33.75 16.25 L28.33 17.5 L25 15 L22.5 11.67 Z" fill="${col}"/>`;
const DOC = (col) => `<path d="M2 0 H27 L36 9 V40 H2 Z" fill="${col}"/><path d="M27 0 V9 H36 Z" fill="${C}" fill-opacity=".55"/>
  <rect x="8" y="14" width="22" height="3" fill="${C}"/><rect x="8" y="21" width="22" height="3" fill="${C}"/><rect x="8" y="28" width="14" height="3" fill="${C}"/>`;
const HEAD = (col) => `<path d="M6 40 V31 C1 26 0 18 3 12 C7 3 17 0 25 3 C32 6 35 12 35 17 L39 24 C40 26 38 27 36 27 V31 C36 34 34 35 31 35 H27 V40 Z" fill="${col}"/>
  <circle cx="27" cy="15" r="2.4" fill="${C}"/><path d="M8 13 C11 9 15 8 19 9" stroke="${C}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
const LENS = (col) => `<circle cx="16" cy="16" r="11" fill="none" stroke="${col}" stroke-width="7"/><path d="M23 25 L28 20 L40 32 L35 37 Z" fill="${col}"/>`;
const FLASK = (col, liq = R) => `<path d="M13 0 H27 V4 H25 V15 L36 35 C37.5 38 36 40 33 40 H7 C4 40 2.5 38 4 35 L15 15 V4 H13 Z" fill="${col}"/><path d="M9.5 27 H30.5 L34 34 C35 36 34 37 32 37 H8 C6 37 5 36 6 34 Z" fill="${liq}"/>`;
const TICK = (col) => `<rect width="40" height="40" fill="${col}"/><path d="M9 21 L17 29 L32 12" fill="none" stroke="${C}" stroke-width="6" stroke-linecap="square"/>`;
const ARROW = (x0, x1, y, col, w = 14) => `<path d="M${x0} ${y - w / 2} H${x1 - w * 1.3} V${y - w * 1.2} L${x1} ${y} L${x1 - w * 1.3} ${y + w * 1.2} V${y + w / 2} H${x0} Z" fill="${col}"/>`;
// flat curved arrow: a band of width w along a circle from a0 to a1 (degrees, screen coords), head at a1
function arcArrow(cx, cy, r, a0, a1, w, col) {
  const P = (a, rr) => [cx + rr * Math.cos((a * Math.PI) / 180), cy + rr * Math.sin((a * Math.PI) / 180)];
  const dir = a1 > a0 ? 1 : -1, ah = 16 * dir, aEnd = a1 - ah;
  const o0 = P(a0, r + w / 2), o1 = P(aEnd, r + w / 2), i1 = P(aEnd, r - w / 2), i0 = P(a0, r - w / 2);
  const h0 = P(aEnd, r + w * 1.2), h1 = P(aEnd, r - w * 1.2), tip = P(a1, r);
  const sw = dir > 0 ? 1 : 0;
  return `<path d="M${f1(o0[0])} ${f1(o0[1])} A${r + w / 2} ${r + w / 2} 0 0 ${sw} ${f1(o1[0])} ${f1(o1[1])} L${f1(h0[0])} ${f1(h0[1])} L${f1(tip[0])} ${f1(tip[1])} L${f1(h1[0])} ${f1(h1[1])} L${f1(i1[0])} ${f1(i1[1])} A${r - w / 2} ${r - w / 2} 0 0 ${1 - sw} ${f1(i0[0])} ${f1(i0[1])} Z" fill="${col}"/>`;
}

// ---------- people: Arntz figures, the same silhouette; her one cue is a bun ----------
function figure(x, y, s, col, bun) {
  return at(x, y, s, `
    <rect x="-13" y="232" width="11" height="48" fill="${col}"/><rect x="2" y="232" width="11" height="48" fill="${col}"/>
    <rect x="-8" y="72" width="16" height="16" fill="${col}"/>
    <path d="M-34 96 C-34 88 -26 84 -16 84 H16 C26 84 34 88 34 96 L42 236 H-42 Z" fill="${col}"/>
    <path d="M-25 106 L-31 204 M25 106 L31 204" stroke="${C}" stroke-width="4"/>
    <circle cx="0" cy="48" r="26" fill="${col}"/>
    ${bun ? `<circle cx="0" cy="13" r="12" fill="${col}"/>` : ""}`);
}
const people = () => `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="400" fill="${C}"/>
  ${figure(140, 50, 1.06, K, false)}${figure(260, 50, 1.06, R, true)}
</svg>`;

// ---------- slide ----------
const slide = () => {
  const rows = [["Model alone", 1, HEAD(K)], ["+ chart pasted", 2, DOC(K)], ["+ tools", 4, WRENCH(K)], ["+ checks", 5, TICK(R)]];
  const ry = 496, rh = 38, sx = 304, ss = 0.75, sp = 40;
  const CX = [144, 416, 864, 1112], py = 192, pz = 96, ly = 328;
  const lab = (x, rows2, col = K) => rows2.map((t, i) => `<text x="${x}" y="${ly + i * 24}" text-anchor="middle" font-size="${i ? TXT : TXT + 4}" font-weight="${i ? 400 : 600}" fill="${i ? K : col}">${t}</text>`).join("");
  return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" ${F}>
  <rect width="1280" height="720" fill="${C}"/>
  <text x="64" y="72" font-size="${LAB}" font-weight="600" letter-spacing="3" fill="${R}">PART 4 · AGENTS</text>
  <text x="62" y="136" font-size="56" font-weight="600" fill="${K}">An agent is a model in a loop</text>

  <!-- one pictogram per part, each in a 96 px box; labels below -->
  ${at(CX[0] - 48, py, 2, DOC(BG))}${at(CX[0] - 40, py + 8, 2, DOC(K))}
  ${at(CX[1] - 48, py, 2.4, HEAD(K))}
  ${at(CX[2] - 52, py - 6, 2.8, WRENCH(K))}
  ${at(CX[3] - 44, py, 2.4, DOC(R))}
  ${ARROW(CX[0] + 72, CX[1] - 72, py + pz / 2, K)}
  ${ARROW(CX[2] + 72, CX[3] - 72, py + pz / 2, K)}
  ${arcArrow(640, py + pz / 2, 54, 196, 344, 13, R)}
  ${arcArrow(640, py + pz / 2, 54, 16, 164, 13, BG)}
  ${lab(CX[0], ["Rosa’s chart", "612 notes"])}
  ${lab(CX[1], ["Model", "reads, decides", "the next step"])}
  ${lab(640, ["Think → Act", "→ Observe"], R).replace(/fill="${K}">→ Observe/, `fill="${BG}">→ Observe`)}
  ${lab(CX[2], ["Tools", "search · read a note", "· labs"])}
  ${lab(CX[3], ["Answer", "EF 30% · metoprolol", "tartrate → a gap", "“LVEF 30%” · Echo, 10/02"], R)}

  <!-- questions right, of 5: one square per question answered -->
  <rect x="64" y="440" width="1152" height="3" fill="${K}"/>
  <text x="64" y="480" font-size="${LAB}" font-weight="600" letter-spacing="2.5" fill="${K}">QUESTIONS RIGHT, OF 5</text>
  ${rows.map(([t, v, glyph], i) => {
    const y = ry + i * rh;
    let sq = "";
    for (let j = 0; j < 5; j++) sq += at(sx + j * sp, y, ss, j < v ? TICK(i === 3 ? R : K) : `<rect width="40" height="40" fill="${PALE}"/>`);
    return `${at(64, y + 2, 0.66, glyph)}<text x="104" y="${y + 22}" font-size="${TXT}" fill="${K}">${t}</text>${sq}
      <text x="${sx + 5 * sp + 8}" y="${y + 23}" font-size="${TXT + 4}" font-weight="700" fill="${i === 3 ? R : K}">${v}</text>`;
  }).join("")}

  <text x="64" y="698" font-size="${LAB}" letter-spacing="2" fill="${K}">QCOR 2026 · BUILD AN AGENT, LIVE</text>
  <text x="1216" y="698" text-anchor="end" font-size="${TXT + 4}" font-weight="700" fill="${K}">14</text>
</svg>`;
};

// ---------- icons: flat silhouettes, details cut out in cream ----------
const ic = (b) => `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">${b}</svg>`;
const icons = [
  ["patient", ic(`<circle cx="24" cy="13" r="9" fill="${K}"/><path d="M9 44 V33 C9 27 13 24 19 24 H29 C35 24 39 27 39 33 V44 Z" fill="${K}"/><path d="M15.5 31 V44 M32.5 31 V44" stroke="${C}" stroke-width="2"/>`)],
  ["heart", ic(`<path d="M24 43 L6 25 C1 20 1 11 7 7 C12 3.5 19 5 24 11 C29 5 36 3.5 41 7 C47 11 47 20 42 25 Z" fill="${R}"/>`)],
  ["pill", ic(`<g transform="rotate(-40 24 24)"><path d="M24 15 H15 A9 9 0 0 0 15 33 H24 Z" fill="${R}"/><path d="M24 15 H33 A9 9 0 0 1 33 33 H24 Z" fill="${K}"/></g>`)],
  ["note", ic(at(5, 4, 1, DOC(K)))],
  ["search", ic(at(4, 4, 1, LENS(K)))],
  ["database", ic(`<path d="M8 9 C8 3 40 3 40 9 V15 C40 21 8 21 8 15 Z" fill="${K}"/><path d="M8 20 C8 25 40 25 40 20 V27 C40 33 8 33 8 27 Z" fill="${K}"/><path d="M8 32 C8 37 40 37 40 32 V39 C40 45 8 45 8 39 Z" fill="${K}"/>`)],
  ["tool", ic(at(4, 4, 1.2, WRENCH(K)))],
  ["agent", ic(`${arcArrow(24, 24, 16, 200, 330, 7, R)}${arcArrow(24, 24, 16, 20, 150, 7, K)}`)],
  ["check", ic(at(4, 4, 1, TICK(K)))],
  ["warning", ic(`<path d="M24 3 L46 43 H2 Z" fill="${K}"/><rect x="21" y="16" width="6" height="15" fill="${C}"/><rect x="21" y="34" width="6" height="5" fill="${C}"/>`)],
];

export default {
  id: "isotype",
  name: "Isotype",
  after: "Otto Neurath's Isotype (Vienna, 1925–1940) and Gerd Arntz's pictograms",
  note: "Quantities are counted, not measured: the chart is rows of identical symbols, and every part of the agent is one flat pictogram with its details cut out of the silhouette. Reads at a glance from the back of a hall.",
  palette: [[K, "black"], [R, "red"], [BG, "blue-grey"], [PALE, "pale"], [C, "cream"]],
  type: "Gill Sans SemiBold for titles and labels, Gill Sans for text",
  ground: C,
  people,
  slide,
  icons,
};
