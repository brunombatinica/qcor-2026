// De Stijl: only horizontal and vertical black bars, and red, yellow, blue and white fields. No diagonals anywhere:
// arrowheads are stepped. The slide is one grid: every column and row below is a cell of the same composition.
const R = "#d42b1f", Y = "#f4cd1c", B = "#1d3e93", K = "#121212", W = "#f5f2ea";
const F = `font-family="'Avenir Next Condensed', 'Futura', sans-serif"`;

const r = (x, y, w, h, c = K) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
const e = (x1, y1, x2, y2, c = K) => r(x1, y1, x2 - x1, y2 - y1, c);
// stepped arrowheads: four blocks, each shorter than the last; tip at (tx, cy)
const STEP = 9, HEAD = 48;
const headR = (tx, cy) => [0, 1, 2, 3].map((k) => r(tx - (4 - k) * STEP, cy - (HEAD * (4 - k)) / 8, STEP, (HEAD * (4 - k)) / 4)).join("");
const headL = (tx, cy) => [0, 1, 2, 3].map((k) => r(tx + (3 - k) * STEP, cy - (HEAD * (4 - k)) / 8, STEP, (HEAD * (4 - k)) / 4)).join("");
const SHAFT = 10;
const arrowR = (x1, x2, y) => e(x1, y - SHAFT / 2, x2 - 4 * STEP, y + SHAFT / 2) + headR(x2, y);
const arrowL = (x1, x2, y) => headL(x1, y) + e(x1 + 4 * STEP, y - SHAFT / 2, x2, y + SHAFT / 2);

// a framed cell: black frame of weight w round a fill (the icon and people logic)
const cell = (x1, y1, x2, y2, c, w = 3) => e(x1, y1, x2, y2) + e(x1 + w, y1 + w, x2 - w, y2 - w, c);
const person = (s, bun, body) => `<g transform="scale(${s})">
  ${bun ? cell(18, 0, 28, 10, W) : ""}${cell(15, 7, 31, 23, W)}
  <polygon points="6,45 6,33 11,33 11,27 37,27 37,33 42,33 42,45" fill="${body}" stroke="${K}" stroke-width="3"/></g>`;

const people = `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  ${r(0, 0, 400, 400, W)}
  <g transform="translate(34 112)">${person(3.6, false, B)}</g>
  <g transform="translate(200 112)">${person(3.6, true, R)}</g>
  ${e(24, 272, 376, 283)}
</svg>`;

