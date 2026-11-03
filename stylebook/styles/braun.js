// Braun / Rams: warm greys, off-white, one orange, a green indicator; grilles, dials, buttons; one calm control panel.
const PAPER = "#e9e6df", FACE = "#f5f3ee", MOD = "#ebe8e1", BODY = "#d7d3cb", MID = "#aaa69d", DK = "#34332f", SUB = "#7d7a72", OR = "#e8642c", GR = "#5fae4e";
const H = `font-family="'Helvetica Neue', Helvetica, Arial, sans-serif"`;

const dots = (x, y, cols, rows, step, r, fill) => {
  let s = "";
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) s += `<circle cx="${x + i * step}" cy="${y + j * step}" r="${r}" fill="${fill}"/>`;
  return s;
};
const ticks = (x, y, r1, r2, n, w, c) => [...Array(n)].map((_, k) => {
  const a = (k / n) * Math.PI * 2;
  return `<line x1="${(x + r1 * Math.cos(a)).toFixed(1)}" y1="${(y + r1 * Math.sin(a)).toFixed(1)}" x2="${(x + r2 * Math.cos(a)).toFixed(1)}" y2="${(y + r2 * Math.sin(a)).toFixed(1)}" stroke="${c}" stroke-width="${w}"/>`;
}).join("");
const T = (x, y, s, size = 15, w = 400, fill = DK, extra = "") => `<text x="${x}" y="${y}" font-size="${size}" font-weight="${w}" fill="${fill}" ${extra}>${s}</text>`;

// filled pictograms on a 48 grid, printed in dark grey on an off-white button
const PIC = {
  man: `<circle cx="24" cy="15" r="7.5"/><path d="M10 39 C10 30.5 16 26.5 24 26.5 C32 26.5 38 30.5 38 39 Z"/>`,
  woman: `<circle cx="24" cy="15" r="7.5"/><circle cx="24" cy="6" r="4"/><path d="M10 39 C10 30.5 16 26.5 24 26.5 C32 26.5 38 30.5 38 39 Z"/>`,
  heart: `<path d="M24 39 C12 31 9 25 9 19.5 C9 14.8 12.6 11.5 16.8 11.5 C20 11.5 22.6 13.4 24 16 C25.4 13.4 28 11.5 31.2 11.5 C35.4 11.5 39 14.8 39 19.5 C39 25 36 31 24 39 Z"/>`,
  pill: `<g transform="rotate(-45 24 24)"><path d="M23 17 H17 A7 7 0 0 0 17 31 H23 Z"/><path d="M25 17 H31 A7 7 0 0 1 31 31 H25 Z"/></g>`,
  note: `<path d="M13 8 H28 L35 15 V40 H13 Z M17.5 21 V24 H30.5 V21 Z M17.5 27.5 V30.5 H30.5 V27.5 Z M17.5 34 V37 H25 V34 Z" fill-rule="evenodd"/>`,
  search: `<path d="M21 9 A12 12 0 1 1 21 33 A12 12 0 1 1 21 9 Z M21 13.5 A7.5 7.5 0 1 0 21 28.5 A7.5 7.5 0 1 0 21 13.5 Z" fill-rule="evenodd"/><path d="M28.5 31.5 L31.5 28.5 L39.5 36.5 L36.5 39.5 Z"/>`,
  database: `<rect x="11" y="10" width="26" height="7" rx="3.5"/><rect x="11" y="20.5" width="26" height="7" rx="3.5"/><rect x="11" y="31" width="26" height="7" rx="3.5"/>`,
  tool: `<path d="M31 9 A8.5 8.5 0 1 0 39 17 L34 18.5 L29.5 14 Z"/><path d="M24.5 20.5 L27.5 23.5 L13.5 37.5 A2.1 2.1 0 0 1 10.5 34.5 Z"/>`,
  agent: `<path d="M24 10 A14 14 0 1 0 38 24 H33.5 A9.5 9.5 0 1 1 24 14.5 Z"/><path d="M24 5 L32.5 12.2 L24 19.5 Z"/><circle cx="24" cy="24" r="4"/>`,
  check: `<path d="M12.5 24 L16 20.5 L21 25.5 L32 14.5 L35.5 18 L21 32.5 Z"/>`,
  warning: `<path d="M24 9 L40 37 H8 Z M22.2 19 V28 H25.8 V19 Z M22.2 30.5 V34 H25.8 V30.5 Z" fill-rule="evenodd"/>`,
};
const button = (k, id) => `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <defs><radialGradient id="braun-cap-${id}" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="${FACE}"/></radialGradient></defs>
  <circle cx="24" cy="25.5" r="22" fill="#000" opacity=".12"/><circle cx="24" cy="24" r="22" fill="url(#braun-cap-${id})"/><circle cx="24" cy="24" r="21.5" fill="none" stroke="#d6d2c9"/>
  <g fill="${DK}" transform="translate(9.6 9.6) scale(.6)">${PIC[k]}</g></svg>`;

