// 10 Tufte: cream paper, Palatino, hairlines, a wide margin for the chart and the note, range frames, one red.
const P = "#fffff8", K = "#111111", G = "#7a7a72", L = "#b9b8ad", RD = "#a00000";
const SERIF = `Palatino, 'Palatino Linotype', 'Book Antiqua', 'Hoefler Text', Georgia, serif`;
const F = `font-family="${SERIF}"`;
const f1 = (n) => n.toFixed(1);

const TXT = 20, LAB = 16;

// ---------- people: a hairline circle and shoulder line each; her one cue is a small circle ----------
const person = (cx, base, s, bun) => `<circle cx="${cx}" cy="${base - 104 * s}" r="${34 * s}"/>
  ${bun ? `<circle cx="${cx}" cy="${base - 152 * s}" r="${11 * s}"/>` : ""}
  <path d="M${cx - 66 * s} ${base} C${cx - 64 * s} ${base - 44 * s} ${cx - 40 * s} ${base - 58 * s} ${cx} ${base - 58 * s} C${cx + 40 * s} ${base - 58 * s} ${cx + 64 * s} ${base - 44 * s} ${cx + 66 * s} ${base}"/>`;
const people = () => `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="400" fill="${P}"/>
  <g fill="none" stroke="${K}" stroke-width="1.2">${person(124, 300, 1, false)}${person(276, 300, 1, true)}</g>
  <path d="M40 300 H360" stroke="${K}" stroke-width=".6"/>
</svg>`;

