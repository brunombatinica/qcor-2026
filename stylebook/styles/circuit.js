// Circuit board: a printed circuit board. Green solder mask, copper traces with 45° corners, gold pads,
// black packages, white silkscreen, an LED bar graph.
const MASK = "#0e5a37", MASK2 = "#0a4228", CU = "#cf9a45", AU = "#e3bd62", SILK = "#f3f3ec";
const PKG = "#1c1d1f", MARK = "#b9bbbe", HOLE = "#0b0f0d", LED = "#ffb21e";
const MONO = `font-family="Menlo, Monaco, monospace"`;
const SANS = `font-family="'DIN Alternate', 'Avenir Next', Helvetica, sans-serif"`;
const r1 = (v) => Math.round(v * 10) / 10;

// a trace through `pts`, every corner cut at 45° by `c`
function trace(pts, w = 5, col = CU, c = 12) {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], [cx, cy] = pts[i + 1];
    const l1 = Math.hypot(bx - ax, by - ay), l2 = Math.hypot(cx - bx, cy - by), k = Math.min(c, l1 / 2, l2 / 2);
    d += ` L${r1(bx - ((bx - ax) / l1) * k)} ${r1(by - ((by - ay) / l1) * k)} L${r1(bx + ((cx - bx) / l2) * k)} ${r1(by + ((cy - by) / l2) * k)}`;
  }
  const [ex, ey] = pts[pts.length - 1];
  return `<path d="${d} L${ex} ${ey}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
}
const pad = (x, y, r = 6) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${AU}"/><circle cx="${x}" cy="${y}" r="${r * 0.42}" fill="${HOLE}"/>`;
const hole = (x, y) => `<circle cx="${x}" cy="${y}" r="17" fill="${MASK2}"/><circle cx="${x}" cy="${y}" r="13" fill="${AU}"/><circle cx="${x}" cy="${y}" r="8" fill="${HOLE}"/>`;
const silk = (x, y, t, size = 13, extra = "") => `<text x="${x}" y="${y}" ${MONO} font-size="${size}" font-weight="700" fill="${SILK}" ${extra}>${t}</text>`;
const board = (p, w, h) => `<defs><radialGradient id="${p}-m" cx="40%" cy="35%" r="85%"><stop offset="0" stop-color="#127046"/><stop offset=".6" stop-color="${MASK}"/><stop offset="1" stop-color="${MASK2}"/></radialGradient>
  <filter id="${p}-glow" x="-60%" y="-120%" width="220%" height="340%"><feGaussianBlur stdDeviation="4"/></filter></defs>
  <rect width="${w}" height="${h}" fill="url(#${p}-m)"/>`;

