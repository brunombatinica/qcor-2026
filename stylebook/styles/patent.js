// Patent drawing: a US utility-patent drawing sheet. Black ink on white, line hatching and surface shading,
// reference numerals on curved leaders, FIG. labels, Times.
const K = "#141414", P = "#fdfcf7", G = "#6f6c66";
const TM = `font-family="'Times New Roman', Times, serif"`;

// curved leader from a numeral to a part: a gentle S, as drawn with a French curve
const lead = (x1, y1, x2, y2) => `<path d="M${x1} ${y1} C${x1 - 2} ${y1 + 10} ${x2 + 10} ${y2 - 12} ${x2} ${y2}" fill="none" stroke="${K}" stroke-width="1.1"/>`;
const num = (x, y, t) => `<text x="${x}" y="${y}" ${TM} font-size="18" fill="${K}">${t}</text>`;
const fig = (x, y, t, size = 30) => `<text x="${x}" y="${y}" text-anchor="middle" ${TM} font-size="${size}" font-style="italic" font-weight="700" letter-spacing="1" fill="${K}">${t}</text>`;

// ---- people: FIG. 3, two figures in line with surface shading ----
function people() {
  const fig1 = (cx, bun) => `
    ${bun ? `<circle cx="${cx}" cy="120" r="15" fill="${P}" stroke="${K}" stroke-width="1.8"/>` : ""}
    <circle cx="${cx}" cy="172" r="40" fill="${P}" stroke="${K}" stroke-width="1.8"/>
    <path d="M${cx - 68} 308 C${cx - 68} 256 ${cx - 38} 232 ${cx} 232 C${cx + 38} 232 ${cx + 68} 256 ${cx + 68} 308" fill="none" stroke="${K}" stroke-width="1.8"/>
    <path d="M${cx + 26} 150 Q${cx + 33} 170 ${cx + 26} 194 M${cx + 18} 146 Q${cx + 25} 172 ${cx + 18} 200 M${cx + 50} 252 Q${cx + 62} 272 ${cx + 62} 306 M${cx + 42} 248 Q${cx + 53} 270 ${cx + 53} 306" fill="none" stroke="${K}" stroke-width=".8"/>`;
  return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  ${fig1(116, false)}${fig1(284, true)}
  ${fig(200, 360, "FIG. 3", 24)}
</svg>`;
}

// ---- slide: FIG. 1, the flowchart; FIG. 2, the chart ----
function slide() {
  const p = "patent-s";
  const ny = 264, nh = 144, nw = 208;
  const nodes = [
    [64, "102", "ROSA'S CHART", ["612 NOTES"]],
    [368, "104", "MODEL", ["READS, DECIDES", "THE NEXT STEP"]],
    [704, "106", "TOOLS", ["SEARCH", "READ A NOTE", "LABS"]],
    [1008, "108", "ANSWER", ["EF 30%", "METOPROLOL TARTRATE", "→ A GAP"]],
  ];
  const base = 640, u = 20;
  const bars = [[1, "MODEL ALONE"], [2, "+ CHART PASTED"], [4, "+ TOOLS"], [5, "+ CHECKS"]];
  return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" ${TM}>
  <defs>
    <pattern id="${p}-d" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" stroke="${K}" stroke-width="1"/></pattern>
    <marker id="${p}-a" viewBox="0 0 12 8" refX="11" refY="4" markerWidth="12" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0 L12 4 L0 8 Z" fill="${K}"/></marker>
  </defs>
  <rect width="1280" height="720" fill="${P}"/>
  <g font-size="18" fill="${K}"><text x="64" y="44">U.S. Patent</text><text x="560" y="44">Oct. 18, 2026</text><text x="1216" y="44" text-anchor="end">Sheet 1 of 3</text></g>
  <text x="64" y="96" font-size="15" letter-spacing="4" fill="${K}">PART 4 · AGENTS</text>
  <text x="62" y="148" font-size="50" fill="${K}">An agent is a model in a loop</text>

  <!-- FIG. 1 -->
  ${nodes.map(([x, n, name, lines]) => `<rect x="${x}" y="${ny}" width="${nw}" height="${nh}" fill="${P}" stroke="${K}" stroke-width="1.7"/>
    <text x="${x + nw / 2}" y="${ny + 38}" text-anchor="middle" font-size="19" fill="${K}">${name}</text>
    ${lines.map((t, i) => `<text x="${x + nw / 2}" y="${ny + 66 + i * 22}" text-anchor="middle" font-size="14" letter-spacing=".6" fill="${K}">${t}</text>`).join("")}
    ${num(x + nw / 2 + 14, ny - 18, n)}${lead(x + nw / 2 + 18, ny - 14, x + nw / 2 + 4, ny + 1)}`).join("")}
  <g fill="none" stroke="${K}" stroke-width="1.6">
    <path d="M272 336 H364" marker-end="url(#${p}-a)"/>
    <path d="M912 336 H1004" marker-end="url(#${p}-a)"/>
    <path d="M544 ${ny} V216 H736 V${ny - 4}" marker-end="url(#${p}-a)"/>
    <path d="M736 ${ny + nh} V456 H544 V${ny + nh + 4}" marker-end="url(#${p}-a)"/>
  </g>
  <text x="640" y="206" text-anchor="middle" font-size="14" letter-spacing="2.5" fill="${K}">THINK → ACT → OBSERVE</text>
  ${num(624, 488, "110")}${lead(628, 472, 644, 457)}
  <text x="1112" y="436" text-anchor="middle" font-size="15" font-style="italic" fill="${K}">“LVEF 30%” (Echo, 10/02)</text>
  ${fig(1112, 486, "FIG. 1")}

  <!-- FIG. 2 -->
  <text x="64" y="512" font-size="14" letter-spacing="2" fill="${K}">QUESTIONS RIGHT, OF 5</text>
  ${[1, 2, 3, 4, 5].map((v) => `<line x1="58" y1="${base - v * u}" x2="64" y2="${base - v * u}" stroke="${K}" stroke-width="1.1"/><text x="52" y="${base - v * u + 4}" text-anchor="end" font-size="12" fill="${K}">${v}</text>`).join("")}
  <line x1="64" y1="${base - 5 * u - 8}" x2="64" y2="${base}" stroke="${K}" stroke-width="1.5"/>
  ${bars.map(([v, lab], i) => {
    const x = 88 + i * 112, top = base - v * u;
    return `<rect x="${x}" y="${top}" width="48" height="${v * u}" fill="url(#${p}-d)" stroke="${K}" stroke-width="1.5"/>
      <text x="${x + 24}" y="${top - 8}" text-anchor="middle" font-size="17" font-weight="700" fill="${K}">${v}</text>
      <text x="${x + 24}" y="${base + 18}" text-anchor="middle" font-size="11.5" letter-spacing=".3" fill="${K}">${lab}</text>`;
  }).join("")}
  <line x1="64" y1="${base}" x2="512" y2="${base}" stroke="${K}" stroke-width="1.5"/>
  ${fig(616, 640, "FIG. 2")}

  <text x="64" y="696" font-size="15" letter-spacing=".5" fill="${G}">QCOR 2026 · Build an agent, live</text>
  <text x="1216" y="696" text-anchor="end" font-size="17" fill="${K}">14</text>
</svg>`;
}

