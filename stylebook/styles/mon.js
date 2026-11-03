// Kamon & Ma: Japanese family crests (circular, symmetric, monochrome) and the emptiness of Kenya Hara's Muji.
// Every crest is a ring plus one solid sumi figure drawn in a 48-unit box; vermilion only for the seal and the last score.
const W = "#f3efe5", K = "#1c1b19", V = "#d4432c", GR = "#8f887b", L = "#d8d1c2";
const MIN = `font-family="'Hiragino Mincho ProN', 'Hiragino Mincho Pro', 'Yu Mincho', serif"`;
const SANS = `font-family="'Hiragino Sans', 'Hiragino Kaku Gothic ProN', sans-serif"`;

const pt = (cx, cy, r, a) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)].map((v) => +v.toFixed(2));
const ring = (c = K) => `<circle cx="24" cy="24" r="21.6" fill="none" stroke="${c}" stroke-width="2.6"/>`;
// a horizontal band y0..y1 cut by the circle of radius r about (24, 24)
const band = (y0, y1, r = 17.4) => {
  const x = (y) => Math.sqrt(Math.max(0, r * r - (y - 24) ** 2));
  return `<path d="M${24 - x(y0)} ${y0} H${24 + x(y0)} A${r} ${r} 0 0 1 ${24 + x(y1)} ${y1} H${24 - x(y1)} A${r} ${r} 0 0 1 ${24 - x(y0)} ${y0} Z"/>`;
};
// one tomoe (comma): head at angle a, tail sweeping back round the rim
const tomoe = (a, R = 17, hr = 6) => {
  const d = R - hr;
  const T = pt(24, 24, R, a), E = pt(24, 24, R, a - 100), I = pt(24, 24, d - hr, a);
  return `<path d="M${T} A${R} ${R} 0 0 0 ${E} A${R * 0.62} ${R * 0.62} 0 0 1 ${I} A${hr} ${hr} 0 0 0 ${T} Z"/>`;
};

// motifs, each in the 48 box, filled sumi
const M = {
  person: `<circle cx="24" cy="18" r="6.6"/><path d="M11.5 37.5 C12.5 30.5 17.5 28 24 28 C30.5 28 35.5 30.5 36.5 37.5 C33 40.5 28.8 42 24 42 C19.2 42 15 40.5 11.5 37.5 Z"/>`,
  personW: `<circle cx="24" cy="9.4" r="3.2"/><circle cx="24" cy="19" r="6.4"/><path d="M11.5 37.5 C12.5 30.5 17.5 28 24 28 C30.5 28 35.5 30.5 36.5 37.5 C33 40.5 28.8 42 24 42 C19.2 42 15 40.5 11.5 37.5 Z"/>`,
  heart: `<path d="M24 39 C16 33 9.5 27 9.5 19.5 C9.5 14.5 13 11 17.5 11 C20.6 11 22.8 12.8 24 15.2 C25.2 12.8 27.4 11 30.5 11 C35 11 38.5 14.5 38.5 19.5 C38.5 27 32 33 24 39 Z"/>`,
  pill: `<g transform="rotate(-45 24 24)"><path d="M24 17.5 H17 A6.5 6.5 0 0 0 17 30.5 H24 Z"/><path d="M24 18.7 H31 A5.3 5.3 0 0 1 31 29.3 H24 Z" fill="none" stroke="${K}" stroke-width="2.4"/></g>`,
  note: `<path d="M15 9 H29 L34 14 V39 H15 Z"/><path d="M29 9 V14 H34" fill="none" stroke="${W}" stroke-width="1.6"/><path d="M19 19 H30 M19 24 H30 M19 29 H30 M19 34 H25" stroke="${W}" stroke-width="2"/>`,
  search: `<circle cx="21" cy="21" r="8.6" fill="none" stroke="${K}" stroke-width="4.4"/><path d="M27.5 27.5 L35.5 35.5" stroke="${K}" stroke-width="5.4" stroke-linecap="round"/>`,
  database: `<ellipse cx="24" cy="13" rx="11" ry="4"/><path d="M13 16 V21 C13 23.2 18 25 24 25 C30 25 35 23.2 35 21 V16 C35 18.2 30 20 24 20 C18 20 13 18.2 13 16 Z"/><path d="M13 25.5 V30.5 C13 32.7 18 34.5 24 34.5 C30 34.5 35 32.7 35 30.5 V25.5 C35 27.7 30 29.5 24 29.5 C18 29.5 13 27.7 13 25.5 Z"/><path d="M13 35 V36.5 C13 38.7 18 40.5 24 40.5 C30 40.5 35 38.7 35 36.5 V35 C35 37.2 30 39 24 39 C18 39 13 37.2 13 35 Z"/>`,
  wrench: (rot = 45) => `<g transform="rotate(${rot} 24 24)"><path d="M20 8.5 V15 H28 V8.5 C32 10 34 13.5 33 17 C32.3 19.5 30 21 27.5 21.5 V38 C27.5 40.5 20.5 40.5 20.5 38 V21.5 C18 21 15.7 19.5 15 17 C14 13.5 16 10 20 8.5 Z"/></g>`,
  mallet: `<g transform="rotate(-45 24 24)"><rect x="15" y="8" width="18" height="10" rx="2"/><rect x="21.5" y="17" width="5" height="23" rx="1.5"/></g>`,
  tomoe: [90, 210, 330].map((a) => tomoe(a)).join(""),
  check: `<path d="M12.5 24.5 L20.5 32.5 L36 16.5" fill="none" stroke="${K}" stroke-width="5.6" stroke-linecap="square"/>`,
  uroko: `<path d="M24 9.5 L38 34.5 H10 Z"/><path d="M24 17.5 V27" stroke="${W}" stroke-width="3.2"/><circle cx="24" cy="30.6" r="1.9" fill="${W}"/>`,
  hiki: band(12.5, 18.6) + band(21, 27) + band(29.4, 35.5),
  janome: `<circle cx="24" cy="24" r="11.5" fill="none" stroke="${K}" stroke-width="7"/>`,
};
const crest = (cx, cy, r, body, c = K) => `<g transform="translate(${cx - r} ${cy - r}) scale(${(2 * r) / 48})"><circle cx="24" cy="24" r="23" fill="${W}"/>${ring(c)}<g fill="${K}">${body}</g></g>`;