// ---- people: a ring pad for the head, a trace for the shoulders ----
function figure(cx, top, s, bun) {
  const hy = top + 30 * s;
  return `${bun ? `<circle cx="${cx}" cy="${hy - 16.5 * s}" r="${5 * s}" fill="${AU}"/>` : ""}
    <circle cx="${cx}" cy="${hy}" r="${10 * s}" fill="none" stroke="${AU}" stroke-width="${4 * s}"/>
    ${trace([[cx - 17 * s, hy + 46 * s], [cx - 17 * s, hy + 30 * s], [cx - 9 * s, hy + 21 * s], [cx + 9 * s, hy + 21 * s], [cx + 17 * s, hy + 30 * s], [cx + 17 * s, hy + 46 * s]], 3.4 * s, CU, 6 * s)}
    ${pad(cx - 17 * s, hy + 46 * s, 4 * s)}${pad(cx + 17 * s, hy + 46 * s, 4 * s)}`;
}
function people() {
  return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  ${figure(116, 74, 3, false)}${figure(284, 74, 3, true)}
</svg>`;
}

// ---- slide ----
function slide() {
  const p = "circuit-s";
  const ny = 264, nh = 144, nw = 208, cy = ny + nh / 2;
  const nodes = [
    [64, "J1", "Rosa's chart", ["612 notes"]],
    [368, "U1", "Model", ["reads, decides", "the next step"]],
    [704, "U2", "Tools", ["search", "read a note", "labs"]],
    [1008, "J2", "Answer", ["EF 30%", "metoprolol tartrate", "→ a gap"]],
  ];
  const pinY = [0, 1, 2, 3, 4].map((k) => ny + 32 + k * 20);
  const pkg = ([x, ref, name, lines]) => `
    ${pinY.map((y) => `<rect x="${x - 10}" y="${y - 4}" width="12" height="8" fill="${AU}"/><rect x="${x + nw - 2}" y="${y - 4}" width="12" height="8" fill="${AU}"/>`).join("")}
    <rect x="${x}" y="${ny}" width="${nw}" height="${nh}" rx="4" fill="${PKG}"/>
    <circle cx="${x + 14}" cy="${ny + nh - 14}" r="4" fill="#33353a"/>
    ${silk(x - 10, ny - 14, ref, 13)}
    <text x="${x + 18}" y="${ny + 38}" ${SANS} font-size="24" font-weight="700" fill="${SILK}">${name}</text>
    ${lines.map((t, i) => `<text x="${x + 18}" y="${ny + 66 + i * 21}" ${MONO} font-size="13.5" fill="${MARK}">${t}</text>`).join("")}`;
  const bus = (x1, x2) => [1, 2, 3].map((k) => trace([[x1 + 8, pinY[k]], [x2 - 8, pinY[k]]], 4)).join("");
  const leds = [[1, "Model alone"], [2, "+ chart pasted"], [4, "+ tools"], [5, "+ checks"]];

  return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" ${MONO}>
  ${board(p, 1280, 720)}
  ${hole(32, 32)}${hole(1248, 32)}${hole(32, 688)}${hole(1248, 688)}

  ${silk(64, 84, "PART 4 · AGENTS", 15, 'letter-spacing="1.5"')}
  <text x="62" y="152" ${SANS} font-size="56" font-weight="700" fill="${SILK}">An agent is a model in a loop</text>

  <!-- traces: chart in, answer out, and the loop between model and tools -->
  ${bus(272, 368)}${bus(912, 1008)}
  ${trace([[528, ny - 2], [528, 216], [752, 216], [752, ny - 2]], 6)}
  ${trace([[752, ny + nh + 2], [752, 456], [528, 456], [528, ny + nh + 2]], 6)}
  <path d="M634 207 L646 216 L634 225" fill="none" stroke="${SILK}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>
  <path d="M646 447 L634 456 L646 465" fill="none" stroke="${SILK}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>
  ${silk(640, 200, "THINK → ACT → OBSERVE", 14, 'text-anchor="middle" letter-spacing="1.5"')}
  ${[[528, ny - 10], [752, ny - 10], [528, ny + nh - 2], [752, ny + nh - 2]].map(([x, y]) => `<rect x="${x - 4}" y="${y}" width="8" height="12" fill="${AU}"/>`).join("")}
  ${nodes.map(pkg).join("")}
  ${silk(1018, ny + nh + 32, "“LVEF 30%” · Echo, 10/02", 13)}

  <!-- LED bar graph -->
  ${silk(64, 512, "QUESTIONS RIGHT, OF 5", 13, 'letter-spacing="1"')}
  ${leds.map(([v, t], i) => {
    const x = 64 + i * 128;
    return `${Array.from({ length: 5 }, (_, k) => {
      const y = 620 - k * 20, on = k < v;
      return `${on ? `<rect x="${x - 2}" y="${y - 2}" width="60" height="16" rx="3" fill="${LED}" filter="url(#${p}-glow)" opacity=".8"/>` : ""}
        <rect x="${x}" y="${y}" width="56" height="12" rx="2" fill="${on ? "#ffd27a" : "#16261d"}" stroke="${on ? "#fff3c9" : "#2f4a3a"}" stroke-width="1.2"/>`;
    }).join("")}
      ${silk(x + 68, 632, String(v), 15)}
      ${silk(x, 656, t, 12)}`;
  }).join("")}

  ${silk(64, 696, "QCOR 2026 · Build an agent, live", 13)}
  ${silk(1200, 696, "14", 15, 'text-anchor="end"')}
</svg>`;
}

