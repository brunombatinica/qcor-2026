// 01 Bauhaus: circle, square, triangle in red, yellow, blue; Futura; a black bar to hold it together.
const R = "#e2382b", Y = "#f4c20d", B = "#1f4fa3", K = "#151515", C = "#efe8d8";
const F = `font-family="Futura, 'Futura PT', 'Century Gothic', sans-serif"`;
const TXT = 20, LAB = 14;

// people: a disc and a half-disc each; the woman's one cue is a small disc (a bun)
const person = (cx, base, r, body, bun) => `
  <path d="M${cx - r} ${base} A${r} ${r} 0 0 1 ${cx + r} ${base} Z" fill="${body}"/>
  <circle cx="${cx}" cy="${base - r - 46}" r="40" fill="${K}"/>
  ${bun ? `<circle cx="${cx}" cy="${base - r - 98}" r="15" fill="${K}"/>` : ""}`;
const people = `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="400" fill="${C}"/>
  ${person(120, 344, 80, B, false)}${person(280, 344, 80, R, true)}
  <rect x="32" y="344" width="336" height="12" fill="${K}"/>
</svg>`;

// slide: four equal shapes (160), on an 8 px grid; names inside, details below, one connector weight
const S = 160, top = 352, X = [64, 344, 720, 1000];
const lines = (x, y0, arr) => arr.map(([t, w, sz], i) => `<text x="${x}" y="${y0 + i * 26}" font-size="${sz || TXT}" font-weight="${w || 500}" fill="${K}">${t}</text>`).join("");
const slide = `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" ${F}>
  <defs><marker id="bauhaus-ah" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="${K}"/></marker></defs>
  <rect width="1280" height="720" fill="${C}"/>
  <rect x="64" y="66" width="14" height="14" fill="${R}"/>
  <text x="92" y="80" font-size="${LAB}" font-weight="600" letter-spacing="4" fill="${K}">PART 4 · AGENTS</text>
  <text x="62" y="152" font-size="60" font-weight="700" letter-spacing="-1" fill="${K}">An agent is</text>
  <text x="62" y="216" font-size="60" font-weight="700" letter-spacing="-1" fill="${K}">a model in a <tspan fill="${R}">loop</tspan></text>

  <!-- questions right, of 5 -->
  <text x="864" y="80" font-size="${LAB}" font-weight="600" letter-spacing="3" fill="${K}">QUESTIONS RIGHT, OF 5</text>
  ${[1, 2, 3, 4, 5].map((v) => `<line x1="864" x2="1216" y1="${264 - v * 28}" y2="${264 - v * 28}" stroke="${K}" stroke-opacity=".12"/>`).join("")}
  ${[[1, K, "Model", "alone"], [2, B, "+ chart", "pasted"], [4, Y, "+ tools", ""], [5, R, "+ checks", ""]].map(([v, c, t, t2], i) => `
    <rect x="${864 + i * 96}" y="${264 - v * 28}" width="64" height="${v * 28}" fill="${c}"/>
    <text x="${896 + i * 96}" y="${254 - v * 28}" text-anchor="middle" font-size="${TXT}" font-weight="700" fill="${K}">${v}</text>
    <text x="${896 + i * 96}" y="288" text-anchor="middle" font-size="${LAB}" fill="${K}">${t}</text><text x="${896 + i * 96}" y="306" text-anchor="middle" font-size="${LAB}" fill="${K}">${t2}</text>`).join("")}
  <line x1="864" x2="1216" y1="264" y2="264" stroke="${K}" stroke-width="3"/>

  <!-- nodes -->
  <rect x="${X[0]}" y="${top}" width="${S}" height="${S}" fill="${B}"/>
  <circle cx="${X[1] + S / 2}" cy="${top + S / 2}" r="${S / 2}" fill="${R}"/>
  <path d="M${X[2] + S / 2} ${top} L${X[2] + S} ${top + S} L${X[2]} ${top + S} Z" fill="${Y}"/>
  <rect x="${X[3]}" y="${top}" width="${S}" height="${S}" fill="${K}"/>
  <text x="${X[0] + 20}" y="${top + 40}" font-size="${TXT}" font-weight="700" fill="#fff">Rosa’s</text><text x="${X[0] + 20}" y="${top + 66}" font-size="${TXT}" font-weight="700" fill="#fff">chart</text>
  <text x="${X[1] + S / 2}" y="${top + S / 2 + 7}" text-anchor="middle" font-size="${TXT}" font-weight="700" fill="#fff">Model</text>
  <text x="${X[2] + S / 2}" y="${top + S - 20}" text-anchor="middle" font-size="${TXT}" font-weight="700" fill="${K}">Tools</text>
  <text x="${X[3] + 20}" y="${top + 40}" font-size="${TXT}" font-weight="700" fill="${Y}">Answer</text>

  ${lines(X[0], 552, [["612 notes"]])}
  ${lines(X[1], 552, [["reads, decides"], ["the next step"]])}
  ${lines(X[2], 552, [["search · read a note"], ["· labs"]])}
  ${lines(X[3], 552, [["EF 30% · metoprolol"], ["tartrate → a gap"]])}
  <text x="${X[3]}" y="610" font-size="${LAB}" fill="${K}"><tspan fill="${R}" font-weight="700">“LVEF 30%”</tspan> · Echo, 10/02</text>

  <!-- connectors: one weight, one arrowhead -->
  <line x1="${X[0] + S + 12}" y1="${top + S / 2}" x2="${X[1] - 16}" y2="${top + S / 2}" stroke="${K}" stroke-width="6" marker-end="url(#bauhaus-ah)"/>
  <line x1="${X[2] + S + 12}" y1="${top + S / 2}" x2="${X[3] - 16}" y2="${top + S / 2}" stroke="${K}" stroke-width="6" marker-end="url(#bauhaus-ah)"/>
  <path d="M496 400 C552 328 696 328 756 392" fill="none" stroke="${K}" stroke-width="6" marker-end="url(#bauhaus-ah)"/>
  <path d="M736 472 C688 536 552 536 504 476" fill="none" stroke="${K}" stroke-width="6" marker-end="url(#bauhaus-ah)"/>
  <text x="624" y="320" text-anchor="middle" font-size="${LAB}" font-weight="600" letter-spacing="4" fill="${K}">THINK → ACT</text>
  <text x="624" y="568" text-anchor="middle" font-size="${LAB}" font-weight="600" letter-spacing="4" fill="${K}">← OBSERVE</text>

  <rect x="0" y="664" width="1280" height="56" fill="${K}"/>
  <text x="64" y="697" font-size="${LAB}" letter-spacing="3" fill="${C}">QCOR 2026 · BUILD AN AGENT, LIVE</text>
  <circle cx="1196" cy="692" r="16" fill="${R}"/>
  <text x="1196" y="698" text-anchor="middle" font-size="${LAB + 2}" font-weight="700" fill="#fff">14</text>
</svg>`;

