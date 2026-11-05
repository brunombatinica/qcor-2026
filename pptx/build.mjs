// Bruno's section of the QCOR 2026 session as PowerPoint: what an agent is (model → model + context → agent) and how
// to set one up (task, model, data, tools, prompt, guardrails). It ends on a placeholder for guardrails, Lovedeep's talk.
//   node build.mjs  ->  qcor-bruno-agents.pptx        (just pptx; check it with just pptx-render)
//
// The template is Bruno's AHA 2026 faculty talk (misc/aha26-faculty-talk, deck/build.js): its title and disclosure
// slides, a black stage, Apple dark-mode colours, Arial, Font Awesome icons, every object native and editable on theme
// colours. The slides before "Set it up like a remote colleague" are shared with that talk: the language-model, "text is
// a universal interface" and agent slides are ported from it (3 Nov 2026), in our blue and with Rosa; its 4 Nov review
// round is carried over too (bubble.mjs: iMessage bubbles, measured off iOS 26; tool calls and results as bubbles; the
// language model's likeliest words, with bars; the logo footer).
// Each colour means one thing, and nothing else is coloured:
//   blue    the model, and the words it writes (and its context, on the map)
//   green   right: what it wrote matches her chart
//   orange  made up
//   greys   everything else: the patient, her chart, tools, people
// Slides have no titles until the setup; there the title is the step, and the icon bar at the top right shows where we are.
// The model sits on the left and what it is given on the right; chats are iMessage bubbles, yours grey, the model's blue.
// A tool call is the model's bubble, outlined in blue, in monospace; a tool's result is a bubble on your side, outlined
// in white (it goes into the model, like your messages).
//
// What pptxgenjs can't write is added to the slide XML afterwards (postProcess): entrance and exit animations (Fade,
// Wipe, typing letter by letter, words one at a time), video playback, and Morph transitions. Morph pairs objects named
// "!!id" across slides, but it also pairs unnamed shapes of the same kind, so a Morph slide shows only paired objects
// until its first animation; every other object enters by animation. The setup slides fade into each other; only the
// move into the bar, the open models making room for the closed ones, and the prompt box that grows are Morph.
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { applyTheme } from "./theme.mjs";
import { bubbleMetrics, bubblePath, BUBBLE_COLORS } from "./bubble.mjs";

const require = createRequire(import.meta.url);
const pptxgen = require("pptxgenjs");
const sharp = require("sharp");
const JSZip = require("jszip");

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const OUT = here("qcor-bruno-agents.pptx");
const LOGO = (f) => here(`logos/${f}`);

// ---------------------------------------------------------------- theme
const HEX = {
  bg: "000000", text: "F5F5F7", muted: "8E8E93", card: "1C1C1E", raised: "2C2C2E", dim: "3A3A3C", edge: "48484A",
  blue: "0A84FF", green: "30D158", orange: "FF9F0A",
};
// dk1 and lt1 are swapped on purpose: text typed into PowerPoint comes out light on the black stage.
const SLOT = { text: "dk1", bg: "lt1", muted: "dk2", card: "lt2", blue: "accent1", green: "accent2", orange: "accent3", raised: "accent4", dim: "accent5", edge: "accent6" };
const THEME = {
  name: "QCOR 2026", headFontFace: "Arial", bodyFontFace: "Arial",
  colors: { ...Object.fromEntries(Object.entries(SLOT).map(([k, s]) => [s, HEX[k]])), hlink: HEX.blue, folHlink: HEX.muted },
};
const hex = (c) => HEX[c] || c;
const MONO = "Courier New";
// Gradient fills (the faculty talk's): a shape is written with a unique marker colour that postProcess swaps for the
// gradient. Stops are [position 0–1, colour, opacity %]; angle in degrees (90: top to bottom).
const GRADS = new Map();
const gradient = (stops, angle = 0) => {
  const key = "FE" + String(GRADS.size + 1).padStart(4, "0");
  const gs = ([p, c, opacity]) => `<a:gs pos="${Math.round(p * 100000)}"><a:srgbClr val="${hex(c)}">${opacity !== undefined ? `<a:alpha val="${Math.round(opacity * 1000)}"/>` : ""}</a:srgbClr></a:gs>`;
  GRADS.set(key, `<a:gradFill rotWithShape="1"><a:gsLst>${stops.map(gs).join("")}</a:gsLst><a:lin ang="${Math.round(angle * 60000)}" scaled="0"/></a:gradFill>`);
  return key;
};
const CAND_FADE = gradient([[0, "card", 25], [1, "card", 100]], 90); // the candidates below the top three fade into the box

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 × 7.5 in
pres.theme = { headFontFace: "Arial", bodyFontFace: "Arial" };
pres.title = "What is an agent? (QCOR 2026)";
pres.author = "Bruno Batinica";
pres.subject = "QCOR workshop, AHA Scientific Sessions 2026";

const SC = pres.SchemeColor;
// pptxgenjs writes the default colour map: tx1 = dk1, bg1 = lt1, tx2 = dk2, bg2 = lt2.
const SCHEME = { dk1: SC.text1, lt1: SC.background1, dk2: SC.text2, lt2: SC.background2, accent1: SC.accent1, accent2: SC.accent2, accent3: SC.accent3, accent4: SC.accent4, accent5: SC.accent5, accent6: SC.accent6 };
const col = (c) => (SLOT[c] ? SCHEME[SLOT[c]] : c); // theme name → scheme colour; raw hex passes through

const W = 13.333, H = 7.5, M = 0.8, CW = W - 2 * M;

// Arial advance widths (1/1000 em), for laying out words that appear one at a time.
const AW = {
  r: { " ": 278, ",": 278, ".": 278, "-": 333, "/": 278, "(": 333, ")": 333, ":": 278, "'": 191, "’": 222, "?": 556, I: 278, W: 944, M: 833, A: 667, B: 667, C: 722, D: 722, E: 667, F: 611, G: 778, H: 722, J: 500, K: 667, L: 556, N: 722, O: 778, P: 667, Q: 778, R: 722, S: 667, T: 611, U: 722, V: 667, X: 667, Y: 667, Z: 611, a: 556, b: 556, c: 500, d: 556, e: 556, f: 278, g: 556, h: 556, i: 222, j: 222, k: 500, l: 222, m: 833, n: 556, o: 556, p: 556, q: 556, r: 333, s: 500, t: 278, u: 556, v: 500, w: 722, x: 500, y: 500, z: 500 },
  b: { " ": 278, ",": 278, ".": 278, "-": 333, "/": 278, "(": 333, ")": 333, ":": 333, "'": 238, "’": 278, "?": 611, I: 278, W: 944, M: 833, A: 722, B: 722, C: 722, D: 722, E: 667, F: 611, G: 778, H: 722, J: 556, K: 722, L: 611, N: 722, O: 778, P: 667, Q: 778, R: 722, S: 667, T: 611, U: 722, V: 667, X: 667, Y: 667, Z: 611, a: 556, b: 611, c: 556, d: 611, e: 556, f: 333, g: 611, h: 611, i: 278, j: 278, k: 556, l: 278, m: 889, n: 611, o: 611, p: 611, q: 611, r: 389, s: 556, t: 333, u: 611, v: 556, w: 778, x: 556, y: 556, z: 500 },
};
const measure = (t, pt, bold) => [...t].reduce((s, ch) => s + ((bold ? AW.b : AW.r)[ch] ?? 556), 0) / 1000 * pt / 72;

// ---------------------------------------------------------------- layouts (the faculty talk's)
const ph = (name, type, o) => ({ placeholder: { options: { name, type, margin: 0, align: "left", valign: "top", bold: false, ...o, color: col(o.color || "text") }, text: "" } });
pres.defineSlideMaster({
  title: "TITLE", background: { color: HEX.bg },
  objects: [
    ph("title", "title", { x: M, y: 1.25, w: CW, h: 1.3, fontSize: 74, bold: true, valign: "bottom" }),
    ph("subtitle", "body", { x: M, y: 2.6, w: CW, h: 0.6, fontSize: 26, color: "muted" }),
    ph("byline", "body", { x: M, y: 4.7, w: CW, h: 1.3, fontSize: 18 }),
  ],
});
pres.defineSlideMaster({
  title: "CONTENT", background: { color: HEX.bg },
  objects: [ph("title", "title", { x: M, y: 0.55, w: CW, h: 0.9, fontSize: 40, bold: true, valign: "middle" })],
});

