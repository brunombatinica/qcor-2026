// Otl Aicher, Munich 1972: a pale spectrum (light blue, green, silver) with orange and dark green, no red or black;
// everything on a 45°/90° grid; figures built from separate segments; Univers-like type (Helvetica Neue).
const LB = "#5db7e5", GN = "#63bc6b", SV = "#c4c8c9", OR = "#f39200", DG = "#0e5a3a", W = "#ffffff", MIST = "#e9eef0";
const H = `font-family="'Helvetica Neue', Helvetica, Arial, sans-serif"`;

// ---------- people: head, torso, arms and legs as separate bars; hers adds a separate 45° dress segment ----------
const figure = (cx, dress) => {
  const bar = (x1, y1, x2, y2, w) => `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${W}" stroke-width="${w}" stroke-linecap="round"/>`;
  return `<circle cx="${cx}" cy="104" r="22" fill="${W}"/>
    ${bar(cx, 158, cx, dress ? 202 : 236, 40)}
    ${bar(cx - 36, 150, cx - 36, 226, 15)}${bar(cx + 36, 150, cx + 36, 226, 15)}
    ${dress ? `<path d="M${cx - 22} 230 H${cx + 22} L${cx + 66} 274 H${cx - 66} Z" fill="${W}"/>` : ""}
    ${bar(cx - 11, dress ? 291 : 272, cx - 11, 364, 18)}${bar(cx + 11, dress ? 291 : 272, cx + 11, 364, 18)}`;
};
const people = `<svg viewBox="0 0 400 440" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="440" fill="${LB}"/>
  <g transform="translate(0 4)">${figure(126, false)}${figure(266, true)}</g>
</svg>`;