// icons: flat fills only, primaries on cream, details cut out in cream
const ic = (body) => `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
const icons = [
  ["patient", ic(`<circle cx="24" cy="14" r="9" fill="${K}"/><path d="M8 44 A16 16 0 0 1 40 44 Z" fill="${R}"/>`)],
  ["heart", ic(`<rect x="13" y="13" width="22" height="22" transform="rotate(45 24 24)" fill="${R}"/><circle cx="16.5" cy="18" r="7.8" fill="${R}"/><circle cx="31.5" cy="18" r="7.8" fill="${R}"/>`)],
  ["pill", ic(`<g transform="rotate(-45 24 24)"><path d="M24 15 H15 A9 9 0 0 0 15 33 H24 Z" fill="${R}"/><path d="M24 15 H33 A9 9 0 0 1 33 33 H24 Z" fill="${B}"/></g>`)],
  ["note", ic(`<path d="M9 4 H31 L39 12 V44 H9 Z" fill="${B}"/><path d="M31 4 V12 H39 Z" fill="${C}"/><rect x="15" y="20" width="18" height="4" fill="${C}"/><rect x="15" y="28" width="18" height="4" fill="${C}"/><rect x="15" y="36" width="10" height="4" fill="${C}"/>`)],
  ["search", ic(`<path d="M20 5 A15 15 0 1 1 20 35 A15 15 0 1 1 20 5 Z M20 11 A9 9 0 1 0 20 29 A9 9 0 1 0 20 11 Z" fill="${K}" fill-rule="evenodd"/><circle cx="20" cy="20" r="9" fill="${Y}"/><path d="M29 33 L33 29 L44 40 L40 44 Z" fill="${K}"/>`)],
  ["database", ic(`<rect x="8" y="5" width="32" height="10" fill="${Y}"/><rect x="8" y="19" width="32" height="10" fill="${R}"/><rect x="8" y="33" width="32" height="10" fill="${B}"/>`)],
  ["tool", ic(`<path d="M28.5 6.5 A11 11 0 0 0 19.6 22 L6 35.6 A4 4 0 0 0 11.7 41.3 L25.4 27.7 A11 11 0 0 0 41 19 L34.5 20.5 L30 17 L27 13 Z" fill="${K}"/>`)],
  ["agent", ic(`<path d="M24 4 A20 20 0 1 1 6.7 14 L12 17 A14 14 0 1 0 24 10 Z" fill="${K}"/><path d="M22 0 L33 7 L22 14 Z" fill="${K}"/><circle cx="24" cy="24" r="7" fill="${R}"/>`)],
  ["check", ic(`<circle cx="24" cy="24" r="20" fill="${Y}"/><path d="M11.5 24.5 L15.8 20.2 L21 25.4 L32.2 14.2 L36.5 18.5 L21 34 Z" fill="${K}"/>`)],
  ["warning", ic(`<path d="M24 4 L45 42 H3 Z" fill="${Y}"/><rect x="21" y="16" width="6" height="14" fill="${K}"/><rect x="21" y="33" width="6" height="5" fill="${R}"/>`)],
];

export default {
  id: "bauhaus",
  name: "Bauhaus",
  after: "Herbert Bayer's 1923 exhibition poster; Kandinsky's form–colour questionnaire (yellow triangle, red square, blue circle)",
  note: "Every element is a circle, a square or a triangle in a primary colour, so a diagram's nodes are their own icons: the model is always the red circle, tools the yellow triangle, data the blue square.",
  palette: [[R, "red"], [Y, "yellow"], [B, "blue"], [K, "black"], [C, "paper"]],
  type: "Futura Bold for titles, Futura Medium for text",
  ground: C,
  people,
  slide,
  icons,
};
