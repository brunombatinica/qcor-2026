// Blueprint: a cyanotype drafting sheet. White line on Prussian blue, a fine grid, centre lines,
// balloons, a sheet frame with zones and a minimal title block.
const BG = "#123e72", BG2 = "#0c2f5c", L = "#eef6ff", CY = "#9fdcff";
const DIN = `font-family="'DIN Condensed', 'Avenir Next Condensed', sans-serif"`;
const AV = `font-family="'Avenir Next Condensed', 'DIN Condensed', sans-serif"`;
const CL = `stroke-dasharray="22 4 3 4"`; // centre line: long dash, dot
const GRID = ["80px", "80px", "16px", "16px"].map((s, i) => `linear-gradient(${i % 2 ? "90deg, " : ""}rgba(238,246,255,${i < 2 ? 0.14 : 0.06}) 1px, transparent 1px) 0 0/${s} ${s}`).join(", ") + ", radial-gradient(circle at 50% 42%, #164681, #0c2f5c)";

function defs(p) {
  return `<defs>
    <pattern id="${p}-g" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M16 0 H0 V16" fill="none" stroke="${L}" stroke-opacity=".07"/></pattern>
    <pattern id="${p}-G" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M80 0 H0 V80" fill="none" stroke="${L}" stroke-opacity=".15"/></pattern>
    <pattern id="${p}-h" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" stroke="${L}" stroke-width="1.1" stroke-opacity=".7"/></pattern>
    <radialGradient id="${p}-v" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="${BG}"/><stop offset="1" stop-color="${BG2}"/></radialGradient>
    <marker id="${p}-A" viewBox="0 0 16 8" refX="15" refY="4" markerWidth="16" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0 L16 4 L0 8 Z" fill="${L}"/></marker>
  </defs>`;
}

