// LeWitt: wall drawings made by rule. Thin straight lines in four directions (horizontal graphite, vertical yellow,
// rising red, falling blue), arcs from a side, grids. Each step of the diagram adds one direction.
const WALL = "#fbfaf6", INK = "#2f2f2f", GRA = "#5e5e5e", PEN = "#a3a3a0";
const Y = "#e0ae00", R = "#cc3a2e", B = "#2d59a0";
const DIRS = [[0, GRA], [90, Y], [45, R], [135, B]];        // the system: direction, colour
const H = `font-family="'Helvetica Neue', Helvetica, Arial, sans-serif"`;
const f = (v) => +v.toFixed(2);

// parallel lines across a box, in one of four directions, clipped to a shape
let uid = 0;
const lines = ([x, y, w, h], dir, sp) => {
  let d = "";
  if (dir === 0) for (let v = y + sp / 2; v < y + h; v += sp) d += `M${f(x)} ${f(v)}H${f(x + w)}`;
  if (dir === 90) for (let v = x + sp / 2; v < x + w; v += sp) d += `M${f(v)} ${f(y)}V${f(y + h)}`;
  const s = sp * Math.SQRT2;
  if (dir === 45) for (let c = x + y + s / 2; c < x + w + y + h; c += s) d += `M${f(c - y - h)} ${f(y + h)}L${f(c - y)} ${f(y)}`;
  if (dir === 135) for (let c = x - y - h + s / 2; c < x + w - y; c += s) d += `M${f(c + y)} ${f(y)}L${f(c + y + h)} ${f(y + h)}`;
  return d;
};
const hatch = (clip, box, dir, sp, col, sw, rule = "nonzero") => {
  const id = `lewitt-c${uid++}`;
  return `<clipPath id="${id}" clip-rule="${rule}">${clip}</clipPath><path d="${lines(box, dir, sp)}" stroke="${col}" stroke-width="${sw}" fill="none" clip-path="url(#${id})"/>`;
};
// the first n directions of the system, superimposed in a rectangle
const field = (x, y, w, h, n, sp, sw) => DIRS.slice(0, n).map(([d, c]) => hatch(`<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`, [x, y, w, h], d, sp, c, sw)).join("");

// ---------- people: heads in vertical lines, shoulders as arcs from the midpoint of the base; her hair in diagonals ----------
const people = () => {
  const fig = (cx, hair) => {
    const arcs = Array.from({ length: 12 }, (_, i) => { const r = 6 * (i + 1); return `M${cx - r} 296 A${r} ${r} 0 0 1 ${cx + r} 296`; }).join("");
    const head = `<circle cx="${cx}" cy="176" r="32"/>`;
    const bob = hair ? hatch(`<path clip-rule="evenodd" d="M${cx - 44} 212 V176 A44 44 0 0 1 ${cx + 44} 176 V212 Z M${cx - 32} 176 A32 32 0 1 0 ${cx + 32} 176 A32 32 0 1 0 ${cx - 32} 176 Z"/>`, [cx - 50, 124, 100, 92], 45, 4.5, GRA, 1, "evenodd") : "";
    return `${bob}${hatch(head, [cx - 34, 142, 68, 68], 90, 4.5, GRA, 1)}<path d="${arcs}" fill="none" stroke="${GRA}" stroke-width="1"/>`;
  };
  return `<svg viewBox="0 56 400 340" xmlns="http://www.w3.org/2000/svg">
  <rect y="56" width="400" height="340" fill="${WALL}"/>
  ${fig(118, false)}${fig(282, true)}
  <path d="M40 296.5 H360" stroke="${PEN}" stroke-width=".75"/>
</svg>`;
};

