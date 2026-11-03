// 30 Whiteboard: an Excalidraw-style sketch. Every line is drawn twice with a seeded wobble, fills are hachure,
// marker colours, sticky notes, hand arrows, Marker Felt / Noteworthy / Chalkboard lettering.
const INK = "#1e1e1e", BLUE = "#1971c2", RED = "#e03131", GREEN = "#2f9e44", ORANGE = "#f08c00", VIOLET = "#6741d9";
const GREY = "#868e96", SIL = "#a6adb4", BOARD = "#fbfbf9", STICKY = "#ffec99", PINK = "#ffc9c9";
const MF = `font-family="'Marker Felt', 'Chalkboard SE', 'Comic Sans MS', cursive"`;
const NW = `font-family="Noteworthy, 'Chalkboard SE', 'Marker Felt', cursive"`;
const CB = `font-family="'Chalkboard SE', Noteworthy, 'Marker Felt', cursive"`;

// ---- a seeded hand ----
let R = () => 0.5;
function seed(s) { let a = s >>> 0; R = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const j = (a) => (R() * 2 - 1) * a;
const f1 = (v) => Math.round(v * 10) / 10;
let uid = 0;

// a wobbly line, drawn in two passes like a marker gone over twice
function lineD(x1, y1, x2, y2, r = 1.4, bow = 0.015, passes = 2) {
  const L = Math.hypot(x2 - x1, y2 - y1) || 1, nx = -(y2 - y1) / L, ny = (x2 - x1) / L;
  let d = "";
  for (let p = 0; p < passes; p++) {
    const b = j(bow * L), o = 0.02 * j(1);
    const ax = x1 - (x2 - x1) * o, ay = y1 - (y2 - y1) * o;
    const P = (t, k) => [f1(ax + (x2 - ax) * t + nx * b * k + j(r)), f1(ay + (y2 - ay) * t + ny * b * k + j(r))];
    const s = [f1(ax + j(r)), f1(ay + j(r))], c1 = P(0.35, 1), c2 = P(0.7, 0.9), e = [f1(x2 + j(r)), f1(y2 + j(r))];
    d += `M${s} C${c1} ${c2} ${e} `;
  }
  return d;
}
const catmull = (pts, close = false) => {
  const p = close ? [pts[pts.length - 1], ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts[pts.length - 1]];
  let d = `M${f1(p[1][0])} ${f1(p[1][1])}`;
  for (let i = 1; i < p.length - 2; i++) {
    const c1 = [p[i][0] + (p[i + 1][0] - p[i - 1][0]) / 6, p[i][1] + (p[i + 1][1] - p[i - 1][1]) / 6];
    const c2 = [p[i + 1][0] - (p[i + 2][0] - p[i][0]) / 6, p[i + 1][1] - (p[i + 2][1] - p[i][1]) / 6];
    d += ` C${f1(c1[0])} ${f1(c1[1])} ${f1(c2[0])} ${f1(c2[1])} ${f1(p[i + 1][0])} ${f1(p[i + 1][1])}`;
  }
  return d;
};
// a hand ellipse: one loop a little more than round, then a second looser pass
function ellD(cx, cy, rx, ry, r = 0.035, passes = 2) {
  let d = "";
  for (let p = 0; p < passes; p++) {
    const n = Math.max(9, Math.round((rx + ry) / 9)), a0 = R() * Math.PI * 2, over = 0.25 + R() * 0.25, pts = [];
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((Math.PI * 2 + over) * i) / n, k = 1 + j(r);
      pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
    }
    d += catmull(pts) + " ";
  }
  return d;
}
const rectD = (x, y, w, h, r = 1.6) => lineD(x, y, x + w, y, r) + lineD(x + w, y, x + w, y + h, r) + lineD(x + w, y + h, x, y + h, r) + lineD(x, y + h, x, y, r);
const stroke = (d, c = INK, w = 2.4, extra = "") => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
// hachure: parallel strokes at -41°, clipped to the shape
function hachure(shapeSVG, [x, y, w, h], c, gap = 9, sw = 1.8, op = 0.75) {
  const id = `sketch-h${++uid}`, a = (-41 * Math.PI) / 180, dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx;
  const corners = [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].map(([px, py]) => px * nx + py * ny);
  const lo = Math.min(...corners), hi = Math.max(...corners), D = Math.hypot(w, h);
  let d = "";
  for (let o = lo + gap / 2; o < hi; o += gap) {
    const cx = nx * o + dx * ((x + w / 2) * dx + (y + h / 2) * dy), cy = ny * o + dy * ((x + w / 2) * dx + (y + h / 2) * dy);
    d += lineD(cx - dx * D, cy - dy * D, cx + dx * D, cy + dy * D, 0.8, 0.004, 1);
  }
  return `<clipPath id="${id}">${shapeSVG}</clipPath><path d="${d}" clip-path="url(#${id})" fill="none" stroke="${c}" stroke-width="${sw}" stroke-opacity="${op}" stroke-linecap="round"/>`;
}
// arrowhead at (x, y) pointing along `ang` (radians)
function head(x, y, ang, s = 16) {
  return lineD(x, y, x - Math.cos(ang - 0.45) * s, y - Math.sin(ang - 0.45) * s, 0.8) + lineD(x, y, x - Math.cos(ang + 0.45) * s, y - Math.sin(ang + 0.45) * s, 0.8);
}
// a hand-drawn curved arrow through control points
function arrow(pts, c = INK, w = 2.6, s = 16) {
  const n = pts.length, [x, y] = pts[n - 1], [px, py] = pts[n - 2];
  const wob = pts.map(([a, b], i) => (i === 0 || i === n - 1 ? [a, b] : [a + j(3), b + j(3)]));
  return stroke(catmull(wob), c, w) + stroke(head(x, y, Math.atan2(y - py, x - px), s), c, w);
}
const sticky = (x, y, w, h, rot, body, c = STICKY) => `<g transform="rotate(${rot} ${x + w / 2} ${y + h / 2})">
    <rect x="${x + 5}" y="${y + 9}" width="${w}" height="${h}" fill="#000" opacity=".16" filter="url(#sketch-s-sh)"/>
    <path d="M${x} ${y} H${x + w} V${y + h - 16} L${x + w - 16} ${y + h} H${x} Z" fill="${c}"/>
    <path d="M${x + w} ${y + h - 16} L${x + w - 16} ${y + h} L${x + w - 13} ${y + h - 13} Z" fill="#000" opacity=".12"/>
    <rect x="${x}" y="${y}" width="${w}" height="16" fill="#000" opacity=".04"/>${body}</g>`;

