// 29 Bricks: plastic toy bricks on a baseplate, seen from above and a little in front. Studs with highlight and
// shadow, printed tiles for text, stacks for the chart, 8×8 stud mosaics for icons. Generic toy bricks, no marks.
const RED = "#d0201a", YEL = "#f5c518", BLU = "#0b5cc2", GRN = "#25904a", WHT = "#f6f6f2", BLK = "#24282c";
const LBG = "#a7acb0", DBG = "#62676b", PLATE = "#c9cdd0", SKIN = "#f7cf3f", ORG = "#f58a1f", LBLU = "#6aa6ea", PUR = "#7a4fa3";
const RND = `font-family="'Arial Rounded MT Bold', 'Helvetica Rounded', 'Avenir Next', sans-serif"`;
const P = 40, FH = 12; // stud pitch, height of one brick layer in the oblique view

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (h, t, f) => { const a = hex(h), b = hex(t); return "#" + a.map((v, i) => Math.round(v + (b[i] - v) * f).toString(16).padStart(2, "0")).join(""); };
const dark = (h, f = 0.28) => mix(h, "#000000", f), lite = (h, f = 0.35) => mix(h, "#ffffff", f);

// one stud seen from above-front: a short cylinder with a lit top
function stud(cx, cy, c, r = 11.5, h = 4) {
  return `<ellipse cx="${cx + 2.5}" cy="${cy + h + 3}" rx="${r}" ry="${r * 0.92}" fill="#000" opacity=".22"/>
    <rect x="${cx - r}" y="${cy}" width="${2 * r}" height="${h}" fill="${dark(c, 0.3)}"/><ellipse cx="${cx}" cy="${cy + h}" rx="${r}" ry="${r * 0.92}" fill="${dark(c, 0.3)}"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.92}" fill="${lite(c, 0.12)}"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${r - 1.2}" ry="${r * 0.92 - 1.2}" fill="none" stroke="${dark(c, 0.08)}" stroke-width="1"/>
    <path d="M${cx - r * 0.62} ${cy + r * 0.05} A${r * 0.66} ${r * 0.6} 0 0 1 ${cx + r * 0.1} ${cy - r * 0.58}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="${r * 0.18}" stroke-linecap="round"/>`;
}
// a brick (or plate/tile) with footprint w×d studs at (x, y); n layers tall; studs on the listed rows
function brick({ x, y, w, d, c, n = 1, rows = null, fh = FH, round = false }) {
  const W = w * P, D = d * P, H = n * fh, top = y - H;
  const rs = rows === null ? [...Array(d).keys()] : rows;
  const seams = Array.from({ length: n - 1 }, (_, k) => `<line x1="${x}" y1="${y + D - (k + 1) * fh}" x2="${x + W}" y2="${y + D - (k + 1) * fh}" stroke="${dark(c, 0.45)}" stroke-width="1.2"/>`).join("");
  if (round) {
    const cx = x + W / 2, r = W / 2;
    return `<ellipse cx="${cx + 5}" cy="${y + D / 2 + 7}" rx="${r}" ry="${r}" fill="#000" opacity=".18"/>
      <rect x="${x}" y="${top + D / 2}" width="${W}" height="${H}" fill="${dark(c, 0.3)}"/><circle cx="${cx}" cy="${y + D / 2}" r="${r}" fill="${dark(c, 0.3)}"/>
      <circle cx="${cx}" cy="${top + D / 2}" r="${r}" fill="${c}"/><circle cx="${cx}" cy="${top + D / 2}" r="${r - 3}" fill="none" stroke="${lite(c, 0.3)}" stroke-width="2"/>`;
  }
  return `<rect x="${x + 5}" y="${top + 8}" width="${W}" height="${D + H}" rx="4" fill="#000" opacity=".18"/>
    <rect x="${x}" y="${y + D - H - 2}" width="${W}" height="${H + 2}" rx="3" fill="${dark(c, 0.3)}"/>${seams}
    <rect x="${x}" y="${top}" width="${W}" height="${D}" rx="3" fill="${c}"/>
    <path d="M${x + 2} ${top + D - 2} V${top + 3} Q${x + 2} ${top + 2} ${x + 4} ${top + 2} H${x + W - 3}" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width="2"/>
    ${rs.map((j) => Array.from({ length: w }, (_, i) => stud(x + P / 2 + i * P, top + P / 2 + j * P - 2, c)).join("")).join("")}`;
}
const tile = (o) => brick({ ...o, rows: [], fh: o.fh ?? 6 });
// the baseplate: low studs on every pitch
function baseplate(W, H, c = PLATE, off = 0) {
  let s = `<rect width="${W}" height="${H}" fill="${c}"/>`;
  for (let j = 0; j * P < H; j++) for (let i = 0; i * P < W; i++) {
    const cx = off + P / 2 + i * P, cy = off + P / 2 + j * P;
    s += `<circle cx="${cx + 1}" cy="${cy + 2}" r="11" fill="${dark(c, 0.16)}"/><circle cx="${cx}" cy="${cy}" r="11" fill="${lite(c, 0.18)}"/>`;
  }
  return s;
}
const txt = (x, y, t, size, fill, anchor = "start", extra = "") => `<text x="${x}" y="${y}" text-anchor="${anchor}" ${RND} font-size="${size}" fill="${fill}" ${extra}>${t}</text>`;

