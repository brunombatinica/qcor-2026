// 09 3Blue1Brown / Manim: dark ground, a faint number plane, blue–teal–yellow–brown, smooth curves and vectors.
const BG = "#0f1215", W = "#ece9e2", BL = "#58c4dd", BD = "#1c758a", TE = "#5cd0b3", YE = "#f9d65c", BR = "#c58b52", RD = "#fc6255", GR = "#83c167";
const SERIF = `'STIX Two Text', 'Times New Roman', Times, serif`;
const F = `font-family="${SERIF}"`;
const f1 = (n) => n.toFixed(1);

// smooth path through points (Catmull–Rom → cubic Bézier)
function smooth(pts, closed = false) {
  const n = pts.length, P = (i) => pts[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
  let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const [p0, p1, p2, p3] = [P(i - 1), P(i), P(i + 1), P(i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${f1(c1[0])} ${f1(c1[1])} ${f1(c2[0])} ${f1(c2[1])} ${f1(p2[0])} ${f1(p2[1])}`;
  }
  return d + (closed ? " Z" : "");
}
// manim-style arrow: line plus a filled triangular tip
function vec(x0, y0, x1, y1, col, w = 4, tip = 14) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
  const bx = x1 - ux * tip, by = y1 - uy * tip, px = -uy * tip * 0.5, py = ux * tip * 0.5;
  return `<path d="M${f1(x0)} ${f1(y0)} L${f1(bx + ux * 2)} ${f1(by + uy * 2)}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>
    <path d="M${f1(x1)} ${f1(y1)} L${f1(bx + px)} ${f1(by + py)} L${f1(bx - px)} ${f1(by - py)} Z" fill="${col}"/>`;
}
// number plane
const plane = (w, h, step, ox, oy, op = 1, axes = true) => {
  let g = "";
  for (let x = ox % step; x <= w; x += step) g += `<path d="M${x} 0 V${h}" stroke="${BL}" stroke-opacity="${0.16 * op}" stroke-width="1.2"/>`;
  for (let y = oy % step; y <= h; y += step) g += `<path d="M0 ${y} H${w}" stroke="${BL}" stroke-opacity="${0.16 * op}" stroke-width="1.2"/>`;
  for (let x = (ox + step / 2) % step; x <= w; x += step) g += `<path d="M${x} 0 V${h}" stroke="${BL}" stroke-opacity="${0.06 * op}"/>`;
  for (let y = (oy + step / 2) % step; y <= h; y += step) g += `<path d="M0 ${y} H${w}" stroke="${BL}" stroke-opacity="${0.06 * op}"/>`;
  return g + (axes ? `<path d="M${ox} 0 V${h} M0 ${oy} H${w}" stroke="${W}" stroke-opacity="${0.5 * op}" stroke-width="1.6"/>` : "");
};

const TXT = 20, LAB = 15;

// ---------- people: two constructed figures on the plane, a circle and an arc each; her cue is a small circle ----------
const figure = (cx, base, s, col, bun) => `<g fill="${col}" fill-opacity=".2" stroke="${col}" stroke-width="${3 * s}">
    <path d="M${cx - 62 * s} ${base} A${62 * s} ${62 * s} 0 0 1 ${cx + 62 * s} ${base} Z"/>
    <circle cx="${cx}" cy="${base - 62 * s - 46 * s}" r="${34 * s}"/>
    ${bun ? `<circle cx="${cx}" cy="${base - 62 * s - 46 * s - 34 * s - 14 * s}" r="${11 * s}"/>` : ""}</g>`;
const people = () => `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" ${F}>
  <rect width="400" height="400" fill="${BG}"/>
  ${plane(400, 400, 40, 200, 320, 0.9)}
  ${figure(120, 320, 1, BL, false)}${figure(280, 320, 1, TE, true)}
</svg>`;

// ---------- slide ----------
const slide = () => {
  const cx = 640, cy = 480, r = 112;
  const P = (deg, rr = r) => [cx + rr * Math.cos((deg * Math.PI) / 180), cy + rr * Math.sin((deg * Math.PI) / 180)];
  const tangent = (deg, len = 72) => { const [x, y] = P(deg), a = (deg * Math.PI) / 180; return vec(x, y, x - Math.sin(a) * len, y + Math.cos(a) * len, YE, 3.5, 14); };
  const M = P(180), Tl = P(0);
  const ox = 896, oy = 256, xs = [960, 1040, 1120, 1200], vals = [1, 2, 4, 5], yu = 28;
  const pts = xs.map((x, i) => [x, oy - vals[i] * yu]);
  const labs = [["Model", "alone"], ["+ chart", "pasted"], ["+ tools", ""], ["+ checks", ""]];
  const box = (x, col) => `<rect x="${x}" y="${cy - 64}" width="224" height="128" rx="10" fill="${col}" fill-opacity=".12" stroke="${col}" stroke-width="3"/>`;
  return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" ${F}>
  <defs><radialGradient id="manim-fade" cx=".5" cy=".6" r=".8"><stop offset="0" stop-color="${BG}" stop-opacity=".2"/><stop offset="1" stop-color="${BG}" stop-opacity=".9"/></radialGradient></defs>
  <rect width="1280" height="720" fill="${BG}"/>
  <g opacity=".7">${plane(1280, 720, 80, 640, 480, 1, false)}</g>
  <rect width="1280" height="720" fill="url(#manim-fade)"/>

  <text x="64" y="80" font-size="${LAB + 3}" fill="${BL}">Part 4 · Agents</text>
  <text x="62" y="152" font-size="60" fill="${W}">An agent is</text>
  <text x="62" y="216" font-size="60" fill="${W}">a model in a <tspan fill="${YE}" font-style="italic">loop</tspan></text>

  <!-- chart: points on axes -->
  <text x="${ox}" y="80" font-size="${LAB + 3}" font-style="italic" fill="${W}">questions right, of 5</text>
  ${vec(ox, oy, ox, 96, W, 2, 10)}${vec(ox, oy, 1232, oy, W, 2, 10)}
  ${[1, 2, 3, 4, 5].map((v) => `<path d="M${ox - 6} ${oy - v * yu} H${ox + 6}" stroke="${W}" stroke-width="2"/><text x="${ox - 14}" y="${oy - v * yu + 5}" text-anchor="end" font-size="${LAB - 2}" fill="${W}" fill-opacity=".6">${v}</text>`).join("")}
  ${pts.map(([x, y]) => `<path d="M${x} ${oy} V${y}" stroke="${W}" stroke-opacity=".4" stroke-width="1.5" stroke-dasharray="4 5"/>`).join("")}
  <path d="${smooth(pts)}" fill="none" stroke="${BL}" stroke-width="3"/>
  ${pts.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="7" fill="${YE}"/><text x="${x - 14}" y="${y - 10}" text-anchor="end" font-size="${TXT}" font-style="italic" fill="${YE}">${vals[i]}</text>
    <text x="${x}" y="${oy + 24}" text-anchor="middle" font-size="${LAB - 1}" fill="${W}" fill-opacity=".85">${labs[i][0]}</text><text x="${x}" y="${oy + 42}" text-anchor="middle" font-size="${LAB - 1}" fill="${W}" fill-opacity=".85">${labs[i][1]}</text>`).join("")}

  <!-- Rosa's chart and the answer: equal boxes -->
  ${box(64, BL)}
  <text x="88" y="${cy - 20}" font-size="${TXT + 2}" fill="${W}">Rosa’s chart</text>
  <text x="88" y="${cy + 12}" font-size="${TXT}" font-style="italic" fill="${BL}">612 notes</text>
  ${vec(296, cy, M[0] - 16, cy, W, 3, 14)}

  <!-- the loop: a circle with tangent vectors -->
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${BL}" fill-opacity=".06" stroke="${BL}" stroke-width="3.5"/>
  ${tangent(232)}${tangent(308)}${tangent(90)}
  <text x="${f1(P(232, r + 30)[0] - 18)}" y="${f1(P(232, r + 30)[1])}" text-anchor="end" font-size="${TXT}" font-style="italic" fill="${YE}">Think</text>
  <text x="${f1(P(308, r + 30)[0] + 18)}" y="${f1(P(308, r + 30)[1])}" font-size="${TXT}" font-style="italic" fill="${YE}">Act</text>
  <text x="${cx - 48}" y="${cy + r + 36}" text-anchor="end" font-size="${TXT}" font-style="italic" fill="${YE}">Observe</text>
  <circle cx="${f1(M[0])}" cy="${cy}" r="10" fill="${TE}"/><circle cx="${f1(Tl[0])}" cy="${cy}" r="10" fill="${BR}"/>
  <text x="${f1(M[0]) - 16}" y="${cy + 40}" text-anchor="end" font-size="${TXT + 2}" fill="${TE}">Model</text>
  <text x="${f1(M[0]) - 16}" y="${cy + 66}" text-anchor="end" font-size="${LAB}" fill="${W}" fill-opacity=".85">reads, decides</text>
  <text x="${f1(M[0]) - 16}" y="${cy + 86}" text-anchor="end" font-size="${LAB}" fill="${W}" fill-opacity=".85">the next step</text>
  <text x="${f1(Tl[0]) + 16}" y="${cy + 40}" font-size="${TXT + 2}" fill="${BR}">Tools</text>
  <text x="${f1(Tl[0]) + 16}" y="${cy + 66}" font-size="${LAB}" fill="${W}" fill-opacity=".85">search · read a note</text>
  <text x="${f1(Tl[0]) + 16}" y="${cy + 86}" font-size="${LAB}" fill="${W}" fill-opacity=".85">· labs</text>
  ${vec(Tl[0] + 16, cy, 976, cy, W, 3, 14)}

  ${box(992, YE)}
  <text x="1016" y="${cy - 20}" font-size="${TXT + 2}" fill="${YE}">Answer</text>
  <text x="1016" y="${cy + 12}" font-size="${TXT}" fill="${W}">EF 30% · metoprolol</text>
  <text x="1016" y="${cy + 38}" font-size="${TXT}" fill="${W}">tartrate → <tspan font-style="italic" fill="${RD}">a gap</tspan></text>
  <path d="M1000 ${cy + 80} q0 12 12 12 h88 q10 0 12 12 q2 -12 12 -12 h88 q12 0 12 -12" fill="none" stroke="${W}" stroke-width="2.2"/>
  <text x="1104" y="${cy + 132}" text-anchor="middle" font-size="${TXT}" fill="${W}">“LVEF 30%” <tspan font-style="italic" fill-opacity=".7" font-size="${LAB}">Echo, 10/02</tspan></text>

  <text x="64" y="688" font-size="${LAB}" fill="${W}" fill-opacity=".55">QCOR 2026 · Build an agent, live</text>
  <text x="1216" y="688" text-anchor="end" font-size="${LAB + 3}" fill="${W}" fill-opacity=".75">14</text>
</svg>`;
};

// ---------- icons: one stroke weight, translucent fills ----------
const ic = (b) => `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" stroke-linecap="round" stroke-linejoin="round">${b}</svg>`;
const icons = () => [
  ["patient", `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">${figure(24, 44, 0.26, BL, false).replace(/stroke-width="[^"]*"/, 'stroke-width="2.6"')}</svg>`],
  ["heart", ic(`<path d="M24 41 C12 32 5 25 5 16.5 A9.5 9.5 0 0 1 24 12 A9.5 9.5 0 0 1 43 16.5 C43 25 36 32 24 41 Z" fill="${RD}" fill-opacity=".25" stroke="${RD}" stroke-width="2.6"/>`)],
  ["pill", ic(`<g transform="rotate(-40 24 24)"><path d="M24 15 H15 A9 9 0 0 0 15 33 H24 Z" fill="${YE}" fill-opacity=".3" stroke="${YE}" stroke-width="2.6"/><path d="M24 15 H33 A9 9 0 0 1 33 33 H24 Z" fill="${BL}" fill-opacity=".25" stroke="${BL}" stroke-width="2.6"/></g>`)],
  ["note", ic(`<path d="M10 5 H30 L38 13 V43 H10 Z" fill="${BL}" fill-opacity=".14" stroke="${BL}" stroke-width="2.6"/><path d="M30 5 V13 H38" fill="none" stroke="${BL}" stroke-width="2.6"/><path d="M16 22 H32 M16 29 H32 M16 36 H26" stroke="${W}" stroke-width="2.6"/>`)],
  ["search", ic(`<circle cx="20" cy="20" r="13" fill="${BL}" fill-opacity=".14" stroke="${BL}" stroke-width="2.6"/><path d="M29.5 29.5 L42 42" stroke="${W}" stroke-width="2.6"/>`)],
  ["database", ic(`<path d="M9 12 V36 A15 5.5 0 0 0 39 36 V12" fill="${TE}" fill-opacity=".14" stroke="${TE}" stroke-width="2.6"/><ellipse cx="24" cy="12" rx="15" ry="5.5" fill="${TE}" fill-opacity=".25" stroke="${TE}" stroke-width="2.6"/>
    <path d="M9 20 A15 5.5 0 0 0 39 20 M9 28 A15 5.5 0 0 0 39 28" fill="none" stroke="${TE}" stroke-width="2.6"/>`)],
  ["tool", ic(`<path d="M28.5 7.5 A10 10 0 0 0 20.6 22.4 L7 36 A3.6 3.6 0 0 0 12 41 L25.6 27.4 A10 10 0 0 0 40.5 19.5 L34 21 L30 18 L27 14 Z" fill="${BR}" fill-opacity=".25" stroke="${BR}" stroke-width="2.6"/>`)],
  ["agent", ic(`<circle cx="24" cy="24" r="14" fill="${BL}" fill-opacity=".1" stroke="${BL}" stroke-width="2.6"/>${vec(14.1, 14.1, 26, 3.5, YE, 2.6, 7)}${vec(33.9, 33.9, 22, 44.5, YE, 2.6, 7)}`)],
  ["check", ic(`<circle cx="24" cy="24" r="19" fill="${GR}" fill-opacity=".14" stroke="${GR}" stroke-width="2.6"/><path d="M15 24.5 L21 30.5 L33.5 18" fill="none" stroke="${GR}" stroke-width="2.6"/>`)],
  ["warning", ic(`<path d="M24 5 L44 41 H4 Z" fill="${YE}" fill-opacity=".16" stroke="${YE}" stroke-width="2.6"/><path d="M24 17 V29" stroke="${YE}" stroke-width="2.6"/><circle cx="24" cy="35" r="1.8" fill="${YE}"/>`)],
];

export default {
  id: "manim",
  name: "3Blue1Brown",
  after: "Grant Sanderson's 3Blue1Brown videos and the Manim animation engine (number planes, vectors, smooth curves)",
  note: "Explains by construction on a dark number plane: the loop is a circle you can trace with tangent vectors, the chart is points on axes. Made to animate, so each step of the agent could be drawn on, one stroke at a time.",
  palette: [[BG, "ground"], [BL, "blue"], [TE, "teal"], [YE, "yellow"], [BR, "brown"], [RD, "red"]],
  type: "STIX Two Text roman and italic",
  ground: BG,
  people,
  slide,
  icons,
};