// ---- people: two quick doodles, a circle and a shoulder line; the woman has a bun ----
function people() {
  seed(71);
  const fig = (cx, bun) => {
    const sh = `M${cx - 70} 318 C${cx - 70} 262 ${cx - 40} 238 ${cx} 238 C${cx + 40} 238 ${cx + 70} 262 ${cx + 70} 318`;
    return `${hachure(`<path d="${sh} Z"/>`, [cx - 70, 238, 140, 80], BLUE, 9, 2, 0.55)}
      ${stroke(catmull([[cx - 70, 318], [cx - 64, 270], [cx - 36, 242], [cx, 238], [cx + 36, 242], [cx + 64, 270], [cx + 70, 318]]), INK, 3)}
      ${stroke(ellD(cx, 180, 40, 42, 0.03), INK, 3)}
      ${bun ? stroke(ellD(cx, 124, 15, 14, 0.05), INK, 3) : ""}`;
  };
  return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  ${fig(112, false)}${fig(288, true)}
</svg>`;
}

// ---- slide ----
function slide() {
  seed(1414);
  const ny = 280, nh = 144, nw = 208, cy = ny + nh / 2;
  const nodes = [
    [64, "Rosa's chart", ["612 notes"]],
    [368, "Model", ["reads, decides", "the next step"]],
    [704, "Tools", ["search", "read a note", "labs"]],
  ];
  const inside = (x, name, lines) => `<text x="${x + 18}" y="${ny + 42}" ${MF} font-size="30" fill="${INK}">${name}</text>
    ${lines.map((t, i) => `<text x="${x + 18}" y="${ny + 72 + i * 23}" ${NW} font-size="18" fill="${INK}">${t}</text>`).join("")}`;
  const bars = [[1, "alone"], [2, "+ chart"], [4, "+ tools"], [5, "+ checks"]];
  const base = 630, u = 19;
  return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
  <defs><filter id="sketch-s-sh" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter></defs>
  <rect width="1280" height="720" fill="${BOARD}"/>

  <text x="64" y="72" ${NW} font-size="22" fill="${BLUE}">Part 4 · Agents</text>
  <text x="62" y="146" ${MF} font-size="66" fill="${INK}">An agent is a model in a loop</text>

  ${nodes.map(([x, name, lines]) => `<rect x="${x}" y="${ny}" width="${nw}" height="${nh}" fill="#fff"/>${stroke(rectD(x, ny, nw, nh, 1.4), INK, 2.6)}${inside(x, name, lines)}`).join("")}
  ${sticky(1008, ny, nw, nh, 1.2, inside(1008, "Answer", ["EF 30%", "metoprolol tartrate", "→ a gap"]))}
  <text x="1024" y="${ny + nh + 36}" ${NW} font-size="17" fill="${INK}">“LVEF 30%” · Echo, 10/02</text>

  ${arrow([[280, cy], [322, cy - 3], [362, cy]], INK, 2.6, 14)}
  ${arrow([[920, cy], [962, cy - 3], [1000, cy]], INK, 2.6, 14)}
  ${arrow([[540, ny - 6], [584, ny - 54], [680, ny - 56], [728, ny - 10]], RED, 2.8, 15)}
  ${arrow([[744, ny + nh + 6], [700, ny + nh + 54], [604, ny + nh + 56], [556, ny + nh + 10]], RED, 2.8, 15)}
  <text x="640" y="${ny - 66}" text-anchor="middle" ${NW} font-size="20" fill="${RED}">Think → Act → Observe</text>

  <!-- chart -->
  <text x="64" y="520" ${NW} font-size="19" fill="${INK}">Questions right, of 5</text>
  ${stroke(lineD(64, base, 488, base, 1, 0.005), INK, 2.4)}
  ${bars.map(([v, t], i) => {
    const x = 88 + i * 104, h = v * u, top = base - h;
    return `${hachure(`<rect x="${x}" y="${top}" width="56" height="${h}"/>`, [x, top, 56, h], BLUE, 8, 2, 0.75)}
      ${stroke(rectD(x, top, 56, h, 1), INK, 2.2)}
      <text x="${x + 28}" y="${top - 10}" text-anchor="middle" ${MF} font-size="26" fill="${INK}">${v}</text>
      <text x="${x + 28}" y="${base + 26}" text-anchor="middle" ${NW} font-size="16" fill="${INK}">${t}</text>`;
  }).join("")}

  <text x="64" y="704" ${NW} font-size="17" fill="${GREY}">QCOR 2026 · Build an agent, live</text>
  <text x="1216" y="704" text-anchor="end" ${MF} font-size="24" fill="${INK}">14</text>
</svg>`;
}

