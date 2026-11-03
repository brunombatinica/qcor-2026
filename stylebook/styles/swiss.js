// Swiss International: a 12-column grid you can see, Helvetica Neue flush left, black with one red (the loop) on white.
const K = "#111111", R = "#e3001b", W = "#ffffff", L = "#e2e2e2", TINT = "#f5f5f5";
const H = `font-family="'Helvetica Neue', Helvetica, Arial, sans-serif"`;

// 12 columns of 74, gutters 24, margins 64
const COL = 74, GUT = 24, X0 = 64;
const cx = (i) => X0 + i * (COL + GUT);
const span = (n) => n * COL + (n - 1) * GUT;
const T = (x, y, s, size = 17, w = 400, fill = K, extra = "") => `<text x="${x}" y="${y}" font-size="${size}" font-weight="${w}" fill="${fill}" ${extra}>${s}</text>`;

// ---------- people: disc and half-disc on a four-column grid ----------
const person = (x, bun) => `<circle cx="${x}" cy="150" r="38" fill="${K}"/>${bun ? `<circle cx="${x}" cy="98" r="15" fill="${K}"/>` : ""}
  <path d="M${x - 78} 290 A78 78 0 0 1 ${x + 78} 290 Z" fill="${K}"/>`;
const people = `<svg viewBox="0 0 400 340" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="340" fill="${W}"/>
  ${[20, 110, 200, 290, 380].map((x) => `<line x1="${x}" y1="0" x2="${x}" y2="340" stroke="${L}"/>`).join("")}
  <line x1="0" y1="290.5" x2="400" y2="290.5" stroke="${L}"/>
  ${person(110, false)}${person(290, true)}
</svg>`;

