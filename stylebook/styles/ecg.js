// 25 ECG paper: a 12-lead printout. Pink 1 mm / 5 mm grid, a black trace, the calibration pulse,
// lead labels, 25 mm/s · 10 mm/mV. The people are drawn by the rhythm itself.
const PAPER = "#fff4f1", MINOR = "#f6c3be", MAJOR = "#e98f88", INK = "#1d1616", RED = "#c8262c", SIL = "#b9bdc3";
const HN = `font-family="'Helvetica Neue', Helvetica, Arial, sans-serif"`;
const MONO = `font-family="Menlo, Monaco, monospace"`;
const r1 = (v) => Math.round(v * 10) / 10;

// grid as a CSS background (Rosa and icon panels) and as SVG patterns (slide)
const cssGrid = (m, M) => [[M, 0.9, MAJOR], [m, 0.6, MINOR]].flatMap(([s, w, c]) => [
  `linear-gradient(${c} ${w}px, transparent ${w}px) 0 0/${s}px ${s}px`, `linear-gradient(90deg, ${c} ${w}px, transparent ${w}px) 0 0/${s}px ${s}px`]).join(", ") + `, ${PAPER}`;
const gridDefs = (p, m) => `<pattern id="${p}-m" width="${m}" height="${m}" patternUnits="userSpaceOnUse"><path d="M${m} 0 H0 V${m}" fill="none" stroke="${MINOR}" stroke-width=".7"/></pattern>
  <pattern id="${p}-M" width="${m * 5}" height="${m * 5}" patternUnits="userSpaceOnUse"><path d="M${m * 5} 0 H0 V${m * 5}" fill="none" stroke="${MAJOR}" stroke-width="1.2"/></pattern>`;

// one PQRST complex from (x, y) on the baseline. kx px per mm of time, ky px per mm of voltage,
// R = R-wave height in mm. Returns path commands (no M) ending on the baseline.
function beat(x, y, kx, ky, R = 12, rr = 20) {
  const X = (t) => r1(x + t * kx), Y = (v) => r1(y - v * ky);
  return `L${X(1.5)} ${Y(0)} Q${X(2.75)} ${Y(3)} ${X(4)} ${Y(0)} L${X(5.4)} ${Y(0)} L${X(5.9)} ${Y(-1)} L${X(6.9)} ${Y(R)} L${X(7.9)} ${Y(-3)} L${X(8.5)} ${Y(0)} L${X(10.4)} ${Y(0.2)} C${X(11.6)} ${Y(4.6)} ${X(13.6)} ${Y(4.6)} ${X(15)} ${Y(0)} L${X(rr)} ${Y(0)}`;
}
const cal = (x, y, h, w) => `L${x} ${y} V${y - h} H${x + w} V${y}`;

