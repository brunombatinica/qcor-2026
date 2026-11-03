// Google Material: Material 3 / Material You. The four colours, tonal surfaces, M3 expressive shapes as containers.
const FONT = `"SF Pro Rounded", ui-rounded, "Avenir Next", Avenir, "Helvetica Neue", sans-serif`;
const BLUE = "#4285f4", RED = "#ea4335", YEL = "#fbbc04", GRN = "#34a853";
const P = "#0b57d0", ON = "#1f1f1f", VAR = "#444746", OUT = "#c4c7c5";
const SURF = "#f8fafd", SC = "#f0f4f9";
const T = { // tonal container, on-container
  b: ["#d3e3fd", "#041e49"], r: ["#ffdad6", "#410e0b"], y: ["#ffefc2", "#3d2e00"], g: ["#c4eed0", "#072711"],
};

// polar M3-ish shapes: r(θ) = R (1 − a + a·cos(nθ)); cookie n = 9, sunny n = 8
function blob(cx, cy, R, n, a, rot = 0) {
  const pts = [];
  for (let i = 0; i < 360; i++) {
    const t = (i / 360) * Math.PI * 2, r = R * (1 - a + a * Math.cos(n * (t - rot)));
    pts.push(`${(cx + r * Math.cos(t)).toFixed(1)} ${(cy + r * Math.sin(t)).toFixed(1)}`);
  }
  return `M${pts.join(" L")} Z`;
}
const cookie = (cx, cy, R) => blob(cx, cy, R, 9, 0.06);
const sunny = (cx, cy, R) => blob(cx, cy, R, 8, 0.05);

// filled glyphs on a 24 grid (Material Symbols, filled style)
const G = {
  man: `<circle cx="12" cy="7.5" r="4"/><path d="M4 20 V18.6 C4 15.6 8.5 14 12 14 S20 15.6 20 18.6 V20 Z"/>`,
  woman: `<circle cx="12" cy="7.5" r="4"/><circle cx="12" cy="2.6" r="2"/><path d="M4 20 V18.6 C4 15.6 8.5 14 12 14 S20 15.6 20 18.6 V20 Z"/>`,
  heart: `<path d="M12 21 L10.6 19.7 C5.4 15 2 11.9 2 8.2 2 5.1 4.4 2.8 7.5 2.8 9.2 2.8 10.9 3.6 12 4.9 13.1 3.6 14.8 2.8 16.5 2.8 19.6 2.8 22 5.1 22 8.2 22 11.9 18.6 15 13.4 19.7 Z"/>`,
  pill: `<path d="M4.9 13.4 L13.4 4.9 A5 5 0 0 1 19.1 10.6 L10.6 19.1 A5 5 0 0 1 4.9 13.4 Z M9.2 9.2 L14.8 14.8" fill-rule="evenodd"/><path d="M8.5 8.5 L15.5 15.5" stroke="#fff" stroke-width="1.6" opacity=".9"/>`,
  note: `<path d="M6 2 H14 L20 8 V20 A2 2 0 0 1 18 22 H6 A2 2 0 0 1 4 20 V4 A2 2 0 0 1 6 2 Z M13 3.5 V9 H18.5 Z M8 13 V15 H16 V13 Z M8 17 V19 H13 V17 Z" fill-rule="evenodd"/>`,
  search: `<path d="M15.5 14 H14.7 L14.4 13.7 A6.5 6.5 0 1 0 13.7 14.4 L14 14.7 V15.5 L19 20.5 20.5 19 Z M9.5 14 A4.5 4.5 0 1 1 9.5 5 A4.5 4.5 0 0 1 9.5 14 Z"/>`,
  database: `<ellipse cx="12" cy="5.5" rx="8" ry="3"/><path d="M4 8.2 C5.6 9.9 8.7 10.6 12 10.6 S18.4 9.9 20 8.2 V11.5 C20 13.2 16.4 14.6 12 14.6 S4 13.2 4 11.5 Z"/><path d="M4 14.3 C5.6 16 8.7 16.7 12 16.7 S18.4 16 20 14.3 V18.5 C20 20.2 16.4 21.5 12 21.5 S4 20.2 4 18.5 Z"/>`,
  tool: `<path d="M22.4 18.6 L13.3 9.5 C14.2 7.2 13.7 4.5 11.8 2.6 9.8 0.6 6.8 0.2 4.4 1.3 L8.7 5.6 5.7 8.6 1.3 4.3 C0.1 6.7 0.6 9.7 2.6 11.7 4.5 13.6 7.2 14.1 9.5 13.2 L18.6 22.3 C19 22.7 19.6 22.7 20 22.3 L22.3 20 C22.8 19.6 22.8 19 22.4 18.6 Z" transform="translate(.6 .6) scale(.95)"/>`,
  agent: `<path d="M12 4 V1 L8 5 12 9 V6 A6 6 0 0 1 17.2 15 L18.7 16.5 A8 8 0 0 0 12 4 Z M12 18 A6 6 0 0 1 6.8 9 L5.3 7.5 A8 8 0 0 0 12 20 V23 L16 19 12 15 Z"/>`,
  check: `<path d="M12 2 A10 10 0 1 0 12 22 A10 10 0 1 0 12 2 Z M10.6 16.6 L5.9 11.9 7.3 10.5 10.6 13.8 16.8 7.6 18.2 9 Z" fill-rule="evenodd"/>`,
  warning: `<path d="M1 21 H23 L12 2 Z M13 18 H11 V16 H13 Z M13 14 H11 V9.5 H13 Z" fill-rule="evenodd"/>`,
};

