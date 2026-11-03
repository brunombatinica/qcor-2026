// 02 Tangram: everything is cut from the seven tans of one square; flat colour, seams in the paper colour.
const S2 = Math.SQRT2, H = S2 / 2;
const G = "#f2ede2"; // paper
const K = "#1e1d1b";
const C = { navy: "#23507a", amber: "#e9a23b", red: "#df5338", grey: "#8c8a83" };
const TXT = 18, LAB = 14;
const F = `font-family="'Avenir Next', Avenir, 'Helvetica Neue', sans-serif"`;

// polygon from unit coordinates: scale k, origin (ox, oy)
const tan = (pts, fill, k = 1, ox = 0, oy = 0, extra = "") =>
  `<polygon points="${pts.map(([x, y]) => `${(ox + x * k).toFixed(2)},${(oy + y * k).toFixed(2)}`).join(" ")}" fill="${fill}"${extra}/>`;
const seams = (w, body, col = G) => `<g stroke="${col}" stroke-width="${w}" stroke-linejoin="round">${body}</g>`;

// rotate/translate a list of points (unit space), for building arrows and icons
const rot = (pts, deg, cx = 0, cy = 0) => {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  return pts.map(([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]);
};
const mv = (pts, dx, dy) => pts.map(([x, y]) => [x + dx, y + dy]);

// the classic dissection of a 4 × 4 square (small-triangle leg = √2)
const SQUARE = [
  ["L", [[0, 0], [4, 0], [2, 2]]],
  ["L", [[0, 0], [2, 2], [0, 4]]],
  ["M", [[4, 4], [4, 2], [2, 4]]],
  ["S", [[4, 0], [4, 2], [3, 1]]],
  ["Q", [[2, 2], [3, 1], [4, 2], [3, 3]]],
  ["S", [[2, 2], [3, 3], [1, 3]]],
  ["P", [[0, 4], [1, 3], [3, 3], [2, 4]]],
];

// ---------- people: a square head on a shawl of two large triangles; her one cue is a small-triangle bun ----------
const PERSON = [
  [[0, 1.2 - H], [H, 1.2], [0, 1.2 + H], [-H, 1.2]],   // square
  [[0, 1.907], [0, 3.907], [-2, 3.907]],               // large triangle
  [[0, 1.907], [2, 3.907], [0, 3.907]],                // large triangle
];
const BUN = [[0, 1.2 - H], [H, 1.2], [S2, 1.2 - H]];   // small triangle on the upper edge of the head
const people = () => {
  const k = 40, base = 330;
  const fig = (cx, col, bun) => seams(3, [...PERSON, ...(bun ? [BUN] : [])].map((p) => tan(p, col, k, cx, base - 3.907 * k)).join(""));
  return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="400" fill="${G}"/>
  ${fig(118, C.navy, false)}${fig(282, C.red, true)}
</svg>`;
};

// ---------- slide ----------
// every node is the same square, cut the same way; nodes 176 on an 8 px grid, labels below
const N = 176, k4 = N / 4, top = 336, X = [64, 344, 720, 1000];
const node = (x, col) => seams(3, SQUARE.map(([, p]) => tan(p, col, k4, x, top)).join(""));
// arrow from tangram pieces: parallelogram shaft + small-triangle head; a = small-triangle leg
function arrow(x, y, a, dir, col) {
  const h = a / S2;
  const shaft = [[0, -h / 2], [a * S2, -h / 2], [a * S2 + h, h / 2], [h, h / 2]];
  const head = [[a * S2 + h / 2 + 2, -h], [a * S2 + h / 2 + 2 + h, 0], [a * S2 + h / 2 + 2, h]];
  const f = (p) => p.map(([px, py]) => [x + dir * px, y + py]);
  return seams(2, tan(f(shaft), col) + tan(f(head), col));
}
const ALEN = 32 * S2 + 32 / S2 + 2; // 70.7: arrow length for a = 32
const lab = (x, y, rows) => rows.map(([t, b], i) => `<text x="${x}" y="${y + i * 24}" font-size="${TXT}" font-weight="${b ? 700 : 500}" fill="${K}">${t}</text>`).join("");

const slide = () => {
  const bars = [[1, "Model", "alone"], [2, "+ chart", "pasted"], [4, "+ tools", ""], [5, "+ checks", ""]];
  const s = 24, gap = 4, base = 264;
  const cells = [], texts = [];
  bars.forEach(([v, t1, t2], i) => {
    const x = 884 + i * 96, col = i === 3 ? C.red : C.navy;
    for (let j = 0; j < v; j++) {
      const y = base - (j + 1) * (s + gap);
      cells.push(tan([[0, 0], [s, 0], [0, s]], col, 1, x, y) + tan([[s, 0], [s, s], [0, s]], col, 1, x, y));
    }
    texts.push(`<text x="${x + s / 2}" y="${base - v * (s + gap) - 10}" text-anchor="middle" font-size="${TXT}" font-weight="700" fill="${K}">${v}</text>
      <text x="${x + s / 2}" y="${base + 22}" text-anchor="middle" font-size="${LAB}" fill="${K}">${t1}</text><text x="${x + s / 2}" y="${base + 40}" text-anchor="middle" font-size="${LAB}" fill="${K}">${t2}</text>`);
  });
  const mid = top + N / 2, lx = (X[1] + N + X[2]) / 2;
  return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" ${F}>
  <defs><pattern id="tangram-grid" width="44" height="44" patternUnits="userSpaceOnUse" x="64" y="336">
    <path d="M0 0 H44 M0 0 V44 M0 0 L44 44 M44 0 L0 44" stroke="${K}" stroke-opacity=".05" stroke-width="1" fill="none"/></pattern></defs>
  <rect width="1280" height="720" fill="${G}"/>
  <rect width="1280" height="720" fill="url(#tangram-grid)"/>

  <text x="64" y="80" font-size="${LAB}" font-weight="600" letter-spacing="4" fill="${K}">PART 4 · AGENTS</text>
  <text x="62" y="152" font-size="60" font-weight="700" letter-spacing="-1.5" fill="${K}">An agent is</text>
  <text x="62" y="216" font-size="60" font-weight="700" letter-spacing="-1.5" fill="${K}">a model in a <tspan fill="${C.red}">loop</tspan></text>

  <text x="880" y="80" font-size="${LAB}" font-weight="600" letter-spacing="3" fill="${K}">QUESTIONS RIGHT, OF 5</text>
  ${seams(2.5, cells.join(""))}${texts.join("")}

  ${node(X[0], C.navy)}${node(X[1], C.red)}${node(X[2], C.amber)}${node(X[3], K)}
  ${arrow(X[0] + N + (X[1] - X[0] - N - ALEN) / 2, mid, 32, 1, K)}
  ${arrow(X[2] + N + (X[3] - X[2] - N - ALEN) / 2, mid, 32, 1, K)}
  ${arrow(lx - ALEN / 2, mid - 32, 32, 1, K)}
  ${arrow(lx + ALEN / 2, mid + 32, 32, -1, K)}
  <text x="${lx}" y="${mid - 64}" text-anchor="middle" font-size="${LAB}" font-weight="600" letter-spacing="3" fill="${K}">THINK → ACT</text>
  <text x="${lx}" y="${mid + 76}" text-anchor="middle" font-size="${LAB}" font-weight="600" letter-spacing="3" fill="${K}">← OBSERVE</text>

  ${lab(X[0], 552, [["Rosa’s chart", 1], ["612 notes"]])}
  ${lab(X[1], 552, [["Model", 1], ["reads, decides"], ["the next step"]])}
  ${lab(X[2], 552, [["Tools", 1], ["search · read a note"], ["· labs"]])}
  ${lab(X[3], 552, [["Answer", 1], ["EF 30% · metoprolol"], ["tartrate → a gap"]])}
  <text x="${X[3]}" y="630" font-size="${LAB}" fill="${K}"><tspan font-weight="700">“LVEF 30%”</tspan> · Echo, 10/02</text>

  <text x="64" y="688" font-size="${LAB}" font-weight="600" letter-spacing="3" fill="${K}">QCOR 2026 · BUILD AN AGENT, LIVE</text>
  ${seams(2, tan([[0, -20], [20, 0], [0, 20], [-20, 0]], C.red, 1, 1196, 683))}
  <text x="1196" y="689" text-anchor="middle" font-size="${LAB + 1}" font-weight="700" fill="#fff">14</text>
</svg>`;
};

// ---------- icons: pieces in unit space (small-triangle leg = 1), fitted into 48 × 48, one ink ----------
function fit(pieces, box = 42, w = 1.6) {
  const all = pieces.flatMap(([p]) => p);
  const xs = all.map((q) => q[0]), ys = all.map((q) => q[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const kk = Math.min(box / (x1 - x0), box / (y1 - y0));
  const ox = 24 - ((x0 + x1) / 2) * kk, oy = 24 - ((y0 + y1) / 2) * kk;
  return `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">${seams(w, pieces.filter(([, c]) => c !== G).map(([p, c]) => tan(p, c, kk, ox, oy)).join(""))}${pieces.filter(([, c]) => c === G).map(([p]) => tan(p, G, kk, ox, oy)).join("")}</svg>`;
}
const SQ = (x, y, sz = 1) => [[x, y], [x + sz, y], [x + sz, y + sz], [x, y + sz]];
const shaftR = [[0, -H / 2], [S2, -H / 2], [S2 + H, H / 2], [H, H / 2]];
const headR = [[S2 + H / 2 + 0.12, -H], [S2 + 1.5 * H + 0.12, 0], [S2 + H / 2 + 0.12, H]];
const I = C.navy;
const ink = (list) => list.map((p) => [p, I]);

const icons = () => [
  ["patient", fit(ink(PERSON), 40)],
  ["heart", fit(ink([[[-2, 0], [0, 0], [0, 2]], [[0, 0], [2, 0], [0, 2]], [[-2, 0], [0, 0], [-1, -1]], [[0, 0], [1, -1], [1, 0]], [[1, -1], [2, 0], [1, 0]]]), 40)],
  ["pill", fit(ink([[[0, H], [H, 0], [H, S2]], [[H, 0], [H + S2, 0], [H, S2]], [[H + S2, 0], [H + S2, S2], [H, S2]], [[H + S2, 0], [2 * S2, H], [H + S2, S2]]].map((p) => rot(p, -45, S2, H))), 42)],
  ["note", fit(ink([[[0, 0], [0, 2], [2, 2]], [[0, 0], [1, 0], [1, 1]], [[1, 1], [2, 1], [2, 2]], [[1, 0], [1, 1], [2, 1]]]), 38)],
  ["search", fit(ink([...[0, 1, 2, 3].map((i) => rot([[0, 0], [1, 0], [0, 1]], 45 + 90 * i)), mv([[0, 0], [1, 1], [1, 2], [0, 1]], H + 0.1, H - 0.5)]), 42)],
  ["database", fit(ink([mv(shaftR, 0, 0), mv(shaftR, 0, 0.95), mv(shaftR, 0, 1.9), mv(shaftR, 0, 2.85)]), 40)],
  ["tool", fit(ink([[[0, 0], [S2, 0], [S2 + H, H], [H, H]], SQ((S2 + H) / 2 - 0.5, H), [[(S2 + H) / 2 - 0.5, H + 1], [(S2 + H) / 2 + 0.5, H + 1], [(S2 + H) / 2 - 0.5, H + 2]], [[(S2 + H) / 2 + 0.5, H + 1], [(S2 + H) / 2 + 0.5, H + 2], [(S2 + H) / 2 - 0.5, H + 2]]]), 42)],
  ["agent", fit(ink([shaftR, headR, ...[shaftR, headR].map((p) => p.map(([x, y]) => [S2 + 1.5 * H + 0.12 - x, y + 1.45]))]), 42)],
  ["check", fit(ink([SQ(0, 0), SQ(0, -1), [[1, 0], [2, 0], [3, 1], [2, 1]], [[1, 0], [2, 1], [1, 1]], [[2, 0], [3, 0], [3, 1]]].map((p) => rot(p, -45, 0, 1))), 40)],
  ["warning", fit([
    ...ink([[[0, 0], [0, 2], [-2, 2]], [[0, 0], [2, 2], [0, 2]]]),
    [[[-0.46, 0.62], [0.46, 0.62], [0, 1.08]], G],
    [[[0, 1.24], [0.26, 1.5], [0, 1.76], [-0.26, 1.5]], G],
  ], 42)],
];

export default {
  id: "tangram",
  name: "Tangram",
  after: "the Chinese seven-board puzzle (qiqiao ban) and its 19th-century European puzzle books",
  note: "Everything is cut from the same seven pieces: every node is the same square cut the same way, the arrows and icons are rearrangements of its pieces. One idea, 'same parts, different arrangement', carried through.",
  palette: [[C.navy, "navy"], [C.red, "vermilion"], [C.amber, "amber"], [K, "ink"], [G, "paper"]],
  type: "Avenir Next Bold for titles, Avenir Next Medium for text",
  ground: G,
  people,
  slide,
  icons,
};
