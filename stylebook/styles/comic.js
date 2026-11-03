// Ligne claire: one uniform black line, flat colours, no hatching, no shading; panels with gutters, caption boxes
// and capital hand lettering. The slide is a strip of four equal panels; the loop runs round the middle two.
const K = "#1b1b1b", PAPER = "#fbf5e6", Y = "#f7d65a", R = "#d8443a", BL = "#2f6db5", GN = "#5d9e6c";
const SKIN = "#f6d2b2", HAIR = "#8a5a3c", MAN = "#efc56f", PALE = "#d6e9f5", GREY = "#a9a9a9", W = "#ffffff";
const F = `font-family="'Chalkboard SE', 'Comic Sans MS', sans-serif" font-weight="700"`;
const LW = 3, LINE = `stroke="${K}" stroke-width="${LW}" stroke-linejoin="round" stroke-linecap="round"`;
const DISPLAY = 44, TEXT = 16, LABEL = 13;

// a person in the icon's construction: hair cap, head, shoulders; the woman adds a bun
const person = (cx, bun, body, lw) => `<g stroke="${K}" stroke-width="${lw}" stroke-linejoin="round">
  ${bun ? `<circle cx="${cx}" cy="7" r="4.5" fill="${HAIR}"/>` : ""}
  <path d="M${cx - 18} 46 C${cx - 17} 35 ${cx - 10} 31 ${cx} 31 C${cx + 10} 31 ${cx + 17} 35 ${cx + 18} 46 Z" fill="${body}"/>
  <circle cx="${cx}" cy="20" r="10" fill="${SKIN}"/>
  <path d="M${cx - 10} 20 C${cx - 11} 13 ${cx - 6} 10 ${cx} 10 C${cx + 6} 10 ${cx + 11} 13 ${cx + 10} 20 C${cx + 7} 17 ${cx + 3} 16 ${cx} 15.5 C${cx - 3} 16 ${cx - 7} 17 ${cx - 10} 20 Z" fill="${HAIR}"/></g>`;
const people = `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(8 108) scale(4)">${person(24, false, BL, 1.1)}${person(72, true, GN, 1.1)}</g>
</svg>`;