// ---------- slide ----------
const slide = () => {
  const rows = [["Model alone", 1], ["+ chart pasted", 2], ["+ tools", 4], ["+ checks", 5]];
  const dx0 = 1016, du = 40, dy0 = 112, dh = 26;
  const X = [64, 352, 720, 1008], w = 208, y = 392, h = 104;
  const box = (x) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${K}" stroke-width=".8"/>`;
  const txt = (x, rows2) => rows2.map(([t, big, col], i) => `<text x="${x + 18}" y="${y + 36 + i * 22 + (i ? 6 : 0)}" font-size="${big ? TXT : LAB}" ${big ? "" : `font-style="italic"`} fill="${col || (big ? K : G)}">${t}</text>`).join("");
  return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" ${F}>
  <defs><marker id="tufte-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 1.5 L9 5 L0 8.5" fill="none" stroke="${K}" stroke-width="1.1"/></marker></defs>
  <rect width="1280" height="720" fill="${P}"/>

  <text x="64" y="80" font-size="${LAB - 1}" letter-spacing="3" fill="${G}">PART 4 · AGENTS</text>
  <text x="62" y="148" font-size="52" fill="${K}">An agent is a model in a loop</text>

  <!-- margin: the chart as a dot plot with a range frame -->
  <text x="864" y="80" font-size="${LAB}" font-style="italic" fill="${K}">Questions right, of 5</text>
  ${rows.map(([t, v], i) => { const yy = dy0 + i * dh; return `<text x="${dx0 - 16}" y="${yy + 5}" text-anchor="end" font-size="${LAB}" fill="${K}">${t}</text>
    <path d="M${dx0} ${yy} H${dx0 + 5 * du}" stroke="${L}" stroke-width=".6" stroke-dasharray="1 3"/>
    <circle cx="${dx0 + v * du}" cy="${yy}" r="3.6" fill="${K}"/>`; }).join("")}
  <path d="M${dx0 + du} ${dy0 + 4 * dh - 8} H${dx0 + 5 * du}" stroke="${K}" stroke-width=".7"/>
  ${[1, 2, 4, 5].map((v) => `<path d="M${dx0 + v * du} ${dy0 + 4 * dh - 8} v4" stroke="${K}" stroke-width=".7"/><text x="${dx0 + v * du}" y="${dy0 + 4 * dh + 12}" text-anchor="middle" font-size="${LAB - 1}" fill="${K}">${v}</text>`).join("")}

  <!-- the figure: hairline boxes, words inside, one arrow -->
  ${box(X[0])}${txt(X[0], [["Rosa’s chart", 1], ["612 notes"]])}
  ${box(X[1])}${txt(X[1], [["Model", 1], ["reads, decides"], ["the next step"]])}
  ${box(X[2])}${txt(X[2], [["Tools", 1], ["search · read a note"], ["· labs"]])}
  ${box(X[3])}${txt(X[3], [["Answer", 1], ["EF 30% · metoprolol", 0, K], ["tartrate <tspan fill='" + RD + "'>→ a gap</tspan>", 0, K]])}
  <text x="${X[3] + 134}" y="${y + 80}" font-size="11" fill="${K}">1</text>
  <path d="M${X[0] + w + 8} ${y + h / 2} H${X[1] - 8}" stroke="${K}" stroke-width=".8" marker-end="url(#tufte-ah)"/>
  <path d="M${X[2] + w + 8} ${y + h / 2} H${X[3] - 8}" stroke="${K}" stroke-width=".8" marker-end="url(#tufte-ah)"/>
  <path d="M${X[1] + w - 24} ${y - 6} C${X[1] + w + 24} ${y - 56} ${X[2] - 24} ${y - 56} ${X[2] + 24} ${y - 6}" fill="none" stroke="${K}" stroke-width=".8" marker-end="url(#tufte-ah)"/>
  <path d="M${X[2] + 24} ${y + h + 6} C${X[2] - 24} ${y + h + 56} ${X[1] + w + 24} ${y + h + 56} ${X[1] + w - 24} ${y + h + 6}" fill="none" stroke="${K}" stroke-width=".8" marker-end="url(#tufte-ah)"/>
  <text x="640" y="${y - 52}" text-anchor="middle" font-size="${LAB}" font-style="italic" fill="${K}">think → act</text>
  <text x="640" y="${y + h + 64}" text-anchor="middle" font-size="${LAB}" font-style="italic" fill="${K}">observe</text>

  <!-- sidenote, under the answer -->
  <text x="${X[3]}" y="${y + h + 40}" font-size="${LAB}" fill="${K}"><tspan font-size="11" dy="-5">1</tspan><tspan dy="5"> “LVEF 30%”</tspan> <tspan font-style="italic" fill="${G}">Echo, 10/02</tspan></text>

  <path d="M64 656 H1216" stroke="${K}" stroke-width=".4"/>
  <text x="64" y="684" font-size="${LAB - 2}" letter-spacing="2.6" fill="${G}">QCOR 2026 · BUILD AN AGENT, LIVE</text>
  <text x="1216" y="685" text-anchor="end" font-size="${LAB}" fill="${K}">14</text>
</svg>`;
};

// ---------- icons: one hairline weight, no fills ----------
const ic = (b) => `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="${K}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${b}</svg>`;
const icons = [
  ["patient", ic(person(24, 44, 0.27, false))],
  ["heart", ic(`<path d="M24 41 C12 32 5 25 5 16.5 A9.5 9.5 0 0 1 24 12 A9.5 9.5 0 0 1 43 16.5 C43 25 36 32 24 41 Z"/>`)],
  ["pill", ic(`<g transform="rotate(-40 24 24)"><rect x="6" y="15" width="36" height="18" rx="9"/><path d="M24 15 V33"/></g>`)],
  ["note", ic(`<path d="M10 5 H31 L38 12 V43 H10 Z"/><path d="M31 5 V12 H38"/><path d="M16 21 H32 M16 28 H32 M16 35 H26"/>`)],
  ["search", ic(`<circle cx="20" cy="20" r="13"/><path d="M29.5 29.5 L42 42"/>`)],
  ["database", ic(`<ellipse cx="24" cy="10" rx="14" ry="4.5"/><path d="M10 10 V38 C10 40.5 16 42.5 24 42.5 C32 42.5 38 40.5 38 38 V10"/><path d="M10 19.5 C10 22 16 24 24 24 C32 24 38 22 38 19.5 M10 29 C10 31.5 16 33.5 24 33.5 C32 33.5 38 31.5 38 29"/>`)],
  ["tool", ic(`<path d="M28.5 7.5 A10 10 0 0 0 20.6 22.4 L7 36 A3.6 3.6 0 0 0 12 41 L25.6 27.4 A10 10 0 0 0 40.5 19.5 L34 21 L30 18 L27 14 Z"/>`)],
  ["agent", ic(`<path d="M38.5 20 A15 15 0 1 1 33 11.5"/><path d="M27 9 L34 11 L32 18"/>`)],
  ["check", ic(`<path d="M10 25 L20 35 L39 13"/>`)],
  ["warning", ic(`<path d="M24 6 L43 40 H5 Z"/><path d="M24 18 V29"/><circle cx="24" cy="34.5" r=".6"/>`)],
];

export default {
  id: "tufte",
  name: "Tufte",
  after: "Edward Tufte's books (The Visual Display of Quantitative Information, Beautiful Evidence) and the tufte-css handout",
  note: "Text first, with the evidence beside it: the chart lives in the margin as a dot plot on a range frame, the figure is hairlines and words, and the quote is a numbered sidenote. Calm and credible; the one red mark goes to the gap.",
  palette: [[P, "paper"], [K, "ink"], [G, "grey"], [L, "hairline"], [RD, "red"]],
  type: "Palatino roman and italic throughout",
  ground: P,
  people,
  slide,
  icons,
};
