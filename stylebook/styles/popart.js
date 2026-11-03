// Pop art in Lichtenstein's calmer register (the interiors and brushstroke paintings): flat primaries, Ben-Day
// dot fields as the mid-tone, one black contour everywhere. Composed, not loud: no balloons, no sound effects.
const Y = "#ffd31a", R = "#e3241b", B = "#1660c9", K = "#111111", W = "#ffffff", PAPER = "#fbf8f0";
const F = `font-family="'Avenir Next', 'Helvetica Neue', sans-serif"`;
const DISPLAY = 60, TEXT = 18, LABEL = 14, LINE = 4;

// Ben-Day dots: two dots per cell on a 45° grid
const dots = (id, color, cell = 10, r = 2.3, bg = W) => `<pattern id="${id}" width="${cell}" height="${cell}" patternUnits="userSpaceOnUse">
  <rect width="${cell}" height="${cell}" fill="${bg}"/><circle cx="${cell / 4}" cy="${cell / 4}" r="${r}" fill="${color}"/><circle cx="${(3 * cell) / 4}" cy="${(3 * cell) / 4}" r="${r}" fill="${color}"/></pattern>`;

// a person: a dotted head and flat shoulders in one contour; the woman adds a bun
const person = (cx, bun, body, skin, sw) => `<g stroke="${K}" stroke-width="${sw}" stroke-linejoin="round">
  ${bun ? `<circle cx="${cx}" cy="104" r="18" fill="${skin}"/>` : ""}<circle cx="${cx}" cy="168" r="46" fill="${skin}"/>
  <path d="M${cx - 80} 318 C${cx - 80} 256 ${cx - 44} 232 ${cx} 232 C${cx + 44} 232 ${cx + 80} 256 ${cx + 80} 318 Z" fill="${body}"/></g>`;
const people = `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <defs>${dots("popart-p-skin", R, 9, 1.9, "#fff6ef")}</defs>
  ${person(104, false, B, "url(#popart-p-skin)", 6)}${person(296, true, Y, "url(#popart-p-skin)", 6)}
  <path d="M10 318 H390" stroke="${K}" stroke-width="6"/>
</svg>`;