// ---- people: one trace that rises into two busts and returns to the baseline ----
function people() {
  const B = 290;
  const bust = (cx, bun) => {
    const top = bun ? `A30 30 0 0 1 ${cx} ${B - 134} A11 11 0 0 1 ${cx} ${B - 156} A11 11 0 0 1 ${cx} ${B - 134} A30 30 0 0 1 ${cx + 12} ${B - 77.5}`
      : `A30 30 0 1 1 ${cx + 12} ${B - 77.5}`;
    return `L${cx - 56} ${B} C${cx - 56} ${B - 44} ${cx - 38} ${B - 70} ${cx - 12} ${B - 77.5} ${top} C${cx + 38} ${B - 70} ${cx + 56} ${B - 44} ${cx + 56} ${B}`;
  };
  const d = `M0 ${B} H18 ${beat(18, B, 3.4, 3.4, 12, 20)} ${bust(150, false)} ${bust(288, true)} L344 ${B} ${beat(344, B, 2.6, 3.4, 12, 21.5)}`;
  return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <path d="${d}" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>
</svg>`;
}

// ---- slide ----
function slide() {
  const p = "ecg-s", m = 6;
  const ny = 234, nh = 132, nw = 180, by = ny + nh / 2;
  const nodes = [
    [48, "Rosa's chart", ["612 notes"]],
    [288, "Model", ["reads, decides", "the next step"]],
    [834, "Tools", ["search", "read a note", "labs"]],
    [1056, "Answer", ["EF 30%", "metoprolol tartrate", "→ a gap"]],
  ];
  const kx = 10, X = (t) => r1(480 + t * kx);
  const loopLine = `M${288 + nw} ${by} H480 ${beat(480, by, kx, 6.4, 11, 20)} ${beat(680, by, kx, 6.4, 11, 15.4)} L${834} ${by}`;
  const cb = 618, ck = 6, unit = 5;
  const bars = [[1, "Model alone"], [2, "+ chart pasted"], [4, "+ tools"], [5, "+ checks"]];
  let chart = `M48 ${cb} H66 ${cal(66, cb, 30, 30)} L150 ${cb}`;
  const cx = (i) => 222 + i * 240;
  bars.forEach(([v], i) => { chart += ` L${r1(cx(i) - 6.9 * ck)} ${cb} ${beat(cx(i) - 6.9 * ck, cb, ck, ck, v * unit, 30)}`; });
  chart += ` L1236 ${cb}`;
  const arrow = (x, y) => `<path d="M${x - 10} ${y - 6} L${x} ${y} L${x - 10} ${y + 6}" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>`;

  return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" ${HN}>
  <defs>${gridDefs(p, m)}</defs>
  <rect width="1280" height="720" fill="${PAPER}"/><rect width="1280" height="720" fill="url(#${p}-m)"/><rect width="1280" height="720" fill="url(#${p}-M)"/>

  <text x="48" y="54" font-size="18" font-weight="700" fill="${RED}">Part 4 · Agents</text>
  <text x="1236" y="54" text-anchor="end" ${MONO} font-size="14" fill="${INK}">25 mm/s   10 mm/mV</text>
  <text x="46" y="126" font-size="56" font-weight="700" letter-spacing="-0.5" fill="${INK}">An agent is a model in a loop</text>

  ${nodes.map(([x, name, lines]) => `<rect x="${x}" y="${ny}" width="${nw}" height="${nh}" rx="3" fill="#fffdfc" stroke="${RED}" stroke-width="2"/>
    <text x="${x + 18}" y="${ny + 38}" font-size="25" font-weight="700" fill="${INK}">${name}</text>
    ${lines.map((t, i) => `<text x="${x + 18}" y="${ny + 66 + i * 22}" font-size="16" fill="${INK}">${t}</text>`).join("")}`).join("")}
  <text x="1056" y="${ny + nh + 30}" font-size="16" font-weight="700" fill="${INK}">“LVEF 30%”</text><text x="1056" y="${ny + nh + 52}" font-size="16" fill="${INK}">Echo, 10/02</text>

  <path d="M228 ${by} H282" fill="none" stroke="${INK}" stroke-width="2.4"/>${arrow(286, by)}
  <path d="M1014 ${by} H1050" fill="none" stroke="${INK}" stroke-width="2.4"/>${arrow(1054, by)}

  <!-- the loop as a rhythm strip: P = Think, QRS = Act, T = Observe; then back for the next beat -->
  <text x="484" y="${ny - 6}" font-size="15" font-weight="700" fill="${INK}">II</text>
  <path d="${loopLine}" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>${arrow(832, by)}
  <g font-size="16" font-weight="700" fill="${RED}" text-anchor="middle">
    <text x="${X(2.75)}" y="${by + 34}">Think</text>
    <text x="${X(6.9) + 22}" y="${by - 48}">Act</text>
    <text x="${X(12.6)}" y="${by + 34}">Observe</text>
  </g>
  <path d="M924 ${ny + nh} V${ny + nh + 48} H378 V${ny + nh + 8}" fill="none" stroke="${INK}" stroke-width="2" stroke-dasharray="7 5"/>
  <path d="M372 ${ny + nh + 16} L378 ${ny + nh + 4} L384 ${ny + nh + 16}" fill="none" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>

  <!-- the chart as a lead: R height = questions right, one big box each -->
  <text x="48" y="492" font-size="15" font-weight="700" fill="${INK}">V1</text>
  <text x="80" y="492" font-size="16" font-weight="500" fill="${INK}">Questions right, of 5</text>
  <path d="${chart}" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>
  ${bars.map(([v, t], i) => `<text x="${cx(i) + 14}" y="${cb - v * unit * ck - 6}" font-size="24" font-weight="700" fill="${RED}">${v}</text>
    <text x="${cx(i)}" y="${cb + 42}" text-anchor="middle" font-size="15" fill="${INK}">${t}</text>`).join("")}

  <text x="48" y="700" ${MONO} font-size="13" fill="${INK}">QCOR 2026 · Build an agent, live</text>
  <text x="1236" y="700" text-anchor="end" ${MONO} font-size="14" font-weight="700" fill="${INK}">14</text>
</svg>`;
}

