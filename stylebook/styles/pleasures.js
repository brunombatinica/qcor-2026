// 13 Ridgelines: stacked white hairlines on black (after Unknown Pleasures / CP 1919 and op art). Each line is
// lifted by a height field and occludes the line above it; the people are reliefs that emerge from the stack.
const K = "#000000", W = "#f4f2ec", D = "#8a8984";
const SANS = `'Helvetica Neue', Helvetica, Arial, sans-serif`;
const F = `font-family="${SANS}"`;
const f1 = (n) => n.toFixed(1);

// seeded PRNG (mulberry32) and smooth 1-D value noise, so the art is the same on every load
const prng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
function noise1(rand, len, cell) {
  const v = Array.from({ length: Math.ceil(len / cell) + 2 }, () => rand() * 2 - 1);
  return (x) => { const i = Math.floor(x / cell), t = x / cell - i, s = (1 - Math.cos(t * Math.PI)) / 2; return v[i] * (1 - s) + v[i + 1] * s; };
}
// draw a stack of ridgelines: z(x, y) lifts, amp(x, y) scales the noise; lower lines are drawn last and hide upper ones
function ridges({ x0, x1, y0, y1, n, step = 2.5, z = () => 0, amp = () => 1, seed = 1, k = 1, sw = 1.1, col = W, fill = K, bumps = 0 }) {
  const rand = prng(seed);
  let out = "";
  for (let i = 0; i < n; i++) {
    const Y = n > 1 ? y0 + (i * (y1 - y0)) / (n - 1) : y0;
    const fine = noise1(rand, x1 - x0, 7), coarse = noise1(rand, x1 - x0, 26);
    const bs = Array.from({ length: bumps }, () => [x0 + (0.3 + 0.4 * rand()) * (x1 - x0), 4 + rand() * 9, rand()]);
    const pts = [];
    for (let x = x0; x <= x1 + 0.01; x += step) {
      const a = amp(x, Y);
      let d = k * z(x, Y) + a * (1.3 * fine(x - x0) + 2.2 * coarse(x - x0) + 2.2);
      for (const [bx, bw, bh] of bs) d += a * bh * 6 * Math.exp(-((x - bx) ** 2) / (2 * bw * bw));
      pts.push([x, Y - Math.max(0, d)]);
    }
    const line = pts.map(([x, y], j) => `${j ? "L" : "M"}${f1(x)} ${f1(y)}`).join("");
    out += `<path d="${line}L${f1(x1)} ${f1(Y + 3)}L${f1(x0)} ${f1(Y + 3)}Z" fill="${fill}"/><path d="${line}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  }
  return out;
}
const dome = (x, y, cx, cy, rx, ry, h) => { const q = 1 - ((x - cx) / rx) ** 2 - ((y - cy) / ry) ** 2; return q > 0 ? h * Math.sqrt(q) : 0; };
const ring = (x, y, cx, cy, R, w, h) => h * Math.exp(-((Math.hypot(x - cx, y - cy) - R) ** 2) / (2 * w * w));

const TXT = 20, LAB = 14;

// ---------- people: two reliefs in the stack, a head and shoulders each; her one cue is a bun ----------
const plateau = (x, y, cx, cy, rx, ry, soft = 4) => { const q = Math.hypot((x - cx) / rx, (y - cy) / ry); return Math.max(0, Math.min(1, ((1 - q) * Math.min(rx, ry)) / soft)); };
const FIG = [[128, false], [272, true]];
function peopleField(x, y) {
  let z = 0;
  for (const [cx, bun] of FIG) {
    z = Math.max(z,
      plateau(x, y, cx, 196, 38, 44) * (6 + dome(x, y, cx, 196, 38, 44, 6)),
      plateau(x, y, cx, 254, 15, 20) * 5,
      plateau(x, y, cx, 380, 92, 104, 5) * (7 + dome(x, y, cx, 380, 92, 104, 12)),
      bun ? plateau(x, y, cx, 140, 15, 14) * (6 + dome(x, y, cx, 140, 15, 14, 3)) : 0);
  }
  return z;
}
const peopleAmp = (x, y) => (peopleField(x, y) > 0.5 ? 0.8 : 0.3);
const people = () => `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="400" fill="${K}"/>
  ${ridges({ x0: 28, x1: 372, y0: 92, y1: 372, n: 70, z: peopleField, amp: peopleAmp, seed: 1919, k: 1, sw: 0.95 })}
</svg>`;

// ---------- slide ----------
const slide = () => {
  const bars = [[1, "Model alone"], [2, "+ chart pasted"], [4, "+ tools"], [5, "+ checks"]];
  const cx0 = 960, cx1 = 1216, peakX = 1080;
  const chart = bars.map(([v, t], i) => {
    const Y = 136 + i * 40;
    const r = ridges({ x0: cx0, x1: cx1 - 32, y0: Y, y1: Y, n: 1, z: (x) => v * 18 * Math.exp(-((x - peakX) ** 2) / (2 * 15 * 15)), amp: () => 0.3, seed: 40 + i, sw: 1.4 });
    return { r, lab: `<text x="${cx0 - 16}" y="${Y + 5}" text-anchor="end" font-size="${LAB}" fill="${W}">${t}</text><text x="${cx1}" y="${Y + 6}" text-anchor="end" font-size="${TXT - 2}" font-weight="500" fill="${W}">${v}</text>` };
  });
  const X = [64, 352, 720, 1008], w = 208, y = 392, h = 128, mid = y + h / 2;
  const box = (x, name, rows) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${W}" stroke-width="1.5"/>
    <text x="${x + 20}" y="${y + 38}" font-size="${TXT}" font-weight="500" fill="${W}">${name}</text>
    ${rows.map((t, i) => `<text x="${x + 20}" y="${y + 68 + i * 20}" font-size="${LAB}" fill="${name === "Answer" ? W : D}">${t}</text>`).join("")}`;
  const horizon = ridges({ x0: 64, x1: 1216, y0: 644, y1: 664, n: 3, step: 3, amp: (x) => 0.3 + 1.2 * Math.exp(-((x - 640) ** 2) / (2 * 170 * 170)), seed: 3, sw: 0.9, bumps: 2 });
  const arc3 = (d) => [-5, 0, 5].map((o) => `<path d="${d(o)}" fill="none" stroke="${W}" stroke-width="${o ? 0.8 : 1.5}" stroke-opacity="${o ? 0.55 : 1}"/>`).join("");
  const a0 = X[1] + w, a1 = X[2];
  return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" ${F}>
  <defs><marker id="pleasures-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 1 L9 5 L0 9" fill="none" stroke="${W}" stroke-width="1.3"/></marker></defs>
  <rect width="1280" height="720" fill="${K}"/>
  <text x="64" y="80" font-size="${LAB}" letter-spacing="5" fill="${D}">PART 4 · AGENTS</text>
  <text x="62" y="152" font-size="60" font-weight="300" letter-spacing="-1" fill="${W}">An agent is</text>
  <text x="62" y="216" font-size="60" font-weight="300" letter-spacing="-1" fill="${W}">a model in a <tspan font-weight="600">loop</tspan></text>

  <!-- chart: one ridge per condition, peak height = questions right -->
  <text x="${cx0 - 16}" y="80" text-anchor="end" font-size="${LAB - 2}" letter-spacing="3" fill="${D}">QUESTIONS RIGHT, OF 5</text>
  ${chart.map((c) => c.r).join("")}${chart.map((c) => c.lab).join("")}

  ${box(X[0], "Rosa’s chart", ["612 notes"])}
  ${box(X[1], "Model", ["reads, decides", "the next step"])}
  ${box(X[2], "Tools", ["search · read a note", "· labs"])}
  ${box(X[3], "Answer", ["EF 30% · metoprolol", "tartrate → a gap"])}
  <text x="${X[3]}" y="${y + h + 32}" font-size="${LAB}" fill="${W}">“LVEF 30%” <tspan fill="${D}">· Echo, 10/02</tspan></text>
  <path d="M${X[0] + w + 8} ${mid} H${X[1] - 8}" stroke="${W}" stroke-width="1.5" marker-end="url(#pleasures-ah)"/>
  <path d="M${X[2] + w + 8} ${mid} H${X[3] - 8}" stroke="${W}" stroke-width="1.5" marker-end="url(#pleasures-ah)"/>

  <!-- the loop: three parallel lines each way -->
  ${arc3((o) => `M${a0 - 24} ${y - 8 - o} C${a0 + 24} ${y - 52 - o} ${a1 - 24} ${y - 52 - o} ${a1 + 24} ${y - 8 - o}`)}
  ${arc3((o) => `M${a1 + 24} ${y + h + 8 + o} C${a1 - 24} ${y + h + 52 + o} ${a0 + 24} ${y + h + 52 + o} ${a0 - 24} ${y + h + 8 + o}`)}
  <path d="M${a1 + 10} ${y - 24} L${a1 + 24} ${y - 8} L${a1 + 4} ${y - 6}" fill="none" stroke="${W}" stroke-width="1.5"/>
  <path d="M${a0 - 10} ${y + h + 24} L${a0 - 24} ${y + h + 8} L${a0 - 4} ${y + h + 6}" fill="none" stroke="${W}" stroke-width="1.5"/>
  <text x="${(a0 + a1) / 2}" y="${y - 60}" text-anchor="middle" font-size="${LAB - 1}" letter-spacing="3.5" fill="${W}">THINK → ACT</text>
  <text x="${(a0 + a1) / 2}" y="${y + h + 76}" text-anchor="middle" font-size="${LAB - 1}" letter-spacing="3.5" fill="${W}">← OBSERVE</text>

  ${horizon}
  <text x="64" y="700" font-size="${LAB - 2}" letter-spacing="4" fill="${D}">QCOR 2026 · BUILD AN AGENT, LIVE</text>
  <text x="1216" y="702" text-anchor="end" font-size="${TXT - 2}" font-weight="300" fill="${W}">14</text>
</svg>`;
};

// ---------- icons: parallel lines only; shapes are hatched, details are cut out in black ----------
const hatch = (name, gap = 3.6, w = 1.7) => `<defs><pattern id="pleasures-h-${name}" width="48" height="${gap}" patternUnits="userSpaceOnUse"><rect width="48" height="${w}" fill="${W}"/></pattern></defs>`;
const ic = (name, shapes, cuts = "", gap, w) => `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">${hatch(name, gap, w)}<g fill="url(#pleasures-h-${name})">${shapes}</g><g fill="${K}">${cuts}</g></svg>`;
const icons = [
  ["patient", ic("patient", `<circle cx="24" cy="15" r="10"/><path d="M7 45 C7 33 14 28.5 24 28.5 C34 28.5 41 33 41 45 Z"/>`)],
  ["heart", ic("heart", `<path d="M24 43 L6 25 C1 20 1 11 7 7 C12 3.5 19 5 24 11 C29 5 36 3.5 41 7 C47 11 47 20 42 25 Z"/>`)],
  ["pill", ic("pill", `<g transform="rotate(-40 24 24)"><rect x="5" y="14" width="38" height="20" rx="10"/></g>`, `<g transform="rotate(-40 24 24)"><rect x="23" y="12" width="2.4" height="24"/></g>`)],
  ["note", ic("note", `<path d="M9 4 H30 L39 13 V44 H9 Z"/>`, `<path d="M30 4 L39 13 H30 Z" fill="none" stroke="${K}" stroke-width="2.6"/><rect x="14" y="20" width="20" height="2.6"/><rect x="14" y="28" width="20" height="2.6"/><rect x="14" y="36" width="12" height="2.6"/>`, 3.2, 1.5)],
  ["search", ic("search", `<circle cx="20" cy="20" r="15"/><path d="M28 32 L32 28 L45 41 L41 45 Z"/>`, `<circle cx="20" cy="20" r="9.5"/>`)],
  ["database", ic("database", `<ellipse cx="24" cy="10" rx="16" ry="6"/><path d="M8 13 V38 C8 46 40 46 40 38 V13 C40 20 8 20 8 13 Z"/>`, `<path d="M8 23.5 C8 30 40 30 40 23.5 V26 C40 32.5 8 32.5 8 26 Z M8 13.6 C8 20 40 20 40 13.6 V16 C40 22.5 8 22.5 8 16 Z"/>`)],
  ["tool", ic("tool", `<path d="M28.5 7.5 A10 10 0 0 0 20.6 22.4 L7 36 A3.6 3.6 0 0 0 12 41 L25.6 27.4 A10 10 0 0 0 40.5 19.5 L34 21 L30 18 L27 14 Z"/>`)],
  ["agent", ic("agent", `<path d="M24 4 A20 20 0 1 1 6.7 14 L12.6 17.4 A13.2 13.2 0 1 0 24 10.8 Z"/><path d="M21 -1 L34 7.4 L21 15.8 Z"/>`)],
  ["check", ic("check", `<path d="M5 25 L11 19 L19 27 L37 9 L43 15 L19 39 Z"/>`)],
  ["warning", ic("warning", `<path d="M24 3 L46 43 H2 Z"/>`, `<rect x="21.5" y="16" width="5" height="14"/><rect x="21.5" y="33.5" width="5" height="5"/>`)],
];

export default {
  id: "pleasures",
  name: "Ridgelines",
  after: "Peter Saville's Unknown Pleasures sleeve (from the CP 1919 pulsar plot in the Cambridge Encyclopaedia of Astronomy) and Bridget Riley's op art",
  note: "Signal as landscape: stacked hairlines, each lifted by data and hiding the one behind. The people are reliefs in the stack and the chart is four ridges whose peaks are the scores. Generated by a seeded function, so it is exact and repeatable.",
  palette: [[K, "black"], [W, "white"], [D, "grey"]],
  type: "Helvetica Neue Light for titles, Helvetica Neue for text",
  ground: K,
  people,
  slide,
  icons,
};