// ---------- slide: white ground, pale colour fields, dark green connectors with 45° corners ----------
const slide = () => {
  const T = (x, y, s, size, extra = "") => `<text x="${x}" y="${y}" font-size="${size}" fill="${DG}" ${extra}>${s}</text>`;
  const NW = 224, NH = 152, NY = 376, NX = [64, 368, 688, 992], cy = NY + NH / 2;
  const tri = (x, y, dir) => { // right-angled arrowhead, tip at (x, y), sides at 45°
    const m = { r: [-12, 0, 0, 12], l: [12, 0, 0, 12], d: [0, -12, 12, 0], u: [0, 12, 12, 0] }[dir];
    return `<path d="M${x} ${y} L${x + m[0] - m[2]} ${y + m[1] - m[3]} L${x + m[0] + m[2]} ${y + m[1] + m[3]} Z" fill="${DG}"/>`;
  };
  const S = `fill="none" stroke="${DG}" stroke-width="3" stroke-linejoin="miter"`;
  const node = (i, fill, name, lines) => `<rect x="${NX[i]}" y="${NY}" width="${NW}" height="${NH}" fill="${fill}"/>
    ${T(NX[i] + 20, NY + 40, name, 22, 'font-weight="700"')}
    ${lines.map((l, k) => T(NX[i] + 20, NY + 68 + k * 22, l, 16)).join("")}`;
  const mA = NX[1] + NW / 2, tA = NX[2] + NW / 2;

  // chart: horizontal bars on a five-unit scale, silver rules
  const rows = [["Model alone", 1], ["+ chart pasted", 2], ["+ tools", 4], ["+ checks", 5]];
  const U = 44, BX = 968;
  const chart = [0, 1, 2, 3, 4, 5].map((v) => `<path d="M${BX + v * U} 108 V264" stroke="${SV}" stroke-width="${v ? 1 : 2}"/>`).join("")
    + rows.map(([t, v], r) => { const y = 116 + r * 38;
      return T(800, y + 19, t, 16) + `<rect x="${BX}" y="${y}" width="${v * U}" height="26" fill="${LB}"/>` + T(BX + v * U - 10, y + 19, v, 16, 'font-weight="700" text-anchor="end"'); }).join("");

  return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" ${H}>
  <rect width="1280" height="720" fill="${W}"/>
  ${T(64, 88, "Part 4 · Agents", 16, 'font-weight="700"')}
  <g font-size="56" font-weight="500" fill="${DG}" letter-spacing="-1.2">
    <text x="61" y="160">An agent is</text>
    <text x="61" y="226">a model in a loop</text>
  </g>
  ${T(800, 88, "Questions right, of 5", 16, 'font-weight="700"')}
  ${chart}

  ${node(0, SV, "Rosa’s chart", ["612 notes"])}
  ${node(1, LB, "Model", ["reads, decides", "the next step"])}
  ${node(2, GN, "Tools", ["search", "read a note", "labs"])}
  <rect x="${NX[3]}" y="${NY}" width="${NW}" height="${NH}" fill="${OR}"/>
  ${T(NX[3] + 20, NY + 40, "Answer", 22, 'font-weight="700"')}
  ${T(NX[3] + 20, NY + 68, "EF 30% · metoprolol", 16)}
  ${T(NX[3] + 20, NY + 90, "tartrate <tspan font-weight=\"700\">→ a gap</tspan>", 16)}
  ${T(NX[3] + 20, NY + 128, "“LVEF 30%”", 16, 'font-weight="700"')}
  ${T(NX[3] + 116, NY + 128, "Echo, 10/02", 13)}

  <path d="M${NX[0] + NW + 8} ${cy} H${NX[1] - 18}" ${S}/>${tri(NX[1] - 8, cy, "r")}
  <path d="M${NX[2] + NW + 8} ${cy} H${NX[3] - 18}" ${S}/>${tri(NX[3] - 8, cy, "r")}
  <path d="M${mA} ${NY - 8} V${NY - 40} L${mA + 16} ${NY - 56} H${tA - 16} L${tA} ${NY - 40} V${NY - 18}" ${S}/>${tri(tA, NY - 8, "d")}
  <path d="M${tA} ${NY + NH + 8} V${NY + NH + 40} L${tA - 16} ${NY + NH + 56} H${mA + 16} L${mA} ${NY + NH + 40} V${NY + NH + 18}" ${S}/>${tri(mA, NY + NH + 8, "u")}
  ${T(640, NY - 70, "Think → Act", 16, 'text-anchor="middle" font-weight="500"')}
  ${T(640, NY + NH + 84, "Observe", 16, 'text-anchor="middle" font-weight="500"')}

  <rect x="64" y="656" width="1152" height="2" fill="${MIST}"/>
  ${T(64, 684, "QCOR 2026 · Build an agent, live", 13)}
  ${T(1216, 684, "14", 13, 'text-anchor="end" font-weight="700"')}
</svg>`;
};

// ---------- icons: white pictograms on a coloured square, 48 grid, 45°/90° only ----------
const tile = (bg, b) => `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" fill="${bg}"/>${b}</svg>`;
const st = (d, w = 4.5, cap = "round") => `<path d="${d}" fill="none" stroke="${W}" stroke-width="${w}" stroke-linecap="${cap}" stroke-linejoin="miter"/>`;
const heart = (cx, by, a) => { const h = a / Math.SQRT2, r = a / 2, f = (v) => +v.toFixed(2); return `<path d="M${cx} ${by} L${f(cx - h)} ${f(by - h)} A${r} ${r} 0 0 1 ${cx} ${f(by - 2 * h)} A${r} ${r} 0 0 1 ${f(cx + h)} ${f(by - h)} Z" fill="${W}"/>`; };
const icons = [
  ["patient", tile(LB, `<circle cx="24" cy="15" r="6" fill="${W}"/><path d="M11 39 V31 L17 25 H31 L37 31 V39 Z" fill="${W}"/>`)],
  ["heart", tile(LB, heart(24, 38, 18))],
  ["pill", tile(LB, `<g transform="rotate(-45 24 24)"><path d="M23 17 H17 A7 7 0 0 0 17 31 H23 Z" fill="${W}"/><path d="M25 17 H31 A7 7 0 0 1 31 31 H25 Z" fill="none" stroke="${W}" stroke-width="2.5"/></g>`)],
  ["note", tile(LB, `<path d="M13 9 H29 L36 16 V39 H13 Z" fill="${W}"/><path d="M18 21 H31 M18 27 H31 M18 33 H26" stroke="${LB}" stroke-width="2.5"/>`)],
  ["search", tile(LB, `<circle cx="21" cy="21" r="9" fill="none" stroke="${W}" stroke-width="4.5"/>${st("M28 28 L37 37", 5.5)}`)],
  ["database", tile(LB, `<path d="M11 10 H37 V16 H11 Z M11 21 H37 V27 H11 Z M11 32 H37 V38 H11 Z" fill="${W}"/>`)],
  ["tool", tile(LB, `<g transform="rotate(45 24 24)"><rect x="21" y="20" width="6" height="19" rx="3" fill="${W}"/><circle cx="24" cy="15" r="8" fill="${W}"/><rect x="21.5" y="5" width="5" height="9" fill="${LB}"/></g>`)],
  ["agent", tile(LB, `${st("M29 11 H32 L37 16 V32 L32 37 H16 L11 32 V16 L16 11 H20", 4.5, "butt")}<path d="M19 5 L26 11 L19 17 Z" fill="${W}"/>`)],
  ["check", tile(GN, st("M13 24 L20.5 31.5 L35 17", 5.5))],
  ["warning", tile(OR, `<path d="M24 7 L41 24 L24 41 L7 24 Z" fill="${W}"/><rect x="22" y="15" width="4" height="12" fill="${OR}"/><rect x="22" y="30" width="4" height="4" fill="${OR}"/>`)],
];

export default {
  id: "aicher",
  name: "Otl Aicher",
  after: "Otl Aicher's design system for the 1972 Munich Olympics: the pale palette, the 45° pictogram grid, Univers",
  note: "A complete visual system rather than a picture: pale fields of light blue, green and silver with an orange for the answer, dark green type, connectors that turn only at 45° and 90°, and figures built from separate segments. Friendly, orderly and international; good for an audience that should feel guided.",
  palette: [[LB, "light blue"], [GN, "green"], [SV, "silver"], [OR, "orange"], [DG, "dark green"], [W, "white"]],
  type: "Helvetica Neue Medium and Bold (standing in for Univers)",
  ground: W,
  peopleGround: LB,
  people,
  slide,
  icons,
};