// ---- people: two front elevations on shared centre lines ----
function people() {
  const fig = (cx, bun) => `
    <line x1="${cx}" y1="${bun ? 74 : 98}" x2="${cx}" y2="318" stroke="${CY}" stroke-width=".9" ${CL}/>
    ${bun ? `<circle cx="${cx}" cy="112" r="16" fill="none" stroke="${L}" stroke-width="2.2"/>` : ""}
    <circle cx="${cx}" cy="168" r="42" fill="${BG}" stroke="${L}" stroke-width="2.2"/>
    <path d="M${cx - 72} 300 C${cx - 72} 248 ${cx - 40} 226 ${cx} 226 C${cx + 40} 226 ${cx + 72} 248 ${cx + 72} 300" fill="none" stroke="${L}" stroke-width="2.2"/>`;
  return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <line x1="24" y1="168" x2="376" y2="168" stroke="${CY}" stroke-width=".9" ${CL}/>
  ${fig(112, false)}${fig(288, true)}
  <line x1="24" y1="300" x2="376" y2="300" stroke="${L}" stroke-width="1.4"/>
</svg>`;
}

// ---- slide ----
function slide() {
  const p = "blueprint-s";
  const zonesX = Array.from({ length: 8 }, (_, i) => 32 + i * 152);
  const zonesY = Array.from({ length: 4 }, (_, i) => 32 + i * 164);
  const ny = 264, nh = 144, nw = 208, cy = ny + nh / 2;
  const nodes = [
    [64, "ROSA'S CHART", ["612 notes"]],
    [368, "MODEL", ["reads, decides", "the next step"]],
    [704, "TOOLS", ["search", "read a note", "labs"]],
    [1008, "ANSWER", ["EF 30%", "metoprolol tartrate", "→ a gap"]],
  ];
  const bars = [[1, "MODEL ALONE"], [2, "+ CHART PASTED"], [4, "+ TOOLS"], [5, "+ CHECKS"]];
  const base = 640, u = 20;
  return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" ${AV}>
  ${defs(p)}
  <rect width="1280" height="720" fill="url(#${p}-v)"/><rect width="1280" height="720" fill="url(#${p}-g)"/><rect width="1280" height="720" fill="url(#${p}-G)"/>

  <!-- sheet frame and zones -->
  <rect x="16" y="16" width="1248" height="688" fill="none" stroke="${L}" stroke-width="1"/>
  <rect x="32" y="32" width="1216" height="656" fill="none" stroke="${L}" stroke-width="2.4"/>
  <g stroke="${L}" stroke-width="1">${zonesX.slice(1).map((x) => `<line x1="${x}" y1="16" x2="${x}" y2="32"/><line x1="${x}" y1="688" x2="${x}" y2="704"/>`).join("")}${zonesY.slice(1).map((y) => `<line x1="16" y1="${y}" x2="32" y2="${y}"/><line x1="1248" y1="${y}" x2="1264" y2="${y}"/>`).join("")}</g>
  <g font-size="11" font-weight="600" fill="${CY}" text-anchor="middle">${zonesX.map((x, i) => `<text x="${x + 76}" y="28">${i + 1}</text><text x="${x + 76}" y="700">${i + 1}</text>`).join("")}${zonesY.map((y, i) => `<text x="24" y="${y + 86}">${"ABCD"[i]}</text><text x="1256" y="${y + 86}">${"ABCD"[i]}</text>`).join("")}</g>

  <text x="64" y="88" font-size="17" font-weight="600" letter-spacing="4" fill="${CY}">PART 4 · AGENTS</text>
  <text x="62" y="160" ${DIN} font-size="68" fill="${L}">An agent is a model in a loop</text>

  <!-- the diagram: four equal parts on one centre line -->
  <line x1="48" y1="${cy}" x2="1232" y2="${cy}" stroke="${CY}" stroke-width=".9" ${CL}/>
  ${nodes.map(([x, name, lines]) => `<rect x="${x}" y="${ny}" width="${nw}" height="${nh}" fill="${BG}" stroke="${L}" stroke-width="2.4"/>
    <text x="${x + 16}" y="${ny + 40}" ${DIN} font-size="28" fill="${L}">${name}</text>
    ${lines.map((t, i) => `<text x="${x + 16}" y="${ny + 70 + i * 22}" font-size="17" font-weight="500" fill="${L}">${t}</text>`).join("")}`).join("")}
  <line x1="272" y1="${cy}" x2="366" y2="${cy}" stroke="${L}" stroke-width="2" marker-end="url(#${p}-A)"/>
  <line x1="912" y1="${cy}" x2="1006" y2="${cy}" stroke="${L}" stroke-width="2" marker-end="url(#${p}-A)"/>
  <path d="M552 ${ny} C576 ${ny - 56} 680 ${ny - 56} 704 ${ny - 4}" fill="none" stroke="${L}" stroke-width="2" marker-end="url(#${p}-A)"/>
  <path d="M720 ${ny + nh} C696 ${ny + nh + 56} 592 ${ny + nh + 56} 568 ${ny + nh + 4}" fill="none" stroke="${L}" stroke-width="2" marker-end="url(#${p}-A)"/>
  <text x="640" y="${ny - 56}" text-anchor="middle" font-size="15" font-weight="700" letter-spacing="3" fill="${CY}">THINK → ACT → OBSERVE</text>
  <polyline points="1024,${ny + nh} 1024,${ny + nh + 32} 1036,${ny + nh + 32}" fill="none" stroke="${CY}" stroke-width="1"/>
  <circle cx="1024" cy="${ny + nh}" r="2.4" fill="${CY}"/>
  <text x="1042" y="${ny + nh + 37}" font-size="16" font-weight="600" fill="${L}">“LVEF 30%” · Echo, 10/02</text>

  <!-- chart -->
  <text x="64" y="512" font-size="15" font-weight="700" letter-spacing="2" fill="${L}">QUESTIONS RIGHT, OF 5</text>
  ${[1, 2, 3, 4, 5].map((v) => `<line x1="64" y1="${base - v * u}" x2="448" y2="${base - v * u}" stroke="${L}" stroke-opacity=".2" stroke-dasharray="3 4"/>`).join("")}
  ${bars.map(([v, lab], i) => {
    const x = 80 + i * 96, top = base - v * u;
    return `<rect x="${x}" y="${top}" width="48" height="${v * u}" fill="url(#${p}-h)" stroke="${L}" stroke-width="1.8"/>
      <circle cx="${x + 24}" cy="${top - 18}" r="11" fill="${BG}" stroke="${L}" stroke-width="1.4"/><text x="${x + 24}" y="${top - 12.5}" text-anchor="middle" font-size="15" font-weight="700" fill="${L}">${v}</text>
      <text x="${x + 24}" y="${base + 20}" text-anchor="middle" font-size="12.5" font-weight="600" fill="${L}">${lab}</text>`;
  }).join("")}
  <line x1="64" y1="${base}" x2="448" y2="${base}" stroke="${L}" stroke-width="2.4"/>

  <!-- title block -->
  <rect x="864" y="624" width="384" height="64" fill="${BG2}" stroke="${L}" stroke-width="2.4"/>
  <line x1="1176" y1="624" x2="1176" y2="688" stroke="${L}" stroke-width="1"/>
  <text x="880" y="662" font-size="15" font-weight="700" letter-spacing="1.5" fill="${L}">QCOR 2026 · BUILD AN AGENT, LIVE</text>
  <text x="1212" y="672" text-anchor="middle" ${DIN} font-size="40" fill="${L}">14</text>
</svg>`;
}

