// Risograph: three drums (yellow, fluorescent pink, blue), each a separate layer printed with multiply and a
// little out of register. Text always sits on paper or on flat ink; halftone (generated dots) only fills shapes.
const P = "#ff48b0", B = "#0078bf", Y = "#ffe800", PAPER = "#f4efe3";
const DIN = `font-family="'DIN Condensed', 'Avenir Next Condensed', sans-serif" font-weight="700"`;
const TW = `font-family="'American Typewriter', 'Courier New', monospace" font-weight="600"`;
const DISPLAY = 88, NAME = 28, TEXT = 17, LABEL = 13;

// halftone: dots on a grid rotated by `ang`, radius from f(x, y) in 0..1, kept where inside(x, y)
const halftone = (x0, y0, x1, y1, step, ang, f, inside, color) => {
  const out = [], a = (ang * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0) / 2;
  for (let u = -R; u <= R; u += step) for (let v = -R; v <= R; v += step) {
    const x = cx + u * ca - v * sa, y = cy + u * sa + v * ca;
    if (x < x0 || x > x1 || y < y0 || y > y1 || !inside(x, y)) continue;
    const r = Math.max(0, Math.min(1, f(x, y))) * step * 0.62;
    if (r > 0.3) out.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}"/>`);
  }
  return `<g fill="${color}">${out.join("")}</g>`;
};
const inCircle = (cx, cy, r) => (x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;

// speckled ink and paper grain, both kept subtle
const defs = (p) => `
  <filter id="${p}-ink" x="-5%" y="-5%" width="110%" height="110%">
    <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="1" seed="3" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="1" result="rough"/>
    <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="9" result="m"/>
    <feColorMatrix in="m" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -22 0 0 0 6.1" result="holes"/>
    <feComposite in="rough" in2="holes" operator="out"/>
  </filter>
  <filter id="${p}-grain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="3" seed="5"/>
    <feColorMatrix type="matrix" values="0 0 0 0 .45  0 0 0 0 .4  0 0 0 0 .33  0 0 0 .12 0"/>
  </filter>`;
const layer = (p, dx, dy, body) => `<g transform="translate(${dx} ${dy})" filter="url(#${p}-ink)" style="mix-blend-mode:multiply">${body}</g>`;
const print = (p, w, h, yellow, pink, blue, paper = true) => `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>${defs(p)}</defs>
  ${paper ? `<rect width="${w}" height="${h}" fill="${PAPER}"/>` : ""}
  ${layer(p, 0, 0, yellow)}${layer(p, 2, -1.5, pink)}${layer(p, -1.5, 1, blue)}
  ${paper ? `<rect width="${w}" height="${h}" filter="url(#${p}-grain)" style="mix-blend-mode:multiply"/>` : ""}
</svg>`;

// a person: a disc and a shoulder; the woman adds a bun
const person = (cx, bun, ink) => `<g fill="${ink}">${bun ? `<circle cx="${cx}" cy="104" r="17"/>` : ""}<circle cx="${cx}" cy="168" r="44"/>
  <path d="M${cx - 92} 316 C${cx - 92} 252 ${cx - 50} 228 ${cx} 228 C${cx + 50} 228 ${cx + 92} 252 ${cx + 92} 316 Z"/></g>`;
const people = print("riso-p", 400, 400, "", person(250, true, P), person(150, false, B), false);

const slide = (() => {
  const T = (x, y, s, f, t, extra = "") => `<text x="${x}" y="${y}" font-size="${s}" ${f} ${extra}>${t}</text>`;
  // four equal nodes; names and text at shared offsets
  const nw = 216, top = 344, nh = 176, xs = [64, 352, 712, 1000];
  const fills = [Y, P, Y, P];
  const nodeText = (x, name, lines, quote) => `${T(x + 18, top + 42, NAME, DIN, name, `fill="${B}"`)}
    ${lines.map((l, i) => T(x + 18, top + 76 + i * 22, TEXT, TW, l, `fill="${B}"`)).join("")}
    ${quote ? T(x + 18, top + 156, LABEL, TW, quote, `fill="${B}"`) : ""}`;
  // one connector: 5 wide, one triangular head
  const head = (x, y, a) => `<path d="M0 -9 L16 0 L0 9 Z" fill="${B}" transform="translate(${x} ${y}) rotate(${a})"/>`;
  const arrow = (x1, x2, y) => `<path d="M${x1} ${y} H${x2 - 14}" stroke="${B}" stroke-width="5"/>${head(x2 - 16, y, 0)}`;
  // the score: halftone bars, denser toward the base
  const base = 240, u = 28;
  const bars = [[1, B, "alone"], [2, B, "+ chart"], [4, P, "+ tools"], [5, P, "+ checks"]].map(([v, c, t], i) => ({ v, c, t, x: 884 + i * 84, y: base - v * u }));
  const barDots = (ink) => bars.filter((b) => b.c === ink).map((b) => halftone(b.x, b.y, b.x + 52, base, 5, ink === B ? 15 : 75, (x, y) => 0.55 + (y - b.y) / 400, () => true, ink)).join("");

  const yellow = `${[0, 2].map((i) => `<rect x="${xs[i]}" y="${top}" width="${nw}" height="${nh}" fill="${Y}"/>`).join("")}`;
  const pink = `
    ${T(64, 72, 15, TW, "PART 4 · AGENTS", `letter-spacing="3" fill="${P}"`)}
    <text x="62" y="244" font-size="${DISPLAY}" ${DIN}><tspan fill="none">A MODEL IN A </tspan><tspan fill="${P}">LOOP</tspan></text>
    ${[1, 3].map((i) => `<rect x="${xs[i]}" y="${top}" width="${nw}" height="${nh}" fill="${P}"/>`).join("")}
    ${halftone(584, 380, 696, 492, 7, 75, (x, y) => 0.15 + 0.8 * (Math.hypot(x - 640, y - 436) / 54) ** 2, inCircle(640, 436, 54), P)}
    ${barDots(P)}
    ${T(1216, 684, NAME, DIN, "14", `text-anchor="end" fill="${P}"`)}`;
  const blue = `
    ${T(62, 160, DISPLAY, DIN, "AN AGENT IS", `fill="${B}"`)}
    <text x="62" y="244" font-size="${DISPLAY}" ${DIN}><tspan fill="${B}">A MODEL IN A </tspan><tspan fill="none">LOOP</tspan></text>
    ${T(884, 72, 15, TW, "Questions right, of 5", `fill="${B}"`)}
    ${barDots(B)}
    <path d="M876 ${base} H1216" stroke="${B}" stroke-width="3"/>
    ${bars.map((b) => T(b.x + 26, b.y - 10, NAME, DIN, b.v, `text-anchor="middle" fill="${B}"`) + T(b.x + 26, base + 24, LABEL, TW, b.t, `text-anchor="middle" fill="${B}"`)).join("")}
    ${nodeText(xs[0], "ROSA’S CHART", ["612 notes"])}
    ${nodeText(xs[1], "MODEL", ["reads, decides", "the next step"])}
    ${nodeText(xs[2], "TOOLS", ["search · read a note", "· labs"])}
    ${nodeText(xs[3], "ANSWER", ["EF 30%", "metoprolol tartrate", "→ a gap"], "“LVEF 30%” · Echo, 10/02")}
    ${arrow(xs[0] + nw + 12, xs[1] - 10, top + nh / 2)}${arrow(xs[2] + nw + 12, xs[3] - 10, top + nh / 2)}
    <path d="M548 334 C572 286 708 286 732 334" fill="none" stroke="${B}" stroke-width="5"/>${head(724, 320, 62)}
    <path d="M732 530 C708 578 572 578 548 530" fill="none" stroke="${B}" stroke-width="5"/>${head(556, 544, 242)}
    ${T(640, 274, LABEL + 1, TW, "THINK → ACT", `text-anchor="middle" letter-spacing="2" fill="${B}"`)}
    ${T(640, 606, LABEL + 1, TW, "← OBSERVE", `text-anchor="middle" letter-spacing="2" fill="${B}"`)}
    ${T(64, 684, 14, TW, "QCOR 2026 · Build an agent, live", `letter-spacing="1" fill="${B}"`)}`;
  return print("riso-s", 1280, 720, yellow, pink, blue);
})();

// icons: a flat pink shape under a blue line drawing, a little out of register
const ic = (pink, blue) => `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" style="isolation:isolate">
  <g transform="translate(1.2 -0.8)" fill="${P}" style="mix-blend-mode:multiply">${pink}</g>
  <g transform="translate(-0.8 0.8)" fill="none" stroke="${B}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="mix-blend-mode:multiply">${blue}</g></svg>`;
const heart = "M24 41 C14 34 5.5 27.5 5.5 18.5 C5.5 12.5 10 8 15.5 8 C19.3 8 22.4 10.3 24 13.6 C25.6 10.3 28.7 8 32.5 8 C38 8 42.5 12.5 42.5 18.5 C42.5 27.5 34 34 24 41 Z";
const wrench = "M27 5 C34 3.5 41 8 42 15 L35 15 L33 21 L39 22 C36 28 28 29 24 25 L11 38 C9 40 6 37 8 35 L21 22 C18 16 21 8 27 5 Z";
const icons = [
  ["patient", ic(`<circle cx="24" cy="16" r="8"/><path d="M8 44 C8 33 15 29 24 29 C33 29 40 33 40 44 Z"/>`, `<circle cx="24" cy="16" r="8"/><path d="M8 44 C8 33 15 29 24 29 C33 29 40 33 40 44 Z"/>`)],
  ["heart", ic(`<path d="${heart}"/>`, `<path d="${heart}"/>`)],
  ["pill", ic(`<g transform="rotate(-45 24 24)"><path d="M24 15 H15 A9 9 0 0 0 15 33 H24 Z"/></g>`, `<g transform="rotate(-45 24 24)"><rect x="6" y="15" width="36" height="18" rx="9"/><path d="M24 15 V33"/></g>`)],
  ["note", ic(`<path d="M10 5 H31 L39 13 V43 H10 Z"/>`, `<path d="M10 5 H31 L39 13 V43 H10 Z M31 5 V13 H39 M16 22 H33 M16 29 H33 M16 36 H26"/>`)],
  ["search", ic(`<circle cx="20" cy="20" r="12"/>`, `<circle cx="20" cy="20" r="13"/><path d="M30 30 L42 42"/>`)],
  ["database", ic(`<path d="M8 11 V37 C8 41 16 44 24 44 C32 44 40 41 40 37 V11 Z"/>`, `<ellipse cx="24" cy="11" rx="16" ry="6"/><path d="M8 11 V37 C8 41 16 44 24 44 C32 44 40 41 40 37 V11 M8 20 C8 24 16 27 24 27 C32 27 40 24 40 20 M8 29 C8 33 16 36 24 36 C32 36 40 33 40 29"/>`)],
  ["tool", ic(`<path d="${wrench}"/>`, `<path d="${wrench}"/>`)],
  ["agent", ic(`<circle cx="24" cy="24" r="9"/>`, `<path d="M41 24 A17 17 0 1 1 35 11"/><path d="M29 6 L36 11 L30 18"/>`)],
  ["check", ic(`<circle cx="24" cy="24" r="19"/>`, `<circle cx="24" cy="24" r="19"/><path d="M15 24.5 L21.5 31 L33.5 18"/>`)],
  ["warning", ic(`<path d="M24 5 L44 41 H4 Z"/>`, `<path d="M24 5 L44 41 H4 Z M24 18 V28 M24 34 V34.5"/>`)],
];

export default {
  id: "riso",
  name: "Risograph",
  after: "risograph printing: fluorescent pink, blue and yellow drums, overprint and slight misregistration",
  note: "Three inks printed over each other (multiply), each drum a pixel or two off, on grainy paper: blue type on flat yellow and pink fields, halftone kept to the shapes that carry no text (the loop's disc, the bars). Warm and handmade; feels like a workshop rather than a lecture.",
  palette: [[P, "fluorescent pink"], [B, "riso blue"], [Y, "yellow"], [PAPER, "paper"], ["#7a3f98", "pink × blue"]],
  type: "DIN Condensed Bold for display and names, American Typewriter Semibold for text",
  ground: PAPER,
  people,
  slide,
  icons,
};
