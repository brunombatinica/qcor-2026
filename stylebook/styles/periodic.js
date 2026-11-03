// 12 Periodic table: every part is an element tile (number, symbol, name, detail) coloured by category.
const BGc = "#f8f7f3", INK = "#1d2330", MUT = "#6b7280";
const CAT = { data: "#9fd0f2", model: "#f6a49c", tools: "#ffd27a", answer: "#a7e3b6", people: "#f2c6e0", grey: "#d3d6dc" };
const SANS = `'Helvetica Neue', Helvetica, Arial, sans-serif`;
const MONO = `Menlo, 'SF Mono', monospace`;
const F = `font-family="${SANS}"`;
const TXT = 18, LAB = 14;

// an element tile: atomic number, symbol, name; detail lines sit on the bottom edge
function tile(x, y, w, h, o) {
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${o.col}"/>
    <text x="${x + 16}" y="${y + 30}" font-size="${LAB + 2}" fill="${INK}" font-family="${MONO}">${o.num}</text>
    <text x="${x + 14}" y="${y + 100}" font-size="64" font-weight="700" letter-spacing="-1" fill="${INK}">${o.sym}</text>
    <text x="${x + 16}" y="${y + 130}" font-size="${TXT}" font-weight="600" fill="${INK}">${o.name}</text>
    ${o.detail.map((t, i, a) => `<text x="${x + 16}" y="${y + h - 16 - (a.length - 1 - i) * 19}" font-size="${LAB + 1}" fill="${INK}">${t}</text>`).join("")}
  </g>`;
}

// ---------- people: two tiles drawn like the patient icon; her one cue is a small circle (a bun) ----------
const PERSON = `<circle cx="24" cy="19" r="5.5"/><path d="M14 36 C14 29 18 26.5 24 26.5 C30 26.5 34 29 34 36"/>`;
const personTile = (x, y, col, bun) => `<g transform="translate(${x} ${y}) scale(3.4)"><rect x="2" y="2" width="44" height="44" rx="6" fill="${col}"/>
  <g fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${PERSON}${bun ? `<circle cx="24" cy="10.2" r="2.2" fill="${INK}" stroke="none"/>` : ""}</g></g>`;
const people = () => `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="400" fill="${BGc}"/>
  ${personTile(16, 118, CAT.data, false)}${personTile(220, 118, CAT.people, true)}
</svg>`;

// ---------- slide ----------
const slide = () => {
  const y = 360, w = 208, h = 208, X = [64, 352, 720, 1008];
  const ch = tile(X[0], y, w, h, { num: 1, sym: "Ch", name: "Rosa’s chart", detail: ["612 notes"], col: CAT.data });
  const mo = tile(X[1], y, w, h, { num: 2, sym: "Mo", name: "Model", detail: ["reads, decides", "the next step"], col: CAT.model });
  const to = tile(X[2], y, w, h, { num: 3, sym: "To", name: "Tools", detail: ["search · read a note", "· labs"], col: CAT.tools });
  const an = tile(X[3], y, w, h, { num: 4, sym: "An", name: "Answer", detail: ["EF 30% · metoprolol", "tartrate → a gap", "“LVEF 30%” · Echo, 10/02"], col: CAT.answer });
  // chart: columns of tiles
  const bars = [[1, CAT.grey, "Model", "alone"], [2, CAT.data, "+ chart", "pasted"], [4, CAT.tools, "+ tools", ""], [5, CAT.answer, "+ checks", ""]];
  const ts = 28, tg = 4, bx = 888, base = 272;
  const cols = bars.map(([v, c, t1, t2], i) => {
    let g = "";
    const tx = bx + i * 84;
    for (let j = 0; j < v; j++) g += `<rect x="${tx}" y="${base - (j + 1) * (ts + tg) + tg}" width="48" height="${ts}" rx="3" fill="${c}"/>`;
    return g + `<text x="${tx + 24}" y="${base - v * (ts + tg) - 6}" text-anchor="middle" font-size="${TXT + 2}" font-weight="700" fill="${INK}">${v}</text>
      <text x="${tx + 24}" y="${base + 22}" text-anchor="middle" font-size="${LAB}" fill="${INK}">${t1}</text><text x="${tx + 24}" y="${base + 40}" text-anchor="middle" font-size="${LAB}" fill="${INK}">${t2}</text>`;
  }).join("");
  const mid = y + h / 2, a0 = X[1] + w, a1 = X[2];
  return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" ${F}>
  <defs><marker id="periodic-ah" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="${INK}"/></marker></defs>
  <rect width="1280" height="720" fill="${BGc}"/>
  <text x="64" y="80" font-size="${LAB}" font-weight="600" letter-spacing="3" fill="${MUT}">PART 4 · AGENTS</text>
  <text x="62" y="152" font-size="60" font-weight="700" letter-spacing="-1.5" fill="${INK}">An agent is</text>
  <text x="62" y="216" font-size="60" font-weight="700" letter-spacing="-1.5" fill="${INK}">a model in a loop</text>

  <text x="${bx}" y="80" font-size="${LAB - 1}" font-weight="600" letter-spacing="2.5" fill="${MUT}">QUESTIONS RIGHT, OF 5</text>
  ${cols}

  ${ch}${mo}${to}${an}
  <path d="M${X[0] + w + 12} ${mid} H${X[1] - 14}" stroke="${INK}" stroke-width="3" marker-end="url(#periodic-ah)"/>
  <path d="M${X[2] + w + 12} ${mid} H${X[3] - 14}" stroke="${INK}" stroke-width="3" marker-end="url(#periodic-ah)"/>
  <path d="M${a0 + 12} ${mid - 40} C${a0 + 48} ${mid - 92} ${a1 - 48} ${mid - 92} ${a1 - 16} ${mid - 44}" fill="none" stroke="${INK}" stroke-width="3" marker-end="url(#periodic-ah)"/>
  <path d="M${a1 - 12} ${mid + 40} C${a1 - 48} ${mid + 92} ${a0 + 48} ${mid + 92} ${a0 + 16} ${mid + 44}" fill="none" stroke="${INK}" stroke-width="3" marker-end="url(#periodic-ah)"/>
  <text x="${(a0 + a1) / 2}" y="${mid - 92}" text-anchor="middle" font-size="${LAB + 1}" font-weight="600" fill="${INK}">Think → Act</text>
  <text x="${(a0 + a1) / 2}" y="${mid + 108}" text-anchor="middle" font-size="${LAB + 1}" font-weight="600" fill="${INK}">← Observe</text>

  <text x="64" y="688" font-size="${LAB - 1}" letter-spacing="2" fill="${MUT}">QCOR 2026 · BUILD AN AGENT, LIVE</text>
  <text x="1216" y="688" text-anchor="end" font-size="${TXT}" font-weight="700" fill="${INK}" font-family="${MONO}">14</text>
</svg>`;
};

