// Apple keynote: black stage, SF, one huge tight sentence with a gradient word, a bento of 28 px cards, SF-Symbols-like glyphs.
const SF = `"SF Pro Display", -apple-system, system-ui, BlinkMacSystemFont, "Helvetica Neue", sans-serif`;
const CARD = "#1c1c1e", CARD2 = "#2c2c2e", GREY = "#86868b", W = "#f5f5f7";
const ORANGE = "#ff9f0a", PINK = "#ff375f", PURPLE = "#bf5af2";
const GRAD = `linear-gradient(95deg, ${ORANGE} 0%, ${PINK} 48%, ${PURPLE} 100%)`;

// one glyph family on a 48 grid, 3 px strokes with round caps; the people are the patient glyph drawn larger
const GLYPH = {
  man: `<circle cx="24" cy="16" r="7"/><path d="M10 41 C10 32 16 28 24 28 C32 28 38 32 38 41"/>`,
  woman: `<path d="M21.4 9.5 A7 7 0 1 0 26.6 9.5 A3.6 3.6 0 1 0 21.4 9.5 Z"/><path d="M10 41 C10 32 16 28 24 28 C32 28 38 32 38 41"/>`,
  heart: `<path d="M24 40 C11 31.5 7 25 7 18.5 C7 13 11 9 16 9 C19.5 9 22.3 11 24 14 C25.7 11 28.5 9 32 9 C37 9 41 13 41 18.5 C41 25 37 31.5 24 40 Z"/>`,
  pill: `<g transform="rotate(-45 24 24)"><rect x="9" y="17" width="30" height="14" rx="7"/><path d="M24 17 V31"/></g>`,
  note: `<path d="M13 6 H28 L36 14 V40 A2 2 0 0 1 34 42 H13 A2 2 0 0 1 11 40 V8 A2 2 0 0 1 13 6 Z"/><path d="M28 6 V14 H36"/><path d="M17 23 H30 M17 29 H30 M17 35 H25"/>`,
  search: `<circle cx="21" cy="21" r="12"/><path d="M30 30 L40 40"/>`,
  database: `<ellipse cx="24" cy="11" rx="14" ry="5"/><path d="M10 11 V37 C10 39.8 16.3 42 24 42 C31.7 42 38 39.8 38 37 V11"/><path d="M10 24 C10 26.8 16.3 29 24 29 C31.7 29 38 26.8 38 24"/>`,
  tool: `<path d="M30.5 7 A9 9 0 0 0 22.5 19 L8.5 33 A3.5 3.5 0 0 0 13.5 38 L27.5 24 A9 9 0 0 0 39.5 16 L34 18.5 L29.5 14 L32 8.5 Z"/>`,
  agent: `<path d="M38.5 21 A15 15 0 0 0 11.8 15"/><path d="M9.5 27 A15 15 0 0 0 36.2 33"/><path d="M40 13.5 L38.5 21 L31.5 18.5"/><path d="M8 34.5 L9.5 27 L16.5 29.5"/>`,
  check: `<circle cx="24" cy="24" r="17"/><path d="M16 24.5 L21.5 30 L32 18.5"/>`,
  warning: `<path d="M21.4 8.5 C22.6 6.5 25.4 6.5 26.6 8.5 L41.5 35 C42.6 37 41.2 39.5 38.9 39.5 H9.1 C6.8 39.5 5.4 37 6.5 35 Z"/><path d="M24 18 V27"/><path d="M24 33 V33.2"/>`,
};
const ic = (k, stroke = W, w = 3) => `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${GLYPH[k]}</svg>`;

// ---------- people: the glyph family at hero size, lit like a keynote reveal ----------
const people = `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="apple-pg" gradientUnits="userSpaceOnUse" x1="0" y1="4" x2="0" y2="42"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#8e8e93"/></linearGradient>
  </defs>
  <g fill="none" stroke="url(#apple-pg)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <g transform="translate(-6 34) scale(4.6)">${GLYPH.man}</g>
    <g transform="translate(174 34) scale(4.6)">${GLYPH.woman}</g>
  </g>
</svg>`;