// ---- icons: doodles ----
function icons() {
  const ic = (name, body) => { return [name, `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">${body}</svg>`]; };
  const S = (d, c = INK, w = 2.3) => stroke(d, c, w);
  const H = (shape, box, c, gap = 4.5) => hachure(shape, box, c, gap, 1.4, 0.8);
  const out = [];
  seed(1); out.push(ic("patient", `${H(`<path d="M8 44 C8 32 15 27 24 27 C33 27 40 32 40 44 Z"/>`, [8, 27, 32, 17], BLUE)}${S(ellD(24, 16, 8.5, 9, 0.04))}${S(catmull([[8, 44], [10, 33], [17, 28], [24, 27], [31, 28], [38, 33], [40, 44]]))}`));
  seed(2); out.push(ic("heart", `${H(`<path d="M24 41 C13 33 7 26.5 7 19.5 C7 14 11 10 16 10 C19.6 10 22.4 12.2 24 15.2 C25.6 12.2 28.4 10 32 10 C37 10 41 14 41 19.5 C41 26.5 35 33 24 41 Z"/>`, [7, 10, 34, 31], RED, 4)}${S(catmull([[24, 41], [12, 32], [7, 22], [9, 13], [16, 10], [22, 12], [24, 15.5], [26, 12], [32, 10], [39, 13], [41, 22], [36, 32], [24, 41]]))}`));
  seed(3); out.push(ic("pill", `<g transform="rotate(-40 24 24)">${H(`<path d="M24 16 H15 A8 8 0 0 0 15 32 H24 Z"/>`, [7, 16, 17, 16], RED, 3.6)}${S(catmull([[24, 16], [15, 16], [8, 19], [7, 24], [8, 29], [15, 32], [24, 32], [33, 32], [40, 29], [41, 24], [40, 19], [33, 16], [24, 16]]))}${S(lineD(24, 16, 24, 32, 0.6))}</g>`));
  seed(4); out.push(ic("note", `${S(lineD(10, 6, 30, 6) + lineD(30, 6, 38, 14) + lineD(38, 14, 38, 42) + lineD(38, 42, 10, 42) + lineD(10, 42, 10, 6))}${S(lineD(30, 6, 30, 14, 0.6) + lineD(30, 14, 38, 14, 0.6), INK, 1.8)}${S(lineD(15, 21, 32, 21, 0.8) + lineD(15, 28, 32, 28, 0.8) + lineD(15, 35, 25, 35, 0.8), BLUE, 2)}`));
  seed(5); out.push(ic("search", `${H(`<circle cx="20" cy="20" r="11"/>`, [9, 9, 22, 22], BLUE, 4)}${S(ellD(20, 20, 12, 12, 0.04))}${S(lineD(29, 29, 41, 41, 0.8), INK, 4.5)}`));
  seed(6); out.push(ic("database", `${H(`<rect x="10" y="10" width="28" height="30"/>`, [10, 10, 28, 30], VIOLET, 4.5)}${S(ellD(24, 10, 14, 4.5, 0.05) + lineD(10, 10, 10, 38) + lineD(38, 10, 38, 38) + catmull([[10, 38], [17, 42.5], [31, 42.5], [38, 38]]) + catmull([[10, 24], [17, 28.5], [31, 28.5], [38, 24]]))}`));
  seed(7); out.push(ic("tool", `${S(catmull([[33, 6], [26, 9], [24, 17], [26, 21]]) + lineD(26, 21, 10, 37) + catmull([[10, 37], [9, 40.5], [12, 41], [15, 39]]) + lineD(15, 39, 31, 23) + catmull([[31, 23], [36, 24], [41, 20], [42, 14]]) + lineD(42, 14, 36, 19) + lineD(36, 19, 31, 17) + lineD(31, 17, 29, 12) + lineD(29, 12, 33, 6))}${H(`<path d="M26 21 L10 37 L15 39 L31 23 Z"/>`, [9, 20, 23, 21], ORANGE, 3.6)}`));
  seed(8); out.push(ic("agent", `${S(catmull([[40, 26], [36, 37], [24, 41], [12, 37], [7, 25], [11, 13], [22, 7], [33, 10]]), INK, 2.5)}${S(lineD(33, 10, 26, 5, 0.6) + lineD(33, 10, 28, 16, 0.6), INK, 2.5)}${H(`<circle cx="24" cy="24" r="6.5"/>`, [17, 17, 14, 14], RED, 3)}${S(ellD(24, 24, 6.5, 6.5, 0.06, 1), RED, 2)}`));
  seed(9); out.push(ic("check", `${H(`<circle cx="24" cy="24" r="18"/>`, [6, 6, 36, 36], GREEN, 5)}${S(ellD(24, 24, 19, 19, 0.03), INK, 2)}${S(lineD(13, 24, 21, 33, 0.8) + lineD(21, 33, 37, 13, 0.8), GREEN, 4.2)}`));
  seed(10); out.push(ic("warning", `${H(`<path d="M24 5 L44 41 H4 Z"/>`, [4, 5, 40, 36], ORANGE, 4.5)}${S(lineD(24, 5, 44, 41) + lineD(44, 41, 4, 41) + lineD(4, 41, 24, 5))}${S(lineD(24, 16, 24, 29, 0.6), INK, 3.6)}<circle cx="24" cy="35" r="2.4" fill="${INK}"/>`));
  return out;
}

export default {
  id: "sketch",
  name: "Whiteboard",
  after: "Excalidraw and rough.js, the hand-drawn whiteboard: double-pass marker lines, hachure fills, sticky notes",
  note: "The talk as a whiteboard drawn live: confident marker boxes, the loop as two red strokes between model and tools, the answer on a sticky note, bars in blue hachure. It says \"this is simple, I can draw it for you\", which suits building an agent in front of the room.",
  palette: [[INK, "marker black"], [RED, "marker red"], [BLUE, "marker blue"], [GREEN, "marker green"], [ORANGE, "marker orange"], [STICKY, "sticky note"], [BOARD, "board"]],
  type: "Marker Felt for titles and names, Noteworthy for notes",
  ground: BOARD,
  peopleGround: "linear-gradient(135deg, #ffffff, #f1f2ef)",
  iconGround: "linear-gradient(135deg, #ffffff, #f1f2ef)",
  iconInk: "#000",
  people,
  slide,
  icons,
};