// ---------------------------------------------------------------- pictures: icons, the model's glyph, logos, Rosa
// The model's glyph: a small neural network, the same drawing as the network in the language-model animation.
function networkSvg(color) {
  const L = [[24, [30, 50, 70]], [50, [22, 40, 60, 78]], [76, [30, 50, 70]]];
  let edges = "", nodes = "";
  for (let i = 0; i < 2; i++) for (const y1 of L[i][1]) for (const y2 of L[i + 1][1]) edges += `<line x1="${L[i][0]}" y1="${y1}" x2="${L[i + 1][0]}" y2="${y2}"/>`;
  for (const [x, ys] of L) for (const y of ys) nodes += `<circle cx="${x}" cy="${y}" r="6"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g stroke="${color}" stroke-width="2.6" stroke-opacity="0.6">${edges}</g><g fill="${color}">${nodes}</g></svg>`;
}
const toPng = async (svg, density = 300) => "image/png;base64," + (await sharp(Buffer.from(svg), { density }).resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()).toString("base64");
// Font Awesome Free (icons/, CC BY 4.0) in any colour. Some files (from the faculty talk) fill with currentColor.
function iconSvg(name, fill) {
  let svg = readFileSync(here(`icons/${name}.svg`), "utf8").replace(/currentColor/g, fill);
  if (!/<svg[^>]*\sfill=/.test(svg)) svg = svg.replace("<svg ", `<svg fill="${fill}" `);
  return svg;
}
const iconCache = new Map();
// "model" is the network glyph.
function iconData(name, color) {
  const key = name + color, fill = "#" + hex(color);
  if (!iconCache.has(key)) iconCache.set(key, toPng(name === "model" ? networkSvg(fill) : iconSvg(name, fill)));
  return iconCache.get(key);
}
// Model makers' logos (shared/logos, from lobehub/icons) as light silhouettes, so they add no colours of their own.
async function logoData(file) {
  const svg = readFileSync(here(`../shared/logos/${file}.svg`), "utf8").replace(/width="1em"/, 'width="512"').replace(/height="1em"/, 'height="512"');
  const { data, info } = await sharp(Buffer.from(svg), { density: 300 }).resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) { data[i] = 0xF5; data[i + 1] = 0xF5; data[i + 2] = 0xF7; }
  return "image/png;base64," + (await sharp(data, { raw: info }).png().toBuffer()).toString("base64");
}
const rosaData = () => toPng(readFileSync(here("../shared/rosa.svg"), "utf8"), 200);
const pngSize = (file) => { const b = readFileSync(file); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
// A laptop in greys: lid, bezel, dark screen, camera, and the base with its thumb notch. 1600 × 1000; the screen's
// middle is at y 440. One picture, so Morph has nothing to pair it with.
const LAPTOP = { ar: 1.6, screenY: 440 / 1000 };
const laptopData = () => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000">
<rect x="230" y="20" width="1140" height="840" rx="46" fill="#${HEX.edge}"/>
<rect x="262" y="52" width="1076" height="776" rx="18" fill="#101012"/>
<circle cx="800" cy="36" r="7" fill="#${HEX.dim}"/>
<path d="M40 872 H1560 V900 Q1560 958 1490 958 H110 Q40 958 40 900 Z" fill="#${HEX.edge}"/>
<rect x="40" y="860" width="1520" height="22" rx="8" fill="#5A5A5E"/>
<path d="M690 860 H910 V870 Q910 890 888 890 H712 Q690 890 690 870 Z" fill="#${HEX.dim}"/>
</svg>`;
  return sharp(Buffer.from(svg), { density: 200 }).resize({ width: 1600 }).png().toBuffer().then((b) => "image/png;base64," + b.toString("base64"));
};

// ---------------------------------------------------------------- slide context
const SLIDES = []; // { anims, transition, videos } per slide, for the XML pass

class Ctx {
  constructor(layout, o = {}) {
    this.idx = SLIDES.length + 1;
    this.slide = pres.addSlide({ masterName: layout });
    this.anims = [];
    this.videos = [];
    this.n = 0;
    this.ops = []; // every object, in drawing order; added by done(), once the pictures are ready
    for (const k of ["title", "subtitle", "byline"]) if (o[k] !== undefined) this.slide.addText(runs(o[k]), { placeholder: k });
    if (o.notes) this.slide.addNotes(o.notes.trim());
    SLIDES.push({ anims: this.anims, transition: o.transition || "fade", videos: this.videos });
    if (o.bar !== undefined) setupBar(this, o.bar);
  }
  name(o, kind) { return o.morph ? `!!${o.morph}` : `${o.name || `${kind} ${++this.n}`} #${this.idx}`; }
  add(fn, data) { this.ops.push({ fn, data }); }

  text(text, x, y, w, h, o = {}) {
    const name = this.name(o, "Text");
    const { fontSize = 18, color = "text", bold, italic, align = "left", valign = "top", fill, line, rectRadius, lineSpacingMultiple, paraSpaceAfter } = o;
    const opts = {
      x, y, w, h, fontSize, bold: !!bold, italic: !!italic, color: col(color), align, valign, margin: o.margin ?? 0, isTextBox: true, objectName: name,
      ...(o.font && { fontFace: o.font }),
      ...(fill && { fill: { color: col(fill), ...(o.transparency && { transparency: o.transparency }) } }),
      ...(line && { line: { color: col(line.color), width: line.width || 1, ...(line.dash && { dashType: line.dash }) } }),
      ...(o.shape && { shape: pres.shapes[o.shape], ...(rectRadius !== undefined && { rectRadius }) }),
      ...(lineSpacingMultiple && { lineSpacingMultiple }), ...(paraSpaceAfter && { paraSpaceAfter }),
      ...(o.textTransparency && { transparency: o.textTransparency }),
    };
    this.add(() => this.slide.addText(runs(text), opts));
    return name;
  }
  shape(kind, x, y, w, h, o = {}) {
    const name = this.name(o, kind);
    const opts = {
      x, y, w, h, objectName: name,
      fill: o.fill ? { color: col(o.fill), ...(o.transparency && { transparency: o.transparency }) } : { type: "none" },
      line: o.line ? { color: col(o.line.color), width: o.line.width || 1, ...(o.line.dash && { dashType: o.line.dash }), ...(o.line.endArrow && { endArrowType: "triangle" }), ...(o.line.beginArrow && { beginArrowType: "triangle" }), ...(o.line.transparency && { transparency: o.line.transparency }) } : { type: "none" },
      ...(o.rectRadius !== undefined && { rectRadius: o.rectRadius }), ...(o.flipV && { flipV: true }), ...(o.flipH && { flipH: true }),
      ...(o.angleRange && { angleRange: o.angleRange }),
    };
    this.add(() => this.slide.addShape(pres.shapes[kind], opts));
    return name;
  }
  card(x, y, w, h, o = {}) { return this.shape("ROUNDED_RECTANGLE", x, y, w, h, { fill: "card", rectRadius: 0.15, ...o }); }
  circle(cx, cy, d, o = {}) { return this.shape("OVAL", cx - d / 2, cy - d / 2, d, d, o); }
  line(x1, y1, x2, y2, o = {}) {
    return this.shape("LINE", Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1), {
      line: { color: o.color || "dim", width: o.width || 1.5, endArrow: o.arrow, dash: o.dash },
      flipH: x2 < x1, flipV: y2 < y1, name: o.name, morph: o.morph,
    });
  }
  arrow(x1, y1, x2, y2, o = {}) { return this.line(x1, y1, x2, y2, { width: 2, color: "muted", arrow: true, ...o }); }
  // A freeform through points (slide inches). Entries are [x, y], or { x, y, c1: [x, y], c2: [x, y] } for a cubic curve.
  // Closed and filled unless o.open.
  path(pts, o = {}) {
    const name = this.name(o, "Freeform");
    const flat = pts.flatMap((p) => (Array.isArray(p) ? [p] : [[p.x, p.y], p.c1, p.c2]));
    const xs = flat.map((p) => p[0]), ys = flat.map((p) => p[1]), x = Math.min(...xs), y = Math.min(...ys);
    const w = Math.max(Math.max(...xs) - x, 0.01), h = Math.max(Math.max(...ys) - y, 0.01);
    const points = pts.map((p, i) => {
      if (Array.isArray(p)) return { x: p[0] - x, y: p[1] - y, ...(i === 0 && { moveTo: true }) };
      return { x: p.x - x, y: p.y - y, curve: { type: "cubic", x1: p.c1[0] - x, y1: p.c1[1] - y, x2: p.c2[0] - x, y2: p.c2[1] - y } };
    });
    if (!o.open) points.push({ close: true });
    const opts = {
      x, y, w, h, points, objectName: name,
      fill: o.fill && !o.open ? { color: col(o.fill) } : { type: "none" },
      line: o.line ? { color: col(o.line.color), width: o.line.width || 1, ...(o.line.endArrow && { endArrowType: "triangle" }) } : { type: "none" },
    };
    this.add(() => this.slide.addShape(pres.shapes.CUSTOM_GEOMETRY, opts));
    return name;
  }
  picture(data, x, y, w, h, o = {}) {
    const name = this.name(o, "Picture");
    this.add((d) => this.slide.addImage({ data: d, x, y, w, h, altText: o.alt || name, objectName: name, ...(o.transparency && { transparency: o.transparency }) }), data);
    return name;
  }
  icon(icon, x, y, s, color = "text", o = {}) { return this.picture(iconData(icon, color), x, y, s, s, { alt: icon, ...o }); }
  // A PNG fitted inside the box, keeping its aspect ratio; align left, centre (default) or right; valign top, middle
  // (default) or bottom.
  image(file, x, y, w, h, o = {}) {
    const name = this.name(o, "Picture"), [pw, ph] = pngSize(file), r = pw / ph;
    let iw = w, ih = w / r;
    if (ih > h) { ih = h; iw = h * r; }
    const ix = o.align === "left" ? x : o.align === "right" ? x + w - iw : x + (w - iw) / 2;
    const iy = o.valign === "top" ? y : o.valign === "bottom" ? y + h - ih : y + (h - ih) / 2;
    this.add(() => this.slide.addImage({ path: file, x: ix, y: iy, w: iw, h: ih, altText: o.alt || name, objectName: name }));
    return name;
  }
  // names: string | string[] (nested ok). The first gets `on` (click, with or after), the rest run with it.
  anim(names, o = {}) {
    [names].flat(Infinity).forEach((n, i) => this.anims.push({ name: n, on: i ? "with" : o.on || "click", fx: o.fx || "fade", dur: o.dur || 500, delay: i ? 0 : o.delay || 0, iterate: o.iterate, each: o.each }));
  }
  // Text that is typed in, letter by letter (a person typing), or that comes a word at a time (the model writing).
  // dur is the whole run, so whatever comes "after" waits for the last letter or word.
  typed(name, text, o = {}) { const ms = o.ms || 35; this.anim(name, { ...o, fx: "appear", iterate: { type: "lt", ms }, dur: [...text].length * ms }); }
  written(name, text, o = {}) { const ms = o.ms || 140, each = 250; this.anim(name, { ...o, fx: "fade", iterate: { type: "wd", ms }, each, dur: text.split(/\s+/).length * ms + each }); }
  // One after another: the first on `on`, each next one after the last.
  stagger(groups, o = {}) { groups.forEach((g, i) => this.anim(g, { ...o, on: i ? "after" : o.on || "click", delay: i ? o.gap ?? 100 : o.delay || 0 })); }
  async done() {
    const data = await Promise.all(this.ops.map((op) => op.data));
    this.ops.forEach((op, i) => op.fn(data[i]));
    this.ops = [];
  }
}
const runs = (t) => (typeof t === "string" ? t : t.map((r) => (typeof r === "string" ? { text: r } : {
  text: r.text, options: { ...(r.color && { color: col(r.color) }), ...(r.bold !== undefined && { bold: r.bold }), ...(r.italic && { italic: true }), ...(r.breakLine && { breakLine: true }), ...(r.fontSize && { fontSize: r.fontSize }), ...(r.font && { fontFace: r.font }) },
})));
const br = (text, o = {}) => ({ text, breakLine: true, ...o }); // a run that ends its line

// ---------------------------------------------------------------- recurring pieces
// The faculty talk's logo footer, along the bottom of the title slide: a little larger, so their small print reads,
// and close to the slide's edges.
function logos(s) {
  const e = 0.5, b = H - 0.36; // side margin; the logos' common bottom edge
  s.image(LOGO("aha-scientific-sessions-white.png"), e, b - 0.47, 1.6, 0.47, { align: "left", valign: "bottom", name: "Logo Scientific Sessions" });
  s.image(LOGO("aha-white.png"), W / 2 - 0.8, b - 0.62, 1.6, 0.62, { valign: "bottom", name: "Logo AHA" });
  s.image(LOGO("cards-lab-yale-white.png"), W - e - 2.1, b - 0.55, 2.1, 0.55, { align: "right", valign: "bottom", name: "Logo CarDS Lab" });
}
// Reference at the bottom centre, "Surname et al., Venue Year".
const cite = (s, text) => s.text(text, M + 0.8, 6.88, CW - 1.6, 0.46, { fontSize: 11, color: "muted", align: "center", valign: "bottom", name: "Citation" });

// The model: a blue circle with the network glyph. It is the same object (Morph "!!model") wherever it appears, unless
// morph is false.
function model(s, cx, cy, d, o = {}) {
  const m = o.morph !== false;
  return [
    s.circle(cx, cy, d, { fill: "blue", transparency: o.transparency, morph: m && "model" }),
    s.icon("model", cx - d * 0.33, cy - d * 0.33, d * 0.66, "text", { transparency: o.transparency, morph: m && "model-glyph", alt: "model" }),
  ];
}
// The loop: three blue arcs, clockwise, with arrowheads; gaps at 270°, 30° and 150° (Reason, Act and Observe).
// With pills ([w, h] each, in that order) every arc starts and ends just clear of them; without, the gaps are equal.
const LOOP_AT = [270, 30, 150];
function loopArcs(R, pills, gap = 26) {
  if (!pills) return LOOP_AT.map((a, k) => [a + gap / 2, LOOP_AT[(k + 1) % 3] - gap / 2].map((v) => (v + 360) % 360));
  const pt = (deg) => [R * Math.cos((deg * Math.PI) / 180), R * Math.sin((deg * Math.PI) / 180)];
  const inside = (deg, k, m = 0.08) => {
    const [x, y] = pt(deg), [px, py] = pt(LOOP_AT[k]);
    return Math.abs(x - px) <= pills[k][0] / 2 + m && Math.abs(y - py) <= pills[k][1] / 2 + m;
  };
  return LOOP_AT.map((a, k) => {
    const n = (k + 1) % 3;
    let a1 = a, a2 = LOOP_AT[n] <= a ? LOOP_AT[n] + 360 : LOOP_AT[n];
    while (inside(a1, k)) a1 += 0.25;
    while (inside(a2, n)) a2 -= 0.25;
    return [a1 % 360, a2 % 360];
  });
}
function loop(s, cx, cy, R, o = {}) {
  const m = o.morph !== false;
  return loopArcs(R, o.pills).map(([a1, a2], k) => s.shape("ARC", cx - R, cy - R, 2 * R, 2 * R, {
    angleRange: [a1, a2], line: { color: "blue", width: o.width || 3, endArrow: true, transparency: o.transparency }, morph: m && `loop-${k}`, name: `Loop arc ${k}`,
  }));
}
// The harness: the software around the model, which runs its tools. A ring between the model and its loop (the faculty
// talk's ring, in the model's blue, as its tool calls are); Morph "!!harness" unless morph is false.
function harness(s, cx, cy, r, o = {}) {
  return s.circle(cx, cy, 2 * r, { line: { color: "blue", width: o.width || 2, transparency: o.transparency }, morph: o.morph !== false && "harness", name: "Harness" });
}
// An agent: the model, in its harness, in its loop. The loop has radius R; the ring is 0.75 R and the model 1.05 R
// across, unless hr and md say otherwise.
function agent(s, cx, cy, R, { md = 1.05 * R, hr = 0.75 * R, pills, width = 3, ...o } = {}) {
  return [...loop(s, cx, cy, R, { pills, width, ...o }), harness(s, cx, cy, hr, { width: (width * 2) / 3, ...o }), ...model(s, cx, cy, md, o)];
}
// A tool as a card: icon and name (Morph "!!tool-i"). dim: a tool it isn't given (grey, with a lock).
function toolCard(s, i, icon, label, x, y, w, h, o = {}) {
  const g = [
    s.card(x, y, w, h, { rectRadius: 0.18, morph: o.morph !== false && `tool-${i}`, name: `Tool ${i}` }),
    s.icon(icon, x + 0.25, y + (h - 0.36) / 2, 0.36, o.dim ? "muted" : "text", { morph: o.morph !== false && `tool-icon-${i}`, name: `Tool icon ${i}` }),
    s.text(label, x + 0.8, y, w - 0.95, h, { fontSize: o.fontSize || 18, bold: true, color: o.dim ? "muted" : "text", valign: "middle", morph: o.morph !== false && `tool-label-${i}`, name: `Tool label ${i}` }),
  ];
  if (o.dim) g.push(s.icon("lock", x + w - 0.55, y + (h - 0.3) / 2, 0.3, "muted", { name: `Tool lock ${i}` }));
  return g;
}

// Words laid out like a paragraph (Arial metrics), so each word can be its own text box and appear on its own.
function flow(words, x0, y0, maxW, pt, lineH, bold, mw = measure) {
  const sp = mw(" ", pt, bold);
  let x = x0, y = y0;
  return words.map((w) => {
    const ww = mw(w, pt, bold);
    if (x > x0 && x + ww > x0 + maxW) { x = x0; y += lineH; }
    const t = { w, x, y, ww };
    x += ww + sp;
    return t;
  });
}
// A sentence the model finishes: the prompt in white, then its words in blue one at a time. Each blue word has a twin in
// `final` colour at the same place, for the reveal (orange: made up; green: from her chart).
function sentence(s, prompt, cont, { x, y, w, pt, lineH, final }) {
  const p = prompt.split(" "), toks = flow([...p, ...cont], x, y, w, pt, lineH);
  const lines = new Map();
  toks.slice(0, p.length).forEach((t) => (lines.get(t.y) || lines.set(t.y, []).get(t.y)).push(t));
  const head = [...lines.values()].map((ts, i) => s.text(ts.map((t) => t.w).join(" "), ts[0].x, ts[0].y, ts.at(-1).x + ts.at(-1).ww - ts[0].x + 0.3, lineH, { fontSize: pt, name: `Prompt ${i}` }));
  const words = toks.slice(p.length).map((t, i) => s.text(t.w, t.x, t.y, t.ww + 0.3, lineH, { fontSize: pt, color: "blue", name: `Word ${i}` }));
  const twins = toks.slice(p.length).map((t, i) => s.text(t.w, t.x, t.y, t.ww + 0.3, lineH, { fontSize: pt, color: final, name: `Word ${i} ${final}` }));
  return { head, words, twins };
}