// ---------- people: two of the icon family, larger ----------
const people = `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
  <path d="${cookie(104, 150, 84)}" fill="${T.b[0]}"/>
  <g transform="translate(60 106) scale(3.66)" fill="${T.b[1]}">${G.man}</g>
  <path d="${cookie(296, 150, 84)}" fill="${T.g[0]}"/>
  <g transform="translate(252 106) scale(3.66)" fill="${T.g[1]}">${G.woman}</g>
</svg>`;

// ---------- slide ----------
const css = `
.s-google .s-google-slide { position: relative; width: 1280px; height: 720px; background: ${SURF}; color: ${ON}; font-family: ${FONT}; overflow: hidden; }
.s-google .s-google-a { position: absolute; }
.s-google .s-google-chip { position: absolute; height: 32px; border-radius: 8px; border: 1px solid ${OUT}; display: flex; align-items: center; padding: 0 14px; font-size: 14px; font-weight: 600; color: ${VAR}; background: #fff; white-space: nowrap; box-sizing: border-box; }
.s-google .s-google-title { font-size: 64px; font-weight: 600; letter-spacing: -1.2px; line-height: 1.1; }
.s-google .s-google-pill { display: inline-block; background: ${P}; color: #fff; border-radius: 999px; padding: 0 28px 4px; }
.s-google .s-google-node { position: absolute; width: 224px; height: 224px; box-sizing: border-box; }
.s-google .s-google-h { font-size: 22px; font-weight: 700; letter-spacing: -.2px; }
.s-google .s-google-b { font-size: 15px; font-weight: 500; line-height: 1.35; }
.s-google .s-google-lab { font-size: 13px; font-weight: 600; letter-spacing: .3px; color: ${VAR}; }
`;

const BARS = [[1, "Model alone", BLUE], [2, "+ chart pasted", RED], [4, "+ tools", YEL], [5, "+ checks", GRN]];
const NY = 352, NC = NY + 112;            // node row: top, centre
const X = [88, 360, 696, 968];            // node lefts: 224 wide, gaps 48 · 112 · 48