const people = `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  ${crest(108, 200, 80, M.person)}${crest(292, 200, 80, M.personW)}
</svg>`;

const slide = (() => {
  const T = (x, y, s, f, t, extra = "") => `<text x="${x}" y="${y}" font-size="${s}" ${f} ${extra}>${t}</text>`;
  const TITLE = 46, NAME = 20, TEXT = 13, LABEL = 11;
  // the four columns of five cells, filled to the score
  const chart = [[1, "alone"], [2, "+ chart"], [4, "+ tools"], [5, "+ checks"]].map(([v, t], i) => {
    const x = 888 + i * 56;
    return Array.from({ length: 5 }, (_, k) => {
      const y = 210 - k * 20, on = k < v;
      return `<rect x="${x}" y="${y}" width="16" height="16" fill="${on ? (i === 3 ? V : K) : "none"}" stroke="${on ? "none" : L}" stroke-width="1.2"/>`;
    }).join("") + T(x + 8, 120, NAME, MIN, v, `text-anchor="middle" fill="${K}"`) + T(x + 8, 248, LABEL, SANS, t, `text-anchor="middle" fill="${GR}"`);
  }).join("");
  // one connector: a 1.5 line ending in a chevron
  const chev = (x, y, dir = 1) => `<path d="M${x - 7 * dir} ${y - 6} L${x} ${y} L${x - 7 * dir} ${y + 6}" fill="none" stroke="${K}" stroke-width="1.5"/>`;
  const line = (x1, x2, y) => `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${K}" stroke-width="1.5"/>${chev(x2, y)}`;
  // four equal crests on one line; names and text below at shared baselines
  const cy = 352, r = 54, base = 438;
  const node = (x, motif, name, lines) => `${crest(x, cy, r, motif)}${T(x, base, NAME, MIN, name, `text-anchor="middle" fill="${K}"`)}
    ${lines.map((l, i) => T(x, base + 22 + i * 18, TEXT, SANS, l, `text-anchor="middle" fill="${GR}"`)).join("")}`;
  const E = { cx: 656, cy: 380, rx: 238, ry: 140 };
  const ex = (y) => E.rx * Math.sqrt(1 - ((y - E.cy) / E.ry) ** 2);

  return `<div class="s-mon-slide">
  <svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="mon-s-washi" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".012 .5" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 .55  0 0 0 0 .5  0 0 0 0 .42  0 0 0 .07 0"/></filter>
      <filter id="mon-s-rough"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="2"/></filter>
    </defs>
    <rect width="1280" height="720" fill="${W}"/>
    <rect width="1280" height="720" filter="url(#mon-s-washi)"/>

    ${T(96, 136, TITLE, MIN, "An agent is", `fill="${K}"`)}
    ${T(96, 198, TITLE, MIN, "a model in a loop", `fill="${K}"`)}

    ${T(888, 82, LABEL, SANS, "QUESTIONS RIGHT, OF 5", `letter-spacing="3" fill="${GR}"`)}
    ${chart}

    <!-- the loop: one quiet orbit round the model and the tools -->
    <ellipse cx="${E.cx}" cy="${E.cy}" rx="${E.rx}" ry="${E.ry}" fill="none" stroke="${K}" stroke-width="1.5"/>
    ${chev(E.cx + 8, E.cy - E.ry)}${chev(E.cx - 8, E.cy + E.ry, -1)}
    ${T(E.cx, E.cy - E.ry - 14, TEXT, SANS, "Think → Act", `text-anchor="middle" letter-spacing="3" fill="${K}"`)}
    ${T(E.cx, E.cy + E.ry + 26, TEXT, SANS, "← Observe", `text-anchor="middle" letter-spacing="3" fill="${K}"`)}

    ${node(200, M.hiki, "Rosa’s chart", ["612 notes"])}
    ${node(584, M.janome, "Model", ["reads, decides", "the next step"])}
    ${node(728, M.wrench(45) + `<g stroke="${W}" stroke-width="2.4">${M.mallet}</g>`, "Tools", ["search · read a note", "· labs"])}
    ${node(1112, M.check, "Answer", ["EF 30%", "metoprolol tartrate → a gap", "“LVEF 30%” · Echo, 10/02"])}
    ${line(200 + r + 14, E.cx - ex(cy) - 2, cy)}
    ${line(E.cx + ex(cy) + 10, 1112 - r - 14, cy)}

    ${T(96, 668, LABEL, SANS, "QCOR 2026 · BUILD AN AGENT, LIVE", `letter-spacing="4" fill="${GR}"`)}
    <!-- hanko seal for the page number -->
    <g transform="rotate(-2 1172 650)" filter="url(#mon-s-rough)">
      <rect x="1144" y="622" width="56" height="56" rx="6" fill="${V}"/>
      <rect x="1149.5" y="627.5" width="45" height="45" rx="2.5" fill="none" stroke="${W}" stroke-width="1.8"/>
      ${T(1172, 661, 27, MIN, "14", `font-weight="600" text-anchor="middle" fill="${W}"`)}
    </g>
  </svg>
  <div class="s-mon-kicker">Part 4 · Agents</div>
</div>`;
})();