// The faculty talk's training picture: text in → a hopper → the model (a box of sliders) → its output, straight out of
// the model's middle (no arrow), and under it the label: the word the text really had, an outline because it comes from
// outside the model. The box is in blues because it is the model, and the output has the model's blue as its rim. Every
// part has a Morph name, so the frames move into each other.
const TR = { cy: 3.45, hx0: 4.0, hx1: 5.1, mx: 5.1, mw: 3.5, mh: 2.9, bx: 9.65, bw: 2.75, bh: 1.2, ch: 1.7, lgap: 0.4 };
const BOX = { outer: "0B2A4A", inner: "0A4D99", track: "06305F", fill: "blue" };
function modelBox(s, x, y, w, h, vals) {
  const p = 0.2;
  s.shape("ROUNDED_RECTANGLE", x, y, w, h, { fill: BOX.outer, rectRadius: 0.2, morph: "mdl-outer" });
  s.shape("ROUNDED_RECTANGLE", x + p, y + p, w - 2 * p, h - 2 * p, { fill: BOX.inner, rectRadius: 0.14, morph: "mdl-inner" });
  const sx = x + p + 0.15, sw = w - 2 * p - 0.3, step = sw / vals.length, tw = 0.075, kd = 0.27, top = y + p + 0.22 + kd / 2, bot = y + h - p - 0.22 - kd / 2;
  vals.forEach((v, i) => {
    const cx = sx + step * (i + 0.5), ky = bot - v * (bot - top);
    s.shape("ROUNDED_RECTANGLE", cx - tw / 2, top, tw, bot - top, { fill: BOX.track, rectRadius: tw / 2, morph: `mdl-track-${i}` });
    s.shape("ROUNDED_RECTANGLE", cx - tw / 2, ky, tw, Math.max(bot - ky, 0.03), { fill: BOX.fill, rectRadius: tw / 2, morph: `mdl-fill-${i}` });
    s.circle(cx, ky, kd, { fill: "text", morph: `mdl-knob-${i}` });
  });
  s.text("Model", x, y + h + 0.12, w, 0.4, { fontSize: 18, bold: true, color: "muted", align: "center", morph: "mdl-label" });
}
// A funnel on its side: a wide mouth for the text, narrowing into the model.
function hopper(s, x0, x1, cy, h0, h1) {
  const xn = x1 - 0.2, L = xn - x0;
  return s.path([
    [x0, cy - h0 / 2],
    { x: xn, y: cy - h1 / 2, c1: [x0 + L * 0.55, cy - h0 / 2], c2: [xn - L * 0.3, cy - h1 / 2] },
    [x1, cy - h1 / 2], [x1, cy + h1 / 2], [xn, cy + h1 / 2],
    { x: x0, y: cy + h0 / 2, c1: [xn - L * 0.3, cy + h1 / 2], c2: [x0 + L * 0.55, cy + h0 / 2] },
  ], { fill: "raised", morph: "hopper" });
}
const valueBox = (s, [x, y, w, h], head, value, o = {}) => s.text([br(head, { color: "muted", fontSize: 15 }), { text: value, bold: true, fontSize: 30, color: o.color }],
  x, y, w, h, { ...(o.outline ? { line: { color: "edge", width: 2 } } : { fill: "card" }), shape: "ROUNDED_RECTANGLE", rectRadius: 0.15, align: "center", valign: "middle", morph: o.morph });
// Its output: its likeliest next words, each with a bar for how likely it is (no numbers); it picks the top one, green
// when that's the label. Below the top three the words fade into the box, so it reads as more than these few. Each
// word keeps its Morph name, so between frames the words re-rank.
function candidates(s, [x, y, w, h], cands, label) {
  const rh = 0.36, y0 = y + 0.48, bx = x + 1.32, bmax = w - 1.32 - 0.3;
  s.shape("ROUNDED_RECTANGLE", x, y, w, h, { fill: "card", line: { color: "blue", width: 2 }, rectRadius: 0.15, morph: "tr-output" });
  s.text("Output", x, y + 0.1, w, 0.3, { fontSize: 15, color: "muted", align: "center", morph: "tr-output-head" });
  if (cands.length) s.shape("ROUNDED_RECTANGLE", x + 0.12, y0 - 0.02, w - 0.24, rh + 0.04, { fill: "raised", rectRadius: 0.1, morph: "cand-pick" });
  cands.forEach(([word, p], i) => {
    const yy = y0 + i * rh, top = i === 0;
    s.text(word, x + 0.26, yy, 1.05, rh, { fontSize: top ? 19 : 16, bold: top, color: top ? (word === label ? "green" : "text") : "muted", valign: "middle", morph: `cand-${word}` });
    s.shape("ROUNDED_RECTANGLE", bx, yy + rh / 2 - 0.05, Math.max(0.04, bmax * p), 0.1, { fill: top ? "blue" : "edge", rectRadius: 0.05, morph: `candbar-${word}` });
  });
  if (cands.length > 3) { const fy = y0 + 3 * rh - 0.02; s.shape("ROUNDED_RECTANGLE", x + 0.06, fy, w - 0.12, y + h - 0.06 - fy, { fill: CAND_FADE, rectRadius: 0.1, morph: "cand-fade" }); }
}
// Everything right of the text. Returns the label box, which the first frame reveals on click.
function trainingScene(s, { vals, cands, label }) {
  hopper(s, TR.hx0, TR.hx1, TR.cy, 3.05, 0.66);
  modelBox(s, TR.mx, TR.cy - TR.mh / 2, TR.mw, TR.mh, vals);
  const oh = cands.length > 3 ? 0.48 + cands.length * 0.36 + 0.1 : TR.ch;
  candidates(s, [TR.bx, TR.cy - oh / 2, TR.bw, oh], cands, label);
  return label === null ? null : valueBox(s, [TR.bx, TR.cy + oh / 2 + TR.lgap, TR.bw, TR.bh], "Label", label, { outline: true, morph: "tr-label" });
}

// The spine, with no title: a model; a model and its context (a blue sheet beside it); an agent (the model in its
// harness, in its loop).
// active 0 builds the three on click; 1–3 lights one and dims the others. Only the lit column carries Morph names, so
// it is the one that moves into the next slide.
const MAP_Y = 3.45, MAP_DX = 3.9;
async function mapSlide(active, notes) {
  const s = new Ctx("CONTENT", { notes, transition: active ? "morph" : "fade" });
  const t = (i) => (active && active !== i + 1 ? 75 : 0), mm = (i) => active === i + 1;
  const c = [0, 1, 2].map((i) => W / 2 + (i - 1) * MAP_DX);
  const cols = [
    model(s, c[0], MAP_Y, 1.6, { transparency: t(0), morph: mm(0) }),
    [...model(s, c[1] - 0.6, MAP_Y, 1.6, { transparency: t(1), morph: mm(1) }), s.icon("file-lines", c[1] + 0.35, MAP_Y - 0.6, 1.2, "blue", { transparency: t(1), name: "Context", morph: mm(1) && "context" })],
    agent(s, c[2], MAP_Y, 1.2, { transparency: t(2), morph: mm(2) }),
  ];
  const labels = ["Model", "Model + context", "Agent"].map((l, i) => s.text(l, c[i] - 2.0, MAP_Y + 1.35, 4.0, 0.6, { fontSize: 28, bold: true, color: t(i) ? "dim" : "text", align: "center", name: `Label ${l}` }));
  if (!active) cols.forEach((g, i) => s.anim([g, labels[i]]));
  await s.done();
}

// The six things you give an agent; on the setup slides they sit top right as icons, the current one lit (the faculty
// talk's design bar).
const SETUP = [["bullseye", "Task"], ["brain", "Model"], ["database", "Data"], ["screwdriver-wrench", "Tools"], ["file-pen", "Prompt"], ["shield-halved", "Guardrails"]];
const BAR = { s: 0.5, gap: 0.16, y: 0.6 };
BAR.x0 = W - M - (SETUP.length * BAR.s + (SETUP.length - 1) * BAR.gap);
function setupBar(s, active) {
  SETUP.forEach(([icon], i) => {
    const x = BAR.x0 + i * (BAR.s + BAR.gap), on = i === active;
    s.shape("ROUNDED_RECTANGLE", x, BAR.y, BAR.s, BAR.s, { fill: on ? "blue" : "card", rectRadius: 0.1, morph: `bar-tile-${i}` });
    s.icon(icon, x + 0.11, BAR.y + 0.11, 0.28, on ? "text" : i < active ? "muted" : "dim", { morph: `bar-icon-${i}` });
  });
}
// A chat bubble, as in iMessage (iOS 26, dark mode; the geometry is in bubble.mjs, the faculty talk's, measured off
// Apple's own renders). Yours is grey, on the right; the model's is blue, on the left (o.from "model"). x is the body's
// tail-side edge: its right edge for yours, its left edge for the model's. The tail hangs under that corner. The bubble
// fits its text (Arial metrics, or Courier New's for o.font MONO), up to maxW wide; "\n" starts a new line. o.tail
// false: no tail (every bubble but the last in a run from one sender). o.line: an outline; o.icon: [icon, colour]
// before the text. o.fill: yours is iMessage's grey on the black stage; on a card pass "dim", so it stands off it.
// Returns the body's box (x, y, w, h, cy) and the gaps to the next bubble: gapRun (same sender, after a bubble with no
// tail) and gapTurn (the sender changes); tailDrop: how far the tail hangs below the body.
const measureMono = (t, pt) => (t.length * 0.6 * pt) / 72;
function bubbleLayout(text, maxW, o = {}) {
  const pt = o.pt || 16, m = bubbleMetrics(pt), bold = !!o.bold, mw = o.font === MONO ? (t, p) => measureMono(t, p) : measure;
  const ic = o.icon ? m.em * 0.95 : 0, ig = o.icon ? m.em * 0.45 : 0;
  let lines = 0, tw = 0;
  text.split("\n").forEach((para) => {
    const toks = flow(para.split(" "), 0, 0, maxW - 2 * m.padX - ic - ig, pt, 1, bold, mw);
    lines += new Set(toks.map((t) => t.y)).size;
    tw = Math.max(tw, ...toks.map((t) => t.x + t.ww));
  });
  return { pt, m, bold, ic, ig, lines, tw, w: tw + ic + ig + 2 * m.padX, h: lines * m.lineH + 2 * m.padY, gapRun: m.gapRun, gapTurn: m.gapTurn, tailDrop: m.tailDrop };
}
function chatBubble(s, text, x, y, maxW, o = {}) {
  const model = o.from === "model", side = o.side || (model ? "left" : "right"), L = bubbleLayout(text, maxW, o), { pt, m, w, h } = L, bx = side === "right" ? x - w : x;
  const shape = s.path(bubblePath(bx, y, w, h, side, { pt, tail: o.tail }), { fill: o.fill || (model ? "blue" : BUBBLE_COLORS.received), line: o.line, name: `${o.name} bubble` });
  const icon = o.icon ? s.icon(o.icon[0], bx + m.padX, y + m.padY + (m.lineH - L.ic) / 2, L.ic, o.icon[1] || "text", { name: `${o.name} icon` }) : null;
  const paras = text.split("\n"), body = paras.length > 1 ? paras.map((t, i) => (i < paras.length - 1 ? br(t) : t)) : text;
  const t = s.text(body, bx + m.padX + L.ic + L.ig, y + m.padY, L.tw + 0.1, L.lines * m.lineH, { fontSize: pt, bold: L.bold, color: o.color, font: o.font, valign: "middle", name: o.name });
  return { g: [shape, icon, t].filter(Boolean), shape, text: t, x: bx, y, w, h, cy: y + h / 2, gapRun: m.gapRun, gapTurn: m.gapTurn, tailDrop: m.tailDrop };
}
// A tool call, as the model writes it: its own bubble, on the model's side, outlined in its blue, in monospace, with the
// tool's icon. A tool's result: a bubble on the other side (it goes into the model, like your messages), outlined in
// white. The same shapes as the chat, so they read as what they are: more text in the conversation (the faculty talk's).
const TOOL = {
  call: ({ icon = "magnifying-glass", ...o } = {}) => ({ side: "left", font: MONO, bold: true, color: "blue", fill: "bg", line: { color: "blue", width: 2 }, icon: [icon, "blue"], ...o }),
  result: ({ icon = "database", ...o } = {}) => ({ side: "right", font: MONO, bold: true, color: "text", fill: "bg", line: { color: "text", width: 1.5 }, icon: [icon, "text"], ...o }),
};
// A tool call on its own (not in a chat): a capsule, centred on cx, with its top at y. Returns its parts.
const call = (s, text, cx, y, o = {}) => {
  const opts = { pt: o.pt || 14, ...TOOL.call({ icon: o.icon }), tail: false, name: o.name || `Call ${text}` };
  return chatBubble(s, text, cx - bubbleLayout(text, 8, opts).w / 2, y, 8, opts).g;
};

// A link that leaves and arrives level (vertical: upright), a cubic with its control points halfway along.
const linkCtl = ([x0, y0], [x1, y1], vertical) => (vertical ? [[x0, (y0 + y1) / 2], [x1, (y0 + y1) / 2]] : [[(x0 + x1) / 2, y0], [(x0 + x1) / 2, y1]]);
const link = (s, a, b, o = {}) => { const [c1, c2] = linkCtl(a, b, o.vertical); return s.path([a, { x: b[0], y: b[1], c1, c2 }], { open: true, line: { color: o.color || "dim", width: o.width || 1.5, endArrow: o.arrow }, name: o.name }); };
// The boxes ([x, y, w, h]) a link passes within m of; the build stops on any, so links stay clear of labels.
function linkHits(a, b, boxes, o = {}) {
  const [c1, c2] = linkCtl(a, b, o.vertical), m = o.margin ?? 0.06, P = [a, c1, c2, b];
  const at = (t) => [0, 1].map((d) => (1 - t) ** 3 * P[0][d] + 3 * (1 - t) ** 2 * t * P[1][d] + 3 * (1 - t) * t ** 2 * P[2][d] + t ** 3 * P[3][d]);
  return boxes.filter(([x, y, w, h]) => Array.from({ length: 101 }, (_, i) => at(i / 100)).some(([px, py]) => px > x - m && px < x + w + m && py > y - m && py < y + h + m));
}

