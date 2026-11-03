// Financial Times: salmon paper, a serif headline over sans labels, column chart with horizontal gridlines and
// direct labels, a calm annotated diagram, and the footer set as the graphic's source line.
const P = "#fff1e5", WH = "#f2dfce", GRID = "#e3d2c3", K = "#33302e", K60 = "#807973";
const OX = "#0f5499", CL = "#990f3d", TL = "#0d7680", SL = "#262a33", TLD = "#0a5a61";
const SANS = `'Helvetica Neue', Helvetica, Arial, sans-serif`, SERIF = `Georgia, 'Iowan Old Style', serif`;

// ---------- people: newspaper-graphic busts on a baseline; hers has hair a shade darker ----------
const bust = (cx, fill, hair) => {
  const B = 312, hy = B - 126;
  return `${hair ? `<path d="M${cx - 47} ${hy + 34} V${hy} A47 47 0 0 1 ${cx + 47} ${hy} V${hy + 34} Z" fill="${hair}"/>` : ""}
    <circle cx="${cx}" cy="${hy}" r="38" fill="${fill}"/>
    <path d="M${cx - 76} ${B} V${B - 40} A44 44 0 0 1 ${cx - 32} ${B - 84} H${cx + 32} A44 44 0 0 1 ${cx + 76} ${B - 40} V${B} Z" fill="${fill}"/>`;
};
const people = `<svg viewBox="0 0 400 440" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="440" fill="${P}"/>
  ${bust(112, OX)}${bust(288, TL, TLD)}
  <path d="M24 312.5 H376" stroke="${K}" stroke-width="1"/>
</svg>`;