// ---------- slide ----------
const css = `
.s-apple .s-apple-slide { position: relative; width: 1280px; height: 720px; background: radial-gradient(900px 520px at 18% -12%, #1b1526 0%, #000 62%); color: ${W}; font-family: ${SF}; overflow: hidden; -webkit-font-smoothing: antialiased; }
.s-apple .s-apple-a { position: absolute; }
.s-apple .s-apple-kick { font-size: 21px; font-weight: 600; color: ${GREY}; }
.s-apple .s-apple-title { font-size: 84px; font-weight: 700; letter-spacing: -0.032em; line-height: 0.98; }
.s-apple .s-apple-grad { background: ${GRAD}; -webkit-background-clip: text; background-clip: text; color: transparent; padding-right: 6px; }
.s-apple .s-apple-card { position: absolute; border-radius: 28px; background: linear-gradient(180deg, #232326 0%, ${CARD} 100%); box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 30px 60px rgba(0,0,0,.5); }
.s-apple .s-apple-lab { position: absolute; left: 24px; top: 22px; font-size: 15px; font-weight: 600; color: ${GREY}; }
.s-apple .s-apple-h { font-size: 26px; font-weight: 700; letter-spacing: -0.02em; }
.s-apple .s-apple-t { font-size: 15px; font-weight: 500; color: ${GREY}; line-height: 1.35; }
.s-apple .s-apple-node { position: absolute; width: 168px; height: 168px; border-radius: 40px; box-sizing: border-box; padding: 20px 20px; }
.s-apple .s-apple-chev { position: absolute; width: 36px; height: 36px; border-radius: 18px; background: ${CARD2}; display: grid; place-items: center; }
.s-apple .s-apple-foot { font-size: 14px; font-weight: 500; color: #6e6e73; }
`;

const chev = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${W}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5 L16 12 L9 19"/></svg>`;
const BARS = [[1, "Model alone"], [2, "+ chart pasted"], [4, "+ tools"], [5, "+ checks"]];
const Y0 = 296, H = 344; // bento row