// Rosa's chart (synthetic; the same patient as demo_pi/ehr/patients.mjs).
const ROSA = "Rosa is 71 and has heart failure. She is taking";
// The model and the text it's given, on the hallucination and context slides: the model left, the text right.
const CTX = { mx: 2.05, my: 3.6, md: 1.6, x: 3.75, w: W - M - 3.75 };

// ---------------------------------------------------------------- slides
async function build() {
  pres.addSection({ title: "What is an agent?" });
  // ── Title (the faculty talk's)
  {
    const s = new Ctx("TITLE", {
      title: "What is an agent?", subtitle: "And how to set one up", transition: "none",
      byline: [br("Bruno Batinica, MBChB", { bold: true, fontSize: 22 }), br("Yale School of Medicine", { color: "muted" }), { text: "QCOR workshop, AHA Scientific Sessions 2026", color: "muted" }],
      notes: `
Thank you, Phyllis. I'm going to talk about what exactly an agent is, and how we can set one up.
Same patient as the rest of the session: Rosa. She's synthetic, like every patient today.`,
    });
    logos(s);
    await s.done();
  }

  // ── Disclosures (no transition in or out; a placeholder, we may not need it)
  {
    const s = new Ctx("CONTENT", { title: "Disclosures", transition: "none", notes: "I have no relevant disclosures. (Placeholder: we may not need this slide.)" });
    s.text("I have no relevant disclosures.", M, 1.75, CW, 0.6, { fontSize: 24, name: "Disclosures" });
    await s.done();
  }

  // ── The spine: model → model + context → agent
  await mapSlide(0, `
We go back to this paradigm.
(click) We have models.
(click) We have models plus context: the information we give it.
(click) And then we have an agent, which enables their full capabilities: the model in a loop, which goes and gets its own context.
So let's start with what a model is, and dig into that a little deeper.`);

  // ── How a language model learns (the faculty talk's training picture, four Morph frames)
  {
    const vals = [[0.3, 0.76, 0.42, 0.64, 0.22, 0.56], [0.44, 0.6, 0.56, 0.52, 0.4, 0.5], [0.38, 0.7, 0.47, 0.6, 0.32, 0.62], [0.55, 0.5, 0.63, 0.46, 0.52, 0.44]];
    const F = [
      ["Once upon a", [["dog", 0.38], ["time", 0.27], ["day", 0.15], ["year", 0.06], ["night", 0.04]], "time"],
      ["Once upon a", [["time", 0.71], ["day", 0.12], ["dog", 0.04], ["year", 0.03], ["night", 0.02]], "time"],
      ["Started on furosemide for heart", [["burn", 0.34], ["failure", 0.29], ["rate", 0.18], ["attack", 0.07], ["disease", 0.04]], "failure"],
      ["Started on furosemide for heart", [["failure", 0.83], ["rate", 0.06], ["burn", 0.03], ["attack", 0.02], ["disease", 0.01]], "failure"],
    ];
    const notes = [`
What a model is trained to do is, roughly, just predict the next word in a series. (Strictly, the next token: a word or a piece of one.)
It's trained on general text: "Once upon a…". Inside, the model is millions or billions of numbers, the sliders. Its output is every possible next word, each with how likely it is (the bars): the top few here, and thousands more fading away underneath. It picks the likeliest: "dog". Wrong.
(click) It sees the label, the word that actually came next: "time". Nobody has to write the labels: the text labels itself.`,
    `(Morph) So it adjusts: every slider moves a little, and now it gets "time".`,
    `(Morph) It's trained on a vast corpus of text, medical information included. "Started on furosemide for heart…": it guesses "burn"; the label is "failure".`,
    `(Morph) Adjust, and it's right. Repeat that over trillions of words: Llama 3 was pretrained on over 15 trillion tokens. That's why it also learns clinical information, and can be used for it.

Source: Meta AI, "Introducing Meta Llama 3", April 2024: “Llama 3 is pretrained on over 15T tokens that were all collected from publicly available sources.” https://ai.meta.com/blog/meta-llama-3/#:~:text=Llama%203%20is%20pretrained%20on%20over%2015T%20tokens`];
    for (let k = 0; k < 4; k++) {
      const s = new Ctx("CONTENT", { transition: k ? "morph" : "fade", notes: notes[k] });
      const [text, cands, label] = F[k];
      s.text([{ text: `${text} ` }, { text: "______", color: "muted" }], 0.95, TR.cy - 1.0, 2.85, 2.0, { fontSize: 22, bold: true, fill: "card", shape: "ROUNDED_RECTANGLE", rectRadius: 0.15, valign: "middle", margin: 14, morph: "llm-in" });
      const lab = trainingScene(s, { vals: vals[k], cands, label });
      if (!k) s.anim(lab);
      await s.done();
    }
  }

  // ── It writes, one word at a time (Morph; each word goes from the output back into the text, in blue)
  {
    const s = new Ctx("CONTENT", {
      transition: "morph",
      notes: `
(Morph) And the beautiful thing: once a model is trained, because it can output the next word, it can generate any text.
(click: it writes by itself) Add that word to the text and go again: "…for heart failure to relieve congestion." Blue is what the model wrote.
One word at a time, it can write anything: a discharge summary, a letter, an answer to a question. This is very powerful.`,
    });
    const cx0 = 0.95, cy0 = TR.cy - 1.45, cwid = 2.85, chgt = 2.9, pt = 20, lh = 0.4;
    s.shape("ROUNDED_RECTANGLE", cx0, cy0, cwid, chgt, { fill: "card", rectRadius: 0.15, morph: "llm-in" });
    const prompt = "Started on furosemide for heart".split(" "), cont = ["failure", "to", "relieve", "congestion."];
    const toks = flow([...prompt, ...cont], cx0 + 0.22, cy0 + 0.25, cwid - 0.44, pt, lh, true);
    const lines = new Map();
    toks.slice(0, prompt.length).forEach((t) => (lines.get(t.y) || lines.set(t.y, []).get(t.y)).push(t));
    [...lines.values()].forEach((ts, i) => s.text(ts.map((t) => t.w).join(" "), ts[0].x, ts[0].y, ts.at(-1).x + ts.at(-1).ww - ts[0].x + 0.3, lh, { fontSize: pt, bold: true, name: `Prompt ${i}` }));
    trainingScene(s, { vals: [0.55, 0.5, 0.63, 0.46, 0.52, 0.44], cands: [], label: null });
    toks.slice(prompt.length).forEach((t, i) => {
      const o = s.text(t.w, TR.bx, TR.cy - 0.3, TR.bw, 0.7, { fontSize: 30, bold: true, color: "blue", align: "center", valign: "middle", name: `Out ${i}` });
      const w = s.text(t.w, t.x, t.y, t.ww + 0.3, lh, { fontSize: pt, bold: true, color: "blue", name: `Word ${i}` });
      s.anim(o, { on: i ? "after" : "click", dur: 220, delay: i ? 200 : 0 });
      s.anim(w, { on: "after", dur: 220, delay: 280 });
      s.anim(o, { fx: "fade-out", on: "with", dur: 200 });
    });
    await s.done();
  }

  // ── Hallucination: it doesn't know Rosa
  {
    const s = new Ctx("CONTENT", {
      notes: `
The problem: it doesn't know our patients. We start with Rosa, and ask it to complete the sentence.
(click) It says something that looks reasonable: carvedilol, lisinopril and furosemide, what a lot of people with heart failure take.
(click) But it's hallucinated. It doesn't know Rosa: she wasn't in any of its training. (She takes sacubitril/valsartan, not lisinopril, and her carvedilol was stopped in May for heart block.)
It's doing its one job, finishing the sentence, with nothing true to go on. So we need to give it context.`,
    });
    model(s, CTX.mx, CTX.my, CTX.md);
    s.card(CTX.x, 2.3, CTX.w, 2.6, { rectRadius: 0.3, name: "Context" });
    const { words, twins } = sentence(s, ROSA, ["carvedilol,", "lisinopril", "and", "furosemide."], { x: CTX.x + 0.5, y: 2.78, w: CTX.w - 1.0, pt: 30, lineH: 0.56, final: "orange" });
    s.stagger(words, { dur: 300, gap: 150 });
    s.anim([twins, s.text("Hallucination", CTX.x, 5.15, CTX.w, 0.6, { fontSize: 28, bold: true, color: "orange", align: "center", valign: "middle", name: "Hallucination" })]);
    s.anim(words, { on: "with", fx: "fade-out" });
    await s.done();
  }

  // ── Part 2
  await mapSlide(2, `
So we go back: the second step, models plus context.`);

  // ── Model + context: give it her chart (Morph: the model moves across from the map)
  {
    const s = new Ctx("CONTENT", {
      transition: "morph",
      notes: `
(Morph) So we provide Rosa's chart, her medications, as the first part of the message, then the same sentence. It's all one message, all text.
That information is now in context: the model's short-term memory.
(click) When it writes, it uses it, in a grounded way: sacubitril/valsartan, spironolactone, dapagliflozin and furosemide.
(click) Correct, because it's in her chart. Same model, same sentence: the context changed the answer. Current models are very good at this.
(Her chart is synthetic, the one in today's demo.)`,
    });
    // The model and the blue sheet move across from the map (Morph); her chart comes in just after. Her chart and the
    // sentence are one message, all text in the same type: the chart is simply the first part of what the model reads.
    const y0 = 0.95, x = CTX.x + 0.5, tw = CTX.w - 1.0, pt = 26, lh = 0.48;
    model(s, CTX.mx, CTX.my, CTX.md);
    const card = s.shape("ROUNDED_RECTANGLE", CTX.x, y0, CTX.w, 5.2, { fill: "card", rectRadius: 0.06, morph: "doc" });
    s.icon("file-lines", x, y0 + 0.3, 0.36, "blue", { morph: "context" });
    const meds = "Rosa’s medications: sacubitril/valsartan 49/51 mg twice daily, spironolactone 25 mg once daily, dapagliflozin 10 mg once daily, furosemide 40 mg once daily. Carvedilol stopped 14 May 2026.";
    const medLines = new Map();
    flow(meds.split(" "), x, y0 + 0.85, tw, pt, lh).forEach((t) => (medLines.get(t.y) || medLines.set(t.y, []).get(t.y)).push(t));
    const chart = [card, ...[...medLines.values()].map((ts, i) => s.text(ts.map((t) => t.w).join(" "), ts[0].x, ts[0].y, tw + 0.3, lh, { fontSize: pt, name: `Chart ${i}` }))];
    const sy = y0 + 0.85 + medLines.size * lh + 0.3;
    const cont = ["sacubitril/valsartan,", "spironolactone,", "dapagliflozin", "and", "furosemide."];
    if (flow([...ROSA.split(" "), ...cont], x, sy, tw, pt, lh).at(-1).y + lh > y0 + 5.2 - 0.15) throw new Error("context slide: the message overflows the card");
    const { head, words, twins } = sentence(s, ROSA, cont, { x, y: sy, w: tw, pt, lineH: lh, final: "green" });
    s.anim([chart, head], { on: "after" });
    s.stagger(words, { dur: 300, gap: 150 });
    s.anim([twins, s.text("Correct, with the right context", CTX.x, y0 + 5.35, CTX.w, 0.55, { fontSize: 26, bold: true, color: "green", align: "center", valign: "middle", name: "Correct" })]);
    s.anim(words, { on: "with", fx: "fade-out" });
    await s.done();
  }

  // ── Today: copy and paste (Morph: the model moves into the chat, on the left; her chart becomes the EHR, on the right).
  // The faculty talk's layout: the chat's model as far from the card's top as from its left, her chart's sections spread
  // evenly, a database icon on her chart. One press: you do the gathering, copy by copy, by itself. The next: you ask.
  {
    const s = new Ctx("CONTENT", {
      transition: "morph",
      notes: `
But how do we get context? Typically, that's your job. It's most of your experience with ChatGPT: first you get the relevant information.
(click: it runs by itself) You find it, her medicines, and copy and paste it into the chat; then her last note, from primary care.
(click) And you ask, and get something back: carvedilol was stopped, but the note doesn't say why. The reason is in a cardiology note we didn't paste.
It's very time-consuming, and it only knows what we happened to copy. So how can we improve this?
(The note is quoted from her synthetic chart: the primary care visit of 20 October.)`,
    });
    const ew = 4.3, ey = 1.1, eh = 5.75, cx0 = M, ex = W - M - ew, pad = 0.25, pt = 16;
    // the chat, on the left: the model's side
    const dd = 0.4, dcx = cx0 + pad + dd / 2, dcy = ey + pad + dd / 2;
    const chat = [s.card(cx0, ey, ew, eh, { rectRadius: 0.08, name: "Chat" }),
      s.text("Chat", dcx + dd / 2 + 0.15, dcy - 0.25, 2, 0.5, { fontSize: 16, bold: true, color: "muted", valign: "middle", name: "Chat head" })];
    model(s, dcx, dcy, dd);
    // her chart, on the right (its card is the context slide's, Morph): a bar, then its sections, spread evenly (as far
    // below the bar as above the card's foot)
    const rows = [["pills", "Medications"], ["file-lines", "Primary care note"], ["file-lines", "Telephone note"], ["flask", "Lab results"], ["heart-pulse", "Vital signs"]];
    const bar = 0.6, rh = 0.62, top = ey + bar + pad, pitch = (ey + eh - pad - top - rh) / (rows.length - 1);
    s.shape("ROUNDED_RECTANGLE", ex, ey, ew, eh, { fill: "card", rectRadius: 0.08, morph: "doc" });
    const ehr = [s.shape("ROUNDED_RECTANGLE", ex, ey, ew, bar, { fill: "raised", rectRadius: 0.08, name: "EHR bar" }),
      s.shape("RECTANGLE", ex, ey + bar - 0.2, ew, 0.2, { fill: "raised", name: "EHR bar base" }),
      s.icon("user", ex + pad, ey + (bar - 0.3) / 2, 0.3, "muted", { name: "EHR icon" }),
      s.text("Rosa Delgado", ex + 0.7, ey, 2.8, bar, { fontSize: 16, bold: true, valign: "middle", name: "EHR patient" }),
      s.icon("database", ex + ew - pad - 0.3, ey + (bar - 0.3) / 2, 0.3, "text", { name: "EHR database" })];
    const lit = [];
    rows.forEach(([icon, t], i) => {
      const y = top + i * pitch;
      ehr.push(s.shape("ROUNDED_RECTANGLE", ex + pad, y, ew - 2 * pad, rh, { fill: "raised", rectRadius: 0.1, name: `Row ${i}` }),
        s.icon(icon, ex + pad + 0.2, y + (rh - 0.28) / 2, 0.28, "muted", { name: `Row icon ${i}` }),
        s.text(t, ex + pad + 0.7, y, 2.9, rh, { fontSize: 17, valign: "middle", name: `Row ${t}` }));
      if (i < 2) lit.push(s.shape("ROUNDED_RECTANGLE", ex + pad, y, ew - 2 * pad, rh, { line: { color: "text", width: 2 }, rectRadius: 0.1, name: `Row lit ${i}` }));
    });
    // you, between them, level with the middle of the cards, copying from the chart into the chat
    const px = W / 2, py = ey + eh / 2;
    const you = [s.icon("user", px - 0.45, py - 0.6, 0.9, "text", { name: "You" }),
      s.text("You", px - 1, py + 0.4, 2, 0.4, { fontSize: 18, bold: true, color: "muted", align: "center", name: "You label" })];
    const arrows = [s.arrow(ex - 0.15, py - 0.15, px + 0.65, py - 0.15, { name: "Copy arrow" }), s.arrow(px - 0.65, py - 0.15, cx0 + ew + 0.15, py - 0.15, { name: "Paste arrow" })];
    // the chat, with the same margins as its model: what you paste and ask (grey, right; one run, so only the last has
    // a tail), what the model answers (blue, left)
    const right = cx0 + ew - pad, maxW = ew - 2 * pad - 0.35;
    let y = dcy + dd / 2 + 0.3;
    const next = (b, gap) => { y += b.h + b[gap]; return b; };
    const pastes = [[0, "Medications: sacubitril/valsartan, spironolactone, dapagliflozin, furosemide; carvedilol stopped 14 May"], [1, "Primary care note: “Heart failure is managed by cardiology.”"]]
      .map(([row, t], i) => [lit[row], next(chatBubble(s, t, right, y, maxW, { pt, fill: "dim", tail: false, name: `Paste ${i + 1}` }), "gapRun")]);
    const ask = next(chatBubble(s, "Is anything missing?", right, y, maxW, { pt, fill: "dim", name: "Ask" }), "gapTurn");
    const ansText = "Carvedilol was stopped, but the note doesn’t say why.";
    const ans = chatBubble(s, ansText, cx0 + pad, y, maxW, { pt, from: "model", name: "Answer" });
    if (y + ans.h + ans.tailDrop > ey + eh - pad) throw new Error("copy and paste: the chat overflows");
    s.anim([chat, ehr, you], { on: "after" });
    // one press: each copy, then its paste, one after another
    pastes.forEach(([row, b], i) => {
      s.anim(i ? row : [arrows, row], { on: i ? "after" : "click", delay: i ? 300 : 0, dur: 300 });
      s.anim(b.g, { on: "after", delay: 150, dur: 300 });
    });
    s.anim(ask.g, { dur: 300 });
    s.anim(ans.shape, { on: "after", delay: 300, dur: 250 });
    s.written(ans.text, ansText, { on: "after" });
    await s.done();
  }

  // ── Part 3
  await mapSlide(3, `
Well, this is where agents come in.`);

  // ── Text is a universal interface (the faculty talk's, for Rosa; Morph: the model and its loop move across from the
  // map). First how a tool works, it's all text (model → harness → text back); that fades, and her chart comes in. Then
  // a chat between the agent and her chart, as in the faculty talk: the tool call and its result are chat bubbles too,
  // the call on the model's side, outlined in its blue, in monospace; the result on yours (it goes into the model, like
  // your messages), outlined in white. The call goes out to her chart, and the result comes back into the chat.
  {
    const s = new Ctx("CONTENT", {
      transition: "morph",
      notes: `
(Morph) This is the agent: the model, in its harness (the ring), in its loop. The same way it can generate text, it can generate text that uses a tool.
(click) It's all text. Just as you'd tell someone "go and fetch me this", the model writes a request for a tool: read her medication records. It's just another message, from the model (the outlined bubble).
(click) Its harness (the ring, labelled), the software around the model, reads that text, turns it into code and runs it: a request to the EHR for her medications. The model only ever writes text; the harness is what does things with it.
(click) What comes back is text again, here the line for her carvedilol (exactly what the demo's tool returns), and it goes into the model's context, like your messages do.
(click) So, with her chart: why was her carvedilol stopped? The question the chat couldn't answer.
(click) It works out what it needs, "I should check her notes", and writes a tool call: search her notes for carvedilol. The harness runs the search: two of her three notes mention it.
(click) The result comes back into the chat: the telephone note from 14 May, Mobitz II heart block on carvedilol, carvedilol stopped.
(click) And it answers the question directly, from her chart: Mobitz II heart block, found on a monitor she wore at home. Nobody pasted anything. This is a very powerful idea.
Behind the scenes, that's all a chatbot is: a conversation, and the tool calls are just more messages in it.
(The note is quoted from her synthetic chart; the demo's search_notes tool returns this passage.)

How the labs draw it (for reference): OpenAI, Function calling: https://developers.openai.com/api/docs/guides/function-calling
Anthropic, How tool use works: https://platform.claude.com/docs/en/agents-and-tools/tool-use/how-tool-use-works
Anthropic, Building effective agents (the augmented LLM; the agent loop): https://www.anthropic.com/engineering/building-effective-agents`,
    });
    const lx = 2.1, ly = 4.05, LR = 1.2, HR = 0.75 * LR;
    agent(s, lx, ly, LR); // the map's agent (Morph): the model, in its harness, in its loop
    // the harness, named: a label above, its arrow down through the loop's top gap to the ring; it stays once it's in
    const named = [s.text("Harness", lx - 1.0, 1.95, 2.0, 0.42, { fontSize: 18, bold: true, align: "center", valign: "middle", name: "Harness label" }),
      s.arrow(lx, 2.42, lx, ly - HR - 0.06, { color: "text", width: 2, name: "Harness arrow" })];
    // 1. It's all text, in three steps down the right: the call (a bubble, the model's side), the code the harness runs,
    // the result (a bubble, your side)
    const rx = 5.25, bx = rx + 0.7, rw = W - M - bx, hp = 16;
    const lab = (t, y) => s.text(t, bx, y, rw, 0.34, { fontSize: 15, color: "muted", valign: "middle", name: `How ${t}` });
    const down = (y) => s.arrow(bx + rw / 2, y, bx + rw / 2, y + 0.28, { name: `Down ${y}` });
    const hc = chatBubble(s, 'read_records("medications")', bx, 2.33, rw, { pt: hp, ...TOOL.call({ icon: "table-list" }), name: "How call" });
    const y2 = hc.y + hc.h + hc.tailDrop + 0.08, y3 = y2 + 0.38 + 0.38 + 0.56 + 0.1;
    const hr = chatBubble(s, "“carvedilol 12.5 mg oral tablet: 12.5 mg by mouth twice daily. Status stopped, ordered 2025-08-26, stopped 2026-05-14”", W - M, y3 + 0.76, rw, { pt: hp, ...TOOL.result(), name: "How result" });
    if (hr.y + hr.h + hr.tailDrop > 6.9) throw new Error("tool use: it's all text runs off the slide");
    const how = [
      [s.text("It’s all text", rx, 1.15, 6, 0.55, { fontSize: 28, bold: true, valign: "middle", name: "All text" }),
        lab("The model writes text", 1.95), ...model(s, rx + 0.25, hc.cy, 0.5, { morph: false }), hc.g],
      [down(y2), lab("The harness turns it into code, and runs it", y2 + 0.38), s.icon("gear", rx + 0.03, y2 + 0.76 + 0.06, 0.44, "muted", { name: "Harness icon" }),
        s.text("GET /fhir/MedicationRequest?patient=…", bx, y2 + 0.76, rw, 0.56, { fontSize: hp, bold: true, font: MONO, fill: "card", shape: "ROUNDED_RECTANGLE", rectRadius: 0.12, valign: "middle", margin: 12, name: "How code" })],
      [down(y3), lab("Text comes back, into the model’s context", y3 + 0.38), hr.g],
    ];
    // 2. Her chart, on the right, and the chat between the agent and it
    const eh = 3.45, ex = 9.25, ew = W - M - ex;
    const x0 = lx + LR + 0.3, x1 = ex - 1.15, maxW = x1 - x0 - 0.2, pt = 16;
    const gapOf = (L, g) => L[g] || 0;
    const MSGS = [
      ["Why was her carvedilol stopped?", { fill: BUBBLE_COLORS.received, name: "Ask" }, "gapTurn"],
      ["I should check her notes.", { from: "model", tail: false, name: "Thought" }, "gapRun"],
      ['search_notes("carvedilol")', TOOL.call({ name: "Call" }), "gapTurn"],
      ["14 May 2026, telephone:\n“…Mobitz II second-degree AV block on carvedilol… Carvedilol stopped today.”", TOOL.result({ name: "Result" }), "gapTurn"],
      ["Mobitz II heart block, found on a monitor she wore at home in May.", { from: "model", name: "Answer" }],
    ];
    const Ls = MSGS.map(([t, o]) => bubbleLayout(t, maxW, { pt, ...o }));
    let y = 1.0 + (5.9 - Ls.reduce((a, L, i) => a + L.h + (i < MSGS.length - 1 ? gapOf(L, MSGS[i][2]) : L.tailDrop), 0)) / 2;
    const [ask, thought, req, res, ans] = MSGS.map(([t, o, g]) => {
      const right = o.side === "right" || (!o.side && o.from !== "model");
      const b = chatBubble(s, t, right ? x1 : x0, y, maxW, { pt, ...o });
      y += b.h + gapOf(b, g);
      return b;
    });
    if (ans.y + ans.h + ans.tailDrop > 6.9) throw new Error("tool use: the chat runs off the slide");
    // her chart sits level with the call and the result
    const ey = (req.cy + res.cy) / 2 - 1.95, NOTES = [["20 Oct 2026", "Primary care visit"], ["30 Jun 2026", "Electrophysiology consult", 1], ["14 May 2026", "Telephone encounter", 1]];
    const fy = ey + 0.72, ry = (i) => ey + 1.32 + i * 0.66, rh = 0.58;
    const ehr = [s.shape("ROUNDED_RECTANGLE", ex, ey, ew, eh, { fill: "card", rectRadius: 0.06, name: "Chart" }),
      s.shape("ROUNDED_RECTANGLE", ex, ey, ew, 0.55, { fill: "raised", rectRadius: 0.06, name: "Chart bar" }),
      s.shape("RECTANGLE", ex, ey + 0.35, ew, 0.2, { fill: "raised", name: "Chart bar base" }),
      s.text("Her chart: notes", ex + 0.25, ey, 2.8, 0.55, { fontSize: 16, bold: true, color: "muted", valign: "middle", name: "Chart head" }),
      s.icon("database", ex + ew - 0.25 - 0.3, ey + 0.125, 0.3, "text", { name: "Chart database" }),
      s.shape("ROUNDED_RECTANGLE", ex + 0.25, fy, ew - 0.5, 0.45, { fill: "bg", rectRadius: 0.1, name: "Search field" }),
      s.icon("magnifying-glass", ex + 0.4, fy + 0.11, 0.23, "muted", { name: "Search icon" }),
      s.text("Search notes", ex + 0.8, fy, ew - 1.15, 0.45, { fontSize: 14, color: "muted", valign: "middle", name: "Search hint" })];
    const lit = [], dim = [];
    NOTES.forEach(([date, title, hit], i) => {
      ehr.push(s.shape("ROUNDED_RECTANGLE", ex + 0.25, ry(i), ew - 0.5, rh, { fill: "raised", rectRadius: 0.1, name: `Note ${i}` }),
        s.icon("file-lines", ex + 0.42, ry(i) + (rh - 0.24) / 2, 0.24, "muted", { name: `Note icon ${i}` }),
        s.text([br(date, { bold: true }), { text: title, color: "muted" }], ex + 0.8, ry(i), ew - 1.1, rh, { fontSize: 12, valign: "middle", name: `Note ${title}` }));
      (hit ? lit : dim).push(hit ? s.shape("ROUNDED_RECTANGLE", ex + 0.25, ry(i), ew - 0.5, rh, { line: { color: "text", width: 2 }, rectRadius: 0.1, name: `Note hit ${i}` })
        : s.shape("ROUNDED_RECTANGLE", ex + 0.23, ry(i) - 0.02, ew - 0.46, rh + 0.04, { fill: "card", transparency: 30, rectRadius: 0.1, name: `Note miss ${i}` }));
    });
    const typed = s.text("carvedilol", ex + 0.8, fy, ew - 1.15, 0.45, { fontSize: 14, fill: "bg", valign: "middle", name: "Search typed" });
    if (ey < 1.0 || ey + eh > 6.9) throw new Error("tool use: her chart runs off the slide");
    if (Math.max(...[ask, thought, req, res, ans].map((b) => b.x + b.w)) > ex - 0.8) throw new Error("tool use: the chat runs into her chart");
    if (Math.min(...[ask, thought, req, res, ans].map((b) => b.x)) < lx + LR + 0.2) throw new Error("tool use: the chat runs into the loop");
    // the call goes out to her chart's search, in the model's blue; the telephone note comes back into the chat
    const out = link(s, [req.x + req.w + 0.15, req.cy], [ex - 0.15, fy + 0.225], { color: "blue", width: 2.5, arrow: true, name: "To her chart" });
    const back = link(s, [ex - 0.15, ry(2) + rh / 2], [res.x + res.w + 0.15, res.cy], { color: "text", width: 2, arrow: true, name: "From her chart" });
    s.anim(how[0], { dur: 400 });
    s.anim([how[1], named], { dur: 400 });
    s.anim(how[2], { dur: 400 });
    s.anim(how, { fx: "fade-out", dur: 400 });
    s.anim([ehr, ask.g], { on: "after", dur: 500 });
    s.anim(thought.g, { dur: 400 });
    s.anim(req.g, { on: "after", delay: 300, dur: 400 });
    s.anim(out, { fx: "wipe-left", on: "after", dur: 400 });
    s.anim([typed, lit, dim], { on: "after", dur: 400 });
    s.anim(back, { fx: "wipe-right", dur: 300 });
    s.anim(res.g, { on: "after", dur: 400 });
    s.anim(ans.shape, { dur: 250 });
    s.written(ans.text, MSGS[4][0], { on: "after" });
    await s.done();
  }

  // ── An agent: a model, tools and a loop (the faculty talk's; ReAct). Reason, Act and Observe come in as soon as the
  // Morph ends; the tools themselves are on the Tools slide.
  {
    const s = new Ctx("CONTENT", {
      transition: "morph",
      notes: `
(Morph) And this is the loop, around the model in its harness: it reasons about what to do next, acts by calling a tool, observes the result, and repeats until the task is done. That's ReAct, the standard recipe (Yao et al., ICLR 2023).
(click) So an agent is a language model with tools (its harness runs them), in a loop. And because it's all text, it can in principle do anything you can write down as a task, especially anything done on a computer. With that flexibility comes a lot of potential, and a lot of power. So how do we set it up safely?

Ref: Yao S et al. ReAct: synergizing reasoning and acting in language models. ICLR 2023. https://arxiv.org/pdf/2210.03629#page=1`,
    });
    const cx = W / 2, cy = 3.6, R = 2.0, md = 1.5, hr = 1.05;
    const STEPS = ["Reason", "Act", "Observe"], pills = STEPS.map((l) => [measure(l, 18, true) + 0.46, 0.44]);
    agent(s, cx, cy, R, { pills, md, hr }); // the agent from the slide before (Morph): its loop grows around the harness
    // the ring stays clear of the steps (the nearest corner of each pill) and of the model
    pills.forEach(([w, h], k) => {
      const a = (LOOP_AT[k] * Math.PI) / 180, px = R * Math.cos(a), py = R * Math.sin(a);
      const nx = Math.max(Math.abs(px) - w / 2, 0), ny = Math.max(Math.abs(py) - h / 2, 0);
      if (Math.hypot(nx, ny) < hr + 0.15) throw new Error(`agent loop: the harness runs into ${STEPS[k]}`);
    });
    if (hr - md / 2 < 0.2) throw new Error("agent loop: the harness runs into the model");
    const steps = STEPS.map((label, k) => {
      const a = (LOOP_AT[k] * Math.PI) / 180, [w, h] = pills[k];
      return s.text(label, cx + R * Math.cos(a) - w / 2, cy + R * Math.sin(a) - h / 2, w, h, { fontSize: 18, bold: true, color: "blue", fill: "bg", line: { color: "blue", width: 1.5 }, shape: "ROUNDED_RECTANGLE", rectRadius: 0.22, align: "center", valign: "middle", name: `Step ${label}` });
    });
    s.anim([steps, cite(s, "Yao et al., ICLR 2023")], { on: "after", dur: 400 });
    s.anim(s.text("An agent: a model with tools, in a loop", M, 6.05, CW, 0.55, { fontSize: 26, bold: true, align: "center", name: "Message" }));
    await s.done();
  }

  pres.addSection({ title: "Setting one up" });
  // ── Set it up like a remote colleague (the model on a laptop; the six things you give it)
  {
    const s = new Ctx("CONTENT", {
      title: "Set it up like a remote colleague", transition: "morph",
      notes: `
There's a risk in anthropomorphising, but we think it's a nice way to think about this: set it up like a remote colleague. They can't walk down the hall to ask what you meant, so everything has to be spelled out.
(click) We need to outline the task we want it to do, the model to use, the data it has, the tools it has, exactly how we prompt it, and the guardrails that keep the work safe.
We'll go through them one by one. They're also the steps of the live build in a few minutes.`,
    });
    // The laptop is a picture, not shapes, so Morph has nothing to pair it with on the next slide: it just fades.
    const lw = 4.6, lh = lw / LAPTOP.ar, ly = 1.75;
    s.picture(laptopData(), W / 2 - lw / 2, ly, lw, lh, { name: "Laptop", alt: "laptop" });
    model(s, W / 2, ly + lh * LAPTOP.screenY, 1.2); // the middle of the laptop's screen
    const ts = 1.2, gap = 0.42, x0 = (W - (6 * ts + 5 * gap)) / 2, y = 5.05;
    s.stagger(SETUP.map(([icon, label], i) => {
      const x = x0 + i * (ts + gap);
      return [
        s.shape("ROUNDED_RECTANGLE", x, y, ts, ts, { fill: "card", rectRadius: 0.2, morph: `bar-tile-${i}` }),
        s.icon(icon, x + (ts - 0.56) / 2, y + (ts - 0.56) / 2, 0.56, "text", { morph: `bar-icon-${i}` }),
        s.text(label, x - 0.3, y + ts + 0.08, ts + 0.6, 0.4, { fontSize: 18, bold: true, align: "center", morph: `bar-label-${i}` }),
      ];
    }), { gap: 80, dur: 400 });
    await s.done();
  }

  // ── Task, two slides, with Phyllis's tasks (her "Range of agentic AI tasks", AIAgents.pptx slide 6, in her words).
  // 1 (Morph: the six tiles move up into the bar): her three groups, on a light blue, then the one we pick turns solid
  // blue and the rest dim. 2 (Morph): the pick moves to the middle, the rest go, and everything else hangs from it.
  {
    const GROUPS = [
      ["For patients", [["calendar-days", "Find and schedule appointments"], ["comment", "Personalized advice"], ["pills", "Medication reminders"], ["heart-pulse", "Summarize health data"]]],
      ["For providers", [["file-pen", "Documentation"], ["stethoscope", "Clinical decision support"], ["list-check", "Administrative support"], ["user-graduate", "Real-time education"]]],
      ["For health systems", [["magnifying-glass", "Identify gaps in care", 1], ["gauge-high", "Quality metrics"], ["gear", "Operations optimization"], ["users", "Patient engagement at scale"]]],
    ];
    const tw = 3.7, th = 0.78, tg = 0.3, rg = 0.14, hy = 1.7, ty0 = 2.35, tx0 = (W - (3 * tw + 2 * tg)) / 2;
    const pos = (c, r) => [tx0 + c * (tw + tg), ty0 + r * (th + rg)];
    // a tile: o.morph names it for the next slide, else o.name
    const tile = (s, x, y, icon, label, o) => {
      const n = (k) => (o.morph ? { morph: `${o.morph}${k}` } : { name: `${o.name}${k}` });
      return [s.card(x, y, tw, th, { rectRadius: 0.16, fill: "blue", transparency: o.transparency, ...n("") }),
        s.icon(icon, x + 0.27, y + (th - 0.38) / 2, 0.38, "text", n(" icon")),
        s.text(label, x + 0.85, y, tw - 1.0, th, { fontSize: 17, bold: true, valign: "middle", ...n(" label") })];
    };
    let pick;
    GROUPS.forEach(([, items], c) => items.forEach(([icon, label, p], r) => { if (p) pick = { c, r, icon, label }; }));
    {
      const s = new Ctx("CONTENT", {
        title: "Task", bar: 0, transition: "morph",
        notes: `
Starting with the task. Phyllis really covered this.
(click) These are her tasks for agents. For patients: finding and scheduling appointments, personalized advice, medication reminders, summarizing their health data. For providers: documentation, clinical decision support, administrative support, real-time education. And for health systems: identifying gaps in care, quality metrics, running operations, and engaging patients at scale.
(click) But it's crucial to pick one. Ours is for the health system: identify gaps in care. Is Rosa on a beta blocker, and if not, why not?
(The tasks are Phyllis's, from her "Range of agentic AI tasks" slide, in her words.)`,
      });
      s.stagger(GROUPS.map(([head, items], c) => [
        s.text(head, pos(c, 0)[0], hy, tw, 0.5, { fontSize: 22, bold: true, color: "muted", align: "center", valign: "middle", name: `Group ${head}` }),
        items.map(([icon, label], r) => tile(s, ...pos(c, r), icon, label, { transparency: 62, name: `Task ${c}-${r}` })),
      ]), { gap: 150, dur: 400 });
      const veils = GROUPS.flatMap(([, items], c) => items.map((_, r) => {
        if (c === pick.c && r === pick.r) return [];
        const [x, y] = pos(c, r);
        return s.card(x - 0.02, y - 0.02, tw + 0.04, th + 0.04, { fill: "bg", transparency: 45, rectRadius: 0.16, name: `Not picked ${c}-${r}` });
      }));
      s.anim([tile(s, ...pos(pick.c, pick.r), pick.icon, pick.label, { morph: "task-pick" }), veils]);
      await s.done();
    }
    {
      const s = new Ctx("CONTENT", {
        title: "Task", bar: 0, transition: "morph",
        notes: `
(Morph: our task moves to the middle, and the rest hangs from it.) Because the task guides how you build the agent: everything else you pick follows from it. A small, clear task is easier to do well, and much easier to check, than "review the chart".
(click) And defining the task is really going to be the clinician's job. More and more of the technical side is being taken care of; deciding exactly what we want it to do, and what it should have access to, isn't. When agents arrive in your health system, that's the part people in this room will be in charge of.`,
      });
      const px = (W - tw) / 2, py = 2.2;
      tile(s, px, py, pick.icon, pick.label, { morph: "task-pick" });
      const g = [], ts = 0.85, ty = 4.15, from = [W / 2, py + th];
      SETUP.slice(1).forEach(([icon, label], k) => {
        const cx = W / 2 + (k - 2) * 2.0;
        g.push(link(s, from, [cx, ty], { vertical: true, color: "edge", width: 1.75, name: `Follows link ${k}` }));
        g.push(s.shape("ROUNDED_RECTANGLE", cx - ts / 2, ty, ts, ts, { fill: "card", rectRadius: 0.14, name: `Follows tile ${k}` }));
        g.push(s.icon(icon, cx - 0.21, ty + 0.215, 0.42, "text", { name: `Follows icon ${k}` }));
        g.push(s.text(label, cx - 0.95, ty + ts + 0.08, 1.9, 0.35, { fontSize: 16, bold: true, align: "center", name: `Follows label ${k}` }));
      });
      const follows = s.text("Everything follows from the task.", M, 6.05, CW, 0.5, { fontSize: 22, bold: true, align: "center", name: "Message" });
      s.anim([g, follows], { on: "after", dur: 500 });
      // then the same place: whose job the task is
      s.anim(follows, { fx: "fade-out", dur: 300 });
      s.anim(s.text("Defining the task is the clinician’s job.", M, 6.05, CW, 0.5, { fontSize: 22, bold: true, align: "center", name: "Our job" }), { on: "after" });
      await s.done();
    }
  }

  // ── Model, two slides. The open-weight models, sized by parameters, one at a time; then speed and cost under them.
  // Then (Morph) they move left, and the closed models come in on the right with privacy, the third thing to weigh.
  {
    const OPEN = [["gemma-color", "Gemma 3", 4], ["meta-color", "Llama 3.1", 8], ["qwen-color", "Qwen 3.6", 35], ["openai", "gpt-oss", 117], ["deepseek-color", "DeepSeek V3", 671]];
    const DMAX = 2.25, dia = (p) => DMAX * Math.cbrt(p / 671), base = 4.85, CD = dia(1000), HY = 1.7, TY = 6.15;
    const cxs = [];
    OPEN.forEach(([, , p], i) => cxs.push(i ? cxs[i - 1] + Math.max(1.4, (dia(OPEN[i - 1][2]) + dia(p)) / 2 + 0.4) : 0));
    const last = cxs.at(-1);
    // with the closed models: labels 0.75 left of the first; the closed circle past the dashed line
    const span = last + DMAX / 2 + 1.0 + CD + 0.75, offB = M + (CW - span) / 2 + 0.75, dashX = offB + last + DMAX / 2 + 0.5, ccx = dashX + 0.5 + CD / 2;
    const offA = W / 2 - last / 2; // open weights alone: centred
    const bubble = (s, cx, d, logos, name, size, o = {}) => {
      const m = (k) => o.morph && `${o.morph}-${k}`;
      const g = [s.circle(cx, base - d / 2, d, o.dashed ? { fill: "blue", transparency: 82, line: { color: "blue", width: 2, dash: "dash" }, name: `Bubble ${name}` } : { fill: "blue", name: `Bubble ${name}`, morph: m("bubble") })];
      const ls = o.dashed ? 0.5 : Math.min(Math.max(0.55 * d, 0.24), 0.9), lg = ls * 0.25, lw = logos.length * ls + (logos.length - 1) * lg;
      for (const [k, file] of logos.entries()) g.push(s.picture(logoData(file), cx - lw / 2 + k * (ls + lg), base - d / 2 - ls / 2, ls, ls, { alt: name, name: `Logo ${name} ${k}`, morph: m(`logo-${k}`) }));
      const tw = o.dashed ? 3.2 : 2.4;
      g.push(s.text([br(name, { bold: true, fontSize: 16 }), { text: size, fontSize: 15, color: "muted" }], cx - tw / 2, base + 0.12, tw, 0.65, { align: "center", name: `Bubble label ${name}`, morph: m("label") }));
      return g;
    };
    const head = (s, label, x, w, morph) => s.text(label, x, HY, w, 0.45, { fontSize: 20, bold: true, color: "muted", align: "center", name: `Head ${label}`, morph });
    // what the choice trades off, as on the data slide; centred, so privacy moves them over when it joins
    const TRADE = [["gauge-high", "Speed"], ["sack-dollar", "Cost"], ["lock", "Privacy"]];
    const trade = (s, n) => TRADE.slice(0, n).map(([icon, label], k) => {
      const cx = W / 2 + (k - (n - 1) / 2) * 3.6;
      return [s.icon(icon, cx - 1.0, TY + 0.07, 0.45, "text", { morph: `trade-icon-${label}` }), s.text(label, cx - 0.38, TY, 2.2, 0.6, { fontSize: 24, bold: true, valign: "middle", morph: `trade-${label}` })];
    });
    const SOURCES = `Sources (model cards):
Gemma 3: https://huggingface.co/google/gemma-3-4b-it#:~:text=for%20the%204B%2C%2012B%2C%20and%2027B%20sizes
Llama 3.1: https://huggingface.co/meta-llama/Llama-3.1-8B#:~:text=in%208B%2C%2070B%20and%20405B%20sizes
Qwen3.6-35B-A3B: https://huggingface.co/Qwen/Qwen3.6-35B-A3B#:~:text=35B%20in%20total%20and%203B%20activated
gpt-oss-120b: https://huggingface.co/openai/gpt-oss-120b#:~:text=117B%20parameters%20with%205.1B%20active%20parameters
DeepSeek-V3: https://arxiv.org/abs/2412.19437#:~:text=671B%20total%20parameters%20with%2037B%20activated`;

    // 1. Open weights
    {
      const s = new Ctx("CONTENT", {
        title: "Model", bar: 1,
        notes: `
Next, the model. We can use different models for different jobs: just as people differ in training, models differ in capability.
(click) These are open-weight models, sized by their parameters, the numbers inside the network. Gemma 3 has 4 billion and runs on a laptop.
(click) Llama 3.1, 8 billion.
(click) Qwen 3.6, 35 billion: the model in our study, on one GPU server; only 3 billion of them work on each word (a mixture of experts).
(click) OpenAI's gpt-oss, 117 billion.
(click) DeepSeek V3, 671 billion: a rack of GPUs. Open weights means you can download them and run them on your own system, inside the hospital's firewall.
(click) As they get bigger, they get smarter, at any one point in time: within the same generation of models. But they're also slower, and cost more to run. So speed and cost are things to consider.
(Don't get into versions here: the names are only there to show the range.)
(The circles grow with size but aren't to scale: diameter goes with the cube root of the parameter count, so the small ones stay visible.)

${SOURCES}`,
      });
      const open = OPEN.map(([file, name, p], i) => bubble(s, offA + cxs[i], dia(p), [file], name, `${p}B`, { morph: `open-${i}` }));
      const openHead = head(s, "Open weights", offA - 1.2, last + 2.4, "open-head");
      open.forEach((g, i) => s.anim(i ? g : [openHead, g]));
      s.anim(trade(s, 2));
      await s.done();
    }
    // 2. And the closed ones (Morph)
    {
      const s = new Ctx("CONTENT", {
        title: "Model", bar: 1, transition: "morph",
        notes: `
(Morph, and the closed models come in with privacy) Then the closed models: GPT, Claude and Gemini. They're usually the most capable, but they run on the company's computers, so we have to send them the data. They don't publish their sizes: outside estimates put the largest above a trillion parameters. That's our estimate, not a published number, so the circle is dashed and drawn at one trillion.
So privacy is the third thing to consider: an open model can run inside the hospital; a closed one means sending patient data out, under an agreement.
Tailor the model to the task: the smallest one that does the job well, checked on your own task. And you can combine them: a small model for the routine charts, a bigger one for the hard ones.`,
      });
      OPEN.forEach(([file, name, p], i) => bubble(s, offB + cxs[i], dia(p), [file], name, `${p}B`, { morph: `open-${i}` }));
      head(s, "Open weights", offB - 0.75, dashX - offB + 0.75, "open-head");
      const privacy = trade(s, 3)[2]; // speed and cost move over (Morph); privacy comes in
      const closed = [s.line(dashX, HY - 0.05, dashX, 5.6, { color: "muted", width: 1.5, dash: "dash", name: "Open | closed" }), head(s, "Closed", ccx - 1.4, 2.8),
        ...bubble(s, ccx, CD, ["openai", "claude-color", "gemini-color"], "GPT · Claude · Gemini", "not published; likely over 1T", { dashed: true })];
      s.anim([closed, privacy], { on: "after", dur: 500 });
      await s.done();
    }
  }

  // ── Models keep getting better: METR's time horizons. The chart is METR's, drawn in greys (inverted for the black
  // stage), so its colours don't take on the deck's meanings.
  {
    const s = new Ctx("CONTENT", {
      title: "Model", bar: 1,
      notes: `
The meta point: these models are improving at breakneck speed, so today's capabilities shouldn't be taken as gospel. METR measures how long a task an AI agent can finish on its own, counted in how long the task takes a human expert: the length it gets right half the time. In 2023 that was a few minutes; now it's hours. METR: “The post-2023 doubling-time is 131 days under TH1.1”, about four months.
(click) So what's true today won't be true in six months. The floor rises for every model, the small ones too. Choose a model for today's task, and set things up so you can swap it.
(These are software and reasoning tasks, not clinical ones; the trend is the point. The chart is METR's, drawn in greys here. It prints a doubling time of 124 days for 2023 onwards; METR's Time Horizon 1.1 post gives 131 days. Confirm the chart's source page and licence before the day.)

Source: METR, "Time Horizon 1.1", 29 January 2026: https://metr.org/blog/2026-01-29-time-horizon-1-1/#:~:text=The%20post%2D2023%20doubling%2Dtime%20is%20131%20days`,
    });
    const file = here("../shared/charts/metr-length-of-tasks-log.png"), [pw, ph] = pngSize(file), ch = 4.55, cw = (ch * pw) / ph;
    const grey = sharp(file).greyscale().negate({ alpha: false }).png().toBuffer().then((b) => "image/png;base64," + b.toString("base64"));
    s.picture(grey, (W - cw) / 2, 1.45, cw, ch, { name: "METR chart", alt: "METR: length of tasks AI agents have been able to complete autonomously, by model release date" });
    s.anim(s.text("What’s true today won’t be true in six months.", M, 6.15, CW, 0.55, { fontSize: 24, bold: true, align: "center", name: "Message" }));
    cite(s, "Chart: METR, 2026 (in greys)");
    await s.done();
  }

  // ── Data: Rosa's record, laid out like an EHR; what the task needs
  {
    const s = new Ctx("CONTENT", {
      title: "Data", bar: 2,
      notes: `
Then the data: we specify exactly which parts of Rosa's chart are available. Here's her record, laid out the way an EHR shows it; it holds much more than this question needs.
(click) For a beta blocker it needs six parts: her problem list, medications, allergies, vital signs, lab results and notes. Not her immunizations, appointments, family or social history, insurance or address.
(click) That has implications for privacy: every part is patient data the protocol has to justify, and the minimum necessary applies. For focus: what the agent looks at; what it doesn't need can distract it. And for approval: the time it takes to get each source scoped and approved in a health system, by the IRB and IT. In the live build, each data card shows the weeks of review it adds.`,
    });
    // The window: Rosa's banner, tabs, then the summary's panels, each a heading over grey bars.
    const ex = M, ey = 1.6, ew = CW, eh = 3.9, by = ey, tby = by + 0.68;
    s.card(ex, ey, ew, eh, { rectRadius: 0.12, name: "EHR" });
    s.shape("ROUNDED_RECTANGLE", ex, by, ew, 0.62, { fill: "raised", rectRadius: 0.12, name: "Banner" });
    s.shape("RECTANGLE", ex, by + 0.4, ew, 0.22, { fill: "raised", name: "Banner base" });
    s.picture(rosaData(), ex + 0.22, by + 0.1, 0.42, 0.42, { name: "Rosa" });
    s.text([{ text: "Rosa Delgado", bold: true }, { text: "     71 y  ·  Female", color: "muted" }], ex + 0.8, by, 6.0, 0.62, { fontSize: 16, valign: "middle", name: "Patient" });
    s.text("PCP: Dr. L. Rivera     Cardiology: Dr. A. Patel", ex + ew - 5.25, by, 5.0, 0.62, { fontSize: 13, color: "muted", align: "right", valign: "middle", name: "Banner right" });
    let tx = ex + 0.25;
    ["Summary", "Chart Review", "Results", "Notes", "Medications", "Orders"].forEach((t, i) => {
      const w = measure(t, 13, !i) + 0.3;
      s.text(t, tx, tby, w, 0.4, { fontSize: 13, bold: !i, color: i ? "muted" : "text", align: "center", valign: "middle", name: `Tab ${t}` });
      if (!i) s.shape("RECTANGLE", tx, tby + 0.4, w, 0.04, { fill: "text", name: "Tab underline" });
      tx += w + 0.15;
    });
    s.line(ex, tby + 0.44, ex + ew, tby + 0.44, { color: "dim", width: 0.75, name: "Tabs rule" });
    const PANELS = [["notes-medical", "Problem list", 1], ["pills", "Medications", 1], ["hand-dots", "Allergies", 1], ["heart-pulse", "Vital signs", 1],
      ["flask", "Lab results", 1], ["file-lines", "Notes", 1], ["syringe", "Immunizations"], ["calendar-days", "Appointments"],
      ["users", "Family history"], ["house", "Social history"], ["id-card", "Insurance"], ["address-card", "Demographics"]];
    const px0 = ex + 0.25, pg = 0.15, pw = (ew - 0.5 - 3 * pg) / 4, phh = 0.7, py0 = tby + 0.62, need = [], skip = [];
    PANELS.forEach(([icon, head, needed], i) => {
      const x = px0 + (i % 4) * (pw + pg), y = py0 + Math.floor(i / 4) * (phh + 0.12);
      s.shape("ROUNDED_RECTANGLE", x, y, pw, phh, { fill: "raised", rectRadius: 0.1, name: `Panel ${head}` });
      s.icon(icon, x + 0.16, y + 0.14, 0.22, "muted", { name: `Panel icon ${head}` });
      s.text(head, x + 0.5, y + 0.09, pw - 0.6, 0.32, { fontSize: 13, bold: true, valign: "middle", name: `Panel head ${head}` });
      [0.72, 0.46].forEach((f, k) => s.shape("ROUNDED_RECTANGLE", x + 0.16, y + 0.45 + k * 0.13, (pw - 0.32) * (f - (i % 3) * 0.06), 0.07, { fill: "edge", rectRadius: 0.035, name: `Panel bar ${head} ${k}` }));
      if (needed) need.push(s.shape("ROUNDED_RECTANGLE", x, y, pw, phh, { line: { color: "text", width: 2 }, rectRadius: 0.1, name: `Needed ${head}` }));
      else skip.push(s.shape("ROUNDED_RECTANGLE", x - 0.02, y - 0.02, pw + 0.04, phh + 0.04, { fill: "card", transparency: 25, rectRadius: 0.1, name: `Not needed ${head}` }));
    });
    if (py0 + 3 * phh + 2 * 0.12 > ey + eh - 0.15) throw new Error("data slide: the panels overflow the window");
    s.anim([need, skip]);
    s.stagger([["lock", "Privacy"], ["bullseye", "Focus"], ["hourglass-half", "Approval"]].map(([icon, label], k) => {
      const cx = W / 2 + (k - 1) * 3.6;
      return [s.icon(icon, cx - 1.0, 6.1, 0.5, "text", { name: `Why icon ${label}` }), s.text(label, cx - 0.35, 6.05, 2.2, 0.6, { fontSize: 24, bold: true, valign: "middle", name: `Why ${label}` })];
    }), { gap: 150 });
    await s.done();
  }

  // ── Tools: some gather context, some act (the faculty talk's agent slide, here rather than on the ReAct slide); for this
  // task the ones that act are locked. The agent sits in the middle; links curve into it from the left and out of it to
  // the right.
  {
    const s = new Ctx("CONTENT", {
      title: "Tools", bar: 3,
      notes: `
Then the tools. We've covered how they work: it's all text, so almost anything can be a tool.
(click) Some gather context: read a note, search the notes, read her records, her medications, diagnoses and vital signs.
(click) And some act in the world, outside the chart: message the patient, and one day, place an order. That's where we need to be careful (the warning sign): gathering and acting are very different levels of trust.
(click) So we have to be careful how each tool runs, and give it only the tools the task needs. For a quality review, the tools that act stay locked: it shouldn't contact patients or prescribe.`,
    });
    const cx = W / 2, cy = 3.95, LR = 1.0, tw = 3.9, th = 0.68, ys = [2.6, 3.5, 4.4], lxl = M, lxr = W - M - tw, hy = 1.8;
    const gather = [["file-lines", "Read a note"], ["magnifying-glass", "Search notes"], ["table-list", "Read records"]];
    const act = [["message", "Message the patient"], ["prescription", "Place an order"]];
    const head = (icon, label, x, align) => [s.icon(icon, align === "right" ? x + tw - 0.45 : x, hy + 0.05, 0.45, "text", { name: `${label} icon` }),
      s.text(label, align === "right" ? x : x + 0.62, hy, tw - 0.62, 0.55, { fontSize: 22, bold: true, align, valign: "middle", name: `${label} head` })];
    const gl = gather.map((_, k) => link(s, [lxl + tw, ys[k] + th / 2], [cx - LR - 0.15, cy], { name: `Gather link ${k}` }));
    const al = act.map((_, k) => link(s, [cx + LR + 0.15, cy], [lxr, ys[k] + th / 2], { name: `Act link ${k}` }));
    agent(s, cx, cy, LR, { morph: false, width: 2.5 });
    s.anim([head("eye", "Gather context", lxl, "left"), gl, gather.map(([icon, label], k) => toolCard(s, 10 + k, icon, label, lxl, ys[k], tw, th, { morph: false }))]);
    s.anim([head("triangle-exclamation", "Act", lxr, "right"), al, act.map(([icon, label], k) => toolCard(s, 20 + k, icon, label, lxr, ys[k], tw, th, { morph: false }))]);
    // locked: a veil over each, and a lock
    s.anim([act.map((_, k) => [s.card(lxr - 0.02, ys[k] - 0.02, tw + 0.04, th + 0.04, { fill: "bg", transparency: 40, rectRadius: 0.18, name: `Locked veil ${k}` }),
      s.icon("lock", lxr + tw - 0.55, ys[k] + (th - 0.3) / 2, 0.3, "text", { name: `Locked ${k}` })]),
    s.text("Only the tools the task needs", M, 6.05, CW, 0.55, { fontSize: 26, bold: true, align: "center", name: "Message" })]);
    await s.done();
  }

  // ── Prompt. Two slides: a short prompt, then (Morph) the box grows and a longer prompt is typed into it, and the run
  // goes further. The box, the arrow and the agent are the Morph objects; each slide's text is its own (typed in, letter
  // by letter, as someone would), and the answer comes a word at a time, as the model writes it.
  // The demo's recorded runs on gpt-6-luna: demo_pi/recorded/rosa-meds-given.json (her medications, read_records) and
  // rosa-notes-gap.json (her medications and notes, the note tools). Prompts verbatim; answers shortened.
  const RY = 3.55, RW = 3.9, AX = W / 2, ANS_X = 8.55, PAD = 0.2;
  const promptScene = (s, prompt, ph, k) => {
    const box = s.shape("ROUNDED_RECTANGLE", M, RY - ph / 2, RW, ph, { fill: "card", rectRadius: 0.15, morph: "prompt-box" });
    const text = s.text(prompt, M + PAD, RY - ph / 2 + PAD, RW - 2 * PAD, ph - 2 * PAD, { fontSize: 22, valign: "middle", morph: `prompt-text-${k}` });
    const into = s.arrow(M + RW + 0.15, RY, AX - 1.0, RY, { morph: "prompt-arrow" });
    return { box, text, into, agent: agent(s, AX, RY, 0.85, { width: 2.5 }) };
  };
  const answer = (s, text, ph, o = {}) => ({
    arrow: s.arrow(AX + 1.0, RY, ANS_X - 0.15, RY, { name: "Answer arrow" }),
    box: s.shape("ROUNDED_RECTANGLE", ANS_X, RY - ph / 2, W - M - ANS_X, ph, { fill: "card", rectRadius: 0.15, ...(o.right && { line: { color: "green", width: 2 } }), name: "Answer box" }),
    text: s.text(text, ANS_X + PAD, RY - ph / 2 + PAD, W - M - ANS_X - 2 * PAD, ph - 2 * PAD, { fontSize: 22, color: "blue", valign: "middle", name: "Answer" }),
  });
  {
    const s = new Ctx("CONTENT", {
      title: "Prompt", bar: 4,
      notes: `
Then the prompt: what we tell it, typed in, just as you'd type a message. It's what starts the loop, and it's where clinicians come in again: saying exactly what we want to know.
(click) Ask only "Is this patient on a beta blocker?"
(click) It reads her medication list, and answers: no, carvedilol was stopped on 14 May. True, but it doesn't say why, and it doesn't say whether that's a problem.`,
    });
    const q = "Is this patient on a beta blocker?", a = "No. Carvedilol was stopped on 14 May.";
    const { box, text, into, agent } = promptScene(s, q, 1.2, "a");
    s.anim(box, { dur: 300 });
    s.typed(text, q, { on: "after" });
    s.anim([into, agent]);
    s.anim(call(s, "read_records", AX, RY + 1.1, { icon: "table-list" }), { on: "after", delay: 300 });
    const ans = answer(s, a, 1.2);
    s.anim([ans.arrow, ans.box], { on: "after", delay: 400 });
    s.written(ans.text, a, { on: "after" });
    await s.done();
  }
  {
    const s = new Ctx("CONTENT", {
      title: "Prompt", bar: 4, transition: "morph",
      notes: `
(The box grows; the new prompt is typed in.) Now ask the measure's whole question: if not, is there a documented reason, or is it a care gap? And give it her notes to answer with.
(click) It reads her medications, then searches the notes, finds the heart block, and answers: stopped after Mobitz II heart block, the notes say not to restart, so a documented contraindication, not a care gap. The longer prompt sent it looking for the reason.
(click) The prompt starts the loop, and steers it. Ask a simple question, get a simple answer; ask for more, and it does more work and tells you more, which may be what you actually wanted. Writing a good prompt is a clinical skill, not a technical one.
(Both are runs recorded for the demo, on gpt-6-luna; the second also had her notes and the note search. The answers here are shortened.)`,
    });
    const q = "Is this patient on a beta blocker? If not, is there a documented reason, or is it a care gap?";
    const a = "No. Stopped after Mobitz II heart block; the notes say not to restart. Not a care gap.";
    const { text } = promptScene(s, q, 2.5, "b");
    s.typed(text, q, { on: "after", delay: 200, ms: 30 });
    s.stagger([call(s, "read_records", AX, RY + 1.1, { icon: "table-list" }), call(s, "search_notes", AX, RY + 1.7)], { gap: 350 });
    const ans = answer(s, a, 2.5, { right: true });
    s.anim([ans.arrow, ans.box], { on: "after", delay: 350 });
    s.written(ans.text, a, { on: "after" });
    s.anim(s.text("The prompt starts the loop, and steers it", M, 6.2, CW, 0.55, { fontSize: 24, bold: true, align: "center", name: "Message" }));
    await s.done();
  }

  // ── Guardrails (placeholder: Lovedeep's talk takes it from here)
  {
    const s = new Ctx("CONTENT", {
      title: "Guardrails", bar: 5,
      notes: `
And the last one: guardrails. What keeps its work safe: what it's allowed to do, what a person checks, and when. That's where Lovedeep takes over.`,
    });
    await s.done();
  }

  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  await postProcess(OUT);
  console.log("wrote", OUT, `(${SLIDES.length} slides)`);
}