// ---------- slide ----------
const slide = () => {
  const T = (x, y, s, size, fill = K, extra = "") => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" ${extra}>${s}</text>`;
  const NW = 224, NH = 120, NY = 384, NX = [64, 368, 688, 992], cy = NY + NH / 2;
  const S = `fill="none" stroke="${K}" stroke-width="1.5"`;
  const S2 = `fill="none" stroke="${TL}" stroke-width="1.5"`;
  const ah = (x, y, a, c = K) => `<path d="M0 0 L-9 -4.5 L-9 4.5 Z" transform="translate(${x} ${y}) rotate(${a})" fill="${c}"/>`;
  const node = (i, name, lines) => `<rect x="${NX[i]}" y="${NY}" width="${NW}" height="${NH}" fill="${WH}"/>
    ${T(NX[i] + 16, NY + 32, name, 18, K, 'font-weight="500"')}
    ${lines.map((l, k) => T(NX[i] + 16, NY + 58 + k * 20, l, 15, K)).join("")}`;

  // column chart: horizontal gridlines 0–5, values labelled directly on the columns
  const rows = [[["Model", "alone"], 1], [["+ chart", "pasted"], 2], [["+ tools"], 4], [["+ checks"], 5]];
  const X0 = 880, Y0 = 268, U = 30, PITCH = 84, CW = 52;
  const grid = [0, 1, 2, 3, 4, 5].map((v) => `<path d="M${X0 - 16} ${Y0 - v * U + 0.5} H1216" stroke="${v ? GRID : K}" stroke-width="1"/>
    ${T(X0 - 24, Y0 - v * U + 4, v, 12, K60, 'text-anchor="end"')}`).join("");
  const cols = rows.map(([lab, v], i) => { const x = X0 + 8 + i * PITCH, c = x + CW / 2;
    return `<rect x="${x}" y="${Y0 - v * U}" width="${CW}" height="${v * U}" fill="${OX}"/>
      ${T(c, Y0 - v * U - 7, v, 15, K, 'text-anchor="middle" font-weight="500"')}
      ${lab.map((l, k) => T(c, Y0 + 20 + k * 15, l, 13, K, 'text-anchor="middle"')).join("")}`; }).join("");

  const mR = NX[1] + NW - 32, tL = NX[2] + 32;
  return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" font-family="${SANS}">
  <rect width="1280" height="720" fill="${P}"/>
  ${T(64, 80, "Part 4 · Agents", 16, CL, 'font-weight="500"')}
  ${T(62, 140, "An agent is a model in a loop", 48, K, `font-family="${SERIF}"`)}

  ${T(X0 - 40, 80, "Questions right, of 5", 18, K, 'font-weight="500"')}
  ${grid}${cols}

  ${node(0, "Rosa’s chart", ["612 notes"])}
  ${node(1, "Model", ["reads, decides", "the next step"])}
  ${node(2, "Tools", ["search", "read a note", "labs"])}
  <rect x="${NX[3]}" y="${NY}" width="${NW}" height="${NH}" fill="${WH}"/>
  ${T(NX[3] + 16, NY + 32, "Answer", 18, K, 'font-weight="500"')}
  ${T(NX[3] + 16, NY + 58, "EF 30% · metoprolol", 15, K)}
  ${T(NX[3] + 16, NY + 78, `tartrate <tspan fill="${CL}" font-weight="500">→ a gap</tspan>`, 15, K)}

  <path d="M${NX[0] + NW + 10} ${cy} H${NX[1] - 10}" ${S}/>${ah(NX[1] - 8, cy, 0)}
  <path d="M${NX[2] + NW + 10} ${cy} H${NX[3] - 10}" ${S}/>${ah(NX[3] - 8, cy, 0)}
  <path d="M${mR} ${NY - 8} C${mR + 24} ${NY - 60} ${tL - 24} ${NY - 60} ${tL} ${NY - 10}" ${S2}/>${ah(tL, NY - 8, 64, TL)}
  <path d="M${tL} ${NY + NH + 8} C${tL - 24} ${NY + NH + 60} ${mR + 24} ${NY + NH + 60} ${mR} ${NY + NH + 10}" ${S2}/>${ah(mR, NY + NH + 8, 244, TL)}
  ${T(640, NY - 58, "Think → Act", 15, TL, 'text-anchor="middle" font-weight="500"')}
  ${T(640, NY + NH + 72, "Observe", 15, TL, 'text-anchor="middle" font-weight="500"')}

  <path d="M${NX[3] + 16} ${NY + NH} V${NY + NH + 36} H${NX[3] + 28}" fill="none" stroke="${K60}" stroke-width="1"/>
  ${T(NX[3] + 34, NY + NH + 42, "“LVEF 30%”", 18, K, `font-family="${SERIF}" font-style="italic"`)}
  ${T(NX[3] + 34, NY + NH + 62, "Echo, 10/02", 13, K60)}

  <path d="M64 648.5 H1216" stroke="${GRID}" stroke-width="1"/>
  ${T(64, 676, "QCOR 2026 · Build an agent, live", 13, K60)}
  ${T(1216, 676, "14", 13, K, 'text-anchor="end" font-weight="500"')}
</svg>`;
};

// ---------- icons: solid newspaper glyphs on a 48 grid, paper knock-outs, claret for the warning ----------
const ic = (b) => `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="${K}">${b}</svg>`;
const ln = (d, w = 4) => `<path d="${d}" fill="none" stroke="${K}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const icons = [
  ["patient", ic(`<circle cx="24" cy="15" r="9"/><path d="M7 43 V36 A11 11 0 0 1 18 25 H30 A11 11 0 0 1 41 36 V43 Z"/>`)],
  ["heart", ic(`<path d="M24 42 C13 34 5 27 5 17.5 A9.5 9.5 0 0 1 24 13 A9.5 9.5 0 0 1 43 17.5 C43 27 35 34 24 42 Z"/>`)],
  ["pill", ic(`<g transform="rotate(-45 24 24)"><path d="M24 15 H15 A9 9 0 0 0 15 33 H24 Z"/><path d="M24 16.5 H33 A7.5 7.5 0 0 1 33 31.5 H24 Z" fill="none" stroke="${K}" stroke-width="3"/></g>`)],
  ["note", ic(`<path fill-rule="evenodd" d="M10 5 H30 L38 13 V43 H10 Z M15 20 H33 V23 H15 Z M15 27 H33 V30 H15 Z M15 34 H27 V37 H15 Z"/>`)],
  ["search", ic(`<circle cx="20" cy="20" r="12" fill="none" stroke="${K}" stroke-width="4"/>${ln("M29 29 L41 41", 5)}`)],
  ["database", ic(`<ellipse cx="24" cy="10" rx="15" ry="5"/><path d="M9 14 C11 18 37 18 39 14 V22 C37 26 11 26 9 22 Z M9 26 C11 30 37 30 39 26 V34 C37 38 11 38 9 34 Z M9 38 C11 42 37 42 39 38 V39 C39 42 32 44 24 44 C16 44 9 42 9 39 Z"/>`)],
  ["tool", ic(`<path d="M30 5 A11 11 0 0 0 20.5 21.2 L6.8 34.9 A4.4 4.4 0 0 0 13.1 41.2 L26.8 27.5 A11 11 0 0 0 43 18 L36.5 21.5 L31 17 L32.5 10 Z"/>`)],
  ["agent", ic(`${ln("M39 24 A15 15 0 1 1 33.5 12.3")}<path d="M27.5 6.5 L38.5 9 L35 19.5 Z"/>`)],
  ["check", ic(ln("M9 25 L19 35 L39 13", 5))],
  ["warning", `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M24 5 L44 41 H4 Z" fill="${CL}" stroke="${CL}" stroke-width="2" stroke-linejoin="round"/><rect x="22" y="17" width="4" height="13" rx="1" fill="${P}"/><circle cx="24" cy="35" r="2.3" fill="${P}"/></svg>`],
];

export default {
  id: "ft",
  name: "Financial Times",
  after: "FT editorial graphics: salmon paper, the FT palette (oxford, claret, teal), Financier-style headline, Metric-style labels",
  note: "Salmon paper and the manners of a newspaper graphic: a serif headline, sans labels, a column chart with horizontal gridlines and values written on the columns, a quiet annotated diagram, and the footer set as the source line. Sober and credible; the talk reads like evidence.",
  palette: [[P, "paper"], [OX, "oxford"], [CL, "claret"], [TL, "teal"], [SL, "slate"], [WH, "wheat"]],
  type: "Georgia for the headline and the quote, Helvetica Neue for labels",
  ground: P,
  people,
  slide,
  icons,
};