const ic = (body, c = K) => `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">${ring(c)}<g fill="${K}">${body}</g></svg>`;
const icons = [
  ["patient", ic(M.person)],
  ["heart", ic(M.heart)],
  ["pill", ic(M.pill)],
  ["note", ic(M.note)],
  ["search", ic(M.search)],
  ["database", ic(M.database)],
  ["tool", ic(M.wrench(45))],
  ["agent", ic(M.tomoe)],
  ["check", ic(M.check)],
  ["warning", ic(M.uroko, V)],
];

export default {
  id: "mon",
  name: "Kamon & Ma",
  after: "Japanese family crests (kamon), Kenya Hara's Muji and his idea of emptiness; the hanko seal",
  note: "Every node is a crest, a ring round one solid sumi figure, and everything else is left empty: one thin orbit for the loop, one vertical line of kicker, vermilion only for the seal and the full score. Calm and very legible; it trusts the audience to look.",
  palette: [[W, "washi"], [K, "sumi"], [V, "shu (vermilion)"], [GR, "usuzumi grey"], [L, "pale line"]],
  type: "Hiragino Mincho ProN for titles and names, Hiragino Sans W3 for labels",
  ground: W,
  css: `.s-mon .s-mon-slide { position: relative; width: 1280px; height: 720px; }
.s-mon .s-mon-slide > svg { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.s-mon .s-mon-kicker { position: absolute; right: 74px; top: 70px; writing-mode: vertical-rl; font: 17px/1 "Hiragino Mincho ProN", serif; letter-spacing: 0.42em; color: ${K}; }`,
  people,
  slide,
  icons,
};