// ---------------------------------------------------------------- transitions + animations (XML)
const FX = {
  fade: { preset: 10, sub: 0, filter: "fade", cls: "entr" },
  "wipe-left": { preset: 22, sub: 8, filter: "wipe(left)", cls: "entr" },
  "wipe-up": { preset: 22, sub: 4, filter: "wipe(down)", cls: "entr" },
  "wipe-right": { preset: 22, sub: 2, filter: "wipe(right)", cls: "entr" },
  appear: { preset: 1, sub: 0, cls: "entr" },
  "fade-out": { preset: 10, sub: 0, filter: "fade", cls: "exit" },
  play: { preset: 1, sub: 0, cls: "mediacall" },
};

function timingXml(anims, ids, kinds, videoIds) {
  // Group into click sequences; each group's effects get start times (ms) relative to its trigger.
  const groups = [], grp = {}, builds = [];
  for (const a of anims) {
    const spid = ids[a.name];
    if (!spid) throw new Error(`animation target not found: ${a.name}`);
    if (a.on === "click" || !groups.length) groups.push({ auto: a.on !== "click", fx: [] });
    const g = groups[groups.length - 1], prev = g.fx[g.fx.length - 1];
    const start = !prev ? a.delay : a.on === "with" ? prev.start : prev.start + prev.dur + a.delay;
    const media = a.fx === "play";
    const gid = media ? null : (grp[spid] = (grp[spid] ?? -1) + 1);
    // Letters or words one at a time animate the text only; everything else animates the shape as one object.
    if (!media && kinds[spid] === "sp") builds.push(`<p:bldP spid="${spid}" grpId="${gid}"${a.iterate ? "" : ' animBg="1"'}/>`);
    g.fx.push({ ...a, spid, gid, start, node: !prev ? (a.on === "click" ? "clickEffect" : "afterEffect") : a.on === "with" ? "withEffect" : "afterEffect" });
  }
  let id = 2;
  const nid = () => ++id;
  const effect = (f) => {
    const p = FX[f.fx], tgt = `<p:tgtEl><p:spTgt spid="${f.spid}"/></p:tgtEl>`, out = p.cls === "exit";
    if (p.cls === "mediacall") return { body: `<p:cmd type="call" cmd="playFrom(0.0)"><p:cBhvr><p:cTn id="${nid()}" dur="${f.dur}" fill="hold"/>${tgt}</p:cBhvr></p:cmd>`, p };
    const vis = (delay, val) => `<p:set><p:cBhvr><p:cTn id="${nid()}" dur="1" fill="hold"><p:stCondLst><p:cond delay="${delay}"/></p:stCondLst></p:cTn>${tgt}<p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr><p:to><p:strVal val="${val}"/></p:to></p:set>`;
    const anim = p.filter ? `<p:animEffect transition="${out ? "out" : "in"}" filter="${p.filter}"><p:cBhvr><p:cTn id="${nid()}" dur="${f.each ?? f.dur}"/>${tgt}</p:cBhvr></p:animEffect>` : "";
    return { body: out ? anim + vis(f.dur - 1, "hidden") : vis(0, "visible") + anim, p };
  };
  const groupXml = groups.map((g) => {
    const slots = new Map();
    g.fx.forEach((f) => (slots.get(f.start) || slots.set(f.start, []).get(f.start)).push(f));
    const outer = nid();
    const inner = [...slots.entries()].sort((a, b) => a[0] - b[0]).map(([start, fs]) => {
      const sid = nid();
      const effs = fs.map((f) => {
        const cid = nid(), e = effect(f);
        const iter = f.iterate ? `<p:iterate type="${f.iterate.type}"><p:tmAbs val="${f.iterate.ms}"/></p:iterate>` : "";
        return `<p:par><p:cTn id="${cid}" presetID="${e.p.preset}" presetClass="${e.p.cls}" presetSubtype="${e.p.sub}" fill="hold"${f.gid !== null && kinds[f.spid] === "sp" ? ` grpId="${f.gid}"` : ""} nodeType="${f.node}"><p:stCondLst><p:cond delay="0"/></p:stCondLst>${iter}<p:childTnLst>${e.body}</p:childTnLst></p:cTn></p:par>`;
      }).join("");
      return `<p:par><p:cTn id="${sid}" fill="hold"><p:stCondLst><p:cond delay="${start}"/></p:stCondLst><p:childTnLst>${effs}</p:childTnLst></p:cTn></p:par>`;
    }).join("");
    const cond = g.auto ? `<p:cond delay="indefinite"/><p:cond evt="onBegin" delay="0"><p:tn val="2"/></p:cond>` : `<p:cond delay="indefinite"/>`;
    return `<p:par><p:cTn id="${outer}" fill="hold"><p:stCondLst>${cond}</p:stCondLst><p:childTnLst>${inner}</p:childTnLst></p:cTn></p:par>`;
  }).join("");
  const videos = videoIds.map((spid) => `<p:video><p:cMediaNode vol="80000"><p:cTn id="${nid()}" fill="hold"><p:stCondLst><p:cond delay="indefinite"/></p:stCondLst></p:cTn><p:tgtEl><p:spTgt spid="${spid}"/></p:tgtEl></p:cMediaNode></p:video>`).join("");
  return `<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst><p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>${groupXml}</p:childTnLst></p:cTn><p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst><p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq>${videos}</p:childTnLst></p:cTn></p:par></p:tnLst>${builds.length ? `<p:bldLst>${builds.join("")}</p:bldLst>` : ""}</p:timing>`;
}