const slide = (() => {
  const T = (x, y, s, w, t, extra = "") => `<text x="${x}" y="${y}" font-size="${s}" font-weight="${w}" ${extra}>${t}</text>`;
  // four equal nodes, each a flat colour field with one contour and a dot-field shadow
  const nw = 216, top = 344, nh = 170, xs = [64, 352, 712, 1000];
  const node = (x, fill, ink, name, lines, quote) => `<rect x="${x + 12}" y="${top + 12}" width="${nw}" height="${nh}" fill="url(#popart-s-shadow)"/>
    <rect x="${x}" y="${top}" width="${nw}" height="${nh}" fill="${fill}" stroke="${K}" stroke-width="${LINE}"/>
    ${T(x + 18, top + 38, TEXT + 2, 800, name, `fill="${ink}" letter-spacing=".5"`)}
    ${lines.map((l, i) => T(x + 18, top + 72 + i * 23, TEXT, 600, l, `fill="${ink}"`)).join("")}
    ${quote ? T(x + 18, top + nh - 18, LABEL, 700, quote, `fill="${ink}"`) : ""}`;
  const head = (x, y, a) => `<path d="M0 -10 L18 0 L0 10 Z" fill="${K}" transform="translate(${x} ${y}) rotate(${a})"/>`;
  const arrow = (x1, x2, y) => `<path d="M${x1} ${y} H${x2 - 16}" stroke="${K}" stroke-width="${LINE}"/>${head(x2 - 18, y, 0)}`;
  const base = 232, u = 26;
  const bars = [[1, "url(#popart-s-bdots)", "ALONE"], [2, B, "+ CHART"], [4, "url(#popart-s-rdots)", "+ TOOLS"], [5, R, "+ CHECKS"]].map(([v, fill, t], i) => {
    const x = 880 + i * 82;
    return `<rect x="${x}" y="${base - v * u}" width="54" height="${v * u}" fill="${fill}" stroke="${K}" stroke-width="${LINE}"/>
      ${T(x + 27, base - v * u - 10, TEXT + 2, 800, v, `text-anchor="middle" fill="${K}"`)}${T(x + 27, base + 24, LABEL - 2, 700, t, `text-anchor="middle" fill="${K}"`)}`;
  }).join("");

  return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" ${F}>
  <defs>${dots("popart-s-wall", "#a9c6ee", 14, 2.6, PAPER)}${dots("popart-s-shadow", B, 8, 2.1, PAPER)}${dots("popart-s-bdots", B, 10, 2.5, W)}${dots("popart-s-rdots", R, 10, 2.7, W)}</defs>
  <rect width="1280" height="720" fill="${PAPER}"/>
  <rect x="0" y="316" width="1280" height="234" fill="url(#popart-s-wall)"/>
  <path d="M0 316 H1280 M0 550 H1280" stroke="${K}" stroke-width="${LINE}"/>

  ${T(64, 74, LABEL, 800, "PART 4 · AGENTS", `letter-spacing="3" fill="${K}"`)}
  ${T(62, 148, DISPLAY, 800, "AN AGENT IS", `letter-spacing="-.5" fill="${K}"`)}
  ${T(62, 212, DISPLAY, 800, `A MODEL IN A <tspan fill="${R}">LOOP</tspan>`, `letter-spacing="-.5" fill="${K}"`)}

  ${T(880, 74, LABEL, 800, "QUESTIONS RIGHT, OF 5", `letter-spacing="1" fill="${K}"`)}
  <path d="M872 ${base} H1216" stroke="${K}" stroke-width="${LINE}"/>
  ${bars}

  ${node(xs[0], B, W, "ROSA’S CHART", ["612 notes"])}
  ${node(xs[1], R, W, "MODEL", ["reads, decides", "the next step"])}
  ${node(xs[2], Y, K, "TOOLS", ["search · read a note", "· labs"])}
  ${node(xs[3], W, K, "ANSWER", ["EF 30%", "metoprolol tartrate", "→ a gap"], "“LVEF 30%” · Echo, 10/02")}
  ${arrow(xs[0] + nw + 14, xs[1] - 10, top + nh / 2)}${arrow(xs[2] + nw + 14, xs[3] - 10, top + nh / 2)}
  <path d="M548 334 C572 270 708 270 732 334" fill="none" stroke="${K}" stroke-width="${LINE}"/>${head(723, 316, 64)}
  <path d="M732 526 C708 590 572 590 548 526" fill="none" stroke="${K}" stroke-width="${LINE}"/>${head(557, 544, 244)}
  ${T(640, 262, LABEL, 800, "THINK → ACT", `text-anchor="middle" letter-spacing="2" fill="${K}"`)}
  ${T(640, 612, LABEL, 800, "← OBSERVE", `text-anchor="middle" letter-spacing="2" fill="${K}"`)}

  ${T(64, 680, LABEL, 800, "QCOR 2026 · BUILD AN AGENT, LIVE", `letter-spacing="2" fill="${K}"`)}
  <circle cx="1192" cy="674" r="24" fill="${R}" stroke="${K}" stroke-width="${LINE}"/>
  ${T(1192, 681, TEXT + 2, 800, "14", `text-anchor="middle" fill="${W}"`)}
</svg>`;
})();

let n = 0; // each icon carries its own dot patterns, so ids stay unique
const ic = (body) => { const p = `popart-i${n++}`; return `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><defs>${dots(`${p}-r`, R, 5, 1.15, W)}${dots(`${p}-b`, B, 5, 1.15, W)}</defs>
  <g stroke="${K}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">${body.replace(/popart-i-/g, `${p}-`)}</g></svg>`; };
const icons = [
  ["patient", ic(`<circle cx="24" cy="16" r="8.5" fill="url(#popart-i-r)"/><path d="M7 44 C7 33 14 28.5 24 28.5 C34 28.5 41 33 41 44 Z" fill="${B}"/>`)],
  ["heart", ic(`<path d="M24 42 C14 35 4.5 28 4.5 18 C4.5 11.5 9 7 15 7 C19 7 22.3 9.5 24 13 C25.7 9.5 29 7 33 7 C39 7 43.5 11.5 43.5 18 C43.5 28 34 35 24 42 Z" fill="${R}"/>`)],
  ["pill", ic(`<g transform="rotate(-45 24 24)"><path d="M24 15 H15 A9 9 0 0 0 15 33 H24 Z" fill="${R}"/><path d="M24 15 H33 A9 9 0 0 1 33 33 H24 Z" fill="${Y}"/></g>`)],
  ["note", ic(`<path d="M9 4 H31 L39 12 V44 H9 Z" fill="${W}"/><path d="M31 4 V12 H39" fill="${Y}"/><path d="M15 21 H33 M15 28 H33 M15 35 H26" fill="none"/>`)],
  ["search", ic(`<path d="M30 30 L43 43" stroke-width="6"/><circle cx="20" cy="20" r="14" fill="url(#popart-i-b)"/>`)],
  ["database", ic(`<path d="M8 11 V37 C8 41 15 44 24 44 C33 44 40 41 40 37 V11" fill="url(#popart-i-r)"/><ellipse cx="24" cy="11" rx="16" ry="6" fill="${Y}"/><path d="M8 20 C8 24 15 27 24 27 C33 27 40 24 40 20 M8 29 C8 33 15 36 24 36 C33 36 40 33 40 29" fill="none"/>`)],
  ["tool", ic(`<path d="M27 5 C34 3.5 41 8 42 15 L35 15 L33 21 L39 22 C36 28 28 29 24 25 L11 38 C9 40 6 37 8 35 L21 22 C18 16 21 8 27 5 Z" fill="${B}"/>`)],
  ["agent", ic(`<path d="M41 24 A17 17 0 1 1 35 11" fill="none" stroke-width="5"/><path d="M28 4 L42 9.5 L32 19 Z" fill="${K}"/><circle cx="24" cy="24" r="7.5" fill="${R}"/>`)],
  ["check", ic(`<circle cx="24" cy="24" r="20" fill="${Y}"/><path d="M13.5 24.5 L21 32 L35 17" fill="none" stroke-width="5.5"/>`)],
  ["warning", ic(`<path d="M24 4 L45 42 H3 Z" fill="url(#popart-i-r)"/><path d="M24 16 V29" stroke-width="5"/><circle cx="24" cy="35.5" r="2.2" fill="${K}"/>`)],
];

export default {
  id: "popart",
  name: "Pop art",
  after: "Roy Lichtenstein's interiors and brushstroke paintings (1960s–90s): flat primaries, Ben-Day dots, black contour",
  note: "Lichtenstein in his quieter register: flat primary fields, Ben-Day dots as the only mid-tone (a dotted wall, dotted shadows, dotted bars) and one black contour for everything. Graphic and warm without being a joke; good for a few slides that need presence.",
  palette: [[Y, "yellow"], [R, "red"], [B, "blue"], [K, "black"], [PAPER, "paper"]],
  type: "Avenir Next Heavy and Demi Bold, one family throughout",
  ground: PAPER,
  people,
  slide,
  icons,
};