const slide = (() => {
  const T = (x, y, s, t, extra = "") => `<text x="${x}" y="${y}" font-size="${s}" ${extra}>${t}</text>`;
  const C = `text-anchor="middle"`;
  const top = 236, bot = 560, pw = 264, gx = (i) => 40 + i * 312, cx = (i) => gx(i) + pw / 2;
  const fills = [PAPER, PALE, "#fbe9b4", "#dcefd9"];
  const panel = (i, cap, lines, quote) => {
    const x = gx(i);
    return `<rect x="${x}" y="${top}" width="${pw}" height="${bot - top}" fill="${fills[i]}" ${LINE}/>
    <rect x="${x}" y="${top}" width="${cap.length * 12 + 28}" height="34" fill="${Y}" ${LINE}/>
    ${T(x + 14, top + 24, TEXT, cap, `fill="${K}"`)}
    <rect x="${x + 16}" y="440" width="${pw - 32}" height="104" rx="4" fill="${W}" ${LINE}/>
    ${lines.map((l, k) => T(cx(i), 468 + k * 22, TEXT, l, `${C} fill="${K}"`)).join("")}
    ${quote ? T(cx(i), 534, LABEL, quote, `${C} fill="${K}"`) : ""}`;
  };
  // one connector: a 3 line with a solid triangular head
  const head = (x, y, a) => `<path d="M0 -8 L15 0 L0 8 Z" fill="${K}" ${LINE} stroke-width="1.5" transform="translate(${x} ${y}) rotate(${a})"/>`;
  const arrow = (i) => { const x1 = gx(i) + pw + 8, x2 = gx(i + 1) - 8, y = 398; return `<path d="M${x1} ${y} H${x2 - 14}" ${LINE} fill="none"/>${head(x2 - 15, y, 0)}`; };
  const rows = [[1, "ALONE"], [2, "+ CHART"], [4, "+ TOOLS"], [5, "+ CHECKS"]].map(([v, t], i) => {
    const y = 70 + i * 22;
    return `${T(984, y + 12, LABEL, t, `text-anchor="end" fill="${K}"`)}<rect x="994" y="${y}" width="${v * 44}" height="14" rx="3" fill="${[GREY, BL, Y, R][i]}" ${LINE} stroke-width="2.5"/>${T(994 + v * 44 + 10, y + 13, LABEL, v, `fill="${K}"`)}`;
  }).join("");
  const [a, b, c, d] = [0, 1, 2, 3].map(cx);

  return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" ${F}>
  <rect width="1280" height="720" fill="${W}"/>

  <rect x="40" y="28" width="196" height="32" fill="${Y}" ${LINE}/>
  ${T(138, 50, LABEL + 1, "PART 4 · AGENTS", `${C} fill="${K}"`)}
  ${T(40, 124, DISPLAY, `AN AGENT IS A MODEL IN A <tspan fill="${R}">LOOP</tspan>`, `fill="${K}" letter-spacing="-.5"`)}
  <rect x="872" y="28" width="368" height="136" rx="4" fill="${PAPER}" ${LINE}/>
  ${T(892, 54, LABEL, "QUESTIONS RIGHT, OF 5", `fill="${K}"`)}
  ${rows}

  <!-- 1 Rosa's chart: a pile of folders -->
  ${panel(0, "ROSA’S CHART", ["612 NOTES"])}
  <g ${LINE}>
    ${[0, 1, 2, 3].map((k) => { const x = a - 70 + (k % 2) * 8, y = 396 - k * 30; return `<rect x="${x}" y="${y}" width="132" height="28" rx="3" fill="${k % 2 ? MAN : "#e8b04f"}"/>`; }).join("")}
    <path d="M${a - 54} 306 v-10 h40 v10" fill="${MAN}"/>
  </g>

  <!-- 2 Model: reads, decides -->
  ${panel(1, "MODEL", ["READS, DECIDES", "THE NEXT STEP"])}
  <g ${LINE}>
    <path d="M${b} 318 C${b - 22} 306 ${b - 56} 304 ${b - 82} 312 V408 C${b - 56} 400 ${b - 22} 402 ${b} 414 Z" fill="${W}"/>
    <path d="M${b} 318 C${b + 22} 306 ${b + 56} 304 ${b + 82} 312 V408 C${b + 56} 400 ${b + 22} 402 ${b} 414 Z" fill="${W}"/>
    <path d="M${b - 66} 334 C${b - 48} 330 ${b - 28} 330 ${b - 14} 336 M${b - 66} 354 C${b - 48} 350 ${b - 28} 350 ${b - 14} 356 M${b - 66} 374 C${b - 48} 370 ${b - 28} 370 ${b - 14} 376 M${b + 14} 336 C${b + 28} 330 ${b + 48} 330 ${b + 66} 334 M${b + 14} 356 C${b + 28} 350 ${b + 48} 350 ${b + 66} 354" fill="none" stroke="${GREY}" stroke-width="2.5"/>
  </g>

  <!-- 3 Tools: a toolbox -->
  ${panel(2, "TOOLS", ["SEARCH · READ A NOTE", "· LABS"])}
  <g ${LINE}>
    <path d="M${c - 6} 360 L${c - 34} 300" fill="none" stroke-width="6"/>
    <circle cx="${c - 40}" cy="288" r="18" fill="${PALE}" stroke-width="4"/>
    <rect x="${c + 2}" y="284" width="48" height="64" rx="3" fill="${W}" transform="rotate(10 ${c + 26} 316)"/>
    <path d="M${c - 16} 362 V318 h16 V362 Z" fill="${W}" transform="rotate(-10 ${c - 8} 340)"/>
    <path d="M${c - 16} 362 V342 h16 V362 Z" fill="${GN}" transform="rotate(-10 ${c - 8} 340)"/>
    <rect x="${c - 84}" y="356" width="168" height="64" rx="6" fill="${R}"/>
    <path d="M${c - 84} 378 H${c + 84}" fill="none"/><rect x="${c - 14}" y="370" width="28" height="16" rx="3" fill="${Y}"/>
  </g>

  <!-- 4 Answer: the echo report, one line marked -->
  ${panel(3, "ANSWER", ["EF 30%", "METOPROLOL TARTRATE", "→ A GAP"], "“LVEF 30%” · ECHO, 10/02")}
  <g ${LINE}>
    <rect x="${d - 62}" y="288" width="124" height="136" rx="4" fill="${W}"/>
    <path d="M${d - 44} 312 h88 M${d - 44} 328 h70 M${d - 44} 384 h88 M${d - 44} 400 h56" fill="none" stroke="${GREY}" stroke-width="2.5"/>
    <rect x="${d - 50}" y="344" width="100" height="24" rx="3" fill="${Y}"/>
  </g>

  <!-- the connectors, and the loop round the middle panels -->
  ${arrow(0)}${arrow(2)}
  <path d="M${b} ${top - 8} C${b + 40} 164 ${c - 40} 164 ${c} ${top - 8}" fill="none" ${LINE}/>${head(c - 8, top - 21, 58)}
  <path d="M${c} ${bot + 8} C${c - 40} 632 ${b + 40} 632 ${b} ${bot + 8}" fill="none" ${LINE}/>${head(b + 8, bot + 21, 238)}
  ${T(640, 172, TEXT, "THINK → ACT", `${C} fill="${K}"`)}
  ${T(640, 640, TEXT, "← OBSERVE", `${C} fill="${K}"`)}

  ${T(40, 698, LABEL, "QCOR 2026 · BUILD AN AGENT, LIVE", `fill="${K}"`)}
  ${T(1240, 698, LABEL, "14", `text-anchor="end" fill="${K}"`)}
</svg>`;
})();

const ic = (body) => `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><g stroke="${K}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">${body}</g></svg>`;
const icons = [
  ["patient", ic(person(24, false, BL, 2.6))],
  ["heart", ic(`<path d="M24 42 C14 35 5 28 5 18.5 C5 12 9.5 7.5 15 7.5 C19 7.5 22.3 10 24 13.5 C25.7 10 29 7.5 33 7.5 C38.5 7.5 43 12 43 18.5 C43 28 34 35 24 42 Z" fill="${R}"/>`)],
  ["pill", ic(`<g transform="rotate(-45 24 24)"><path d="M24 15 H15 A9 9 0 0 0 15 33 H24 Z" fill="${R}"/><path d="M24 15 H33 A9 9 0 0 1 33 33 H24 Z" fill="${W}"/></g>`)],
  ["note", ic(`<path d="M9 4 H31 L39 12 V44 H9 Z" fill="${W}"/><path d="M31 4 V12 H39" fill="${PALE}"/><path d="M15 21 H33 M15 28 H33 M15 35 H26" fill="none"/>`)],
  ["search", ic(`<path d="M29 29 L42 42" stroke-width="6"/><circle cx="20" cy="20" r="13" fill="${PALE}" stroke-width="3.6"/>`)],
  ["database", ic(`<path d="M8 11 V37 C8 41 15 44 24 44 C33 44 40 41 40 37 V11" fill="${Y}"/><ellipse cx="24" cy="11" rx="16" ry="6" fill="${MAN}"/><path d="M8 20 C8 24 15 27 24 27 C33 27 40 24 40 20 M8 29 C8 33 15 36 24 36 C33 36 40 33 40 29" fill="none"/>`)],
  ["tool", ic(`<path d="M27 5 C34 3.5 41 8 42 15 L35 15 L33 21 L39 22 C36 28 28 29 24 25 L11 38 C9 40 6 37 8 35 L21 22 C18 16 21 8 27 5 Z" fill="${GREY}"/>`)],
  ["agent", ic(`<path d="M41 24 A17 17 0 1 1 35 11" fill="none" stroke-width="4"/><path d="M28 4.5 L42 9.5 L32.5 19 Z" fill="${K}"/><circle cx="24" cy="24" r="7.5" fill="${R}"/>`)],
  ["check", ic(`<circle cx="24" cy="24" r="20" fill="${GN}"/><path d="M14 24.5 L21.5 32 L35 17" fill="none" stroke-width="5"/>`)],
  ["warning", ic(`<path d="M24 4.5 L45 42 H3 Z" fill="${Y}"/><path d="M24 16 V29" stroke-width="4.5"/><circle cx="24" cy="35.5" r="1.6" fill="${K}" stroke-width="2.4"/>`)],
];

export default {
  id: "comic",
  name: "Ligne claire",
  after: "the Belgian clear-line school (Hergé, Edgar P. Jacobs): uniform contour, flat colour, caption boxes",
  note: "The slide is a strip of four equal panels (Rosa's chart, the model, the tools, the answer), each a clear-line object over a lettered card, with the Think → Act → Observe loop drawn round the middle two. Tells the agent as a sequence, which suits a live build: one panel per step.",
  palette: [[K, "line"], [Y, "caption yellow"], [R, "red"], [BL, "blue"], [GN, "green"], [SKIN, "skin"]],
  type: "Chalkboard SE Bold, capitals, for all lettering",
  ground: PAPER,
  people,
  slide,
  icons,
};