const unxml = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&apos;/g, "'");
const xmlName = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function postProcess(file) {
  const zip = await JSZip.loadAsync(readFileSync(file));
  for (let i = 0; i < SLIDES.length; i++) {
    const p = `ppt/slides/slide${i + 1}.xml`, { anims, transition, videos } = SLIDES[i];
    let xml = await zip.file(p).async("string");
    // Videos: pptxgenjs derives their shape id from a relationship number, which can collide; give each a fresh one.
    videos.forEach((nm, k) => { xml = xml.replace(new RegExp(`<p:cNvPr id="\\d+" name="${xmlName(nm).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}">`), `<p:cNvPr id="${3001 + k}" name="${xmlName(nm)}">`); });
    const ids = {}, kinds = {};
    for (const m of xml.matchAll(/<p:(sp|pic)>\s*<p:nv(?:Sp|Pic)Pr>\s*<p:cNvPr id="(\d+)" name="([^"]*)"/g)) {
      const name = unxml(m[3]);
      if (ids[name] && (anims.some((a) => a.name === name) || name.startsWith("!!"))) throw new Error(`slide ${i + 1}: duplicate object name "${name}"`);
      ids[name] = m[2];
      kinds[m[2]] = m[1];
    }
    const tr = transition === "none" ? ""
      : transition === "morph"
        ? `<mc:AlternateContent xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"><mc:Choice xmlns:p159="http://schemas.microsoft.com/office/powerpoint/2015/09/main" Requires="p159"><p:transition spd="slow"><p159:morph option="byObject"/></p:transition></mc:Choice><mc:Fallback><p:transition spd="slow"><p:fade/></p:transition></mc:Fallback></mc:AlternateContent>`
        : `<p:transition spd="med"><p:fade/></p:transition>`;
    xml = xml.replace(/<a:solidFill><a:srgbClr val="(FE\d{4})"\s*(?:\/>|>.*?<\/a:srgbClr>)<\/a:solidFill>/g, (m, key) => GRADS.get(key) || m); // gradient fills
    const timing = anims.length || videos.length ? timingXml(anims, ids, kinds, videos.map((nm) => ids[nm])) : "";
    const before = xml;
    xml = xml.replace(/(<p:clrMapOvr>.*?<\/p:clrMapOvr>|<p:clrMapOvr\/>)/s, (m) => m + tr + timing);
    if (xml === before && (tr || timing)) throw new Error(`slide ${i + 1}: no clrMapOvr to anchor the transition`);
    zip.file(p, xml);
  }
  writeFileSync(file, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

build().catch((e) => { console.error(e); process.exit(1); });
