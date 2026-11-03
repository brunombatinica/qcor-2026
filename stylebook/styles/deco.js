// Art Deco: navy lacquer and metallic gold, strict bilateral symmetry, stepped (ziggurat) forms.
// Two faces only: Didot for the title and text, Copperplate for small spaced labels.
const N = "#0e1a30", K = "#070b14", G = "#d6b25e", GL = "#f3dea0", GD = "#8a6627", C = "#efe2c2";
const DIDOT = `font-family="Didot, 'Bodoni 72', serif"`;
const CP = `font-family="Copperplate, 'Copperplate Gothic Light', serif"`;
const DISPLAY = 54, TEXT = 18, LABEL = 13;

// metallic gold: diagonal bands repeated by reflection, in user space so thin lines and text all shine
const gold = (id, w = 160, h = 90) => `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${w}" y2="${h}" spreadMethod="reflect">
  <stop offset="0" stop-color="${GD}"/><stop offset=".32" stop-color="#e2c272"/><stop offset=".5" stop-color="#fff3c8"/><stop offset=".68" stop-color="#d0a750"/><stop offset="1" stop-color="${GD}"/></linearGradient>`;
const pt = (cx, cy, r, a) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)].map((v) => +v.toFixed(2));
const rays = (cx, cy, r0, r1, n, a0, a1, stroke, w, op) => Array.from({ length: n }, (_, i) => {
  const a = a0 + ((a1 - a0) * i) / (n - 1), [x0, y0] = pt(cx, cy, r0, a), [x1, y1] = pt(cx, cy, r1, a);
  return `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="${stroke}" stroke-width="${w}" stroke-opacity="${op}"/>`;
}).join("");
// a ziggurat: a rectangle with `steps` set-backs on top, each `dx` in and `dy` up
const zig = (x, y, w, h, steps, dx, dy) => {
  let d = `M${x} ${y + h} V${y}`;
  for (let i = 0; i < steps; i++) d += ` H${x + dx * (i + 1)} V${y - dy * (i + 1)}`;
  d += ` H${x + w - dx * steps}`;
  for (let i = steps - 1; i >= 0; i--) d += ` V${y - dy * i} H${x + w - dx * i}`;
  return d + ` V${y + h} Z`;
};

// the person, in the icon's line logic (head, shoulders, a stepped neckline); the woman adds a bun
const bust = (cx, s, bun, stroke, w) => `<g transform="translate(${cx} 0) scale(${s})" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="miter">
  ${bun ? `<circle cx="0" cy="3.6" r="3.6"/>` : ""}<circle cx="0" cy="16.5" r="7.5"/>
  <path d="M-15 43 C-15 32 -9 28 0 28 C9 28 15 32 15 43 Z"/><path d="M-5 28.6 L0 34 L5 28.6"/></g>`;

const people = `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <defs>${gold("deco-p-gold", 120, 70)}</defs>
  <g transform="translate(0 100)">${bust(118, 4.2, false, "url(#deco-p-gold)", 0.85)}${bust(282, 4.2, true, "url(#deco-p-gold)", 0.85)}</g>
  <path d="M40 300 H360" stroke="url(#deco-p-gold)" stroke-width="2"/><path d="M40 308 H360" stroke="url(#deco-p-gold)" stroke-width="1"/>
</svg>`;

