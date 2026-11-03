// Playing cards: the slide as a quiet card table. Four equal face-up cards, a stack of chips for the score.
const FELT = "#1d5a3a", PAPER = "#fbf8f1", RED = "#c8302c", INK = "#1b1b1b", GOLD = "#d9a93a", CREAM = "#f3ead2", EDGE = "#cbbfa8", SUB = "#6b6152";
const SERIF = `font-family="Baskerville, 'Baskerville Old Face', Georgia, serif"`;
const DIDOT = `font-family="Didot, 'Bodoni 72', 'Bodoni MT', serif"`;

// suit pips, centred on 0,0 at scale 1 ≈ 80 units tall
const spade = `M0 -40 C20 -15 40 0 40 15 A18 18 0 0 1 6 22 L12 40 H-12 L-6 22 A18 18 0 0 1 -40 15 C-40 0 -20 -15 0 -40 Z`;
const heart = `M0 36 C-8 28 -40 10 -40 -12 A20 20 0 0 1 0 -18 A20 20 0 0 1 40 -12 C40 10 8 28 0 36 Z`;
const diamond = `M0 -40 Q14 -14 30 0 Q14 14 0 40 Q-14 14 -30 0 Q-14 -14 0 -40 Z`;
const club = `M0 -36 A16 16 0 0 1 12 -9 A16 16 0 1 1 6 18 L12 40 H-12 L-6 18 A16 16 0 1 1 -12 -9 A16 16 0 0 1 0 -36 Z`;
const pip = (d, x, y, s, fill, rot = 0) => `<path d="${d}" fill="${fill}" transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"/>`;

// the figure pip: a head and shoulders, drawn like a suit symbol (woman: a small bun)
const figure = (bun) => `<circle cx="0" cy="-16" r="15"/>${bun ? `<circle cx="0" cy="-36" r="8"/>` : ""}<path d="M-32 38 C-32 14 -18 4 0 4 C18 4 32 14 32 38 Z"/>`;
const figPip = (bun, x, y, s, fill, rot = 0) => `<g fill="${fill}" transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">${figure(bun)}</g>`;

const defs = `<defs>
  <radialGradient id="cards-felt" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="#256f48"/><stop offset="1" stop-color="#123f28"/></radialGradient>
  <pattern id="cards-back" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="${RED}"/><path d="M0 5 H10 M5 0 V10" stroke="#e08a84" stroke-width="1.2"/></pattern>
  <filter id="cards-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.06 0"/></filter>
  <filter id="cards-shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-opacity=".3"/></filter>
  <marker id="cards-ah" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="${CREAM}"/></marker>
</defs>`;

// a face-up card with a small pip in two corners
const card = (x, y, w, h, pipD, color, body = "") => `<g filter="url(#cards-shadow)">
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${w * 0.06}" fill="${PAPER}" stroke="${EDGE}"/>
  ${pip(pipD, x + 18, y + 22, 0.17, color)}${pip(pipD, x + w - 18, y + h - 22, 0.17, color, 180)}
  ${body}</g>`;

// ---------- people: two figure cards, pips-style ----------
const fcard = (x, bun, color) => `<g filter="url(#cards-shadow)">
  <rect x="${x}" y="30" width="170" height="240" rx="11" fill="${PAPER}" stroke="${EDGE}"/>
  ${figPip(bun, x + 20, 52, 0.26, color)}${figPip(bun, x + 150, 248, 0.26, color, 180)}
  ${figPip(bun, x + 85, 156, 1.3, color)}</g>`;
const people = `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">${defs}${fcard(20, false, INK)}${fcard(210, true, RED)}</svg>`;