const slide = `<div class="s-apple-slide">
  <div class="s-apple-a s-apple-kick" style="left:72px; top:56px">Part 4 · Agents</div>
  <div class="s-apple-a s-apple-title" style="left:68px; top:96px">An agent is<br>a model in a <span class="s-apple-grad">loop.</span></div>

  <div class="s-apple-card" style="left:896px; top:48px; width:312px; height:216px">
    <div class="s-apple-lab">Questions right, of 5</div>
    ${BARS.map(([v, t], i) => `
      <div class="s-apple-a" style="left:${28 + i * 70}px; top:72px; width:44px; height:100px; border-radius:12px; background:rgba(255,255,255,.06)"></div>
      <div class="s-apple-a" style="left:${28 + i * 70}px; top:${172 - v * 20}px; width:44px; height:${v * 20}px; border-radius:12px; background:${i === 3 ? GRAD.replace("95deg", "0deg") : "#48484a"}"></div>
      <div class="s-apple-a" style="left:${28 + i * 70}px; top:${172 - v * 20 - 26}px; width:44px; text-align:center; font-size:17px; font-weight:700">${v}</div>
      <div class="s-apple-a" style="left:${14 + i * 70}px; top:180px; width:72px; text-align:center; font-size:11.5px; font-weight:500; color:${GREY}; line-height:1.15">${t.replace("chart pasted", "chart<br>pasted")}</div>`).join("")}
  </div>

  <!-- bento: chart → loop → answer -->
  <div class="s-apple-card" style="left:64px; top:${Y0}px; width:272px; height:${H}px">
    <div class="s-apple-lab">Rosa’s chart</div>
    <div class="s-apple-a" style="left:22px; top:178px; font-size:112px; font-weight:700; letter-spacing:-.05em; line-height:1">612</div>
    <div class="s-apple-a s-apple-t" style="left:26px; top:296px; font-size:19px">notes</div>
  </div>
  <div class="s-apple-chev" style="left:342px; top:${Y0 + H / 2 - 18}px">${chev}</div>

  <div class="s-apple-card" style="left:384px; top:${Y0}px; width:512px; height:${H}px">
    <div class="s-apple-lab">Think → Act → Observe</div>
    <svg class="s-apple-a" style="left:0; top:0" width="512" height="${H}" viewBox="0 0 512 ${H}">
      <defs>
        <linearGradient id="apple-arc" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${ORANGE}"/><stop offset=".5" stop-color="${PINK}"/><stop offset="1" stop-color="${PURPLE}"/></linearGradient>
        <filter id="apple-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="20"/></filter>
        <marker id="apple-ah" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4.4" markerHeight="4.4" orient="auto"><path d="M1.5 1 L7.5 5 L1.5 9" fill="none" stroke="${W}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></marker>
      </defs>
      <rect x="40" y="106" width="152" height="152" rx="40" fill="${PINK}" opacity=".45" filter="url(#apple-glow)"/>
      <g fill="none" stroke="${W}" stroke-width="3" stroke-linecap="round">
        <path d="M176 92 C214 44 298 44 336 92" marker-end="url(#apple-ah)"/>
        <path d="M336 272 C298 320 214 320 176 272" marker-end="url(#apple-ah)"/>
      </g>
    </svg>
    <div class="s-apple-node" style="left:32px; top:98px; background:${GRAD.replace("95deg", "135deg")}">
      <div class="s-apple-h">Model</div>
      <div class="s-apple-t" style="color:rgba(255,255,255,.9); margin-top:6px">reads, decides<br>the next step</div>
    </div>
    <div class="s-apple-node" style="left:312px; top:98px; background:${CARD2}; box-shadow: inset 0 1px 0 rgba(255,255,255,.08)">
      <div class="s-apple-h">Tools</div>
      <div class="s-apple-t" style="margin-top:6px">search<br>read a note<br>labs</div>
    </div>
  </div>
  <div class="s-apple-chev" style="left:902px; top:${Y0 + H / 2 - 18}px">${chev}</div>

  <div class="s-apple-card" style="left:944px; top:${Y0}px; width:272px; height:${H}px">
    <div class="s-apple-lab">Answer</div>
    <div class="s-apple-a" style="left:22px; top:58px; font-size:72px; font-weight:700; letter-spacing:-.045em; line-height:1">EF 30%</div>
    <div class="s-apple-a" style="left:24px; top:144px; font-size:20px; font-weight:600; letter-spacing:-.01em; line-height:1.3">metoprolol tartrate<br><span style="color:${GREY}">→</span> a gap</div>
    <div class="s-apple-a" style="left:16px; top:240px; width:240px; height:88px; border-radius:20px; background:rgba(255,255,255,.07)">
      <div class="s-apple-a" style="left:18px; top:16px; font-size:22px; font-weight:700; letter-spacing:-.02em">“LVEF 30%”</div>
      <div class="s-apple-a s-apple-t" style="left:18px; top:50px">Echo, 10/02</div>
    </div>
  </div>

  <div class="s-apple-a s-apple-foot" style="left:72px; top:672px">QCOR 2026 · Build an agent, live</div>
  <div class="s-apple-a s-apple-foot" style="right:64px; top:672px; color:${GREY}; font-weight:600">14</div>
</div>`;

const icons = [
  ["patient", ic("man")], ["heart", ic("heart")], ["pill", ic("pill")], ["note", ic("note")], ["search", ic("search")],
  ["database", ic("database")], ["tool", ic("tool")], ["agent", ic("agent")], ["check", ic("check")], ["warning", ic("warning")],
];

export default {
  id: "apple",
  name: "Apple keynote",
  after: "WWDC keynote slides and bento-grid product pages; SF Pro and SF Symbols",
  note: "A black stage, one huge tight sentence with a single gradient word, and a bento of soft 28 px cards. The gradient means one thing, the loop: the title word, the model and the best score.",
  palette: [["#000000", "stage black"], [CARD, "card"], [W, "near white"], [ORANGE, "orange"], [PINK, "pink"], [PURPLE, "purple"]],
  type: "SF Pro (system-ui) Bold at −3% tracking for titles, Semibold and Medium for text",
  ground: "#000000",
  css,
  people,
  slide,
  icons,
};
