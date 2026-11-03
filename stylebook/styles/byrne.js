// 08 Byrne's Euclid: the 1847 coloured Euclid. Red, yellow, blue and black on cream; Caslon; small coloured
// shapes in the text stand for the parts of the figure.
const R = "#cf3a24", Y = "#edb21f", B = "#1c5aa0", K = "#1b1a17", C = "#f3e8cf";
const SERIF = `'Hoefler Text', 'Big Caslon', Baskerville, Georgia, serif`;
const CAP = `'Big Caslon', 'Hoefler Text', Baskerville, serif`;
const F = `font-family="${SERIF}"`;
const TXT = 18, LAB = 14, LW = 4.5; // one text size, one label size, one line weight

// ---------- people: Prop. I.1 twice: an equilateral triangle on a line, a circle touching its vertex ----------
const people = () => {
  const base = 330, s = 150, h = s * Math.sin(Math.PI / 3), r = 34;
  const fig = (cx, col, bun) => `<path d="M${cx - s / 2} ${base} L${cx + s / 2} ${base} L${cx} ${base - h} Z" fill="${col}"/>
    <circle cx="${cx}" cy="${base - h - r}" r="${r}" fill="${Y}"/>
    ${bun ? `<circle cx="${cx}" cy="${base - h - 2 * r - 13}" r="13" fill="${K}"/>` : ""}`;
  return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="400" fill="${C}"/>
  <path d="M${200 - 2 * s / 2 - 8} ${base - h} H${200 + s + 8}" stroke="${K}" stroke-width="1" stroke-dasharray="1.5 4"/>
  ${fig(200 - s / 2 - 6, B, false)}${fig(200 + s / 2 + 6, R, true)}
  <path d="M24 ${base} H376" stroke="${K}" stroke-width="${LW}"/>
</svg>`;
};

// ---------- inline symbols for the text ----------
const sym = (body, w = 1) => `<svg class="s-byrne-i" viewBox="0 0 ${12 * w} 12" style="width:${0.8 * w}em">${body}</svg>`;
const sSq = sym(`<rect x="1" y="1" width="10" height="10" fill="${B}"/>`);
const sCi = sym(`<circle cx="6" cy="6" r="5.4" fill="${R}"/>`);
const sTr = sym(`<path d="M6 1 L11.6 11 H.4 Z" fill="${Y}"/>`);
const sUp = sym(`<path d="M2 10 A8 8 0 0 1 22 10" fill="none" stroke="${R}" stroke-width="2.4"/>`, 2);
const sDn = sym(`<path d="M2 2 A8 8 0 0 0 22 2" fill="none" stroke="${B}" stroke-width="2.4"/>`, 2);
const sPa = sym(`<path d="M6 1.5 H23 L18 10.5 H1 Z" fill="${K}"/>`, 2);

// ---------- slide ----------
const slide = () => {
  const cy = 456, n = 80;                         // one row; peer nodes 80 across, labels below
  const CH = 112, MO = 400, TO = 784, AX = 960;   // centres (answer: left edge)
  const th = n * Math.sin(Math.PI / 3);
  const tri = [[TO, cy - th / 2 - 4], [TO - n / 2, cy + th / 2 - 4], [TO + n / 2, cy + th / 2 - 4]];
  const lab = (x, y, rows, anchor = "middle") => rows.map(([t, it], i) => `<text x="${x}" y="${y + i * 24}" text-anchor="${anchor}" font-size="${TXT}" ${it ? `font-style="italic"` : ""} fill="${K}">${t}</text>`).join("");
  const bars = [[1, K, "Model alone"], [2, B, "+ chart pasted"], [4, Y, "+ tools"], [5, R, "+ checks"]];
  const bx = 768, by = 296, bu = 22, ly = cy + n / 2 + 40;
  return `<div class="s-byrne-slide">
  <svg class="s-byrne-fig" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" ${F}>
    <defs>
      <marker id="byrne-ahr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="${R}"/></marker>
      <marker id="byrne-ahb" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="${B}"/></marker>
      <marker id="byrne-ahk" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="${K}"/></marker>
    </defs>
    <!-- Fig. 1: the loop -->
    <path d="M${MO} ${cy} H${TO}" stroke="${K}" stroke-width="1" stroke-dasharray="1.5 4"/>
    <path d="M${MO + 36} ${cy - 22} C${MO + 110} ${cy - 92} ${TO - 110} ${cy - 92} ${TO - 30} ${cy - 22}" fill="none" stroke="${R}" stroke-width="${LW}" marker-end="url(#byrne-ahr)"/>
    <path d="M${TO - 34} ${cy + 30} C${TO - 110} ${cy + 88} ${MO + 110} ${cy + 88} ${MO + 38} ${cy + 22}" fill="none" stroke="${B}" stroke-width="${LW}" marker-end="url(#byrne-ahb)"/>
    <path d="M${CH + n / 2 + 12} ${cy} H${MO - n / 2 - 16}" stroke="${K}" stroke-width="${LW}" marker-end="url(#byrne-ahk)"/>
    <path d="M${TO + n / 2 + 12} ${cy} H${AX - 16}" stroke="${K}" stroke-width="${LW}" marker-end="url(#byrne-ahk)"/>
    <rect x="${CH - n / 2}" y="${cy - n / 2}" width="${n}" height="${n}" fill="${B}"/>
    <circle cx="${MO}" cy="${cy}" r="${n / 2}" fill="${R}"/>
    <path d="M${tri.join(" L")} Z" fill="${Y}"/>
    <path d="M${AX + 20} ${cy - n / 2} H${AX + 152} L${AX + 132} ${cy + n / 2} H${AX} Z" fill="${K}"/>
    <text x="${(MO + TO) / 2}" y="${cy - 84}" text-anchor="middle" font-size="${LAB}" letter-spacing="2.4" fill="${R}">THINK → ACT</text>
    <text x="${(MO + TO) / 2}" y="${cy + 116}" text-anchor="middle" font-size="${LAB}" letter-spacing="2.4" fill="${B}">← OBSERVE</text>
    ${lab(CH, ly, [["Rosa’s chart", 1], ["612 notes"]])}
    ${lab(MO, ly, [["Model", 1], ["reads, decides"], ["the next step"]])}
    ${lab(TO, ly, [["Tools", 1], ["search · read a note"], ["· labs"]])}
    ${lab(AX, ly, [["Answer", 1], ["EF 30% · metoprolol tartrate"], ["→ a gap"], ["“LVEF 30%” · Echo, 10/02"]], "start")}

    <!-- Fig. 2: questions right, of 5 -->
    <text x="${bx}" y="128" font-size="${LAB}" letter-spacing="2.4" fill="${K}">QUESTIONS RIGHT, OF 5</text>
    <path d="M${bx} ${by} H1216" stroke="${K}" stroke-width="1.5"/>
    ${bars.map(([v, c, t], i) => `<rect x="${bx + i * 120}" y="${by - v * bu}" width="40" height="${v * bu}" fill="${c}"/>
      <text x="${bx + i * 120 + 52}" y="${by - v * bu + 14}" font-size="${TXT}" fill="${K}">${v}</text>
      <text x="${bx + i * 120}" y="${by + 22}" font-size="${LAB}" font-style="italic" fill="${K}">${t}</text>`).join("")}
  </svg>

  <div class="s-byrne-run">PART 4 · AGENTS</div>
  <div class="s-byrne-col">
    <div class="s-byrne-prop">PROP. XIV. <span>THEOR.</span></div>
    <div class="s-byrne-title">An agent is a model in a loop.</div>
    <p class="s-byrne-p"><span class="s-byrne-drop">L</span>ET ${sSq} be Rosa’s chart, and ${sCi} the model;<br>
      join ${sCi} to ${sTr} the tools by ${sUp} and ${sDn}:<br>
      think → act → observe, until ${sPa} the answer.</p>
  </div>
  <div class="s-byrne-foot"><span>QCOR 2026 · BUILD AN AGENT, LIVE</span><span style="letter-spacing:0">14</span></div>
</div>`;
};

const css = `
.s-byrne .s-byrne-slide { position: relative; width: 1280px; height: 720px; background: ${C}; color: ${K}; font-family: ${SERIF}; overflow: hidden; }
.s-byrne .s-byrne-fig { position: absolute; inset: 0; width: 1280px; height: 720px; }
.s-byrne .s-byrne-run { position: absolute; left: 64px; right: 64px; top: 40px; text-align: center; font: ${LAB}px/1 ${SERIF}; letter-spacing: .32em; padding-bottom: 12px; border-bottom: 1px solid ${K}; }
.s-byrne .s-byrne-col { position: absolute; left: 64px; top: 104px; width: 620px; }
.s-byrne .s-byrne-prop { font: ${TXT + 4}px/1 ${CAP}; letter-spacing: .14em; margin-bottom: 16px; }
.s-byrne .s-byrne-prop span { font-size: ${LAB + 2}px; }
.s-byrne .s-byrne-title { font: italic 44px/1.1 ${SERIF}; margin: 0 0 28px; }
.s-byrne .s-byrne-p { margin: 0; font-size: 22px; line-height: 40px; }
.s-byrne .s-byrne-drop { float: left; width: 72px; height: 72px; margin: 4px 12px 0 0; border: 1.5px solid ${K}; box-shadow: inset 0 0 0 4px ${C}, inset 0 0 0 5px ${K};
  font: 60px/72px ${CAP}; text-align: center; color: ${R}; }
.s-byrne .s-byrne-i { display: inline-block; height: .8em; vertical-align: -.04em; margin: 0 .12em; }
.s-byrne .s-byrne-foot { position: absolute; left: 64px; right: 64px; bottom: 32px; display: flex; justify-content: space-between; align-items: baseline; border-top: 1px solid ${K}; padding-top: 12px; font: ${LAB}px/1 ${SERIF}; letter-spacing: .26em; }
`;

// ---------- icons: flat colour fills and one line weight ----------
const ic = (b) => `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" stroke-linecap="butt">${b}</svg>`;
const icons = [
  ["patient", ic(`<path d="M8 44 L24 23 L40 44 Z" fill="${R}"/><circle cx="24" cy="14" r="9" fill="${Y}"/>`)],
  ["heart", ic(`<circle cx="16" cy="18" r="10" fill="${R}"/><circle cx="32" cy="18" r="10" fill="${R}"/><path d="M7.3 23 L24 43 L40.7 23 Z" fill="${R}"/>`)],
  ["pill", ic(`<g transform="rotate(-40 24 24)"><path d="M24 15 H15 A9 9 0 0 0 15 33 H24 Z" fill="${R}"/><path d="M24 15 H33 A9 9 0 0 1 33 33 H24 Z" fill="${B}"/></g>`)],
  ["note", ic(`<path d="M10 4 H32 L39 11 V44 H10 Z" fill="${Y}"/><path d="M15 19 H34" stroke="${R}" stroke-width="${LW}"/><path d="M15 27 H34" stroke="${B}" stroke-width="${LW}"/><path d="M15 35 H27" stroke="${K}" stroke-width="${LW}"/>`)],
  ["search", ic(`<circle cx="20" cy="20" r="12" fill="${Y}"/><circle cx="20" cy="20" r="12" fill="none" stroke="${B}" stroke-width="${LW}"/><path d="M29 29 L43 43" stroke="${K}" stroke-width="${LW}"/>`)],
  ["database", ic(`<rect x="8" y="6" width="32" height="10" fill="${R}"/><rect x="8" y="19" width="32" height="10" fill="${Y}"/><rect x="8" y="32" width="32" height="10" fill="${B}"/>`)],
  ["tool", ic(`<path d="M24 10 L12 44 M24 10 L36 44" stroke="${K}" stroke-width="${LW}"/><path d="M16 32 H32" stroke="${R}" stroke-width="${LW}"/><circle cx="24" cy="8" r="5" fill="${Y}"/>`)],
  ["agent", ic(`<path d="M24 6 A18 18 0 0 1 24 42" fill="none" stroke="${R}" stroke-width="${LW}"/><path d="M24 42 A18 18 0 0 1 24 6" fill="none" stroke="${B}" stroke-width="${LW}"/>
    <path d="M18 37.5 L26 42 L19 47 Z" fill="${R}"/><path d="M30 10.5 L22 6 L29 1 Z" fill="${B}"/><circle cx="24" cy="24" r="6" fill="${Y}"/>`)],
  ["check", ic(`<path d="M8 25 L19 36" stroke="${R}" stroke-width="${LW + 1}"/><path d="M17.5 37.5 L41 11" stroke="${B}" stroke-width="${LW + 1}"/>`)],
  ["warning", ic(`<path d="M24 4 L45 41 H3 Z" fill="${Y}"/><path d="M24 16 V30" stroke="${K}" stroke-width="${LW}"/><circle cx="24" cy="35.5" r="2.8" fill="${R}"/>`)],
];

export default {
  id: "byrne",
  name: "Byrne's Euclid",
  after: "Oliver Byrne, The First Six Books of the Elements of Euclid in which Coloured Diagrams and Symbols Are Used (Pickering, 1847)",
  note: "Byrne replaced letters with colours: the text says ‘the red circle’ by drawing a small red circle. The slide is a short proposition whose words point at the parts of the figure, so the sentence and the diagram are read together.",
  palette: [[R, "vermilion"], [Y, "chrome yellow"], [B, "ultramarine"], [K, "ink"], [C, "cream"]],
  type: "Hoefler Text roman and italic for text, Big Caslon for capitals and the drop cap",
  ground: C,
  css,
  people,
  slide,
  icons,
};