// ---------- slide ----------
function chips() {
  const stacks = [[1, "Model alone"], [2, "+ chart pasted"], [4, "+ tools"], [5, "+ checks"]];
  const rx = 28, ry = 8, th = 15, yb = 238;
  return stacks.map(([n, label], s) => {
    const cx = 930 + s * 84, c = s === 3 ? RED : PAPER, edge = s === 3 ? PAPER : RED;
    let g = "";
    for (let i = 0; i < n; i++) {
      const top = yb - (i + 1) * th;
      g += `<ellipse cx="${cx}" cy="${yb - i * th}" rx="${rx}" ry="${ry}" fill="${c}" stroke="rgba(0,0,0,.3)"/>
        <rect x="${cx - rx}" y="${top}" width="${rx * 2}" height="${th}" fill="${c}"/>
        <rect x="${cx - 4}" y="${top}" width="8" height="${th}" fill="${edge}"/><rect x="${cx - rx + 4}" y="${top}" width="6" height="${th}" fill="${edge}"/><rect x="${cx + rx - 10}" y="${top}" width="6" height="${th}" fill="${edge}"/>
        <path d="M${cx - rx} ${top} V${top + th} M${cx + rx} ${top} V${top + th}" stroke="rgba(0,0,0,.3)"/>
        <ellipse cx="${cx}" cy="${top}" rx="${rx}" ry="${ry}" fill="${c}" stroke="rgba(0,0,0,.3)"/>`;
    }
    const [l1, l2] = label === "+ chart pasted" ? ["+ chart", "pasted"] : label === "Model alone" ? ["Model", "alone"] : [label, ""];
    return `${g}<text x="${cx}" y="${yb - n * th - 18}" text-anchor="middle" ${DIDOT} font-size="26" fill="${CREAM}">${n}</text>
      <text x="${cx}" y="${yb + 30}" text-anchor="middle" ${SERIF} font-size="14" fill="${CREAM}">${l1}</text>
      ${l2 ? `<text x="${cx}" y="${yb + 47}" text-anchor="middle" ${SERIF} font-size="14" fill="${CREAM}">${l2}</text>` : ""}`;
  }).join("");
}

const CW = 192, CH = 256, CY = 360, X = [112, 368, 720, 976], MID = CY + CH / 2;
const lines = (x, rows) => rows.map(([t, y, sz, fam, fill, style]) => `<text x="${x + CW / 2}" y="${CY + y}" text-anchor="middle" ${fam === "d" ? DIDOT : SERIF} font-size="${sz}" ${style || ""} fill="${fill || INK}">${t}</text>`).join("");

const slide = `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">${defs}
  <rect width="1280" height="720" fill="url(#cards-felt)"/><rect width="1280" height="720" filter="url(#cards-grain)"/>
  <rect x="16" y="16" width="1248" height="688" rx="22" fill="none" stroke="${GOLD}" stroke-opacity=".35" stroke-width="1.5"/>

  <text x="64" y="72" ${SERIF} font-size="16" letter-spacing="5" fill="${CREAM}">PART 4 · AGENTS</text>
  <text x="62" y="154" ${DIDOT} font-size="60" fill="${CREAM}">An agent is a model</text>
  <text x="62" y="222" ${DIDOT} font-size="60" fill="${CREAM}">in a <tspan font-style="italic" fill="${GOLD}">loop</tspan></text>

  <text x="888" y="72" ${SERIF} font-size="14" letter-spacing="3" fill="${CREAM}" opacity=".85">QUESTIONS RIGHT, OF 5</text>
  ${chips()}

  ${[2, 1].map((k) => `<g filter="url(#cards-shadow)"><rect x="${X[0] + k * 5}" y="${CY - k * 5}" width="${CW}" height="${CH}" rx="${CW * 0.06}" fill="${PAPER}" stroke="${EDGE}"/><rect x="${X[0] + k * 5 + 8}" y="${CY - k * 5 + 8}" width="${CW - 16}" height="${CH - 16}" rx="7" fill="url(#cards-back)"/></g>`).join("")}
  ${card(X[0], CY, CW, CH, diamond, RED, lines(X[0], [["Rosa’s chart", 120, 26, "d"], ["612 notes", 150, 16, "s", SUB]]))}
  ${card(X[1], CY, CW, CH, spade, INK, lines(X[1], [["Model", 108, 26, "d"], ["reads, decides", 138, 16, "s", SUB], ["the next step", 160, 16, "s", SUB]]))}
  ${card(X[2], CY, CW, CH, club, INK, lines(X[2], [["Tools", 98, 26, "d"], ["search", 128, 16, "s", SUB], ["read a note", 150, 16, "s", SUB], ["labs", 172, 16, "s", SUB]]))}
  ${card(X[3], CY, CW, CH, heart, RED, `${lines(X[3], [["EF 30%", 92, 34, "d"], ["metoprolol tartrate", 122, 16, "s"], ["→ a gap", 144, 16, "s", RED]])}
    <path d="M${X[3] + 56} ${CY + 164} H${X[3] + CW - 56}" stroke="${GOLD}"/>
    ${lines(X[3], [["“LVEF 30%”", 192, 18, "s", INK, 'font-style="italic"'], ["Echo, 10/02", 212, 13, "s", SUB]])}`)}

  <g fill="none" stroke="${CREAM}" stroke-width="2.5">
    <path d="M${X[0] + CW + 14} ${MID} H${X[1] - 14}" marker-end="url(#cards-ah)"/>
    <path d="M${X[1] + CW + 12} ${MID - 60} C${X[1] + CW + 70} ${MID - 128} ${X[2] - 70} ${MID - 128} ${X[2] - 14} ${MID - 60}" marker-end="url(#cards-ah)"/>
    <path d="M${X[2] - 12} ${MID + 60} C${X[2] - 70} ${MID + 128} ${X[1] + CW + 70} ${MID + 128} ${X[1] + CW + 14} ${MID + 60}" marker-end="url(#cards-ah)"/>
    <path d="M${X[2] + CW + 14} ${MID} H${X[3] - 14}" marker-end="url(#cards-ah)"/>
  </g>
  <text x="${(X[1] + CW + X[2]) / 2}" y="${MID - 146}" text-anchor="middle" ${SERIF} font-style="italic" font-size="19" fill="${CREAM}">Think → Act → Observe</text>

  <text x="64" y="684" ${SERIF} font-size="14" letter-spacing="3" fill="${CREAM}" opacity=".8">QCOR 2026 · BUILD AN AGENT, LIVE</text>
  <text x="1216" y="684" text-anchor="end" ${SERIF} font-size="15" fill="${CREAM}" opacity=".8">14</text>
</svg>`;

