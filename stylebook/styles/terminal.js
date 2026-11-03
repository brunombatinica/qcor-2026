// Terminal: a calm full-screen TUI on a phosphor screen. One 132 × 36 character grid, box-drawing panes, block bars.
const MONO = `"SF Mono", ui-monospace, Menlo, Monaco, monospace`;
const BG = "#050a06", G = "#3dff7a", GD = "#1c8a3e", GB = "#c8ffd6", A = "#ffb000";
const COLS = 132, ROWS = 36, FS = 16, CW = FS * 0.6021, LH = 20; // Menlo advance = 0.602 em

// ---------- a tiny character-cell canvas ----------
function screen(cols, rows) {
  const ch = [...Array(rows)].map(() => Array(cols).fill(" "));
  const cl = [...Array(rows)].map(() => Array(cols).fill(""));
  const put = (r, c, s, k = "") => { [...s].forEach((x, i) => { if (r >= 0 && r < rows && c + i >= 0 && c + i < cols) { ch[r][c + i] = x; cl[r][c + i] = k; } }); };
  const box = (r, c, h, w, title = "", k = "gd", tk = "g") => {
    put(r, c, "┌" + "─".repeat(w - 2) + "┐", k);
    for (let i = 1; i < h - 1; i++) { put(r + i, c, "│", k); put(r + i, c + w - 1, "│", k); }
    put(r + h - 1, c, "└" + "─".repeat(w - 2) + "┘", k);
    if (title) put(r, c + 2, ` ${title} `, tk);
  };
  const html = () => ch.map((row, r) => {
    let out = "", cur = null, buf = "";
    const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    row.forEach((x, c) => { const k = cl[r][c]; if (k !== cur) { if (buf) out += cur ? `<span class="s-terminal-${cur}">${esc(buf)}</span>` : esc(buf); buf = ""; cur = k; } buf += x; });
    if (buf) out += cur ? `<span class="s-terminal-${cur}">${esc(buf)}</span>` : esc(buf);
    return out;
  }).join("\n");
  return { put, box, html };
}

// ---------- the slide ----------
const slide = () => {
  const S = screen(COLS, ROWS);
  const { put, box } = S;

  put(1, 2, "Part 4 · Agents", "a");

  // chart pane
  box(1, 88, 7, 42, "questions right, of 5", "gd", "g");
  [[1, "Model alone"], [2, "+ chart pasted"], [4, "+ tools"], [5, "+ checks"]].forEach(([v, t], i) => {
    const r = 3 + i;
    put(r, 90, t.padEnd(15), "g");
    put(r, 105, "░".repeat(20), "dim");
    put(r, 105, "█".repeat(v * 4), i === 3 ? "a" : "g");
    put(r, 127, String(v), i === 3 ? "a" : "gb");
  });

  // four equal boxes, 24 × 11, on one row
  const R0 = 17, H = 9, W = 24, X = [2, 34, 74, 106], M = R0 + 4;
  box(R0, X[0], H, W, "rosa's chart");
  put(R0 + 2, X[0] + 2, "612 notes", "gb");
  box(R0, X[1], H, W, "model");
  put(R0 + 2, X[1] + 2, "reads, decides", "gb"); put(R0 + 3, X[1] + 2, "the next step", "gb");
  box(R0, X[2], H, W, "tools");
  put(R0 + 2, X[2] + 2, "search", "gb"); put(R0 + 3, X[2] + 2, "read a note", "gb"); put(R0 + 4, X[2] + 2, "labs", "gb");
  box(R0, X[3], H, W, "answer", "a", "a");
  put(R0 + 2, X[3] + 2, "EF 30%", "ab");
  put(R0 + 3, X[3] + 2, "metoprolol tartrate", "gb");
  put(R0 + 4, X[3] + 2, "→ a gap", "gb");
  put(R0 + 6, X[3] + 2, "\"LVEF 30%\"", "a");
  put(R0 + 7, X[3] + 2, "Echo, 10/02", "g");

  // connectors: one line, one arrowhead
  put(M, X[0] + W, "──────▶", "g");
  put(M, X[2] + W, "──────▶", "g");
  // the loop between model and tools
  put(M - 2, X[1] + W - 1, "├" + "─".repeat(15) + "▶", "a");
  put(M + 2, X[1] + W, "◀" + "─".repeat(15) + "┤", "a");
  const lab = "think → act → observe";
  put(R0 - 2, Math.round((X[1] + W + X[2]) / 2 - lab.length / 2), lab, "a");

  // footer
  put(33, 2, "─".repeat(128), "dim");
  put(34, 2, "QCOR 2026 · Build an agent, live", "gd");
  put(34, 127, "14", "g");

  return `<div class="s-terminal-slide">
    <pre class="s-terminal-pre">${S.html()}</pre>
    <div class="s-terminal-big" style="left:${2 * CW + 3}px; top:${3 * LH}px">An agent is a model</div>
    <div class="s-terminal-big" style="left:${2 * CW + 3}px; top:${6 * LH}px">in a <span class="s-terminal-a">loop</span><span class="s-terminal-cur">█</span></div>
    <div class="s-terminal-scan"></div>
  </div>`;
};