const slide = `<div class="s-google-slide">
  <div class="s-google-chip" style="left:64px; top:48px">Part 4 · Agents</div>
  <div class="s-google-a s-google-title" style="left:62px; top:100px">An agent is a model<br>in a <span class="s-google-pill">loop</span></div>

  <div class="s-google-a" style="left:880px; top:40px; width:336px; height:248px; border-radius:28px; background:${SC}">
    <div class="s-google-a" style="left:24px; top:20px; font-size:16px; font-weight:700">Questions right, of 5</div>
    ${[1, 2, 3, 4, 5].map((v) => `<div class="s-google-a" style="left:24px; top:${204 - v * 26}px; width:288px; height:1px; background:${OUT}"></div>`).join("")}
    ${BARS.map(([v, t, c], i) => `
      <div class="s-google-a" style="left:${40 + i * 72}px; top:${204 - v * 26}px; width:48px; height:${v * 26}px; border-radius:24px 24px 4px 4px; background:${c}"></div>
      <div class="s-google-a" style="left:${40 + i * 72}px; top:${204 - v * 26 - 24}px; width:48px; text-align:center; font-size:16px; font-weight:700">${v}</div>
      <div class="s-google-a s-google-lab" style="left:${24 + i * 72}px; top:212px; width:80px; text-align:center; font-size:11.5px; line-height:1.15">${t.replace("chart pasted", "chart<br>pasted")}</div>`).join("")}
  </div>

  <svg class="s-google-a" style="left:0; top:0" width="1280" height="720" viewBox="0 0 1280 720">
    <defs><marker id="google-ah" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M1 1 L9 5 L1 9 Z" fill="${VAR}" stroke="${VAR}" stroke-width="1.5" stroke-linejoin="round"/></marker></defs>
    <path d="${cookie(X[0] + 112, NC, 112)}" fill="${T.b[0]}"/>
    <path d="${sunny(X[1] + 112, NC, 112)}" fill="${P}"/>
    <rect x="${X[2]}" y="${NY}" width="224" height="224" rx="48" fill="${T.y[0]}"/>
    <g fill="none" stroke="${VAR}" stroke-width="3" stroke-linecap="round">
      <path d="M${X[0] + 232} ${NC} H${X[1] - 10}" marker-end="url(#google-ah)"/>
      <path d="M${X[1] + 196} ${NY + 28} C${X[1] + 250} ${NY - 24} ${X[2] - 26} ${NY - 24} ${X[2] + 20} ${NY + 6}" marker-end="url(#google-ah)"/>
      <path d="M${X[2] + 20} ${NY + 218} C${X[2] - 26} ${NY + 248} ${X[1] + 250} ${NY + 248} ${X[1] + 196} ${NY + 196}" marker-end="url(#google-ah)"/>
      <path d="M${X[2] + 232} ${NC} H${X[3] - 10}" marker-end="url(#google-ah)"/>
    </g>
  </svg>
  <div class="s-google-a s-google-lab" style="left:${X[1] + 112}px; top:${NY - 54}px; width:${X[2] - X[1]}px; text-align:center; font-size:15px">Think → Act → Observe</div>

  <div class="s-google-node" style="left:${X[0]}px; top:${NY}px; color:${T.b[1]}; display:flex; flex-direction:column; justify-content:center; align-items:center">
    <div class="s-google-h">Rosa’s chart</div><div class="s-google-b" style="font-size:17px">612 notes</div>
  </div>
  <div class="s-google-node" style="left:${X[1]}px; top:${NY}px; color:#fff; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center">
    <div class="s-google-h" style="font-size:30px">Model</div><div class="s-google-b">reads, decides<br>the next step</div>
  </div>
  <div class="s-google-node" style="left:${X[2]}px; top:${NY}px; color:${T.y[1]}; padding:26px 24px">
    <div class="s-google-h">Tools</div>
    ${["search", "read a note", "labs"].map((t, i) => `<div class="s-google-chip" style="left:24px; top:${72 + i * 44}px; border-color:#e3d7b0">${t}</div>`).join("")}
  </div>
  <div class="s-google-node" style="left:${X[3]}px; top:${NY}px; border-radius:28px; background:#fff; box-shadow: 0 1px 3px rgba(0,0,0,.12), 0 4px 12px rgba(60,64,67,.12); padding:22px 22px">
    <div class="s-google-lab" style="color:#146c2e">ANSWER</div>
    <div style="font-size:42px; font-weight:700; letter-spacing:-1px; margin-top:2px">EF 30%</div>
    <div class="s-google-b" style="color:${VAR}">metoprolol tartrate<br>→ a gap</div>
    <div class="s-google-a" style="left:14px; bottom:14px; width:196px; height:56px; border-radius:14px; background:${SC}">
      <div class="s-google-a" style="left:12px; top:12px; width:4px; height:32px; border-radius:2px; background:${GRN}"></div>
      <div class="s-google-a" style="left:26px; top:8px; font-size:17px; font-weight:700">“LVEF 30%”</div>
      <div class="s-google-a s-google-lab" style="left:26px; top:31px; font-weight:500">Echo, 10/02</div>
    </div>
  </div>

  <div class="s-google-a" style="left:64px; top:672px; font-size:14px; font-weight:600; color:${VAR}">QCOR 2026 · Build an agent, live</div>
  <div class="s-google-a" style="left:1176px; top:662px; width:40px; height:40px; border-radius:20px; background:${T.b[0]}; color:${T.b[1]}; display:grid; place-items:center; font-size:15px; font-weight:700">14</div>
</div>`;

// ---------- icons: filled glyphs, one cookie container, tones cycling through the four colours ----------
const NAMES = ["patient", "heart", "pill", "note", "search", "database", "tool", "agent", "check", "warning"];
const KEY = { patient: "man" };
const TONE = ["b", "r", "y", "g"];
const INK = { b: P, r: "#c5221f", y: "#a05a00", g: "#146c2e" };
const icons = NAMES.map((n, i) => {
  const t = TONE[i % 4];
  return [n, `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="${cookie(24, 24, 23)}" fill="${T[t][0]}"/><g transform="translate(12 12)" fill="${INK[t]}">${G[KEY[n] || n].replace('stroke="#fff"', `stroke="${T[t][0]}"`)}</g></svg>`];
});

export default {
  id: "google",
  name: "Google Material",
  after: "Material 3 and Material You (expressive shapes: cookie, sunny, rounded square); Material Symbols",
  note: "Tonal surfaces and four bright colours, each idea in its own soft container of the same size: the chart a cookie, the model a sunburst in primary blue, tools a tonal square of chips, the answer an elevated card. Friendly and legible from the back of the room.",
  palette: [[BLUE, "blue"], [RED, "red"], [YEL, "yellow"], [GRN, "green"], [P, "primary"], [SC, "surface"]],
  type: "Avenir Next Demi Bold for titles (rounded system faces first), Avenir Next Medium for text",
  ground: SC,
  css,
  people,
  slide,
  icons,
};