// ---------- icons: a tile with one glyph, one stroke weight, no letters ----------
const it = (col, glyph) => `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="2" width="44" height="44" rx="6" fill="${col}"/>
  <g fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${glyph}</g></svg>`;
const icons = [
  ["patient", it(CAT.people, PERSON)],
  ["heart", it(CAT.model, `<path d="M24 36 C17 31 12.5 27 12.5 21.5 A5.8 5.8 0 0 1 24 18.6 A5.8 5.8 0 0 1 35.5 21.5 C35.5 27 31 31 24 36 Z"/>`)],
  ["pill", it(CAT.tools, `<g transform="rotate(-40 24 24)"><rect x="12" y="18.5" width="24" height="11" rx="5.5"/><path d="M24 18.5 V29.5"/></g>`)],
  ["note", it(CAT.data, `<path d="M15 12 H28 L33 17 V36 H15 Z"/><path d="M19.5 22 H28.5 M19.5 27 H28.5 M19.5 32 H25"/>`)],
  ["search", it(CAT.tools, `<circle cx="22" cy="22" r="7.5"/><path d="M27.5 27.5 L34 34"/>`)],
  ["database", it(CAT.data, `<ellipse cx="24" cy="16" rx="9" ry="3.2"/><path d="M15 16 V32 C15 35.5 33 35.5 33 32 V16 M15 24 C15 27.5 33 27.5 33 24"/>`)],
  ["tool", it(CAT.tools, `<path d="M29.5 13 A6 6 0 0 0 23.7 21.8 L14.5 31 A2.2 2.2 0 0 0 17.5 34 L26.7 24.8 A6 6 0 0 0 35.5 19 L31.5 19.8 L29 17.5 Z"/>`)],
  ["agent", it(CAT.model, `<path d="M33 24 A9 9 0 1 1 30.4 17.6"/><path d="M26.5 15.6 L31 17.4 L29.8 22"/>`)],
  ["check", it(CAT.answer, `<path d="M15 24.5 L21.5 31 L33.5 18"/>`)],
  ["warning", it("#ffbf9b", `<path d="M24 13 L35 34 H13 Z"/><path d="M24 21 V27"/><path d="M24 30.5 V30.6"/>`)],
];

export default {
  id: "periodic",
  name: "Periodic table",
  after: "Mendeleev's table and the classroom wall chart (category colours; number, symbol, name on one tile)",
  note: "Each part of the agent becomes an element tile with its own colour, so the parts read as a small table that can be recombined: the loop is a reaction between Mo and To. Colour carries the category everywhere, icons included.",
  palette: [[CAT.data, "data"], [CAT.model, "model"], [CAT.tools, "tools"], [CAT.answer, "answer"], [CAT.people, "people"], [INK, "ink"]],
  type: "Helvetica Neue Bold for symbols and titles, Menlo for numbers",
  ground: BGc,
  people,
  slide,
  icons,
};