// ---- people: two brick-built figures, front view; the woman has one round plate on top ----
function elev(x, y, w, h, c, studs = true) { // a brick seen from the front: body and studs
  const n = Math.round(w / 40);
  return `${studs ? Array.from({ length: n }, (_, i) => `<rect x="${x + 10 + i * 40}" y="${y - 8}" width="20" height="9" rx="2" fill="${c}"/><rect x="${x + 10 + i * 40}" y="${y - 8}" width="6" height="9" rx="2" fill="#fff" opacity=".3"/>`).join("") : ""}
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${c}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="url(#lego-p-sh)"/>`;
}
function people() {
  const fig = (cx, bun) => `${elev(cx - 40, 248, 80, 84, BLU)}<line x1="${cx - 40}" y1="290" x2="${cx + 40}" y2="290" stroke="${dark(BLU, 0.35)}" stroke-width="1.5"/>
    ${elev(cx - 24, 192, 48, 50, SKIN, !bun)}${bun ? elev(cx - 18, 178, 36, 14, LBG, false) : ""}`;
  return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="lego-p-sh" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient></defs>
  <g transform="translate(200 200) scale(1.35) translate(-200 -265)">${elev(60, 332, 280, 18, GRN)}
  ${fig(140, false)}${fig(260, true)}</g>
</svg>`;
}

// ---- slide: all on a baseplate ----
function slide() {
  const ny = 240, d = 4, w = 5;                // four equal bricks, 5×4 studs, on the same row
  const nodes = [
    [40, BLU, WHT, "Rosa's chart", ["612 notes"]],
    [360, RED, WHT, "Model", ["reads, decides", "the next step"]],
    [720, YEL, BLK, "Tools", ["search", "read a note", "labs"]],
    [1040, BLK, WHT, "Answer", ["EF 30%", "metoprolol tartrate", "→ a gap"]],
  ];
  const arrowTile = (x, y, n, label, dir = 1) => {
    const W = n * P, ax = dir > 0 ? x + W - 14 : x + 14, cy = y + P / 2 - 3;
    return `${tile({ x, y, w: n, d: 1, c: WHT })}
      ${label ? txt(x + W / 2, cy + 5, label, 15, BLK, "middle") : `<line x1="${x + 14}" y1="${cy}" x2="${ax}" y2="${cy}" stroke="${BLK}" stroke-width="3"/>
      <path d="M${ax - dir * 9} ${cy - 7} L${ax} ${cy} L${ax - dir * 9} ${cy + 7}" fill="none" stroke="${BLK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>`}`;
  };
  const stacks = [[1, DBG, WHT, "alone"], [2, BLU, WHT, "+ chart"], [4, YEL, BLK, "+ tools"], [5, RED, WHT, "+ checks"]];
  const sfh = 24, sb = 640;
  return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" ${RND}>
  ${baseplate(1280, 720)}

  ${tile({ x: 40, y: 40, w: 6, d: 1, c: WHT })}
  ${txt(56, 68, "Part 4 · Agents", 18, BLK)}
  ${tile({ x: 40, y: 88, w: 23, d: 2, c: WHT })}
  ${txt(60, 145, "An agent is a model in a loop", 50, BLK, "start", 'letter-spacing="-0.5"')}

  ${nodes.map(([x, c, ink, name, lines]) => `${brick({ x, y: ny, w, d, c, rows: [0] })}
    ${txt(x + 16, ny + 60, name, 24, ink)}
    ${lines.map((t, i) => txt(x + 16, ny + 88 + i * 21, t, 15, ink)).join("")}`).join("")}
  ${tile({ x: 1040, y: 408, w: 5, d: 1, c: WHT })}
  ${txt(1056, 434, "“LVEF 30%” · Echo, 10/02", 14, BLK)}

  ${arrowTile(240, 300, 3, "", 1)}
  ${arrowTile(920, 300, 3, "", 1)}
  ${arrowTile(560, 280, 4, "Think → Act →", 1)}
  ${arrowTile(560, 336, 4, "← Observe", -1)}

  <!-- the chart: stacks of bricks -->
  ${txt(40, 616, "Questions right,", 18, BLK)}${txt(40, 640, "of 5", 18, BLK)}
  ${stacks.map(([v, c, ink, t], i) => {
    const x = 360 + i * 120;
    return `${brick({ x, y: sb - P, w: 2, d: 1, c, n: v, fh: sfh })}
      ${txt(x + 40, sb - P - v * sfh - 14, String(v), 24, BLK, "middle")}
      ${txt(x + 40, sb - 7, t, 13, ink, "middle")}`;
  }).join("")}

  ${tile({ x: 40, y: 664, w: 9, d: 1, c: DBG })}
  ${txt(56, 690, "QCOR 2026 · Build an agent, live", 15, WHT)}
  ${tile({ x: 1160, y: 664, w: 2, d: 1, c: DBG })}
  ${txt(1200, 690, "14", 17, WHT, "middle")}
</svg>`;
}