// ---------- slide ----------
const slide = (() => {
  const grid = [...Array(12)].map((_, i) => `<rect x="${cx(i)}" y="0" width="${COL}" height="720" fill="${TINT}"/>`).join("");

  // chart: horizontal bars; labels in cols 8–9, bars in cols 10–11
  const unit = span(2) / 5;
  const bars = [[1, "Model alone"], [2, "+ chart pasted"], [4, "+ tools"], [5, "+ checks"]].map(([v, t], i) => {
    const y = 104 + i * 40;
    return `${T(cx(8), y + 18, t, 15)}<rect x="${cx(10)}" y="${y}" width="${v * unit}" height="24" fill="${K}"/>${T(cx(10) + v * unit - 7, y + 18, v, 15, 700, W, 'text-anchor="end"')}`;
  }).join("");
  const ticks = [0, 1, 2, 3, 4, 5].map((v) => `${T(cx(10) + v * unit, 282, v, 13, 400, K, 'text-anchor="middle"')}`).join("");

  // four equal boxes, two columns each
  const BY = 424, BH = 168, BW = span(2), XS = [cx(0), cx(3), cx(7), cx(10)], mid = BY + BH / 2;
  const box = (x, name, lines, rule = K) => `<rect x="${x}" y="${BY}" width="${BW}" height="${BH}" fill="${W}" stroke="${K}" stroke-width="1"/>
    <rect x="${x}" y="${BY}" width="${BW}" height="6" fill="${rule}"/>
    ${T(x + 14, BY + 38, name, 17, 700)}${lines.map((l, i) => T(x + 14, BY + 64 + i * 22, l, 17)).join("")}`;
  const ah = (x, y, deg, c) => `<path d="M0 -6 L12 0 L0 6 Z" transform="translate(${x} ${y}) rotate(${deg})" fill="${c}"/>`;
  // loop arcs: chord from inside the model box top to inside the tools box top, and back underneath
  const a0 = XS[1] + BW - 40, a1 = XS[2] + 40, sag = 44;
  const arcR = ((a1 - a0) / 2) ** 2 / (2 * sag) + sag / 2, tan = (Math.asin((a1 - a0) / 2 / arcR) * 180) / Math.PI;

  return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" ${H}>
  <rect width="1280" height="720" fill="${W}"/>
  ${grid}

  ${T(cx(0), 62, "Part 4 · Agents", 17, 700)}
  <g font-size="94" font-weight="700" letter-spacing="-3.6" fill="${K}">
    <text x="${cx(0) - 5}" y="166">An agent</text>
    <text x="${cx(0) - 5}" y="254">is a model</text>
    <text x="${cx(0) - 5}" y="342">in a <tspan fill="${R}">loop.</tspan></text>
  </g>

  ${T(cx(8), 62, "Questions right, of 5", 17, 700)}
  <rect x="${cx(8)}" y="76" width="${span(4)}" height="2" fill="${K}"/>
  ${bars}${ticks}

  ${box(XS[0], "Rosa’s chart", ["612 notes"])}
  ${box(XS[1], "Model", ["reads, decides", "the next step"])}
  ${box(XS[2], "Tools", ["search", "read a note", "labs"])}
  ${box(XS[3], "Answer", [])}
  ${T(XS[3] + 14, BY + 64, "EF 30%", 17, 700)}
  ${T(XS[3] + 14, BY + 86, "metoprolol tartrate", 17)}
  ${T(XS[3] + 14, BY + 108, "→ a gap", 17)}
  ${T(XS[3] + 14, BY + 136, "“LVEF 30%”", 13, 700)}
  ${T(XS[3] + 14, BY + 154, "Echo, 10/02", 13)}

  <g stroke="${K}" stroke-width="3" fill="none">
    <line x1="${XS[0] + BW + 12}" y1="${mid}" x2="${XS[1] - 14}" y2="${mid}"/>
    <line x1="${XS[2] + BW + 12}" y1="${mid}" x2="${XS[3] - 14}" y2="${mid}"/>
  </g>
  ${ah(XS[1] - 14, mid, 0, K)}${ah(XS[3] - 14, mid, 0, K)}
  <g stroke="${R}" stroke-width="3" fill="none">
    <path d="M${a0} ${BY - 8} A${arcR} ${arcR} 0 0 1 ${a1} ${BY - 8}"/>
    <path d="M${a1} ${BY + BH + 8} A${arcR} ${arcR} 0 0 1 ${a0} ${BY + BH + 8}"/>
  </g>
  ${ah(a1, BY - 8, tan, R)}${ah(a0, BY + BH + 8, 180 + tan, R)}
  ${T((a0 + a1) / 2, BY - sag - 22, "Think → Act → Observe", 15, 700, R, 'text-anchor="middle"')}

  <rect x="${cx(0)}" y="672" width="${span(12)}" height="1" fill="${K}"/>
  ${T(cx(0), 698, "QCOR 2026 · Build an agent, live", 13)}
  ${T(cx(11) + COL, 698, "14", 13, 700, K, 'text-anchor="end"')}
</svg>`;
})();

// ---------- icons: black geometric solids on a 48 grid ----------
const ic = (body) => `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="${K}">${body}</svg>`;
const icons = [
  ["patient", ic(`<circle cx="24" cy="15" r="8"/><path d="M8 40 A16 16 0 0 1 40 40 Z"/>`)],
  ["heart", ic(`<path d="M24 42 L8 26 A8.5 8.5 0 0 1 24 14 A8.5 8.5 0 0 1 40 26 Z"/>`)],
  ["pill", ic(`<path d="M23 16 H16 A8 8 0 0 0 16 32 H23 Z"/><path d="M25 16 H32 A8 8 0 0 1 32 32 H25 Z"/>`)],
  ["note", ic(`<path d="M10 6 H30 L38 14 V42 H10 Z M16 20 V23 H32 V20 Z M16 27 V30 H32 V27 Z M16 34 V37 H25 V34 Z" fill-rule="evenodd"/>`)],
  ["search", ic(`<path d="M20 6 A14 14 0 1 1 20 34 A14 14 0 1 1 20 6 Z M20 11 A9 9 0 1 0 20 29 A9 9 0 1 0 20 11 Z" fill-rule="evenodd"/><path d="M29 32 L32 29 L42 39 L39 42 Z"/>`)],
  ["database", ic(`<rect x="8" y="8" width="32" height="8"/><rect x="8" y="20" width="32" height="8"/><rect x="8" y="32" width="32" height="8"/>`)],
  ["tool", ic(`<path d="M32 6 A10 10 0 1 0 42 16 L36 18 L30 12 Z" /><path d="M24.5 19.5 L28.5 23.5 L11 41 L7 37 Z"/>`)],
  ["agent", ic(`<path d="M24 8 A16 16 0 1 0 40 24 H35 A11 11 0 1 1 24 13 Z"/><path d="M24 2 L34 10.5 L24 19 Z"/><circle cx="24" cy="24" r="5"/>`)],
  ["check", ic(`<path d="M24 4 A20 20 0 1 1 24 44 A20 20 0 1 1 24 4 Z M13 24 L17 20 L21 24 L31 14 L35 18 L21 32 Z" fill-rule="evenodd"/>`)],
  ["warning", ic(`<path d="M24 5 L44 41 H4 Z M22 18 V30 H26 V18 Z M22 33 V37 H26 V33 Z" fill-rule="evenodd"/>`)],
];

export default {
  id: "swiss",
  name: "Swiss International",
  after: "Josef Müller-Brockmann's grid systems; Helvetica; the International Typographic Style",
  note: "Everything snaps to a twelve-column grid you can see. Huge flush-left type, four equal boxes, black throughout and red for one thing only: the loop. Rigorous, quiet, almost mathematical.",
  palette: [[W, "white"], [K, "black"], [R, "signal red"], [TINT, "grid tint"]],
  type: "Helvetica Neue Bold for titles (−4% tracking), Helvetica Neue Regular and Bold for text",
  ground: W,
  people,
  slide,
  icons,
};
