// Albers: Homage to the Square. Nested squares, inner ones sinking towards the base (side 1, base ½, top 1½),
// flat fields in close colour relations; Model and Tools hold the same three colours in opposite order.
const GR = "#e9e4d9";                         // ground: warm paper grey
const ST = ["#cdc6b8", "#b8b1a2", "#a29b8c"]; // stone greys, darkening inward (the chart: raw material)
const OC = "#f1d07b", AM = "#e5a73d", OR = "#d47a2c", VE = "#b2442b", DV = "#8d3423";
const INK = "#3a2f27", SUB = "#7a6c5f", EMPTY = "#dcd5c7";
const F = `font-family="Futura, 'Futura Medium', 'Avenir Next', sans-serif"`;

// Homage proportions: each step in by d at the sides, ½d at the base and 1½d at the top (d = s/10)
const homage = (x, y, s, cols) => cols.map((c, i) => {
  const d = (s / 10) * i, w = s - 2 * d;
  return `<rect x="${(x + d).toFixed(1)}" y="${(y + 1.5 * d).toFixed(1)}" width="${w.toFixed(1)}" height="${w.toFixed(1)}" fill="${c}"/>`;
}).join("");

// ---------- people: two nested-square figures; hers is a head set in a field, sunk low like a Homage ----------
const people = `<svg viewBox="0 20 400 440" xmlns="http://www.w3.org/2000/svg">
  <rect y="20" width="400" height="440" fill="${GR}"/>
  <rect x="88" y="136" width="64" height="64" fill="${VE}"/>
  ${homage(48, 224, 144, [OR, AM])}
  <rect x="232" y="112" width="96" height="96" fill="${DV}"/>
  <rect x="248" y="136" width="64" height="64" fill="${VE}"/>
  ${homage(208, 224, 144, [AM, OR])}
</svg>`;