// ---------- people: two of the buttons, larger ----------
const people = `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="braun-pc" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="${FACE}"/></radialGradient>
    <filter id="braun-psh" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter>
  </defs>
  ${[[106, "man"], [294, "woman"]].map(([x, k]) => `
    <circle cx="${x}" cy="158" r="84" fill="#000" opacity=".16" filter="url(#braun-psh)"/>
    <circle cx="${x}" cy="150" r="84" fill="url(#braun-pc)"/><circle cx="${x}" cy="150" r="83.5" fill="none" stroke="#d6d2c9"/>
    <g fill="${DK}" transform="translate(${x - 52.8} ${150 - 52.8}) scale(2.2)">${PIC[k]}</g>`).join("")}
</svg>`;

// ---------- slide ----------
const slide = (() => {
  const lv = [[1, "Model alone"], [2, "+ chart pasted"], [4, "+ tools"], [5, "+ checks"]].map(([v, t], i) => {
    const x = 940 + i * 66;
    let seg = "";
    for (let k = 0; k < 5; k++) seg += `<rect x="${x}" y="${200 - k * 20}" width="40" height="14" rx="3" fill="${k < v ? (k === 4 ? OR : DK) : "#d9d5cd"}"/>`;
    return `${seg}${T(x + 20, 112, v, 15, 500, DK, 'text-anchor="middle"')}${t.split(" ").length > 2 ? T(x + 20, 236, "+ chart", 11.5, 400, SUB, 'text-anchor="middle"') + T(x + 20, 250, "pasted", 11.5, 400, SUB, 'text-anchor="middle"') : T(x + 20, 236, t, 11.5, 400, SUB, 'text-anchor="middle"')}`;
  }).join("");

  const MY = 332, MW = 200, MH = 236, CY = MY + 92, X = [112, 360, 720, 968];
  const mod = (x, name, detail) => `<rect x="${x}" y="${MY}" width="${MW}" height="${MH}" rx="16" fill="${MOD}"/>
    ${T(x + 20, MY + 192, name, 15, 500)}${detail.map((d, i) => T(x + 20, MY + 212 + i * 17, d, 13, 400, SUB)).join("")}`;
  const btn = (x) => `<circle cx="${x}" cy="${CY + 2}" r="22" fill="#000" opacity=".15" filter="url(#braun-bsh)"/><circle cx="${x}" cy="${CY}" r="22" fill="${DK}"/>`;

  return `<svg viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg" ${H}>
  <defs>
    <radialGradient id="braun-dial" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="${FACE}"/><stop offset="1" stop-color="#dad6ce"/></radialGradient>
    <filter id="braun-dsh" x="-10%" y="-20%" width="120%" height="150%"><feGaussianBlur stdDeviation="12"/></filter>
    <filter id="braun-bsh" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
    <marker id="braun-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 1 L9 5 L0 9 Z" fill="${DK}"/></marker>
  </defs>
  <rect width="1280" height="720" fill="${PAPER}"/>

  ${T(64, 66, "Part 4 · Agents", 15, 500, SUB)}
  ${T(62, 140, "An agent is a model in a loop", 50, 500, DK, 'letter-spacing="-1"')}

  <rect x="916" y="40" width="300" height="220" rx="18" fill="${FACE}" stroke="#d6d2c9"/>
  ${T(936, 70, "Questions right, of 5", 13, 500, SUB)}
  ${lv}

  <rect x="64" y="296" width="1152" height="320" rx="30" fill="#000" opacity=".16" filter="url(#braun-dsh)" transform="translate(0 10)"/>
  <rect x="64" y="288" width="1152" height="320" rx="30" fill="${BODY}"/>
  <rect x="76" y="300" width="1128" height="296" rx="22" fill="${FACE}"/>

  <g>
    ${mod(X[0], "rosa’s chart", ["612 notes"])}
    ${dots(X[0] + 28, CY - 54, 9, 7, 18, 4.2, DK)}

    ${mod(X[1], "model", ["reads, decides", "the next step"])}
    ${ticks(X[1] + MW / 2, CY, 70, 76, 48, 1.2, MID)}
    <circle cx="${X[1] + MW / 2}" cy="${CY + 4}" r="62" fill="#000" opacity=".16" filter="url(#braun-bsh)"/>
    <circle cx="${X[1] + MW / 2}" cy="${CY}" r="62" fill="url(#braun-dial)"/>
    <circle cx="${X[1] + MW / 2}" cy="${CY}" r="61.5" fill="none" stroke="#d3cfc6"/>
    <line x1="${X[1] + MW / 2}" y1="${CY - 54}" x2="${X[1] + MW / 2}" y2="${CY - 34}" stroke="${OR}" stroke-width="5" stroke-linecap="round" transform="rotate(40 ${X[1] + MW / 2} ${CY})"/>

    ${mod(X[2], "tools", ["search · read a note", "labs"])}
    ${btn(X[2] + 44)}${btn(X[2] + 100)}${btn(X[2] + 156)}

    ${mod(X[3], "answer", ["“LVEF 30%”", "Echo, 10/02"])}
    <rect x="${X[3] + 16}" y="${MY + 16}" width="${MW - 32}" height="148" rx="10" fill="${DK}"/>
    <circle cx="${X[3] + MW - 32}" cy="${MY + 34}" r="4.5" fill="${GR}"/>
    ${T(X[3] + 32, MY + 74, "EF 30%", 36, 300, FACE)}
    ${T(X[3] + 32, MY + 112, "metoprolol tartrate", 15, 400, FACE)}
    ${T(X[3] + 32, MY + 134, "→ a gap", 15, 400, FACE)}

    <g fill="none" stroke="${DK}" stroke-width="2.5">
      <path d="M${X[0] + MW + 8} ${CY} H${X[1] - 8}" marker-end="url(#braun-ah)"/>
      <path d="M${X[1] + MW + 8} ${CY - 28} C${X[1] + MW + 52} ${CY - 74} ${X[2] - 52} ${CY - 74} ${X[2] - 8} ${CY - 28}" marker-end="url(#braun-ah)"/>
      <path d="M${X[2] - 8} ${CY + 28} C${X[2] - 52} ${CY + 74} ${X[1] + MW + 52} ${CY + 74} ${X[1] + MW + 8} ${CY + 28}" marker-end="url(#braun-ah)"/>
      <path d="M${X[2] + MW + 8} ${CY} H${X[3] - 8}" marker-end="url(#braun-ah)"/>
    </g>
    ${T((X[1] + MW + X[2]) / 2, CY - 82, "think → act → observe", 13, 500, DK, 'text-anchor="middle"')}
  </g>

  <line x1="64" y1="664" x2="1216" y2="664" stroke="${MID}" stroke-width="1"/>
  ${T(64, 692, "QCOR 2026 · Build an agent, live", 13, 500, SUB)}
  ${T(1216, 692, "14", 13, 500, DK, 'text-anchor="end"')}
</svg>`;
})();

const icons = [["patient", "man"], ["heart"], ["pill"], ["note"], ["search"], ["database"], ["tool"], ["agent"], ["check"], ["warning"]]
  .map(([n, k], i) => [n, button(k || n, i)]);

export default {
  id: "braun",
  name: "Braun / Rams",
  after: "Dieter Rams and Dietrich Lubs at Braun (T 1000, SK 4, ET 66) and their manuals; “less, but better”",
  note: "The agent as an object you could own: four equal modules on one panel. The chart is a speaker grille, the model a dial, tools three round buttons, the answer a lit display, the scores a level meter. Orange marks the dial and the top score; green says the answer was checked.",
  palette: [[PAPER, "paper"], [FACE, "off-white"], [BODY, "warm grey"], [DK, "dark grey"], [OR, "orange #e8642c"], [GR, "green indicator"]],
  type: "Helvetica Neue Medium for titles and labels (in place of Akzidenz-Grotesk), Light for the display",
  ground: PAPER,
  css: "",
  people,
  slide,
  icons,
};