// ---------- slide ----------
const slide = () => {
  const T = (x, y, s, size, fill = INK, extra = "") => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" ${extra}>${s}</text>`;
  const S = 176, Y0 = 312, NX = [64, 352, 752, 1040], cy = Y0 + S / 2;
  const chev = (x, y, a) => `<path d="M-10 -5.5 L0 0 L-10 5.5" transform="translate(${f(x)} ${f(y)}) rotate(${f(a)})" fill="none" stroke="${INK}" stroke-width="1.5" stroke-linejoin="miter"/>`;
  const line = (x1, x2, y) => `<path d="M${x1} ${y} H${x2}" stroke="${INK}" stroke-width="1.5"/>${chev(x2, y, x2 > x1 ? 0 : 180)}`;
  // the loop: two arcs on the chord between Model and Tools, sagitta 40
  const xa = NX[1] + S + 20, xb = NX[2] - 20, half = (xb - xa) / 2, sag = 40, Rr = (half * half + sag * sag) / (2 * sag);
  const ang = (Math.atan2(half, Rr - sag) * 180) / Math.PI;
  const loop = `<path d="M${xa} ${cy - 36} A${f(Rr)} ${f(Rr)} 0 0 1 ${xb} ${cy - 36}" fill="none" stroke="${INK}" stroke-width="1.5"/>${chev(xb, cy - 36, ang)}
    <path d="M${xb} ${cy + 36} A${f(Rr)} ${f(Rr)} 0 0 1 ${xa} ${cy + 36}" fill="none" stroke="${INK}" stroke-width="1.5"/>${chev(xa, cy + 36, 180 + ang)}`;

  // chart: a grid of five squares per row; answered squares carry the row's lines (each row adds a direction)
  const rows = [["Model alone", 1], ["+ chart pasted", 2], ["+ tools", 4], ["+ checks", 5]];
  const C = 32, CX = 1008;
  const chart = rows.map(([t, v], r) => {
    const y = 112 + r * 40;
    return T(832, y + 22, t, 16) + [0, 1, 2, 3, 4].map((i) => (i < v ? field(CX + i * C, y, C, C, r + 1, 5, 0.9) : "")
      + `<rect x="${CX + i * C}" y="${y}" width="${C}" height="${C}" fill="none" stroke="${PEN}" stroke-width=".75"/>`).join("")
      + T(1216, y + 22, v, 18, INK, 'text-anchor="end"');
  }).join("");

  const node = (i) => field(NX[i], Y0, S, S, i + 1, 8, 1) + `<rect x="${NX[i]}" y="${Y0}" width="${S}" height="${S}" fill="none" stroke="${PEN}" stroke-width=".75"/>`;
  const lab = (x, name, ls) => T(x, Y0 + S + 40, name, 20, INK, 'font-weight="500"') + ls.map((l, i) => T(x, Y0 + S + 66 + i * 22, l, 16, GRA)).join("");
  return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" ${H}>
  <rect width="1280" height="720" fill="${WALL}"/>
  ${T(64, 88, "Part 4 · Agents", 16, R, 'font-weight="500"')}
  <g font-size="56" font-weight="300" fill="${INK}" letter-spacing="-1">
    <text x="61" y="160">An agent is</text>
    <text x="61" y="226">a model in a loop</text>
  </g>
  ${T(832, 88, "Questions right, of 5", 16, R, 'font-weight="500"')}
  ${chart}

  ${[0, 1, 2, 3].map(node).join("")}
  ${line(NX[0] + S + 20, NX[1] - 20, cy)}
  ${loop}
  ${line(NX[2] + S + 20, NX[3] - 20, cy)}
  ${T(640, cy - 36 - sag - 14, "Think → Act", 16, INK, 'text-anchor="middle"')}
  ${T(640, cy + 36 + sag + 26, "Observe", 16, INK, 'text-anchor="middle"')}

  ${lab(NX[0], "Rosa’s chart", ["612 notes"])}
  ${lab(NX[1], "Model", ["reads, decides", "the next step"])}
  ${lab(NX[2], "Tools", ["search", "read a note", "labs"])}
  ${T(NX[3], Y0 + S + 40, "Answer", 20, INK, 'font-weight="500"')}
  ${T(NX[3], Y0 + S + 66, "EF 30% · metoprolol", 16, GRA)}
  ${T(NX[3], Y0 + S + 88, `tartrate <tspan fill="${R}">→ a gap</tspan>`, 16, GRA)}
  ${T(NX[3], Y0 + S + 116, "“LVEF 30%”", 16, INK)}
  ${T(NX[3] + 96, Y0 + S + 116, "Echo, 10/02", 13, GRA)}

  <path d="M64 652.5 H1216" stroke="${PEN}" stroke-width=".75"/>
  ${T(64, 680, "QCOR 2026 · Build an agent, live", 13, GRA)}
  ${T(1216, 680, "14", 13, INK, 'text-anchor="end"')}
</svg>`;
};

// ---------- icons: a graphite outline, the inside drawn in parallel lines (48 grid, lines every 3) ----------
const OUT = `fill="none" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"`;
const ic = (shape, dir, col = GRA, extra = "", clip = shape, rule = "nonzero") => `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">${hatch(clip, [0, 0, 48, 48], dir, 3, col, 0.8, rule)}<g ${OUT}>${shape}</g>${extra}</svg>`;
// a polyline thickened to width t, mitred (for the check and handles)
const thick = (pts, t) => {
  const off = (p, q, d) => { const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy), n = [-dy / L * d, dx / L * d]; return [[p[0] + n[0], p[1] + n[1]], [q[0] + n[0], q[1] + n[1]]]; };
  const meet = ([a, b], [c, e]) => { const d1 = [b[0] - a[0], b[1] - a[1]], d2 = [e[0] - c[0], e[1] - c[1]], den = d1[0] * d2[1] - d1[1] * d2[0];
    if (Math.abs(den) < 1e-9) return b; const t1 = ((c[0] - a[0]) * d2[1] - (c[1] - a[1]) * d2[0]) / den; return [a[0] + d1[0] * t1, a[1] + d1[1] * t1]; };
  const side = (d) => { const segs = pts.slice(1).map((q, i) => off(pts[i], q, d)); const out = [segs[0][0]];
    for (let i = 1; i < segs.length; i++) out.push(meet(segs[i - 1], segs[i])); out.push(segs[segs.length - 1][1]); return out; };
  const P = [...side(t / 2), ...side(-t / 2).reverse()];
  return `<path d="M${P.map((p) => `${f(p[0])} ${f(p[1])}`).join(" L")} Z"/>`;
};
const heartD = (cx, by, a) => { const h = a / Math.SQRT2, r = a / 2; return `M${cx} ${by} L${f(cx - h)} ${f(by - h)} A${r} ${r} 0 0 1 ${cx} ${f(by - 2 * h)} A${r} ${r} 0 0 1 ${f(cx + h)} ${f(by - h)} Z`; };
const ringD = (cx, cy, r1, r2, a0, a1) => { const P = (r, a) => `${f(cx + r * Math.cos((a * Math.PI) / 180))} ${f(cy + r * Math.sin((a * Math.PI) / 180))}`; const lg = a1 - a0 > 180 ? 1 : 0;
  return `M${P(r2, a0)} A${r2} ${r2} 0 ${lg} 1 ${P(r2, a1)} L${P(r1, a1)} A${r1} ${r1} 0 ${lg} 0 ${P(r1, a0)} Z`; };