// ---- icons: each one continuous trace, flat line in and out ----
const S = `fill="none" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"`;
const ic = (d, tint = "") => `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">${tint}<path d="${d}" ${S}/></svg>`;
const icons = [
  ["patient", ic(`M1 42 H9 C9 33 13 29.5 18.5 28.3 C15.4 25.8 14 22.4 14 18.5 A10 10 0 1 1 29.5 28.3 C35 29.5 39 33 39 42 H47`)],
  ["heart", ic(`M1 38 H24 C14 30 8 24.5 8 18.5 C8 13.5 11.8 10 16 10 C19.8 10 22.6 12.6 24 15.8 C25.4 12.6 28.2 10 32 10 C36.2 10 40 13.5 40 18.5 C40 24.5 34 30 24 38 H47`)],
  ["pill", ic(`M1 33 H38 C44.6 33 44.6 17 38 17 H10 C3.4 17 3.4 33 10 33 H24 V17 V33 H47`)],
  ["note", ic(`M1 43 H37 V15 L29 7 V15 H37 L29 7 H11 V22 H14.5 L16.5 18.5 L19 26 L21 22 H32 H11 V31 H32 H11 V43 H47`)],
  ["search", ic(`M1 42 H34 L38.5 37.5 L27.6 26.6 A10.5 10.5 0 1 1 12.8 11.8 A10.5 10.5 0 1 1 27.6 26.6 L38.5 37.5 L43.5 42 H47`)],
  ["database", ic(`M1 43 H10 V12 A14 4.5 0 0 1 38 12 A14 4.5 0 0 1 10 12 V22 A14 4.5 0 0 0 38 22 V32 A14 4.5 0 0 1 10 32 V39 A14 4.5 0 0 0 38 39 V12 V43 H47`)],
  ["tool", ic(`M1 43 H6.5 L8.6 34 L24.6 18 A9 9 0 0 1 32.8 6.2 L28.4 11.3 L28.7 16.6 L31.4 19.6 L36.7 20.3 L41.8 15.2 A9 9 0 0 1 30 23.4 L14 39.4 L17.6 43 H47`)],
  ["agent", ic(`M1 41 H14 C26 41 37 35 37 23 C37 14 31 8 24 8 C17 8 11 14 11 23 C11 35 22 41 34 41 H47`, `<path d="M28.5 3.8 L24 8 L28.5 12.2" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`)],
  ["check", ic(`M1 29 H10 L19 38 L37 9 L41 29 H47`)],
  ["warning", ic(`M1 42 H43 L24 6.5 L5 42 H22 L23 39 L24 18.5 L25 30.5 L26 42 H47`)],
];

export default {
  id: "ecg",
  name: "ECG paper",
  after: "the 12-lead ECG printout: 1 mm and 5 mm grid, calibration pulse, lead labels, 25 mm/s and 10 mm/mV",
  note: "The language a cardiology room already reads: one beat is one turn of the agent loop (P is Think, QRS is Act, T is Observe), and the chart is a lead whose R waves stand 1, 2, 4 and 5 big boxes tall. The people are one trace that leaves the rhythm and returns to it.",
  palette: [[PAPER, "paper"], [MINOR, "1 mm grid"], [MAJOR, "5 mm grid"], [INK, "trace"], [RED, "printer red"]],
  type: "Helvetica Neue Bold and Regular; Menlo for the machine print",
  ground: PAPER,
  peopleGround: cssGrid(8, 40),
  iconGround: cssGrid(5, 25),
  iconInk: "#000",
  people,
  slide,
  icons,
};