const css = `
.s-terminal .s-terminal-slide { position: relative; width: 1280px; height: 720px; overflow: hidden; background: radial-gradient(120% 120% at 50% 45%, #0a160c 0%, ${BG} 70%); }
.s-terminal .s-terminal-pre { position: absolute; left: 3px; top: 0; margin: 0; font: ${FS}px/${LH}px ${MONO}; color: ${G}; white-space: pre; text-shadow: 0 0 4px rgba(61,255,122,.3); letter-spacing: 0; font-variant-ligatures: none; }
.s-terminal .s-terminal-big { position: absolute; font: 700 ${FS * 3}px/${LH * 3}px ${MONO}; color: ${GB}; white-space: pre; text-shadow: 0 0 10px rgba(61,255,122,.4); letter-spacing: 0; }
.s-terminal .s-terminal-scan { position: absolute; inset: 0; pointer-events: none; background: repeating-linear-gradient(0deg, rgba(0,0,0,.14) 0 1px, transparent 1px 3px); }
.s-terminal .s-terminal-g { color: ${G}; } .s-terminal .s-terminal-gd { color: ${GD}; text-shadow: none; } .s-terminal .s-terminal-gb { color: ${GB}; }
.s-terminal .s-terminal-a { color: ${A}; text-shadow: 0 0 6px rgba(255,176,0,.35); } .s-terminal .s-terminal-ab { color: ${A}; font-weight: 700; text-shadow: 0 0 6px rgba(255,176,0,.45); }
.s-terminal .s-terminal-dim { color: #145c2a; text-shadow: none; }
.s-terminal .s-terminal-cur { color: ${G}; animation: s-terminal-bl 1.1s steps(1) infinite; }
@keyframes s-terminal-bl { 50% { opacity: 0; } }
`;