// ---- icons: 8×8 stud mosaics ----
const PAL = { R: RED, Y: YEL, B: BLU, G: GRN, W: WHT, K: BLK, S: LBG, D: DBG, O: ORG, C: LBLU, P: PUR, F: SKIN };
const MOS = {
  patient: ["...KK...", "..KKKK..", "..KKKK..", "...KK...", "........", ".KKKKKK.", "KKKKKKKK", "KKKKKKKK"],
  heart: ["........", ".RR..RR.", "RRRRRRRR", "RRRRRRRR", "RRRRRRRR", ".RRRRRR.", "..RRRR..", "...RR..."],
  pill: [".....KKK", "....KKKK", "...KKKK.", "..RRRK..", ".RRRR...", "RRRR....", "RRR.....", "........"],
  note: [".KKKKK..", ".KKKKKK.", ".KWWWWK.", ".KKKKKK.", ".KWWWWK.", ".KKKKKK.", ".KWWKKK.", ".KKKKKK."],
  search: [".KKKK...", "KWWWWK..", "KWWWWK..", "KWWWWK..", ".KKKKK..", ".....KK.", "......KK", ".......K"],
  database: [".KKKKKK.", "KKKKKKKK", "........", "KKKKKKKK", "KKKKKKKK", "........", "KKKKKKKK", ".KKKKKK."],
  tool: ["....K..K", "....KKKK", ".....KK.", "....KK..", "...KK...", "..KK....", ".KK.....", "KK......"],
  agent: ["..KKKK..", ".K....K.", "K......K", "K..RR..K", "K..RR..K", "K......K", ".K...KKK", "..KK..KK"],
  check: ["........", ".......G", "......GG", "G....GG.", "GG..GG..", ".GGGG...", "..GG....", "........"],
  warning: ["...YY...", "...YY...", "..YKKY..", "..YKKY..", ".YYKKYY.", ".YYYYYY.", "YYYKKYYY", "YYYYYYYY"],
};
function mosaic(rows) {
  let s = `<rect x="0" y="0" width="48" height="48" rx="3" fill="${PLATE}"/><rect x="0" y="45" width="48" height="3" rx="1.5" fill="${dark(PLATE, 0.2)}"/>`;
  rows.forEach((row, j) => [...row].forEach((ch, i) => {
    const x = i * 6, y = j * 5.7, cx = x + 3, cy = y + 2.85;
    if (ch === ".") { s += `<circle cx="${cx}" cy="${cy + 0.3}" r="1.9" fill="${dark(PLATE, 0.12)}"/><circle cx="${cx}" cy="${cy}" r="1.9" fill="${lite(PLATE, 0.2)}"/>`; return; }
    const c = PAL[ch];
    s += `<rect x="${x + 0.25}" y="${y + 0.25}" width="5.5" height="5.5" rx=".6" fill="${dark(c, 0.25)}"/><rect x="${x + 0.25}" y="${y + 0.25}" width="5.5" height="4.6" rx=".6" fill="${c}"/>
      <circle cx="${cx}" cy="${cy + 0.5}" r="2" fill="${dark(c, 0.22)}"/><circle cx="${cx}" cy="${cy}" r="2" fill="${lite(c, 0.12)}"/><path d="M${cx - 1.3} ${cy + 0.2} A1.4 1.4 0 0 1 ${cx + 0.3} ${cy - 1.3}" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width=".55"/>`;
  }));
  return `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
}

export default {
  id: "lego",
  name: "Bricks",
  after: "plastic construction bricks and baseplates, printed tiles, stud mosaics (generic, no marks)",
  note: "Everything is built on one stud grid: four equal bricks for the parts, printed tiles for text and arrows, and the chart as stacks you can count, 1, 2, 4 and 5 bricks high. Calm and exact; an agent as something you could assemble on the table.",
  palette: [[RED, "brick red"], [YEL, "brick yellow"], [BLU, "brick blue"], [BLK, "black"], [WHT, "white"], [PLATE, "baseplate"]],
  type: "Arial Rounded MT Bold throughout",
  ground: PLATE,
  peopleGround: "radial-gradient(circle at 50% 38%, #f3f6fa, #d7e2ee)",
  people,
  slide,
  icons: Object.keys(MOS).map((k) => [k, mosaic(MOS[k])]),
};