const wrench = `M20 3.84 V12 H28 V3.84 A10 10 0 0 1 28 22.16 V41 A4 4 0 0 1 20 41 V22.16 A10 10 0 0 1 20 3.84 Z`;
const agentTip = (() => { const a = (-70 * Math.PI) / 180, c = [24 + 14 * Math.cos(a), 24 + 14 * Math.sin(a)], t = [Math.cos(a + Math.PI / 2), Math.sin(a + Math.PI / 2)], n = [Math.cos(a), Math.sin(a)];
  const p = (u, v) => `${f(c[0] + t[0] * u + n[0] * v)} ${f(c[1] + t[1] * u + n[1] * v)}`; return `M${p(0, -8)} L${p(9, 0)} L${p(0, 8)} Z`; })();
const icons = [
  ["patient", ic(`<circle cx="24" cy="13" r="7.5"/><path d="M8 43 A16 16 0 0 1 40 43 Z"/>`, 90)],
  ["heart", ic(`<path d="${heartD(24, 41, 22)}"/>`, 45, R)],
  ["pill", (() => { const cap = `<rect x="6" y="16" width="36" height="16" rx="8"/>`, half = `<path d="M24 16 H14 A8 8 0 0 0 14 32 H24 Z"/>`;
    return `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><g transform="rotate(-45 24 24)">${hatch(half, [0, 0, 48, 48], 90, 3, GRA, 0.8)}<g ${OUT}>${cap}<path d="M24 16 V32"/></g></g></svg>`; })()],
  ["note", ic(`<path d="M10 5 H31 L38 12 V43 H10 Z"/><path d="M31 5 V12 H38"/>`, 0, GRA, "", `<path d="M10 5 H31 V12 H38 V43 H10 Z"/>`)],
  ["search", ic(`<circle cx="20" cy="20" r="13"/>${thick([[29.5, 29.5], [42, 42]], 6)}`, 135)],
  ["database", `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">${[6, 19, 32].map((y, i) => hatch(`<rect x="8" y="${y}" width="32" height="10"/>`, [0, 0, 48, 48], DIRS[i][0], 3, GRA, 0.8)).join("")}<g ${OUT}>${[6, 19, 32].map((y) => `<rect x="8" y="${y}" width="32" height="10"/>`).join("")}</g></svg>`],
  ["tool", `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><g transform="rotate(45 24 24)">${hatch(`<path d="${wrench}"/>`, [0, 0, 48, 48], 0, 3, GRA, 0.8)}<path d="${wrench}" ${OUT}/></g></svg>`],
  ["agent", ic(`<path d="${ringD(24, 24, 11, 17, -50, 250)}"/><path d="${agentTip}"/>`, 45)],
  ["check", ic(thick([[7, 24], [18.5, 35.5], [41, 13]], 8), 135)],
  ["warning", ic(`<path d="M24 5 L44 41 H4 Z"/><rect x="22" y="17" width="4" height="13"/><rect x="22" y="33" width="4" height="4"/>`, 90, R, "",
    `<path clip-rule="evenodd" d="M24 5 L44 41 H4 Z M22 17 H26 V30 H22 Z M22 33 H26 V37 H22 Z"/>`, "evenodd")],
];

export default {
  id: "lewitt",
  name: "LeWitt",
  after: "Sol LeWitt's wall drawings (lines in four directions, arcs from sides and corners, grids), 1968–2007",
  note: "Everything is drawn by a rule: thin straight lines in four directions, one colour each, plus arcs from a side. The chart is one direction, the model adds a second, the tools a third, the answer holds all four; the score grid follows the same rule. Calm, systematic, and quietly beautiful on a white wall.",
  palette: [[WALL, "wall"], [GRA, "graphite"], [Y, "yellow, vertical"], [R, "red, rising"], [B, "blue, falling"]],
  type: "Helvetica Neue Light for the title, Regular and Medium for text",
  ground: WALL,
  people,
  slide,
  icons,
};