// ---------- icons and people: one family of 16 × 16 block-character glyphs, drawn as character cells ----------
const dSeg = (x, y, x1, y1, x2, y2) => { const dx = x2 - x1, dy = y2 - y1, t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy))); return Math.hypot(x - x1 - t * dx, y - y1 - t * dy); };
const inTri = (x, y, a, b, c) => { const s = (p, q, r) => (p[0] - r[0]) * (q[1] - r[1]) - (q[0] - r[0]) * (p[1] - r[1]); const d1 = s([x, y], a, b), d2 = s([x, y], b, c), d3 = s([x, y], c, a); return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0)); };
const body = (x, y) => y >= 10.8 && y <= 15 && ((x - 8) / 6.8) ** 2 + ((y - 15.4) / 4.8) ** 2 <= 1;
const SHAPE = {
  man: (x, y) => Math.hypot(x - 8, y - 6.6) <= 3 || body(x, y),
  woman: (x, y) => Math.hypot(x - 8, y - 6.6) <= 3 || Math.hypot(x - 8, y - 2) <= 1.75 || body(x, y),
  heart: (x, y) => { const u = (x - 8) / 6.2, v = -(y - 7.6) / 6.2; return (u * u + v * v - 1) ** 3 - u * u * v ** 3 <= 0; },
  pill: (x, y) => { const d = dSeg(x, y, 4.5, 11.5, 11.5, 4.5); const p = (x - y) / Math.SQRT2; return d <= 3 && Math.abs(p + 0) > 0.55; },
  note: (x, y) => x >= 3.5 && x <= 12.5 && y >= 1.5 && y <= 14.5 && !(x + (1.5 - y) > 9.2 && x > 9.5) && !((Math.abs(y - 6.5) < 0.6 || Math.abs(y - 9) < 0.6 || (Math.abs(y - 11.5) < 0.6 && x < 9.5)) && x > 5 && x < 11),
  search: (x, y) => Math.abs(Math.hypot(x - 6.8, y - 6.8) - 4.2) <= 1.15 || dSeg(x, y, 10.2, 10.2, 14, 14) <= 1.25,
  database: (x, y) => x >= 2.5 && x <= 13.5 && ((y >= 2 && y <= 4.6) || (y >= 6.7 && y <= 9.3) || (y >= 11.4 && y <= 14)),
  tool: (x, y) => (Math.hypot(x - 10.5, y - 5.5) <= 3.6 && !(dSeg(x, y, 10.5, 5.5, 14.5, 1.5) <= 1.1)) || dSeg(x, y, 2.8, 13.2, 9, 7) <= 1.35,
  agent: (x, y) => { const r = Math.hypot(x - 8, y - 8.5), a = Math.atan2(y - 8.5, x - 8); return (Math.abs(r - 5.4) <= 1.1 && !(a > -1.7 && a < -0.55)) || inTri(x, y, [7, 1.2], [12.2, 3.5], [7.6, 6.4]) || r <= 1.6; },
  check: (x, y) => dSeg(x, y, 2.5, 8.5, 6.3, 12.3) <= 1.35 || dSeg(x, y, 6.3, 12.3, 13.5, 4) <= 1.35,
  warning: (x, y) => inTri(x, y, [8, 1.5], [15, 14.2], [1, 14.2]) && !(Math.abs(x - 8) < 0.9 && ((y > 5.5 && y < 10.2) || (y > 11.3 && y < 12.9))),
};
const cells = (k, x0, y0, s, c) => {
  let out = "";
  for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) if (SHAPE[k](i + 0.5, j + 0.5)) out += `<rect x="${(x0 + i * s).toFixed(2)}" y="${(y0 + j * s).toFixed(2)}" width="${(s * 0.86).toFixed(2)}" height="${(s * 0.86).toFixed(2)}" rx="${(s * 0.12).toFixed(2)}"/>`;
  return `<g fill="${c}" style="filter: drop-shadow(0 0 ${s * 0.6}px rgba(61,255,122,.45))">${out}</g>`;
};
const icon = (k) => `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">${cells(k, 4, 4, 2.5, G)}</svg>`;
const people = `<svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg">${cells("man", 30, 50, 10, G)}${cells("woman", 210, 50, 10, G)}</svg>`;

const icons = [["patient", "man"], ["heart"], ["pill"], ["note"], ["search"], ["database"], ["tool"], ["agent"], ["check"], ["warning"]].map(([n, k]) => [n, icon(k || n)]);

export default {
  id: "terminal",
  name: "Terminal",
  after: "VT100 and green-phosphor CRTs; full-screen TUIs; DEC double-size lines",
  note: "The whole slide is one 132 × 36 character grid: four equal box-drawing panes, block-character bars, the title in triple-size characters, amber for the loop and the answer. It shows the agent the way it really runs, as text, and it could be the live demo itself.",
  palette: [[BG, "phosphor black"], [G, "phosphor green"], [GD, "dim green"], [GB, "bright"], [A, "amber"]],
  type: "Menlo (SF Mono where installed) at 16 px on a 132-column grid; 3× for the title",
  ground: BG,
  iconInk: G,
  css,
  people,
  slide,
  icons,
};
