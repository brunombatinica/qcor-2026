// Bruno's section of the QCOR 2026 session as PowerPoint: what an agent is (model → model + context → agent) and how
// to set one up (task, model, data, tools, prompt, guardrails). It ends on a placeholder for guardrails, Lovedeep's talk.
//   node build.mjs  ->  qcor-bruno-agents.pptx        (just pptx; check it with just pptx-render)
//
// The template is Bruno's AHA 2026 faculty talk (misc/aha26-faculty-talk, deck/build.js): its title and disclosure
// slides, a black stage, Apple dark-mode colours, Arial, Font Awesome icons, every object native and editable on theme
// colours. The slides before "Set it up like a remote colleague" are shared with that talk: the language-model, "text is
// a universal interface" and agent slides are ported from it (3 Nov 2026), in our blue and with Rosa.
// Each colour means one thing, and nothing else is coloured:
//   blue    the model, and the words it writes (and its context, on the map)
//   green   right: what it wrote matches her chart
//   orange  made up
//   greys   everything else: the patient, her chart, tools, people
// Slides have no titles until the setup; there the title is the step, and the icon bar at the top right shows where we are.
// The model sits on the left and what it is given on the right; chats are iMessage bubbles, yours grey, the model's blue.
//
// What pptxgenjs can't write is added to the slide XML afterwards (postProcess): entrance and exit animations (Fade,
// Wipe, typing letter by letter, words one at a time), video playback, and Morph transitions. Morph pairs objects named
// "!!id" across slides, but it also pairs unnamed shapes of the same kind, so a Morph slide shows only paired objects
// until its first animation; every other object enters by animation. The setup slides fade into each other; only the
// move into the bar and the prompt box that grows on the prompt slides are Morph.
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { applyTheme } from "./theme.mjs";

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
  // A PNG fitted inside the box, keeping its aspect ratio; align left, centre (default) or right.
  image(file, x, y, w, h, o = {}) {
    const name = this.name(o, "Picture"), [pw, ph] = pngSize(file), r = pw / ph;
    let iw = w, ih = w / r;
    if (ih > h) { ih = h; iw = h * r; }
    const ix = o.align === "left" ? x : o.align === "right" ? x + w - iw : x + (w - iw) / 2;
    this.add(() => this.slide.addImage({ path: file, x: ix, y: y + (h - ih) / 2, w: iw, h: ih, altText: o.alt || name, objectName: name }));
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
// The faculty talk's logo row, along the bottom of the title slide.
function logos(s, y) {
  s.image(LOGO("aha-scientific-sessions-white.png"), M, y, 1.6, 0.6, { align: "left", name: "Logo Scientific Sessions" });
  s.image(LOGO("aha-white.png"), W / 2 - 0.8, y - 0.05, 1.6, 0.7, { name: "Logo AHA" });
  s.image(LOGO("cards-lab-yale-white.png"), W - M - 2.0, y, 2.0, 0.6, { align: "right", name: "Logo CarDS Lab" });
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
function flow(words, x0, y0, maxW, pt, lineH, bold) {
  const sp = measure(" ", pt, bold);
  let x = x0, y = y0;
  return words.map((w) => {
    const ww = measure(w, pt, bold);
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
// the model's middle, and under it the label: the word the text really had, an outline because it comes from outside
// the model. The box is in blues because it is the model. Every part has a Morph name, so the frames move into each other.
const TR = { cy: 3.45, hx0: 4.0, hx1: 5.1, mx: 5.1, mw: 3.5, mh: 2.9, bx: 9.65, bw: 2.75, bh: 1.2, lgap: 0.4 };
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
const OUT_BOX = [TR.bx, TR.cy - TR.bh / 2, TR.bw, TR.bh], LABEL_BOX = [TR.bx, TR.cy + TR.bh / 2 + TR.lgap, TR.bw, TR.bh];
// Everything right of the text. Returns the label box, which the first frame reveals on click.
function trainingScene(s, { vals, out, outColor, label }) {
  hopper(s, TR.hx0, TR.hx1, TR.cy, 3.05, 0.66);
  modelBox(s, TR.mx, TR.cy - TR.mh / 2, TR.mw, TR.mh, vals);
  s.arrow(TR.mx + TR.mw + 0.12, TR.cy, TR.bx - 0.12, TR.cy, { morph: "tr-arrow" });
  valueBox(s, OUT_BOX, "Output", out, { color: outColor, morph: "tr-output" });
  return label === null ? null : valueBox(s, LABEL_BOX, "Label", label, { outline: true, morph: "tr-label" });
}

// The spine, with no title: a model; a model and its context (a blue sheet beside it); an agent (the model in its loop).
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
    [...loop(s, c[2], MAP_Y, 1.1, { transparency: t(2), morph: mm(2) }), ...model(s, c[2], MAP_Y, 1.4, { transparency: t(2), morph: mm(2) })],
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
// A tool call, as the model writes it: monospace on the model's blue.
const call = (s, text, cx, y, w = 2.3, o = {}) => s.text(text, cx - w / 2, y, w, o.h || 0.4, { fontSize: o.pt || 14, bold: true, font: MONO, color: "text", fill: "blue", shape: "ROUNDED_RECTANGLE", rectRadius: 0.2, align: "center", valign: "middle", name: o.name || `Call ${text}` });

// A chat bubble with a tail at its bottom corner, as in iMessage: yours grey with the tail on the right, the model's
// blue with the tail on the left. x is the tail's side: the right edge for yours, the left edge for the model's. The
// bubble fits its text (Arial metrics), up to maxW wide.
function bubblePath(x, y, w, h, side) {
  const r = Math.min(0.2, h / 2), k = 0.5523 * r, R = x + w, B = y + h;
  const pts = [
    [x + r, y], [R - r, y],
    { x: R, y: y + r, c1: [R - r + k, y], c2: [R, y + r - k] },
    [R, B - 0.22],
    { x: R + 0.12, y: B, c1: [R, B - 0.08], c2: [R + 0.05, B - 0.005] }, // the tail's outer edge, down to its tip
    { x: R - 0.26, y: B, c1: [R - 0.03, B - 0.02], c2: [R - 0.14, B - 0.06] }, // and back under the bubble
    [x + r, B],
    { x, y: B - r, c1: [x + r - k, B], c2: [x, B - r + k] },
    [x, y + r],
    { x: x + r, y, c1: [x, y + r - k], c2: [x + r - k, y] },
  ];
  if (side === "right") return pts;
  const m = (p) => [2 * x + w - p[0], p[1]];
  return pts.map((p) => (Array.isArray(p) ? m(p) : { x: 2 * x + w - p.x, y: p.y, c1: m(p.c1), c2: m(p.c2) }));
}
function chatBubble(s, text, x, y, maxW, o = {}) {
  const pt = o.pt || 16, mx = 0.17, my = 0.1, lineH = (pt * 1.2) / 72;
  const toks = flow(text.split(" "), 0, 0, maxW - 2 * mx - 0.12, pt, 1, false);
  const lines = new Set(toks.map((t) => t.y)).size, tw = Math.max(...toks.map((t) => t.x + t.ww)) + 0.12;
  const w = tw + 2 * mx, h = lines * lineH + 2 * my, mine = o.from !== "model", bx = mine ? x - w : x;
  const shape = s.path(bubblePath(bx, y, w, h, mine ? "right" : "left"), { fill: mine ? "dim" : "blue", name: `${o.name} bubble` });
  const t = s.text(text, bx + mx, y + my, tw, h - 2 * my, { fontSize: pt, valign: "middle", name: o.name });
  return { g: [shape, t], shape, text: t, w, h };
}

// A link that leaves and arrives level (vertical: upright), a cubic with its control points halfway along.
const linkCtl = ([x0, y0], [x1, y1], vertical) => (vertical ? [[x0, (y0 + y1) / 2], [x1, (y0 + y1) / 2]] : [[(x0 + x1) / 2, y0], [(x0 + x1) / 2, y1]]);
const link = (s, a, b, o = {}) => { const [c1, c2] = linkCtl(a, b, o.vertical); return s.path([a, { x: b[0], y: b[1], c1, c2 }], { open: true, line: { color: o.color || "dim", width: o.width || 1.5 }, name: o.name }); };
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
Thanks, Phyllis. Phyllis showed you what agents can be used for. My part is what an agent actually is, and how you set one up.
Same patient as the rest of the session: Rosa. She's synthetic, like every patient today.`,
    });
    logos(s, 6.45);
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
One idea to hold on to for the next few minutes.
(click) We start with a model.
(click) Then a model with context: the information we give it.
(click) Then an agent: the model in a loop, which goes and gets its own context. Each step builds on the one before.`);

  // ── How a language model learns (the faculty talk's training picture, four Morph frames)
  {
    const vals = [[0.3, 0.76, 0.42, 0.64, 0.22, 0.56], [0.44, 0.6, 0.56, 0.52, 0.4, 0.5], [0.38, 0.7, 0.47, 0.6, 0.32, 0.62], [0.55, 0.5, 0.63, 0.46, 0.52, 0.44]];
    const F = [
      ["Once upon a", "dog", "time", false], ["Once upon a", "time", "time", true],
      ["Started on furosemide for heart", "burn", "failure", false], ["Started on furosemide for heart", "failure", "failure", true],
    ];
    const notes = [`
So what is a large language model? A neural network trained on one task: predict the next word. (Strictly, the next token: a word or a piece of one.)
The input is text with the next word missing: "Once upon a…". Inside, the model is millions or billions of numbers, the sliders. Its output, out of the model: "dog".
(click) The label is simply the word that actually came next in the text, "time". It comes from outside the model, and nobody has to write it: the text labels itself. We compare the output with the label.`,
    `(Morph) So every slider moves a little, in the direction that makes "time" more likely. Now it gets it right.`,
    `(Morph) Then the next piece of text, and the next: general text, and medical text. "Started on furosemide for heart…": it guesses "burn"; the label is "failure".`,
    `(Morph) Adjust, and it's right. Repeat that for trillions of words: Llama 3 was pretrained on over 15 trillion tokens. To predict the next word that well, it has to learn a lot about language, and about what language describes, medicine included.

Source: Meta AI, "Introducing Meta Llama 3", April 2024: “Llama 3 is pretrained on over 15T tokens that were all collected from publicly available sources.” https://ai.meta.com/blog/meta-llama-3/#:~:text=Llama%203%20is%20pretrained%20on%20over%2015T%20tokens`];
    for (let k = 0; k < 4; k++) {
      const s = new Ctx("CONTENT", { transition: k ? "morph" : "fade", notes: notes[k] });
      const [text, out, label, ok] = F[k];
      s.text([{ text: `${text} ` }, { text: "______", color: "muted" }], 0.95, TR.cy - 1.0, 2.85, 2.0, { fontSize: 22, bold: true, fill: "card", shape: "ROUNDED_RECTANGLE", rectRadius: 0.15, valign: "middle", margin: 14, morph: "llm-in" });
      const lab = trainingScene(s, { vals: vals[k], out, outColor: ok ? "green" : undefined, label });
      if (!k) s.anim(lab);
      await s.done();
    }
  }

  // ── It writes, one word at a time (Morph; each word goes from the output back into the text, in blue)
  {
    const s = new Ctx("CONTENT", {
      transition: "morph",
      notes: `
(Morph) Trained, the model does one thing: given the text so far, it predicts the next word.
(click: it writes by itself) We add that word to the text and go again. One word at a time, it writes the sentence: "…for heart failure to relieve congestion." Blue is what the model wrote.
One word at a time, it can write anything: a discharge summary, a letter, an answer to a question.`,
    });
    const cx0 = 0.95, cy0 = TR.cy - 1.45, cwid = 2.85, chgt = 2.9, pt = 20, lh = 0.4;
    s.shape("ROUNDED_RECTANGLE", cx0, cy0, cwid, chgt, { fill: "card", rectRadius: 0.15, morph: "llm-in" });
    const prompt = "Started on furosemide for heart".split(" "), cont = ["failure", "to", "relieve", "congestion."];
    const toks = flow([...prompt, ...cont], cx0 + 0.22, cy0 + 0.25, cwid - 0.44, pt, lh, true);
    const lines = new Map();
    toks.slice(0, prompt.length).forEach((t) => (lines.get(t.y) || lines.set(t.y, []).get(t.y)).push(t));
    [...lines.values()].forEach((ts, i) => s.text(ts.map((t) => t.w).join(" "), ts[0].x, ts[0].y, ts.at(-1).x + ts.at(-1).ww - ts[0].x + 0.3, lh, { fontSize: pt, bold: true, name: `Prompt ${i}` }));
    trainingScene(s, { vals: [0.55, 0.5, 0.63, 0.46, 0.52, 0.44], out: " ", label: null });
    const ob = OUT_BOX;
    toks.slice(prompt.length).forEach((t, i) => {
      const o = s.text(t.w, ob[0], ob[1] + 0.38, ob[2], 0.7, { fontSize: 30, bold: true, color: "blue", align: "center", valign: "middle", name: `Out ${i}` });
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
It knows a lot of medicine. But all of it was fixed in training: it has no short-term memory of its own, and it has never seen Rosa's chart. So ask it to finish a sentence about her.
(click) It writes something plausible: carvedilol, lisinopril and furosemide, what a lot of people with heart failure take.
(click) It's made up. Rosa takes sacubitril/valsartan, not lisinopril, and her carvedilol was stopped in May for heart block.
That's all a hallucination is: the model doing its one job, finishing the sentence, with nothing true to go on.`,
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
So the second step: give it context.`);

  // ── Model + context: give it her chart (Morph: the model moves across from the map)
  {
    const s = new Ctx("CONTENT", {
      transition: "morph",
      notes: `
Context is whatever text we put in front of the model. Here: the heart-failure medicines from Rosa's chart, then the same sentence.
(click) Now the likeliest next words are the ones in front of it: sacubitril/valsartan, spironolactone, dapagliflozin and furosemide.
(click) Correct, because it's in her chart. Same model, same sentence: the context changed the answer.
(Her chart is synthetic, the one in today's demo.)`,
    });
    // The model and the blue sheet move across from the map (Morph); her chart comes in around the sheet just after.
    const y0 = 0.95, x = CTX.x + 0.5, tw = CTX.w - 1.0;
    model(s, CTX.mx, CTX.my, CTX.md);
    const chart = [s.shape("ROUNDED_RECTANGLE", CTX.x, y0, CTX.w, 5.2, { fill: "card", rectRadius: 0.06, morph: "doc" }),
      s.text("Rosa’s chart", x + 0.5, y0 + 0.29, 4, 0.38, { fontSize: 18, bold: true, color: "muted", valign: "middle", name: "Chart head" }),
      s.text([br("sacubitril/valsartan 49/51 mg twice daily"), br("spironolactone 25 mg once daily"), br("dapagliflozin 10 mg once daily"), br("furosemide 40 mg once daily"), { text: "carvedilol: stopped 14 May 2026", color: "muted" }],
        x, y0 + 0.83, tw, 2.2, { fontSize: 22, lineSpacingMultiple: 1.05, name: "Medicines" }),
      s.line(x, y0 + 3.13, x + tw, y0 + 3.13, { color: "dim", width: 1, name: "Divider" })];
    s.icon("file-lines", x, y0 + 0.3, 0.36, "blue", { morph: "context" }); // drawn over the chart it heads
    const { head, words, twins } = sentence(s, ROSA, ["sacubitril/valsartan,", "spironolactone,", "dapagliflozin", "and", "furosemide."], { x, y: y0 + 3.33, w: tw, pt: 28, lineH: 0.52, final: "green" });
    s.anim([chart, head], { on: "after" });
    s.stagger(words, { dur: 300, gap: 150 });
    s.anim([twins, s.text("Correct, with the right context", CTX.x, y0 + 5.35, CTX.w, 0.55, { fontSize: 26, bold: true, color: "green", align: "center", valign: "middle", name: "Correct" })]);
    s.anim(words, { on: "with", fx: "fade-out" });
    await s.done();
  }

  // ── Today: copy and paste (Morph: the model moves into the chat, on the left; her chart becomes the EHR, on the right)
  {
    const s = new Ctx("CONTENT", {
      transition: "morph",
      notes: `
Who put her chart there? Today, usually we do. It's how most of us use ChatGPT and other chatbots:
(click) find her medicines, copy, paste;
(click) find her last note, from primary care, copy, paste;
(click) then ask: is anything missing? It spots that carvedilol was stopped. But it can't say why: the reason is in a cardiology note we didn't paste. We are doing the gathering, one copy at a time, and it only knows what we happened to copy.
(The note is quoted from her synthetic chart: the primary care visit of 20 October.)`,
    });
    const ew = 4.3, ey = 1.2, eh = 5.0, cx0 = M, ex = W - M - ew;
    // the chat, on the left: the model's side
    const chat = [s.card(cx0, ey, ew, eh, { rectRadius: 0.06, name: "Chat" }),
      s.text("Chat", cx0 + 0.8, ey + 0.05, 2, 0.55, { fontSize: 16, bold: true, color: "muted", valign: "middle", name: "Chat head" })];
    model(s, cx0 + 0.45, ey + 0.32, 0.42);
    // her chart, on the right
    const ehr = [s.shape("ROUNDED_RECTANGLE", ex, ey, ew, eh, { fill: "card", rectRadius: 0.06, morph: "doc" }),
      s.shape("ROUNDED_RECTANGLE", ex, ey, ew, 0.55, { fill: "raised", rectRadius: 0.06, name: "EHR bar" }),
      s.shape("RECTANGLE", ex, ey + 0.35, ew, 0.2, { fill: "raised", name: "EHR bar base" }),
      s.icon("file-lines", ex + 0.25, ey + 0.13, 0.3, "muted", { name: "EHR icon" }),
      s.text("Rosa Delgado", ex + 0.7, ey, 3.0, 0.55, { fontSize: 16, bold: true, color: "muted", valign: "middle", name: "EHR patient" })];
    const rows = [["pills", "Medications"], ["file-lines", "Primary care note"], ["file-lines", "Telephone note"], ["flask", "Lab results"], ["heart-pulse", "Vital signs"]];
    const ry = (i) => ey + 0.85 + i * 0.78, lit = [];
    rows.forEach(([icon, t], i) => {
      ehr.push(s.shape("ROUNDED_RECTANGLE", ex + 0.25, ry(i), ew - 0.5, 0.6, { fill: "raised", rectRadius: 0.1, name: `Row ${i}` }),
        s.icon(icon, ex + 0.45, ry(i) + 0.16, 0.28, "muted", { name: `Row icon ${i}` }),
        s.text(t, ex + 0.95, ry(i), 2.9, 0.6, { fontSize: 17, valign: "middle", name: `Row ${t}` }));
      if (i < 2) lit.push(s.shape("ROUNDED_RECTANGLE", ex + 0.25, ry(i), ew - 0.5, 0.6, { line: { color: "text", width: 2 }, rectRadius: 0.1, name: `Row lit ${i}` }));
    });
    // you, in the middle, copying from the chart into the chat
    const px = W / 2, py = ey + 2.2;
    const you = [s.icon("user", px - 0.45, py - 0.6, 0.9, "text", { name: "You" }),
      s.text("You", px - 1, py + 0.4, 2, 0.4, { fontSize: 18, bold: true, color: "muted", align: "center", name: "You label" })];
    const arrows = [s.arrow(ex - 0.15, py - 0.15, px + 0.65, py - 0.15, { name: "Copy arrow" }), s.arrow(px - 0.65, py - 0.15, cx0 + ew + 0.15, py - 0.15, { name: "Paste arrow" })];
    // the bubbles: what you paste and ask (grey, right), what the model answers (blue, left)
    const right = cx0 + ew - 0.3, maxW = 3.75;
    let y = ey + 0.8;
    const next = (b) => { y += b.h + 0.22; return b; };
    const b1 = next(chatBubble(s, "Medications: sacubitril/valsartan, spironolactone, dapagliflozin, furosemide; carvedilol stopped 14\u00A0May", right, y, maxW, { pt: 15, name: "Paste 1" }));
    const b2 = next(chatBubble(s, "Primary care note: “Heart failure is managed by cardiology.”", right, y, maxW, { pt: 15, name: "Paste 2" }));
    const b3 = next(chatBubble(s, "Is anything missing?", right, y, maxW, { pt: 15, name: "Ask" }));
    const ansText = "Carvedilol was stopped, but the note doesn’t say why.";
    const ans = chatBubble(s, ansText, cx0 + 0.3, y, maxW, { pt: 15, from: "model", name: "Answer" });
    if (y + ans.h > ey + eh - 0.15) throw new Error("copy and paste: the chat overflows");
    s.anim([chat, ehr, you], { on: "after" });
    s.anim([arrows, lit[0]]);
    s.anim(b1.g, { on: "after", dur: 300 });
    s.anim(lit[1]);
    s.anim(b2.g, { on: "after", dur: 300 });
    s.anim(b3.g, { dur: 300 });
    s.anim(ans.shape, { on: "after", delay: 300, dur: 250 });
    s.written(ans.text, ansText, { on: "after" });
    await s.done();
  }

  // ── Part 3
  await mapSlide(3, `
Which brings us to the third step: an agent.`);

  // ── Text is a universal interface (the faculty talk's, for Rosa; Morph: the model moves across from the map)
  {
    const s = new Ctx("CONTENT", {
      transition: "morph",
      notes: `
How could it get the context itself? Ideally the model would fetch its own, and it can, because text is a universal interface. The same way we give it instructions in text, it can write instructions: it can say what it needs.
(click) Why was her carvedilol stopped? The question the chat couldn't answer.
(click) It doesn't answer. It writes a request for a tool: search her notes for carvedilol. Software around the model, the harness, reads that request and runs the search: two of her three notes mention carvedilol.
(click) The harness hands back the result, as text, into the model's context: the telephone note from 14 May, Mobitz II heart block on carvedilol, carvedilol stopped.
(click) Now it answers from her chart: Mobitz II heart block, found on a monitor she wore at home. Wire that into a loop, so it can ask again and again, and you have an agent.
(The note is quoted from her synthetic chart; the demo's search_notes tool returns it this way.)

How the labs draw it (for reference): OpenAI, Function calling: https://developers.openai.com/api/docs/guides/function-calling
Anthropic, How tool use works: https://platform.claude.com/docs/en/agents-and-tools/tool-use/how-tool-use-works`,
    });
    // the chat on the left, the model in the middle (Morph from the map), her chart on the right
    const ey = 1.85, eh = 3.45, cw = 4.2, cy0 = ey, ch = eh, lx = 6.35, ly = ey + eh / 2, ld = 1.5, ex = 8.85, ew = W - M - ex;
    model(s, lx, ly, ld);
    const chat = [s.card(M, cy0, cw, ch, { rectRadius: 0.06, name: "Chat" }),
      s.icon("message", M + 0.28, cy0 + 0.16, 0.26, "muted", { name: "Chat icon" }),
      s.text("Chat", M + 0.68, cy0 + 0.05, 2, 0.5, { fontSize: 16, bold: true, color: "muted", valign: "middle", name: "Chat head" }),
      s.shape("ROUNDED_RECTANGLE", M + 0.25, cy0 + ch - 0.58, cw - 0.5, 0.38, { fill: "bg", line: { color: "dim", width: 1 }, rectRadius: 0.19, name: "Chat input" }),
      s.text("Message", M + 0.45, cy0 + ch - 0.58, 2, 0.38, { fontSize: 13, color: "muted", valign: "middle", name: "Chat input hint" })];
    const NOTES = [["20 Oct 2026", "Primary care visit"], ["30 Jun 2026", "Electrophysiology consult", 1], ["14 May 2026", "Telephone encounter", 1]];
    const fy = ey + 0.72, ry = (i) => ey + 1.32 + i * 0.66, rh = 0.58;
    const ehr = [s.shape("ROUNDED_RECTANGLE", ex, ey, ew, eh, { fill: "card", rectRadius: 0.06, name: "Chart" }),
      s.shape("ROUNDED_RECTANGLE", ex, ey, ew, 0.55, { fill: "raised", rectRadius: 0.06, name: "Chart bar" }),
      s.shape("RECTANGLE", ex, ey + 0.35, ew, 0.2, { fill: "raised", name: "Chart bar base" }),
      s.icon("file-medical", ex + 0.25, ey + 0.13, 0.3, "muted", { name: "Chart icon" }),
      s.text("Her chart: notes", ex + 0.7, ey, 3.0, 0.55, { fontSize: 16, bold: true, color: "muted", valign: "middle", name: "Chart head" }),
      s.shape("ROUNDED_RECTANGLE", ex + 0.25, fy, ew - 0.5, 0.45, { fill: "bg", rectRadius: 0.1, name: "Search field" }),
      s.icon("magnifying-glass", ex + 0.4, fy + 0.11, 0.23, "muted", { name: "Search icon" }),
      s.text("Search notes", ex + 0.8, fy, 2.5, 0.45, { fontSize: 14, color: "muted", valign: "middle", name: "Search hint" })];
    const lit = [], dim = [];
    NOTES.forEach(([date, title, hit], i) => {
      ehr.push(s.shape("ROUNDED_RECTANGLE", ex + 0.25, ry(i), ew - 0.5, rh, { fill: "raised", rectRadius: 0.1, name: `Note ${i}` }),
        s.icon("file-lines", ex + 0.42, ry(i) + (rh - 0.24) / 2, 0.24, "muted", { name: `Note icon ${i}` }),
        s.text([br(date, { bold: true }), { text: title, color: "muted" }], ex + 0.8, ry(i), ew - 1.1, rh, { fontSize: 12, valign: "middle", name: `Note ${title}` }));
      (hit ? lit : dim).push(hit ? s.shape("ROUNDED_RECTANGLE", ex + 0.25, ry(i), ew - 0.5, rh, { line: { color: "text", width: 2 }, rectRadius: 0.1, name: `Note hit ${i}` })
        : s.shape("ROUNDED_RECTANGLE", ex + 0.23, ry(i) - 0.02, ew - 0.46, rh + 0.04, { fill: "card", transparency: 30, rectRadius: 0.1, name: `Note miss ${i}` }));
    });
    const typed = s.text("carvedilol", ex + 0.8, fy, 2.5, 0.45, { fontSize: 14, fill: "bg", valign: "middle", name: "Search typed" });
    // the request: the model's text (blue) on the arc to her chart; the result comes back on the grey arc below
    const a0 = [lx + 0.55, ly - 0.52], a1 = [ex - 0.12, fy + 0.22], b0 = [ex - 0.12, ry(2) + rh / 2], b1 = [lx + 0.55, ly + 0.52];
    const top = s.path([a0, { x: a1[0], y: a1[1], c1: [a0[0] + 0.3, 0.75], c2: [a1[0] - 0.9, 0.75] }], { open: true, line: { color: "blue", width: 2.5, endArrow: true }, name: "Request arc" });
    const mid = (a0[0] + a1[0]) / 2;
    const req = call(s, 'search_notes("carvedilol")', mid, 1.1, 3.7, { h: 0.5, pt: 15, name: "Call" });
    const bot = s.path([b0, { x: b1[0], y: b1[1], c1: [b0[0] - 0.9, 6.55], c2: [b1[0] + 0.3, 6.55] }], { open: true, line: { color: "muted", width: 2.5, endArrow: true }, name: "Result arc" });
    const res = s.text([br("14 May 2026  Telephone encounter", { fontSize: 12, color: "muted", bold: true }), { text: "“…Mobitz II second-degree AV block on carvedilol… Carvedilol stopped today.”", fontSize: 14 }],
      mid - 2.4, 5.53, 4.8, 1.0, { fill: "raised", shape: "ROUNDED_RECTANGLE", rectRadius: 0.12, valign: "middle", margin: 10, paraSpaceAfter: 3, name: "Result" });
    // the bubbles
    const ask = chatBubble(s, "Why was her carvedilol stopped?", M + cw - 0.3, cy0 + 0.7, 3.8, { name: "Ask" });
    const ansText = "Mobitz II heart block, found on a monitor she wore at home in May.";
    const ans = chatBubble(s, ansText, M + 0.25, cy0 + 0.7 + ask.h + 0.25, 3.85, { from: "model", name: "Answer" });
    if (cy0 + 0.7 + ask.h + 0.25 + ans.h > cy0 + ch - 0.7) throw new Error("tool use: the chat overflows");
    s.anim([chat, ehr], { on: "after" });
    s.anim(ask.g, { dur: 300 });
    s.anim([top, req], { dur: 500 });
    s.anim([typed, lit, dim], { on: "after", dur: 400 });
    s.anim([bot, res], { dur: 500 });
    s.anim(ans.shape, { dur: 250 });
    s.written(ans.text, ansText, { on: "after" });
    await s.done();
  }

  // ── An agent: a model, tools and a loop (the faculty talk's; ReAct). The loop, then the tools one at a time.
  {
    const s = new Ctx("CONTENT", {
      transition: "morph",
      notes: `
No hype: an agent is a language model that we give tools, and run in a loop. The standard recipe is ReAct (Yao et al., ICLR 2023): (click) the model reasons about what to do next, acts (calls a tool), observes the result, and repeats until the task is done.
Then the tools, one at a time. Some gather context: (click) read a note, (click) search the notes, (click) read her records: her medications, diagnoses, vital signs.
(click) And some act in the world: message the patient, (click) and one day, place an order. The software that runs the loop and the tools, the harness, gives the model a body: eyes to gather, hands to act. Gathering and acting are very different levels of trust.
(click) Why is this so powerful? Language is a universal interface. Almost anything can be written down as text, a note, a lab result, a guideline, an order, so a model that reads and writes text can use almost any tool.

Ref: Yao S et al. ReAct: synergizing reasoning and acting in language models. ICLR 2023. https://arxiv.org/pdf/2210.03629#page=1`,
    });
    // The tools sit above the Observe and Act pills, so their links (curves into the model from the left, out of it to
    // the right) pass clear of the pills; the build stops if one doesn't.
    const cx = W / 2, cy = 3.85, R = 1.8, md = 1.5, tw = 3.45, th = 0.68, ys = [2.0, 2.92, 3.84], lxl = M, lxr = W - M - tw, hy = 1.2;
    const gather = [["file-lines", "Read a note"], ["magnifying-glass", "Search notes"], ["table-list", "Read records"]];
    const act = [["message", "Message the patient"], ["prescription", "Place an order"]];
    const STEPS = ["Reason", "Act", "Observe"], pills = STEPS.map((l) => [measure(l, 16, true) + 0.42, 0.4]);
    const pillBox = (k) => { const a = (LOOP_AT[k] * Math.PI) / 180, [w, h] = pills[k]; return [cx + R * Math.cos(a) - w / 2, cy + R * Math.sin(a) - h / 2, w, h]; };
    const ends = [...gather.map((_, k) => [[lxl + tw, ys[k] + th / 2], [cx - md / 2, cy]]), ...act.map((_, k) => [[cx + md / 2, cy], [lxr, ys[k] + th / 2]])];
    const keepClear = [0, 1, 2].map(pillBox);
    ends.forEach(([a, b], k) => { if (linkHits(a, b, keepClear).length) throw new Error(`agent slide: link ${k} runs into a pill`); });
    const links = ends.map(([a, b], k) => link(s, a, b, { name: `${k < 3 ? "Gather" : "Act"} link ${k}` }));
    model(s, cx, cy, md);
    const arcs = loop(s, cx, cy, R, { pills, morph: false });
    const steps = STEPS.map((label, k) => {
      const [x, y, w, h] = pillBox(k);
      return s.text(label, x, y, w, h, { fontSize: 16, bold: true, color: "blue", fill: "bg", line: { color: "blue", width: 1.5 }, shape: "ROUNDED_RECTANGLE", rectRadius: 0.2, align: "center", valign: "middle", name: `Step ${label}` });
    });
    const head = (icon, label, x, align) => [s.icon(icon, align === "right" ? x + tw - 0.45 : x, hy + 0.05, 0.45, "text", { name: `${label} icon` }),
      s.text(label, align === "right" ? x : x + 0.62, hy, tw - 0.62, 0.55, { fontSize: 22, bold: true, align, valign: "middle", name: `${label} head` })];
    s.anim([arcs, steps, cite(s, "Yao et al., ICLR 2023")]);
    gather.forEach(([icon, label], k) => s.anim([k ? [] : head("eye", "Gather context", lxl, "left"), links[k], toolCard(s, 10 + k, icon, label, lxl, ys[k], tw, th, { morph: false })]));
    act.forEach(([icon, label], k) => s.anim([k ? [] : head("hand", "Act", lxr, "right"), links[3 + k], toolCard(s, 20 + k, icon, label, lxr, ys[k], tw, th, { morph: false })]));
    s.anim(s.text("Language is a universal interface", M, 6.05, CW, 0.55, { fontSize: 26, bold: true, align: "center", name: "Message" }));
    await s.done();
  }

  pres.addSection({ title: "Setting one up" });
  // ── Set it up like a remote colleague (the model on a laptop; the six things you give it)
  {
    const s = new Ctx("CONTENT", {
      title: "Set it up like a remote colleague", transition: "morph",
      notes: `
So how do you set one up? I'm going to anthropomorphise, on purpose. Set it up the way you'd set up a capable new colleague who works remotely: they can't walk down the hall to ask what you meant.
(click) You'd give them a job. You'd pick the right person for it. You'd give them access to the records they need, the software to do the work, instructions, and guardrails that keep the work safe.
Task, model, data, tools, prompt and guardrails. They're also the steps of the live build in a few minutes.`,
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

  // ── Task (Morph: the six tiles move up into the bar; everything else enters after)
  {
    const s = new Ctx("CONTENT", {
      title: "Task", bar: 0, transition: "morph",
      notes: `
Start with the task, because everything else follows from it.
(click) What could we ask an agent to do? In quality and outcomes work: find care gaps, abstract registry data, screen patients for trials, summarise a chart before clinic, follow up abnormal results, draft a letter to a patient.
(click) Pick one. Today's: find care gaps. Is Rosa on a beta blocker, and if not, why not?
(click) Whichever it is, the task decides the model, the data, the tools, the prompt and the guardrails. A small, clear task is easier to do well, and much easier to check, than "review the chart".`,
    });
    // The tasks on a light blue; the one we pick turns solid blue, the bottom middle, so the links fall straight from it.
    const TASKS = [["table-list", "Abstract registry data"], ["list-check", "Screen for trials"], ["file-lines", "Summarise a chart"],
      ["vial", "Follow up results"], ["magnifying-glass", "Find care gaps", 1], ["message", "Draft a patient letter"]];
    const tw = 3.7, th = 0.85, tg = 0.3, tx0 = (W - (3 * tw + 2 * tg)) / 2, ty0 = 1.75, pos = (i) => [tx0 + (i % 3) * (tw + tg), ty0 + Math.floor(i / 3) * (th + 0.25)];
    const task = (i, icon, label, o) => { const [x, y] = pos(i); return [s.card(x, y, tw, th, { rectRadius: 0.16, ...o, name: `${o.name} ${i}` }),
      s.icon(icon, x + 0.3, y + (th - 0.4) / 2, 0.4, "text", { name: `${o.name} icon ${i}` }),
      s.text(label, x + 0.95, y, tw - 1.1, th, { fontSize: 19, bold: true, valign: "middle", name: `${o.name} label ${i}` })]; };
    s.stagger(TASKS.map(([icon, label], i) => task(i, icon, label, { fill: "blue", transparency: 62, name: "Task" })), { gap: 60, dur: 400 });
    const pick = TASKS.findIndex((t) => t[2]), [px, py] = pos(pick);
    s.anim([task(pick, TASKS[pick][0], TASKS[pick][1], { fill: "blue", name: "Picked" }),
      TASKS.map((_, i) => { if (i === pick) return []; const [x, y] = pos(i); return s.card(x - 0.02, y - 0.02, tw + 0.04, th + 0.04, { fill: "bg", transparency: 45, rectRadius: 0.16, name: `Not picked ${i}` }); })]);
    const g = [], ts = 0.85, ty = 4.8, from = [px + tw / 2, py + th];
    SETUP.slice(1).forEach(([icon, label], k) => {
      const cx = W / 2 + (k - 2) * 2.0;
      g.push(link(s, from, [cx, ty], { vertical: true, color: "edge", width: 1.75, name: `Follows link ${k}` }));
      g.push(s.shape("ROUNDED_RECTANGLE", cx - ts / 2, ty, ts, ts, { fill: "card", rectRadius: 0.14, name: `Follows tile ${k}` }));
      g.push(s.icon(icon, cx - 0.21, ty + 0.215, 0.42, "text", { name: `Follows icon ${k}` }));
      g.push(s.text(label, cx - 0.95, ty + ts + 0.08, 1.9, 0.35, { fontSize: 16, bold: true, align: "center", name: `Follows label ${k}` }));
    });
    s.anim([g, s.text("Everything follows from the task.", M, 6.4, CW, 0.5, { fontSize: 22, bold: true, align: "center", name: "Message" })]);
    await s.done();
  }

  // ── Model: who do you need? Then the models, sized by parameters, open and closed
  {
    const s = new Ctx("CONTENT", {
      title: "Model", bar: 1,
      notes: `
Next: who do you need for the job?
(click) Some jobs you'd give a medical student; others need a consultant. With people that's experience as much as intelligence. With models it really is capability, and capability goes with size.
(click) Size is counted in parameters, the numbers inside the network. Gemma 3 has 4 billion and runs on a laptop. Llama 3.1, 8 billion. Qwen 3.6, 35 billion: the model in our study, on one GPU server; only 3 billion of them work on each word (a mixture of experts). OpenAI's gpt-oss, 117 billion. DeepSeek V3, 671 billion: a rack of GPUs. These are open weights: you can download them and run them on your own computers, inside the hospital's firewall.
(click) Then the closed models, GPT, Claude and Gemini: the companies run them on their computers and we send them the text. They're usually the most capable, and they don't publish their sizes. Outside estimates put the largest above a trillion parameters; that's our estimate on the slide, not a published number, so the circle is dashed and drawn at one trillion.
Bigger is usually more capable, and slower and costlier to run. Pick the smallest model that does the job well, and check it on your own task.
(The circles grow with size but aren't to scale: diameter goes with the cube root of the parameter count, so the small ones stay visible.)

Sources (model cards):
Gemma 3: https://huggingface.co/google/gemma-3-4b-it#:~:text=for%20the%204B%2C%2012B%2C%20and%2027B%20sizes
Llama 3.1: https://huggingface.co/meta-llama/Llama-3.1-8B#:~:text=in%208B%2C%2070B%20and%20405B%20sizes
Qwen3.6-35B-A3B: https://huggingface.co/Qwen/Qwen3.6-35B-A3B#:~:text=35B%20in%20total%20and%203B%20activated
gpt-oss-120b: https://huggingface.co/openai/gpt-oss-120b#:~:text=117B%20parameters%20with%205.1B%20active%20parameters
DeepSeek-V3: https://arxiv.org/abs/2412.19437#:~:text=671B%20total%20parameters%20with%2037B%20activated`,
    });
    // 1. The framing: a medical student and a consultant, on one line.
    const py = 3.75;
    const people = [
      s.icon("user-graduate", 2.0, py - 0.6, 1.2, "text", { name: "Student" }),
      s.text("Medical student", 1.0, py + 0.72, 3.2, 0.45, { fontSize: 20, bold: true, align: "center", name: "Student label" }),
      s.line(3.75, py, W - 3.75, py, { color: "dim", width: 2.5, name: "Spectrum" }),
      s.icon("user-doctor", W - 3.2, py - 0.6, 1.2, "blue", { name: "Consultant" }),
      s.text("Consultant", W - 4.2, py + 0.72, 3.2, 0.45, { fontSize: 20, bold: true, align: "center", name: "Consultant label" }),
    ];
    s.anim(people);
    // 2. The models, smallest to largest, sitting on one line; open weights, then the closed ones past the dashed line,
    // drawn at our estimate of a trillion parameters.
    const OPEN = [["gemma-color", "Gemma 3", 4], ["meta-color", "Llama 3.1", 8], ["qwen-color", "Qwen 3.6", 35], ["openai", "gpt-oss", 117], ["deepseek-color", "DeepSeek V3", 671]];
    const DMAX = 2.25, dia = (p) => DMAX * Math.cbrt(p / 671), base = 5.35, CD = dia(1000);
    const cxs = [];
    OPEN.forEach(([, , p], i) => cxs.push(i ? cxs[i - 1] + Math.max(1.4, (dia(OPEN[i - 1][2]) + dia(p)) / 2 + 0.4) : 0));
    const span = cxs.at(-1) + DMAX / 2 + 1.0 + CD + 0.75; // labels 0.75 left of the first; the closed circle past the dashed line
    const off = M + (CW - span) / 2 + 0.75, dashX = off + cxs.at(-1) + DMAX / 2 + 0.5, ccx = dashX + 0.5 + CD / 2;
    const bubble = async (cx, d, logos, name, size, o = {}) => {
      const g = [s.circle(cx, base - d / 2, d, o.dashed ? { fill: "blue", transparency: 82, line: { color: "blue", width: 2, dash: "dash" }, name: `Bubble ${name}` } : { fill: "blue", name: `Bubble ${name}` })];
      const ls = o.dashed ? 0.5 : Math.min(Math.max(0.55 * d, 0.24), 0.9), lg = ls * 0.25, lw = logos.length * ls + (logos.length - 1) * lg;
      for (const [k, file] of logos.entries()) g.push(s.picture(logoData(file), cx - lw / 2 + k * (ls + lg), base - d / 2 - ls / 2, ls, ls, { alt: name, name: `Logo ${name} ${k}` }));
      const tw = o.dashed ? 3.2 : 2.4;
      g.push(s.text([br(name, { bold: true, fontSize: 16 }), { text: size, fontSize: 15, color: "muted" }], cx - tw / 2, base + 0.12, tw, 0.65, { align: "center", name: `Bubble label ${name}` }));
      return g;
    };
    const open = [];
    for (const [i, [file, name, p]] of OPEN.entries()) open.push(await bubble(off + cxs[i], dia(p), [file], name, `${p}B`));
    const heads = (label, x, w) => s.text(label, x, 2.2, w, 0.45, { fontSize: 20, bold: true, color: "muted", align: "center", name: `Head ${label}` });
    s.anim(people, { fx: "fade-out" });
    s.stagger(open, { on: "after", gap: 80, dur: 400 });
    s.anim(heads("Open weights", off - 0.75, dashX - off + 0.75), { on: "after", delay: 150 });
    const closed = [s.line(dashX, 2.15, dashX, 6.2, { color: "muted", width: 1.5, dash: "dash", name: "Open | closed" }), heads("Closed", ccx - 1.4, 2.8),
      ...(await bubble(ccx, CD, ["openai", "claude-color", "gemini-color"], "GPT · Claude · Gemini", "not published; likely over 1T", { dashed: true }))];
    s.anim(closed);
    await s.done();
  }

  // ── Data: Rosa's record, laid out like an EHR; what the task needs
  {
    const s = new Ctx("CONTENT", {
      title: "Data", bar: 2,
      notes: `
What can it see? Here's Rosa's record, laid out the way an EHR shows it. It holds much more than this question needs.
(click) For a beta blocker it needs six parts: her problem list, medications, allergies, vital signs, lab results and notes. Not her immunizations, appointments, family or social history, insurance or address.
(click) Why not just give it everything? Privacy: every part is patient data the protocol has to justify, and the minimum necessary applies. Focus: what it doesn't need can distract it. And approval: each data source adds review time, IRB and IT. In the live build, each data card shows the weeks of review it adds.`,
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

  // ── Tools
  {
    const s = new Ctx("CONTENT", {
      title: "Tools", bar: 3,
      notes: `
What can it use? (click) Simple tools: search the notes, read a note, read the structured records. Tools that act, messaging the patient or placing an order, stay locked here: a quality review shouldn't contact patients or prescribe.
(click) And a tool call is just text. The model writes a request: read her medication records.
(click) The harness, the software around the model, reads that text and turns it into code, which runs: here a request to the EHR's FHIR interface for her medications.
(click) What comes back is text again, here the line for her carvedilol (exactly what the demo's tool returns), and it goes into the model's context. Text in, text out. That's why almost anything can be a tool.`,
    });
    const T = [["magnifying-glass", "Search notes"], ["file-lines", "Read a note"], ["table-list", "Read records"], ["message", "Message the patient", 1], ["prescription", "Place an order", 1]];
    s.stagger(T.map(([icon, label, locked], i) => toolCard(s, i, icon, label, M, 1.95 + i * 0.88, 5.2, 0.72, { morph: false, dim: locked })), { gap: 60, dur: 400 });
    // It's all text: the model writes text → the harness turns it into code and runs it → text comes back.
    const rx = 6.85, bx = rx + 0.7, rw = W - M - bx, lab = (t, y) => s.text(t, bx, y, rw, 0.34, { fontSize: 14, color: "muted", valign: "middle", name: `Step ${t}` });
    const down = (y) => s.arrow(bx + rw / 2, y, bx + rw / 2, y + 0.3, { name: `Down ${y}` });
    s.anim(s.text("It’s all text", rx, 1.95, 5, 0.5, { fontSize: 24, bold: true, valign: "middle", name: "All text" }), { on: "after" });
    s.anim([lab("The model writes text", 2.6), ...model(s, rx + 0.25, 3.23, 0.5, { morph: false }),
      call(s, 'read_records("medications")', bx + rw / 2, 2.95, rw, { h: 0.56, pt: 18, name: "Call" })]);
    s.anim([down(3.6), lab("The harness turns it into code, and runs it", 3.95), s.icon("gear", rx + 0.03, 4.36, 0.44, "muted", { name: "Harness icon" }),
      s.text("GET /fhir/MedicationRequest?patient=…", bx, 4.3, rw, 0.56, { fontSize: 14, bold: true, font: MONO, fill: "card", shape: "ROUNDED_RECTANGLE", rectRadius: 0.12, valign: "middle", margin: 12, name: "Code" })]);
    s.anim([down(4.95), lab("Text comes back, into the model’s context", 5.3), s.icon("file-lines", rx + 0.05, 5.95, 0.4, "muted", { name: "Result icon" }),
      s.text("“carvedilol 12.5 mg oral tablet: 12.5 mg by mouth twice daily. Status stopped, ordered 2025-08-26, stopped 2026-05-14”", bx, 5.65, rw, 1.1, { fontSize: 14, fill: "card", shape: "ROUNDED_RECTANGLE", rectRadius: 0.12, valign: "middle", margin: 12, name: "Result" })]);
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
    const agent = [...loop(s, AX, RY, 0.78, { width: 2.5 }), ...model(s, AX, RY, 1.0)];
    return { box, text, into, agent };
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
Then the prompt: what we tell it, typed in, just as you'd type a message. It's what starts the loop.
(click) Ask only "Is this patient on a beta blocker?"
(click) It reads her medication list, and answers: no, carvedilol was stopped on 14 May. True, but it doesn't say why, and it doesn't say whether that's a problem.`,
    });
    const q = "Is this patient on a beta blocker?", a = "No. Carvedilol was stopped on 14 May.";
    const { box, text, into, agent } = promptScene(s, q, 1.2, "a");
    s.anim(box, { dur: 300 });
    s.typed(text, q, { on: "after" });
    s.anim([into, agent]);
    s.anim(call(s, "read_records", AX, RY + 1.0), { on: "after", delay: 300 });
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
(click) The prompt starts the loop, and steers it.
(Both are runs recorded for the demo, on gpt-6-luna; the second also had her notes and the note search. The answers here are shortened.)`,
    });
    const q = "Is this patient on a beta blocker? If not, is there a documented reason, or is it a care gap?";
    const a = "No. Stopped after Mobitz II heart block; the notes say not to restart. Not a care gap.";
    const { text } = promptScene(s, q, 2.5, "b");
    s.typed(text, q, { on: "after", delay: 200, ms: 30 });
    s.stagger([call(s, "read_records", AX, RY + 1.0), call(s, "search_notes", AX, RY + 1.5)], { gap: 350 });
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
    const timing = anims.length || videos.length ? timingXml(anims, ids, kinds, videos.map((nm) => ids[nm])) : "";
    const before = xml;
    xml = xml.replace(/(<p:clrMapOvr>.*?<\/p:clrMapOvr>|<p:clrMapOvr\/>)/s, (m) => m + tr + timing);
    if (xml === before && (tr || timing)) throw new Error(`slide ${i + 1}: no clrMapOvr to anchor the transition`);
    zip.file(p, xml);
  }
  writeFileSync(file, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

build().catch((e) => { console.error(e); process.exit(1); });