// ---------- icons: one solid glyph on a small blank card; red for the body, black for the machinery ----------
const ic = (color, glyph) => `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <rect x="7" y="1.5" width="34" height="45" rx="3.5" fill="${PAPER}" stroke="#bfb39b"/>
  <g fill="${color}">${glyph}</g></svg>`;
const icons = [
  ["patient", ic(RED, `<g transform="translate(24 25) scale(.3)">${figure(false)}</g>`)],
  ["heart", ic(RED, `<path d="${heart}" transform="translate(24 24) scale(.3)"/>`)],
  ["pill", ic(RED, `<g transform="rotate(-45 24 24)"><path d="M23 19 H18 A5 5 0 0 0 18 29 H23 Z"/><path d="M25 19 H30 A5 5 0 0 1 30 29 H25 Z"/></g>`)],
  ["note", ic(INK, `<path d="M16 13 H28 L33 18 V35 H16 Z M19 22 V23.6 H30 V22 Z M19 26 V27.6 H30 V26 Z M19 30 V31.6 H26 V30 Z" fill-rule="evenodd"/>`)],
  ["search", ic(INK, `<path d="M22 14 A8 8 0 1 1 22 30 A8 8 0 1 1 22 14 Z M22 17.2 A4.8 4.8 0 1 0 22 26.8 A4.8 4.8 0 1 0 22 17.2 Z" fill-rule="evenodd"/><path d="M26.6 28.9 L28.9 26.6 L34 31.7 L31.7 34 Z"/>`)],
  ["database", ic(INK, `<rect x="15" y="14" width="18" height="5" rx="2.5"/><rect x="15" y="21.5" width="18" height="5" rx="2.5"/><rect x="15" y="29" width="18" height="5" rx="2.5"/>`)],
  ["tool", ic(INK, `<path d="M27.5 14 a5.5 5.5 0 0 0 -6.4 7.3 L14.5 28 a2.3 2.3 0 0 0 3.3 3.3 l6.7 -6.6 a5.5 5.5 0 0 0 7.2 -6.5 l-3.2 3.2 -2.9 -.6 -.6 -2.9 z"/>`)],
  ["agent", ic(INK, `<path d="M24 14.5 A9.5 9.5 0 1 0 33.5 24 H30.5 A6.5 6.5 0 1 1 24 17.5 Z"/><path d="M24 11 L30 15.8 L24 20.6 Z"/><circle cx="24" cy="24" r="2.6"/>`)],
  ["check", ic(INK, `<path d="M15 24 L17.4 21.6 L21.5 25.7 L30.6 16.6 L33 19 L21.5 30.5 Z"/>`)],
  ["warning", ic(RED, `<path d="M24 13 L35 33 H13 Z M22.8 19.5 V26 H25.2 V19.5 Z M22.8 28 V30.4 H25.2 V28 Z" fill-rule="evenodd"/>`)],
];

export default {
  id: "cards",
  name: "Playing cards",
  after: "the standard French-suited deck and its pips; a card table",
  note: "A quiet card table. The four steps are four equal face-up cards with a suit in the corners; the chart sits on a small deck, and the scores are stacks of chips. Red and black carry meaning the way suits do: red for the patient, black for the machine.",
  palette: [[FELT, "felt"], [PAPER, "card"], [RED, "red suit"], [INK, "black suit"], [GOLD, "gold"], [CREAM, "cream"]],
  type: "Didot for titles and numbers, Baskerville for text",
  ground: FELT,
  peopleGround: "radial-gradient(circle at 50% 45%, #256f48, #123f28)",
  people,
  slide,
  icons,
};