// ---- icons: drafted parts, one 2 px outline, thin centre lines ----
const S = `fill="none" stroke="${L}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`;
const T = `fill="none" stroke="${CY}" stroke-width=".7" stroke-dasharray="6 1.5 1 1.5"`;
const ic = (body) => `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
const icons = [
  ["patient", ic(`<line x1="24" y1="3" x2="24" y2="45" ${T}/><circle cx="24" cy="16" r="8" ${S}/><path d="M9 42 C9 31 15 27 24 27 C33 27 39 31 39 42" ${S}/>`)],
  ["heart", ic(`<line x1="24" y1="4" x2="24" y2="45" ${T}/><path d="M24 40 C12 31 7 25 7 18.5 C7 13.5 11 9.5 16 9.5 C19.6 9.5 22.4 11.6 24 14.6 C25.6 11.6 28.4 9.5 32 9.5 C37 9.5 41 13.5 41 18.5 C41 25 36 31 24 40 Z" ${S}/>`)],
  ["pill", ic(`<g transform="rotate(-45 24 24)"><line x1="2" y1="24" x2="46" y2="24" ${T}/><path d="M24 16 H16 A8 8 0 0 0 16 32 H32 A8 8 0 0 0 32 16 Z M24 16 V32" ${S}/></g>`)],
  ["note", ic(`<line x1="24" y1="2" x2="24" y2="46" ${T}/><path d="M11 6 H29 L37 14 V42 H11 Z M29 6 V14 H37" ${S}/><path d="M16 22 H32 M16 28 H32 M16 34 H26" ${S}/>`)],
  ["search", ic(`<path d="M7 20 H35 M21 6 V34" ${T}/><circle cx="21" cy="20" r="11" ${S}/><path d="M29 28 L40 39" ${S} stroke-width="3.4"/>`)],
  ["database", ic(`<line x1="24" y1="2" x2="24" y2="46" ${T}/><ellipse cx="24" cy="11" rx="14" ry="5" ${S}/><path d="M10 11 V37 A14 5 0 0 0 38 37 V11 M10 24 A14 5 0 0 0 38 24" ${S}/>`)],
  ["tool", ic(`<line x1="6" y1="42" x2="42" y2="6" ${T}/><path d="M32.6 6.4 A9 9 0 0 0 24.4 18.2 L8.4 34.2 A3.4 3.4 0 0 0 13.8 39.6 L29.8 23.6 A9 9 0 0 0 41.6 15.4 L36.5 20.5 L31.2 19.8 L28.5 16.8 L28.2 11.5 Z" ${S}/>`)],
  ["agent", ic(`<path d="M24 4 V44 M4 24 H44" ${T}/><path d="M40 24 A16 16 0 1 1 33.8 11.4" ${S}/><path d="M29.4 6.4 L37.6 9.6 L33 16.8" ${S}/>`)],
  ["check", ic(`<path d="M24 3 V45 M3 24 H45" ${T}/><circle cx="24" cy="24" r="18" ${S}/><path d="M15 24.5 L21.5 31 L34 17.5" ${S}/>`)],
  ["warning", ic(`<line x1="24" y1="2" x2="24" y2="46" ${T}/><path d="M24 5 L44 41 H4 Z" ${S}/><path d="M24 18 V29" ${S}/><circle cx="24" cy="34.5" r="1.6" fill="${L}"/>`)],
];

export default {
  id: "blueprint",
  name: "Blueprint",
  after: "cyanotype engineering drawings: ISO 128 line types, the drawing-sheet frame and title block, balloons",
  note: "The agent drawn as a mechanism on a drafting sheet: four equal parts on one centre line, the loop between model and tools drawn as a pair of arcs, the chart as hatched bars with balloons. Precise and calm; it reads as engineering rather than magic.",
  palette: [[BG, "Prussian blue"], [BG2, "deep blue"], [L, "line white"], [CY, "cyan"]],
  type: "DIN Condensed for titles and part names, Avenir Next Condensed for text",
  ground: BG,
  peopleGround: GRID,
  iconGround: GRID,
  iconInk: "#eef6ff",
  people,
  slide,
  icons,
};
