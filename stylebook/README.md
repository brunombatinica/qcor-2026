# Style book

Thirty-five candidate looks for the QCOR talk, one page each, so we can pick pieces out of a catalogue. Every page
shows the same three things drawn in that style:

1. **People**: a man and a woman, as simple as the style allows.
2. **A slide**: the same content every time (below), so the layouts compare like for like.
3. **Icons**: the same ten, in order: `patient heart pill note search database tool agent check warning`.

The last four pages (`assets.js`) collect what the deck and demo already use: the people and portraits, the icon set
in duotone with the colour meanings, the logos by group, and the charts and screenshots.

Open it through the QCOR server (`just view`, or the `qcor` preview config) at `/stylebook/`. Hover a panel and
press ★ to pick it (kept in this browser); the Picks button lists them and copies the list. ← → flip pages.
`?only=<id>` shows one page (used for screenshots: `./shot.sh <id>`). Fonts are macOS system fonts.

## The bar: refined, not gimmicky

Each style is one idea carried out precisely. It may be experimental; it should never be a joke.

- **Restraint.** No mascots, robots, speech balloons, stickers, sound effects, puns, mock data, fake UI chrome or
  decorative clutter. Texture (grain, halftone) only where it *is* the style, and subtle.
- **Type.** A real hierarchy: one display size, one text size, one small label size. Generous margins, aligned
  left edges and shared baselines. No more than two typefaces.
- **Diagrams.** One grid (e.g. 8 px) for everything. Equal node sizes where the nodes are peers, one stroke weight
  for connectors, one arrowhead, labels placed consistently (all above, or all inside). Nothing overlaps, nothing
  crowds an edge. The loop reads at a glance.
- **People.** A man and a woman side by side, generic and adult, no age, no faces unless the style needs them,
  no clothing jokes. Use the style's most reduced form (a disc and a shoulder line; the woman distinguished by one
  quiet cue). They should look like a pair of icons from the same family as the icon set, drawn larger.
- **Icons.** One grid (48 × 48 or 24 × 24), one stroke weight or one fill logic, optically balanced, no letters
  inside, no extra decoration. The ten must look like one set.
- **Colour.** A small palette with meaning; the accent used sparingly.

## The slide (same content every time)

On a 1280 × 720 stage:

- kicker: `Part 4 · Agents`
- title: `An agent is a model in a loop`
- diagram, with boxes and connecting lines/arrows:
  - **Rosa's chart**: 612 notes
  - **Model**: reads, decides the next step
  - **Tools**: search · read a note · labs
  - Model ⇄ Tools drawn as a loop labelled **Think → Act → Observe**
  - **Answer**: `EF 30% · metoprolol tartrate → a gap`, with the quote `"LVEF 30%"` (Echo, 10/02)
- a small chart, "Questions right, of 5": Model alone **1** · + chart pasted **2** · + tools **4** · + checks **5**
- footer: `QCOR 2026 · Build an agent, live` and the page number `14`

Nothing else on the slide: no extra subtitles, captions, logs or jokes.

## One style = one file

`styles/<id>.js` default-exports:

```js
export default {
  id: "bauhaus",                 // = file name; prefix for every CSS class and SVG id
  name: "Bauhaus",
  after: "Herbert Bayer; Kandinsky's form–colour questionnaire",   // what it borrows from
  note: "One or two sentences: what it is, and what it would do for the talk.",
  palette: [["#e63b2e", "red"], ["#f6c21c", "yellow"]],           // 3–6 colours with names
  type: "Futura Bold for titles, Futura Medium for text",          // macOS fonts used
  ground: "#efe9dc",             // background of the people and icon panels (hex; or set peopleGround / iconGround,
                                 //   which may be any CSS background, e.g. a gradient; then set iconInk for the labels)
  css: `.s-bauhaus .x { … }`,    // every selector starts with .s-<id>
  people: `<svg viewBox="0 0 400 400">…</svg>`,                     // a man and a woman; or a function returning it
  slide: `<div class="s-bauhaus-slide">…</div>`,                    // 1280×720; or a function
  icons: [["patient", `<svg viewBox="0 0 48 48">…</svg>`], …],      // the ten names, in order
};
```

Rules: every SVG `id` (gradients, clip paths, filters, patterns) starts with `<id>-` so pages don't collide; every
CSS selector starts with `.s-<id>`; no network fonts or images (local `../shared/` files are fine); text in the slide
is real text, not paths. `people`, `slide` and `icons` may be functions, for generated art (pure JS, no canvas).
`styles/list.js` sets the page order and the index groups.