// ---- icons: small patent figures, 1.7 outline and 0.75 surface shading on the right ----
const S = `fill="none" stroke="${K}" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"`;
const h = (d) => `<path d="${d}" fill="none" stroke="${K}" stroke-width=".75"/>`;
const ic = (body) => `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><g transform="translate(2 0)">${body}</g></svg>`;
const icons = [
  ["patient", ic(`<circle cx="22" cy="15" r="8" ${S}/><path d="M7 43 C7 32 13 27 22 27 C31 27 37 32 37 43" ${S}/>
    ${h("M27 10 Q29 15 27 20 M24.5 9 Q26.5 15 24.5 21 M31 32 Q34 37 34.5 43 M28 30 Q31 36 31.5 43")}`)],
  ["heart", ic(`<path d="M22 41 C11 33 5 26.5 5 19.5 C5 14 9 10 14 10 C17.6 10 20.4 12.2 22 15.2 C23.6 12.2 26.4 10 30 10 C35 10 39 14 39 19.5 C39 26.5 33 33 22 41 Z" ${S}/>
    ${h("M31 14 Q36 18 34 25 M28 14.5 Q33 19 31 27 M25 17 Q29 21 27.5 30")}`)],
  ["pill", ic(`<g transform="rotate(-45 22 24)"><path d="M22 16 H14 A8 8 0 0 0 14 32 H22 Z" ${S}/><path d="M22 16 H30 A8 8 0 0 1 30 32 H22 Z" ${S}/>
    ${h("M23 18 L29 32 M26 16.5 L32 31.5 M29.5 16.3 L34.5 29 M22.5 23 L26 31.5")}</g>`)],
  ["note", ic(`<path d="M9 5 H28 L35 12 V43 H9 Z" ${S}/><path d="M28 5 V12 H35" ${S}/>${h("M29 6 L34 11 M29 8.5 L32.5 12")}
    <path d="M14 19 H30 M14 25 H30 M14 31 H30 M14 37 H23" fill="none" stroke="${K}" stroke-width="1.1"/>`)],
  ["search", ic(`<circle cx="19" cy="19" r="12" ${S}/>${h("M13 15 L17 11 M13 19 L21 11 M15 21 L19 17")}<path d="M27.4 27.4 L30 30 M28.6 32.6 L32.6 28.6 L41 37 L37 41 Z" ${S}/>${h("M33.5 31.5 L31.5 33.5 M36 34 L34 36")}`)],
  ["database", ic(`<ellipse cx="22" cy="11" rx="14" ry="5" ${S}/><path d="M8 11 V37 A14 5 0 0 0 36 37 V11" ${S}/>
    <path d="M8 24 A14 5 0 0 0 36 24" fill="none" stroke="${K}" stroke-width="1.2"/>${h("M31 18 V27.5 M33.5 17 V26.5 M31 31 V40.5 M33.5 30 V39.5")}`)],
  ["tool", ic(`<path d="M31.6 5.4 A9 9 0 0 0 23.4 17.2 L6.4 34.2 A3.4 3.4 0 0 0 11.8 39.6 L28.8 22.6 A9 9 0 0 0 40.6 14.4 L35.5 19.5 L30.2 18.8 L27.5 15.8 L27.2 10.5 Z" ${S}/>
    ${h("M10 37.5 L25 22.5 M12 38.5 L26.4 24")}`)],
  ["agent", ic(`<path d="M36 24 A14 14 0 1 1 30.6 12.7" ${S}/><path d="M25.5 6.5 L35.6 9.4 L30.8 17.6 Z" fill="${K}"/>${h("M32 28 Q30 34 25 36 M34 31 Q31 37 26.5 39")}`)],
  ["check", ic(`<rect x="7" y="9" width="30" height="30" ${S}/>${h("M33 13 V35 M30 13 V35")}
    <path d="M13 24 L20 31 L32 16" fill="none" stroke="${K}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`)],
  ["warning", ic(`<path d="M22 5 L41 40 H3 Z" ${S}/><path d="M22 17 V28" stroke="${K}" stroke-width="3" stroke-linecap="round"/><circle cx="22" cy="33" r="1.8" fill="${K}"/>${h("M29 22 L34 32 M27.5 25 L31.5 33")}`)],
];

export default {
  id: "patent",
  name: "Patent drawing",
  after: "US utility-patent drawing sheets (37 CFR 1.84): ink line, section hatching, reference numerals, FIG. labels",
  note: "The agent as an invention disclosed: four equal boxes with reference numerals, the loop as orthogonal flow lines, so the speaker can say \"the model, 104, calls the tools, 106\". Austere and exact; it makes an abstract system feel like a mechanism with parts.",
  palette: [[K, "ink"], [P, "drawing paper"], [G, "pencil grey"]],
  type: "Times New Roman, upright for text and numerals, bold italic for FIG. labels",
  ground: P,
  people,
  slide,
  icons,
};