const slide = (() => {
  const T = (x, y, s, w, t, extra = "") => `<text x="${x}" y="${y}" font-size="${s}" font-weight="${w}" ${extra}>${t}</text>`;
  const DISPLAY = 80, TEXT = 22, LABEL = 15;
  // columns: margin | chart | arrow | model | loop | tools | arrow | answer | margin, bars 12 wide
  const col = { chart: [60, 260], model: [348, 548], tools: [732, 932], answer: [1020, 1220] };
  const vbars = [260, 336, 548, 720, 932, 1008];
  const top = 256, mid = 512, bot = 624;
  const fills = [], bars = [];
  // rows and the two full-height margin bars
  bars.push(e(0, 244, 1280, 256), e(0, 624, 1280, 636), e(48, 0, 60, 720), e(1220, 0, 1232, 720));
  fills.push(e(0, 0, 48, 120, Y), e(1232, 636, 1280, 720, R));
  bars.push(e(0, 120, 48, 128), e(860, 0, 872, 244));
  // diagram columns
  vbars.forEach((x) => bars.push(e(x, top, x + 12, bot)));
  fills.push(e(col.chart[0], top, col.chart[1], mid, B), e(col.model[0], top, col.model[1], mid, R), e(col.tools[0], top, col.tools[1], mid, Y), e(col.answer[0], mid + 12, col.answer[1], bot, B));
  Object.values(col).forEach(([a, b]) => bars.push(e(a, mid, b, mid + 12)));
  // connectors: one weight, one head
  const cy = (top + mid) / 2;
  bars.push(arrowR(272, 336, cy), arrowR(944, 1008, cy), arrowR(560, 720, 328), arrowL(560, 720, 440));
  // chart: columns are framed cells standing on a bar
  const base = 200, u = 26;
  let chart = "";
  [[1, W, "ALONE"], [2, B, "+ CHART"], [4, Y, "+ TOOLS"], [5, R, "+ CHECKS"]].forEach(([v, c, t], i) => {
    const x = 904 + i * 80, t0 = base - v * u;
    bars.push(cell(x, t0, x + 56, base + 3, c, 6));
    chart += T(x + 28, t0 - 12, TEXT, 800, v, `text-anchor="middle" fill="${K}"`) + T(x + 28, 228, LABEL, 600, t, `text-anchor="middle" letter-spacing="1" fill="${K}"`);
  });
  bars.push(e(872, base, 1220, base + 6));
  const node = ([x], ink, name, lines, first = 500) => `<g fill="${ink}">${T(x + 20, 300, TEXT, 800, name, `letter-spacing="1"`)}${lines.map((l, i) => T(x + 20, 334 + i * 28, TEXT, i === 0 ? first : 500, l)).join("")}</g>`;

  return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" ${F}>
  ${r(0, 0, 1280, 720, W)}
  ${fills.join("")}
  ${bars.join("")}
  <g fill="${K}">
    ${T(96, 72, LABEL, 700, "PART 4 · AGENTS", `letter-spacing="5"`)}
    ${T(92, 156, DISPLAY, 800, "AN AGENT IS", `letter-spacing="1"`)}
    ${T(92, 226, DISPLAY, 800, `A MODEL IN A <tspan fill="${R}">LOOP</tspan>`, `letter-spacing="1"`)}
    ${T(904, 44, LABEL, 700, "QUESTIONS RIGHT, OF 5", `letter-spacing="3"`)}
  </g>
  ${chart}
  ${node(col.chart, "#fff", "ROSA’S CHART", ["612 notes"])}
  ${node(col.model, "#fff", "MODEL", ["reads, decides", "the next step"])}
  ${node(col.tools, K, "TOOLS", ["search · read a note", "· labs"])}
  ${node(col.answer, K, "ANSWER", ["EF 30%", "metoprolol tartrate", "→ a gap"], 800)}
  <g fill="#fff">${T(1040, 564, TEXT, 800, "“LVEF 30%”")}${T(1040, 592, TEXT, 500, "Echo, 10/02")}</g>
  <g fill="${K}">
    ${T(640, 288, LABEL, 700, "THINK → ACT", `text-anchor="middle" letter-spacing="3"`)}
    ${T(640, 484, LABEL, 700, "← OBSERVE", `text-anchor="middle" letter-spacing="3"`)}
    ${T(96, 684, LABEL, 700, "QCOR 2026 · BUILD AN AGENT, LIVE", `letter-spacing="4"`)}
  </g>
  ${T(1256, 686, TEXT, 800, "14", `text-anchor="middle" fill="#fff"`)}
</svg>`;
})();

const ic = (body) => `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
// orthogonal outlines drawn as one polygon with a 3-unit black frame
const out = (points, c) => `<polygon points="${points}" fill="${c}" stroke="${K}" stroke-width="3" stroke-linejoin="miter"/>`;
const heart = [[1, 0], [3, 0], [3, 1], [4, 1], [4, 0], [6, 0], [6, 1], [7, 1], [7, 3], [6, 3], [6, 4], [5, 4], [5, 5], [4, 5], [4, 6], [3, 6], [3, 5], [2, 5], [2, 4], [1, 4], [1, 3], [0, 3], [0, 1], [1, 1]].map(([x, y]) => `${4 + x * 5.71},${7 + y * 5.71}`).join(" ");
const icons = [
  ["patient", ic(person(1, false, B))],
  ["heart", ic(out(heart, R))],
  ["pill", ic(out("10,13 24,13 24,35 10,35 10,31 5,31 5,17 10,17", R) + out("24,13 38,13 38,17 43,17 43,31 38,31 38,35 24,35", W))],
  ["note", ic(`${cell(8, 4, 40, 44, W)}${cell(28, 4, 40, 16, Y)}${e(14, 22, 34, 25)}${e(14, 29, 34, 32)}${e(14, 36, 26, 39)}`)],
  ["search", ic(`${cell(4, 4, 30, 30, B)}${e(28, 28, 35, 35)}${e(33, 33, 40, 40)}${e(38, 38, 45, 45)}`)],
  ["database", ic(`${cell(6, 4, 42, 44, W)}${e(9, 7, 39, 16, Y)}${e(6, 16, 42, 19)}${e(9, 19, 39, 28, R)}${e(6, 28, 42, 31)}${e(9, 31, 39, 41, B)}`)],
  ["tool", ic(`${cell(6, 5, 42, 19, R)}${cell(19, 17, 29, 45, Y)}`)],
  ["agent", ic(`${e(16, 5, 43, 9)}${e(39, 5, 43, 43)}${e(5, 39, 43, 43)}${e(5, 19, 9, 43)}${e(6, 5.5, 9, 8.5)}${e(9, 3, 12.5, 11)}${e(12.5, 0.5, 16, 13.5)}${cell(17, 17, 31, 31, R)}`)],
  ["check", ic(`${cell(3, 3, 45, 45, Y)}${[[10, 22], [14, 26], [18, 30], [22, 28], [26, 24], [30, 20], [34, 16], [36, 12]].map(([x, y]) => r(x - 1, y, 8, 8)).join("")}`)],
  ["warning", ic(`${out("19,4 29,4 29,13 35,13 35,23 41,23 41,33 46,33 46,44 2,44 2,33 7,33 7,23 13,23 13,13 19,13", Y)}${e(22, 15, 26, 31)}${e(22, 35, 26, 40)}`)],
];

export default {
  id: "destijl",
  name: "De Stijl",
  after: "Piet Mondrian's grid compositions (1920s) and Theo van Doesburg's De Stijl lettering",
  note: "Nothing but horizontal and vertical black bars and primary fields: the slide is one grid whose four equal columns are the nodes, and the Think → Act → Observe loop runs on bars across the cell between the model and the tools. Arrowheads are stepped; there is no diagonal anywhere.",
  palette: [[R, "red"], [Y, "yellow"], [B, "blue"], [K, "black"], [W, "white"]],
  type: "Avenir Next Condensed Heavy for titles and names, Medium for text",
  ground: W,
  people,
  slide,
  icons,
};