// ---------- slide ----------
const slide = () => {
  const T = (x, y, s, size, fill = INK, extra = "") => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" ${extra}>${s}</text>`;
  const S = 176, Y = 320, NX = [64, 352, 752, 1040];
  const ah = (x, y, dir) => `<path d="M${x} ${y} l${-12 * dir} -6 v12 Z" fill="${INK}"/>`; // tip at (x, y)
  const bar = (x1, x2, y) => { const dir = x2 > x1 ? 1 : -1; return `<rect x="${Math.min(x1, x2 - 12 * dir)}" y="${y - 1.5}" width="${Math.abs(x2 - x1) - 12}" height="3" fill="${INK}"/>${ah(x2, y, dir)}`; };

  // chart: rows of five squares, the answered ones filled
  const rows = [["Model alone", 1], ["+ chart pasted", 2], ["+ tools", 4], ["+ checks", 5]];
  const chart = rows.map(([t, v], r) => {
    const y = 120 + r * 40;
    return T(832, y + 22, t, 16) + [0, 1, 2, 3, 4].map((i) => `<rect x="${976 + i * 40}" y="${y}" width="32" height="32" fill="${i < v ? OR : EMPTY}"/>`).join("")
      + T(1216, y + 23, v, 18, INK, 'text-anchor="end"');
  }).join("");

  const lab = (x, name, lines) => T(x, Y + S + 40, name, 20) + lines.map((l, i) => T(x, Y + S + 66 + i * 22, l, 16, SUB)).join("");
  const cy = Y + 96; // optical centre of the squares (the inner squares sit low)
  return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" ${F}>
  <rect width="1280" height="720" fill="${GR}"/>
  ${T(64, 88, "Part 4 · Agents", 16, OR, 'letter-spacing="0.6"')}
  <g font-size="56" fill="${INK}" letter-spacing="-0.6">
    <text x="61" y="160">An agent is</text>
    <text x="61" y="228">a model in a loop</text>
  </g>

  ${T(832, 88, "Questions right, of 5", 16, OR, 'letter-spacing="0.6"')}
  ${chart}

  ${homage(NX[0], Y, S, ST)}
  ${homage(NX[1], Y, S, [OR, AM, OC])}
  ${homage(NX[2], Y, S, [OC, AM, OR])}
  ${homage(NX[3], Y, S, [AM, OR, VE])}

  ${bar(NX[0] + S + 16, NX[1] - 16, cy)}
  ${bar(NX[1] + S + 16, NX[2] - 16, cy - 32)}
  ${bar(NX[2] - 16, NX[1] + S + 16, cy + 32)}
  ${bar(NX[2] + S + 16, NX[3] - 16, cy)}
  ${T(640, cy - 48, "Think → Act", 16, INK, 'text-anchor="middle"')}
  ${T(640, cy + 60, "Observe", 16, INK, 'text-anchor="middle"')}

  ${lab(NX[0], "Rosa’s chart", ["612 notes"])}
  ${lab(NX[1], "Model", ["reads, decides", "the next step"])}
  ${lab(NX[2], "Tools", ["search", "read a note", "labs"])}
  ${T(NX[3], Y + S + 40, "Answer", 20)}
  ${T(NX[3], Y + S + 66, "EF 30% · metoprolol", 16, SUB)}
  ${T(NX[3], Y + S + 88, `tartrate <tspan fill="${VE}">→ a gap</tspan>`, 16, SUB)}
  ${T(NX[3], Y + S + 116, "“LVEF 30%”", 16, INK)}
  ${T(NX[3] + 96, Y + S + 116, "Echo, 10/02", 13, SUB)}

  ${T(64, 680, "QCOR 2026 · Build an agent, live", 13, SUB, 'letter-spacing="0.4"')}
  ${T(1216, 680, "14", 13, INK, 'text-anchor="end"')}
</svg>`;
};

// ---------- icons: flat fields on a 48 grid; an outer field and a nested inner field, set low ----------
const ic = (b) => `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">${b}</svg>`;
const heart = (cx, by, a, fill) => {          // a 45° square with semicircles on its two upper sides
  const h = a / Math.SQRT2, r = a / 2, f = (v) => v.toFixed(2);
  return `<path d="M${cx} ${by} L${f(cx - h)} ${f(by - h)} A${r} ${r} 0 0 1 ${cx} ${f(by - 2 * h)} A${r} ${r} 0 0 1 ${f(cx + h)} ${f(by - h)} Z" fill="${fill}"/>`;
};
const icons = [
  ["patient", ic(`<rect x="17.5" y="4" width="13" height="13" fill="${OR}"/>${homage(11, 20, 26, [OR, OC])}`)],
  ["heart", ic(heart(24, 41, 22, VE) + heart(24, 39, 13, OC))],
  ["pill", ic(`<g transform="rotate(-45 24 24)"><path d="M24 14 H15 A10 10 0 0 0 15 34 H24 Z" fill="${OR}"/><path d="M24 14 H33 A10 10 0 0 1 33 34 H24 Z" fill="${VE}"/></g>`)],
  ["note", ic(`<rect x="9" y="5" width="30" height="38" fill="${OR}"/><rect x="14" y="13" width="20" height="4" fill="${OC}"/><rect x="14" y="21" width="20" height="4" fill="${OC}"/><rect x="14" y="29" width="12" height="4" fill="${OC}"/>`)],
  ["search", ic(`${homage(5, 5, 28, [OR, OC])}<path d="M27 31 L31 27 L43 39 L39 43 Z" fill="${OR}"/>`)],
  ["database", ic(`<rect x="8" y="6" width="32" height="10" fill="${OC}"/><rect x="8" y="19" width="32" height="10" fill="${AM}"/><rect x="8" y="32" width="32" height="10" fill="${OR}"/>`)],
  ["tool", ic(`<g transform="rotate(45 24 24)"><rect x="20" y="16" width="8" height="28" fill="${OR}"/><circle cx="24" cy="12" r="11" fill="${OR}"/><rect x="20.5" y="0" width="7" height="11" fill="${GR}"/></g>`)],
  ["agent", ic(`<path d="M33 9 H39 V39 H9 V9 H18" fill="none" stroke="${OR}" stroke-width="6"/><path d="M17 1 L28 9 L17 17 Z" fill="${OR}"/>${homage(16, 16, 16, [OC])}`)],
  ["check", ic(`<path d="M7 25 L19 37 L41 13" fill="none" stroke="${OR}" stroke-width="7" stroke-linejoin="miter"/>`)],
  ["warning", ic(`<path d="M24 5 L44 41 H4 Z" fill="${VE}"/><rect x="21.5" y="18" width="5" height="12" fill="${OC}"/><rect x="21.5" y="33" width="5" height="5" fill="${OC}"/>`)],
];

export default {
  id: "albers",
  name: "Albers",
  after: "Josef Albers, Homage to the Square (1950–76) and Interaction of Color (1963)",
  note: "Flat nested squares, the inner ones sunk towards the base, in close colour relations; almost no lines. Model and Tools are drawn in the same three colours in opposite order, so the loop is a colour exchange as much as two arrows. Quiet, warm and exact; it makes the talk feel considered.",
  palette: [[GR, "ground"], [OC, "ochre light"], [AM, "amber"], [OR, "orange"], [VE, "vermilion"], [ST[1], "stone"]],
  type: "Futura Medium throughout, sentence case",
  ground: GR,
  people,
  slide,
  icons,
};