// ---- icons: copper trace, gold pads, on a board tile ----
const tile = (body) => `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="46" height="46" rx="7" fill="${MASK}"/>${body}</svg>`;
const T = (d) => `<path d="${d}" fill="none" stroke="${CU}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
const v = (x, y) => pad(x, y, 3);
const icons = [
  ["patient", tile(`<circle cx="24" cy="16" r="6" fill="none" stroke="${AU}" stroke-width="3"/>${T("M13 38 V32 L17 28 H31 L35 32 V38")}${v(13, 38)}${v(35, 38)}`)],
  ["heart", tile(`${T("M24 37 C14.5 30 10 24.8 10 19.2 C10 15 13.2 12 17 12 C20 12 22.5 13.8 24 16.4 C25.5 13.8 28 12 31 12 C34.8 12 38 15 38 19.2 C38 24.8 33.5 30 24 37 Z")}${v(24, 16.4)}`)],
  ["pill", tile(`<g transform="rotate(-45 24 24)">${T("M17 17 H31 A7 7 0 0 1 31 31 H17 A7 7 0 0 1 17 17 Z M24 17 V31")}</g>${v(24, 24)}`)],
  ["note", tile(`${T("M14 10 H28 L34 16 V38 H14 Z")}${T("M19 22 H27 M19 28 H29 M19 33 H24")}${v(29, 22)}${v(24, 33)}`)],
  ["search", tile(`<circle cx="21" cy="21" r="8" fill="none" stroke="${AU}" stroke-width="3"/>${T("M27 27 L35 35")}${v(36, 36)}`)],
  ["database", tile(`${T("M13 14 A11 4 0 0 1 35 14 A11 4 0 0 1 13 14 V33 A11 4 0 0 0 35 33 V14 M13 23.5 A11 4 0 0 0 35 23.5")}`)],
  ["tool", tile(`${T("M32.5 11 A7 7 0 0 0 25.6 20.2 L13 32.8 A2.6 2.6 0 0 0 16.6 36.4 L29.2 23.8 A7 7 0 0 0 38.4 16.9 L34.4 20.9 L30.6 20 L29.6 16.2 Z")}${v(14.8, 34.6)}`)],
  ["agent", tile(`${T("M35 24 A11 11 0 1 1 31 15.5 M30 10 L32 16 L26 17.5")}${v(24, 24)}`)],
  ["check", tile(`${T("M13 24 L21 32 L36 16")}${v(13, 24)}${v(36, 16)}`)],
  ["warning", tile(`${T("M24 10 L38 35 H10 Z M24 19 V27")}${v(24, 31.5)}`)],
];

export default {
  id: "circuit",
  name: "Circuit board",
  after: "printed circuit boards: green solder mask, gold pads, 45° routing, silkscreen reference designators",
  note: "The agent as hardware you can follow with a finger: the chart plugs in at J1, the model is U1, the tools are U2 on a loop of traces, and the answer leaves at J2. The questions-right chart is an LED bar graph, lit 1, 2, 4, 5.",
  palette: [[MASK, "solder mask"], [CU, "copper"], [AU, "gold"], [SILK, "silkscreen"], [PKG, "package black"], [LED, "LED amber"]],
  type: "DIN Alternate Bold for the title and part names, Menlo Bold for silkscreen",
  ground: MASK,
  peopleGround: "radial-gradient(circle at 40% 35%, #127046, #0e5a37 60%, #0a4228)",
  people,
  slide,
  icons,
};