const slide = (() => {
  const g = "url(#deco-s-gold)";
  const T = (x, y, s, f, t, extra = "") => `<text x="${x}" y="${y}" font-size="${s}" ${f} ${extra}>${t}</text>`;
  const lab = (x, y, t, extra = "") => T(x, y, LABEL, CP, t, `text-anchor="middle" letter-spacing="4" fill="${GL}" ${extra}`);
  const txt = (x, y, t, extra = "") => T(x, y, TEXT, DIDOT, t, `text-anchor="middle" fill="${C}" ${extra}`);
  // four equal plaques, mirror-symmetric about x = 640
  const W = 232, top = 268, H = 200, xs = [72, 352, 696, 976];
  const plaque = (x, name, lines, quote) => `<path d="${zig(x, top, W, H, 2, 22, 12)}" fill="${K}" stroke="${g}" stroke-width="2"/>
    <path d="${zig(x + 8, top + 8, W - 16, H - 16, 2, 22, 12)}" fill="none" stroke="${g}" stroke-width="1"/>
    ${lab(x + W / 2, 300, name)}<path d="M${x + W / 2 - 40} 314 H${x + W / 2 + 40}" stroke="${g}" stroke-width="1"/>
    ${lines.map(([t, it], i) => txt(x + W / 2, 342 + i * 23, it ? `<tspan font-style="italic">${t}</tspan>` : t)).join("")}
    ${quote ? `<path d="M${x + 60} 400 H${x + W - 60}" stroke="${g}" stroke-width="1"/>${quote.map((q, i) => txt(x + W / 2, 422 + i * 22, q, `fill="${GL}"`)).join("")}` : ""}`;
  const arrow = (x1, x2, y) => `<path d="M${x1} ${y} H${x2}" stroke="${g}" stroke-width="2" marker-end="url(#deco-s-ah)"/>`;
  // skyline chart
  const base = 652, u = 16, bw = 48, gap = 30, x0 = 640 - (4 * bw + 3 * gap) / 2;
  const bars = [[1, "ALONE"], [2, "+ CHART"], [4, "+ TOOLS"], [5, "+ CHECKS"]].map(([v, t], i) => {
    const x = x0 + i * (bw + gap), top = base - v * u;
    return `<path d="${zig(x, top, bw, v * u, v > 1 ? 2 : 1, 8, 6)}" fill="${i === 3 ? g : K}" stroke="${g}" stroke-width="1.5"/>
      ${txt(x + bw / 2, top - (v > 1 ? 22 : 14), v, `fill="${GL}"`)}${T(x + bw / 2, base + 18, 11, CP, t, `text-anchor="middle" letter-spacing="1" fill="${C}"`)}`;
  }).join("");

  return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
  <defs>${gold("deco-s-gold", 180, 100)}
    <radialGradient id="deco-s-bg" cx=".5" cy=".42" r=".75"><stop offset="0" stop-color="#1a2b4d"/><stop offset=".6" stop-color="${N}"/><stop offset="1" stop-color="${K}"/></radialGradient>
    <marker id="deco-s-ah" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="12" markerHeight="12" markerUnits="userSpaceOnUse" orient="auto"><path d="M2 1 L10 6 L2 11" fill="none" stroke="${G}" stroke-width="2"/></marker>
  </defs>
  <rect width="1280" height="720" fill="url(#deco-s-bg)"/>
  ${rays(640, 780, 160, 900, 37, 190, 350, G, 1, 0.07)}
  <rect x="18" y="18" width="1244" height="684" fill="none" stroke="${g}" stroke-width="1.5"/>
  ${[[26, 26, 1, 1], [1254, 26, -1, 1], [26, 694, 1, -1], [1254, 694, -1, -1]].map(([x, y, sx, sy]) => `<path d="M${x} ${y + sy * 36} V${y} H${x + sx * 36} M${x + sx * 8} ${y + sy * 36} V${y + sy * 8} H${x + sx * 36}" fill="none" stroke="${g}" stroke-width="1.2"/>`).join("")}

  <path d="M452 70 H528 M752 70 H828" stroke="${g}" stroke-width="1"/>
  ${lab(640, 75, "PART 4 · AGENTS", `letter-spacing="6"`)}
  ${T(640, 144, DISPLAY, DIDOT, `An agent is a model in a <tspan font-style="italic">loop</tspan>`, `text-anchor="middle" fill="${g}"`)}
  <path d="M520 172 H760" stroke="${g}" stroke-width="1"/>

  ${plaque(xs[0], "ROSA’S CHART", [["612 notes", 1]])}
  ${plaque(xs[1], "MODEL", [["reads, decides", 1], ["the next step", 1]])}
  ${plaque(xs[2], "TOOLS", [["search · read a note", 1], ["· labs", 1]])}
  ${plaque(xs[3], "ANSWER", [["EF 30%"], ["metoprolol tartrate", 1], ["→ a gap", 1]], ["“LVEF 30%”", `<tspan font-style="italic">Echo, 10/02</tspan>`])}
  ${arrow(xs[0] + W + 6, xs[1] - 6, 368)}${arrow(xs[2] + W + 6, xs[3] - 6, 368)}
  <path d="M590 330 C612 288 668 288 690 330" fill="none" stroke="${g}" stroke-width="2" marker-end="url(#deco-s-ah)"/>
  <path d="M690 406 C668 448 612 448 590 406" fill="none" stroke="${g}" stroke-width="2" marker-end="url(#deco-s-ah)"/>
  ${lab(640, 262, "THINK → ACT")}${lab(640, 494, "← OBSERVE")}

  ${lab(640, 526, "QUESTIONS RIGHT, OF 5", `fill="${G}"`)}
  <path d="M${x0 - 30} ${base} H${1280 - x0 + 30}" stroke="${g}" stroke-width="1.5"/>
  ${bars}

  <rect x="456" y="688" width="368" height="28" fill="${K}"/>
  ${lab(640, 707, "QCOR 2026 · BUILD AN AGENT, LIVE")}
  <circle cx="1206" cy="648" r="20" fill="none" stroke="${g}" stroke-width="1.5"/>${txt(1206, 654, "14", `fill="${GL}"`)}
</svg>`;
})();

// icons: one gold line, one weight, no fills
const ic = (i, body) => `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><defs>${gold(`deco-i${i}-g`, 30, 20)}</defs><g fill="none" stroke="url(#deco-i${i}-g)" stroke-width="2.4" stroke-linejoin="miter" stroke-linecap="square">${body}</g></svg>`;
const icons = [
  ["patient", ic(0, `<circle cx="24" cy="16.5" r="7.5"/><path d="M9 43 C9 32 15 28 24 28 C33 28 39 32 39 43 Z"/><path d="M19 28.6 L24 34 L29 28.6"/>`)],
  ["heart", ic(1, `<path d="M24 41 L8 25 C3 19.5 5.5 9.5 14 9.5 C18.5 9.5 22 12.5 24 16 C26 12.5 29.5 9.5 34 9.5 C42.5 9.5 45 19.5 40 25 Z"/>`)],
  ["pill", ic(2, `<g transform="rotate(-45 24 24)"><rect x="6" y="15" width="36" height="18" rx="9"/><path d="M24 15 V33"/></g>`)],
  ["note", ic(3, `<path d="${zig(10, 12, 28, 32, 2, 5, 4)}"/><path d="M16 23 H32 M16 30 H32 M16 37 H26"/>`)],
  ["search", ic(4, `<circle cx="20" cy="20" r="12"/><path d="M29 29 L42 42"/>`)],
  ["database", ic(5, `<ellipse cx="24" cy="11" rx="15" ry="5"/><path d="M9 11 V37 C9 40 16 42 24 42 C32 42 39 40 39 37 V11"/><path d="M9 20 C9 23 16 25 24 25 C32 25 39 23 39 20 M9 28.5 C9 31.5 16 33.5 24 33.5 C32 33.5 39 31.5 39 28.5"/>`)],
  ["tool", ic(6, `<g transform="rotate(45 24 24)"><path d="M19 3.5 V12 H29 V3.5 C34.5 5.5 36.5 11 34.5 15 C33.3 17.6 30.8 19.4 28 20 V41 C28 44 20 44 20 41 V20 C17.2 19.4 14.7 17.6 13.5 15 C11.5 11 13.5 5.5 19 3.5 Z"/></g>`)],
  ["agent", ic(7, `<path d="M40 24 A16 16 0 1 1 33 10.8"/><path d="M27.5 6.5 L35 10 L31 17"/><circle cx="24" cy="24" r="5"/>`)],
  ["check", ic(8, `<path d="M24 3.5 L41 10 V24 C41 33.5 33.5 40 24 44 C14.5 40 7 33.5 7 24 V10 Z"/><path d="M15.5 24 L21.5 30 L32.5 18.5"/>`)],
  ["warning", ic(9, `<path d="M24 5 L44 41 H4 Z"/><path d="M24 18 V29 M24 34 V35.5"/>`)],
];

export default {
  id: "deco",
  name: "Art Deco",
  after: "1920s–30s Art Deco: Chrysler Building crowns, Cassandre's posters, cinema-palace frames",
  note: "Navy lacquer, metallic gold and strict mirror symmetry: four equal ziggurat plaques for the nodes, the loop as two arcs between the model and the tools, and the evaluation chart as a small skyline. Feels like an occasion; best for title and section slides.",
  palette: [[N, "navy"], [K, "black lacquer"], [G, "gold"], [GL, "pale gold"], [C, "ivory"]],
  type: "Didot for the title and text, Copperplate for labels",
  ground: N,
  peopleGround: `radial-gradient(circle at 50% 45%, #1b2c4d, ${K} 75%)`,
  iconGround: `linear-gradient(180deg, ${N}, ${K})`,
  iconInk: GL,
  people,
  slide,
  icons,
};
