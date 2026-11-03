// One icon set for the talk, the demo and the asset gallery.
//
// LINE: 24×24 line icons (stroke = currentColor), the default style. Use in HTML as
//   <svg class="i"><use href="#i-pill"/></svg>    after this script has run (it injects the sprite).
// PIXEL: 12×12 pixel versions of some icons (8-bit style), for the gallery.

const LINE = {
  // the two characters of the talk: a language model, and an agent (a model in a loop)
  llm:       '<rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><circle cx="8.6" cy="9.2" r="1.6"/><circle cx="15.4" cy="9.2" r="1.6"/><circle cx="12" cy="15.4" r="1.6"/><path d="M10.2 9.2h3.6M9.4 10.6l1.8 3.3M14.6 10.6l-1.8 3.3"/>',
  agent:     '<rect x="7" y="7" width="10" height="10" rx="3"/><circle cx="12" cy="12" r="1.4"/><path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1"/><path d="M18.6 2.6v3.6H15"/>',
  patient:   '<circle cx="12" cy="7.5" r="3.5"/><path d="M5 20c0-3.9 3.1-6.5 7-6.5s7 2.6 7 6.5"/>',
  man:       '<circle cx="12" cy="6.5" r="3"/><path d="M6 21v-5a6 6 0 0 1 12 0v5"/>',
  woman:     '<circle cx="12" cy="6.5" r="3"/><path d="M5.5 21l2.3-6.4a4.5 4.5 0 0 1 8.4 0L18.5 21"/>',
  people:    '<circle cx="9" cy="8" r="3"/><path d="M3.5 19c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M16 13.6c2.7.2 4.5 2.2 4.5 5.4"/>',
  doctor:    '<circle cx="12" cy="7" r="3.5"/><path d="M5 21c0-4 3-7 7-7s7 3 7 7"/><path d="M9 14.5v2.5a3 3 0 0 0 6 0v-2.5"/><circle cx="15" cy="17" r=".6"/>',
  heart:     '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"/>',
  ecg:       '<path d="M2.5 12h4l2-5 3.5 10 2.5-7 1.5 2h5.5"/>',
  pill:      '<rect x="3.2" y="8.6" width="17.6" height="6.8" rx="3.4" transform="rotate(-40 12 12)"/><path d="M9.8 9.4l4.4 5.2"/>',
  flask:     '<path d="M9.5 3.5h5M10.5 3.5v6L5.2 18.2A1.5 1.5 0 0 0 6.5 20.5h11a1.5 1.5 0 0 0 1.3-2.3L13.5 9.5v-6"/><path d="M7.6 14.5h8.8"/>',
  echo:      '<path d="M12 4l-7 13a8 8 0 0 0 14 0z"/><path d="M8.8 14.5a4 4 0 0 0 6.4 0"/>',
  note:      '<path d="M6.5 3.5h7.5l4.5 4.5v12.5h-12z"/><path d="M14 3.5v4.5h4.5M9 12h6M9 15.5h6"/>',
  notes:     '<path d="M8.5 6.5h7l3.5 3.5v10.5h-10.5z"/><path d="M5 17.5v-14h7.5"/><path d="M11.5 14h5M11.5 17h5"/>',
  hospital:  '<path d="M4 20.5v-13l8-4 8 4v13z"/><path d="M12 8.5v5M9.5 11h5M10 20.5v-3.5h4v3.5"/>',
  home:      '<path d="M4 11l8-6.5 8 6.5"/><path d="M6 9.5v10.5h12v-10.5"/><path d="M10 20v-5h4v5"/>',
  calendar:  '<rect x="4" y="5.5" width="16" height="15" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
  clock:     '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v5l3 2"/>',
  search:    '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/>',
  database:  '<ellipse cx="12" cy="6" rx="7" ry="2.8"/><path d="M5 6v12c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8V6"/><path d="M5 12c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8"/>',
  code:      '<path d="M8.5 7.5L4 12l4.5 4.5M15.5 7.5L20 12l-4.5 4.5M13.5 5.5l-3 13"/>',
  brain:     '<path d="M9 4.5a2.8 2.8 0 0 0-2.8 2.8A3 3 0 0 0 4.5 12a3 3 0 0 0 1.7 4.7A2.8 2.8 0 0 0 9 19.5a2 2 0 0 0 3-1.5V6a2 2 0 0 0-3-1.5z"/><path d="M15 4.5a2.8 2.8 0 0 1 2.8 2.8 3 3 0 0 1 1.7 4.7 3 3 0 0 1-1.7 4.7 2.8 2.8 0 0 1-2.8 2.8 2 2 0 0 1-3-1.5V6a2 2 0 0 1 3-1.5z"/>',
  chip:      '<rect x="6.5" y="6.5" width="11" height="11" rx="1.5"/><rect x="9.5" y="9.5" width="5" height="5"/><path d="M9.5 3v3.5M14.5 3v3.5M9.5 17.5V21M14.5 17.5V21M3 9.5h3.5M3 14.5h3.5M17.5 9.5H21M17.5 14.5H21"/>',
  tool:      '<path d="M14.5 6.2a4 4 0 0 0-5 5L4.2 16.5a1.8 1.8 0 0 0 2.5 2.5l5.3-5.3a4 4 0 0 0 5-5l-2.5 2.5-2.2-.3-.3-2.2z"/>',
  lock:      '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/><path d="M12 14.5v2.5"/>',
  unlock:    '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 7.7-1.5"/>',
  shield:    '<path d="M12 3.5l7 3v5.5c0 4.4-3 7.6-7 8.5-4-.9-7-4.1-7-8.5V6.5z"/><path d="M9 12l2.2 2.2L15.5 10"/>',
  check:     '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  x:         '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  question:  '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.6a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.6"/><circle cx="12" cy="16.8" r=".4"/>',
  quote:     '<path d="M5 18c2.4-1 3.8-3.2 3.8-6.2V7H5v5h3.8"/><path d="M14 18c2.4-1 3.8-3.2 3.8-6.2V7H14v5h3.8"/>',
  eye:       '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  laptop:    '<rect x="5" y="5" width="14" height="10" rx="1.5"/><path d="M3 18.5h18"/>',
  cloud:     '<path d="M7 18.5a4.5 4.5 0 0 1-.6-9 5.5 5.5 0 0 1 10.6 1.4 3.8 3.8 0 0 1 .5 7.6z"/>',
  server:    '<rect x="4.5" y="4" width="15" height="7" rx="1.5"/><rect x="4.5" y="13" width="15" height="7" rx="1.5"/><path d="M8 7.5h.01M8 16.5h.01"/>',
  book:      '<path d="M4.5 5.5a2 2 0 0 1 2-2h12v15h-12a2 2 0 0 0-2 2z"/><path d="M4.5 20.5a2 2 0 0 1 2-2h12v2h-12"/>',
  books:     '<rect x="4" y="5" width="4" height="15" rx=".8"/><rect x="9" y="3.5" width="4" height="16.5" rx=".8"/><path d="M14.5 6.2l3.8-1 3.3 14-3.8 1z"/>',
  desk:      '<path d="M3 11.5h18M5 11.5v8M19 11.5v8"/><path d="M7 11.5V8h4v3.5M12.5 11.5l1.5-4.5 3 1-1.2 3.5"/>',
  link:      '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  loop:      '<path d="M19 12a7 7 0 1 1-2.1-5"/><path d="M17.5 3.5v3.8h-3.8"/>',
  target:    '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  warning:   '<path d="M12 4l9 15.5H3z"/><path d="M12 10v4.5M12 17.2v.3"/>',
  stethoscope: '<path d="M6 3.5v5a4 4 0 0 0 8 0v-5"/><path d="M10 12.5v2a5 5 0 0 0 10 0v-2"/><circle cx="20" cy="10.5" r="2"/>',
  kidney:    '<path d="M9 4c-3 0-5 3-5 7.5S6 20 9 20c2 0 3-1.5 2.5-3.5-.3-1.3-1.5-2-1.5-4.5s1.2-3.2 1.5-4.5C12 5.5 11 4 9 4z"/><path d="M15 4c3 0 5 3 5 7.5S18 20 15 20"/>',
  scale:     '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8.5 10a3.5 3.5 0 0 1 7 0z"/><path d="M12 10l1.5-2"/>',
  dollar:    '<path d="M16 8a3.5 3 0 0 0-4-2c-2.2 0-3.5 1.2-3.5 2.7 0 3.6 7.5 1.8 7.5 5.6 0 1.6-1.6 2.7-4 2.7a4.3 3.5 0 0 1-4-2"/><path d="M12 4v16"/>',
  chat:      '<path d="M4.5 5.5h15v10h-9l-4.5 3.5v-3.5h-1.5z"/>',
  sparkle:   '<path d="M12 3.5l1.8 5.2 5.2 1.8-5.2 1.8L12 17.5l-1.8-5.2L5 10.5l5.2-1.8z"/><path d="M18.5 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
  flag:      '<path d="M5.5 21V4M5.5 4.5h11l-2 4 2 4h-11"/>',
  clipboard: '<rect x="5" y="4.5" width="14" height="16" rx="2"/><path d="M9 4.5v-1h6v1M8.5 10h7M8.5 13.5h7M8.5 17h4"/>',
  pen:       '<path d="M15.5 4.5l4 4L9 19l-5 1 1-5z"/><path d="M13 7l4 4"/>',
  gear:      '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>',
  chart:     '<path d="M4 4v16h16"/><path d="M7.5 15l3.5-4 3 2.5 5-6"/>',
  pointer:   '<path d="M6 3.5l12 7.5-5.2 1.3 3.2 6.2-2.5 1.2-3.1-6.2L6 17z"/>',
  copy:      '<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5"/>',
  filter:    '<path d="M4 5h16l-6.2 7.5v6l-3.6 1.8v-7.8z"/>',
  layers:    '<path d="M12 4l8.5 4.5L12 13 3.5 8.5z"/><path d="M3.5 12.5L12 17l8.5-4.5M3.5 16L12 20.5l8.5-4.5"/>',
  key:       '<circle cx="8" cy="15" r="4"/><path d="M11 12.2l8.5-8.5M16.5 6.5l2.5 2.5M14 9l2 2"/>',
  globe:     '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.5 3.5 5.5 3.5 8.5s-1 6-3.5 8.5c-2.5-2.5-3.5-5.5-3.5-8.5s1-6 3.5-8.5z"/>',
  ghost:     '<path d="M5.5 20.5V11a6.5 6.5 0 0 1 13 0v9.5l-2.2-1.8-2.1 1.8-2.2-1.8-2.2 1.8-2.1-1.8z"/><circle cx="9.7" cy="11" r=".9"/><circle cx="14.3" cy="11" r=".9"/>',
  token:     '<rect x="3" y="8" width="5" height="8" rx="1.5"/><rect x="9.5" y="8" width="5" height="8" rx="1.5"/><rect x="16" y="8" width="5" height="8" rx="1.5"/>',
  dice:      '<rect x="4.5" y="4.5" width="15" height="15" rx="3"/><circle cx="9" cy="9" r=".9"/><circle cx="15" cy="15" r=".9"/><circle cx="12" cy="12" r=".9"/>',
  harness:   '<rect x="3.5" y="3.5" width="17" height="17" rx="3" stroke-dasharray="3 2.2"/><rect x="8" y="8" width="8" height="8" rx="1.8"/>',
  json:      '<path d="M8.5 4.5C6.5 4.5 6.5 6 6.5 8s-.5 3.5-2 4c1.5.5 2 2 2 4s0 3.5 2 3.5M15.5 4.5c2 0 2 1.5 2 3.5s.5 3.5 2 4c-1.5.5-2 2-2 4s0 3.5-2 3.5"/>',
  fire:      '<path d="M12 21c-3.6 0-6-2.4-6-5.6 0-3.4 3-5 3-8.4 2.5 1.2 3.4 3.2 3.4 4.6.8-.6 1.4-1.8 1.4-3.2 2.4 1.6 4.2 4.2 4.2 7 0 3.2-2.4 5.6-6 5.6z"/>',
  inbox:     '<path d="M4 13.5l2.5-8h11l2.5 8v6H4z"/><path d="M4 13.5h4.5l1 2h5l1-2H20"/>',
  send:      '<path d="M4 12l16-7.5-5.5 16-3-6.5z"/><path d="M11.5 14l3.5-3.5"/>',
  hand:      '<path d="M8 12V6.5a1.5 1.5 0 0 1 3 0V11M11 10.5V5a1.5 1.5 0 0 1 3 0v5.5M14 10.5V6.5a1.5 1.5 0 0 1 3 0V14c0 3.6-2.4 6.5-6 6.5-2.2 0-3.6-1-4.8-2.7L4.5 15a1.5 1.5 0 0 1 2.4-1.7L8 14.5"/>',
  steps:     '<path d="M3.5 20h4v-4h4v-4h4V8h5"/>',
};

// 12×12 pixel maps: "#" filled, "." empty
const PIXEL = {
  heart:    ["............", ".##....##...", "####..####..", "##########..", "##########..", ".########...", "..######....", "...####.....", "....##......", "............", "............", "............"],
  pill:     ["............", "......###...", ".....#####..", "....###.##..", "...###.##...", "..###.##....", ".#####.#....", ".######.....", "..####......", "...##.......", "............", "............"],
  patient:  ["....####....", "...######...", "...######...", "...######...", "....####....", "............", "..########..", ".##########.", ".##########.", ".##########.", "............", "............"],
  note:     [".#######....", ".#.....##...", ".#.....#.#..", ".#.....####.", ".#.######.#.", ".#........#.", ".#.######.#.", ".#........#.", ".#.######.#.", ".#........#.", ".##########.", "............"],
  search:   ["............", "..####......", ".#....#.....", "#......#....", "#......#....", "#......#....", ".#....#.....", "..#####.....", "......###...", ".......###..", "........###.", ".........##."],
  database: ["..########..", ".#........#.", ".##########.", ".#........#.", ".#........#.", ".##########.", ".#........#.", ".#........#.", ".##########.", ".#........#.", "..########..", "............"],
  lock:     ["....####....", "...#....#...", "...#....#...", "...#....#...", "..########..", "..########..", "..###..###..", "..###..###..", "..########..", "..########..", "............", "............"],
  check:    ["............", "..........##", ".........##.", "........##..", ".......##...", "##....##....", ".##..##.....", "..####......", "...##.......", "............", "............", "............"],
  flask:    ["...######...", "....#..#....", "....#..#....", "....#..#....", "...#....#...", "..#......#..", ".#........#.", ".#.######.#.", "#.########.#", "#.########.#", ".##########.", "............"],
  hospital: [".....##.....", "....####....", "...######...", "..########..", ".##########.", ".####..####.", ".###....###.", ".####..####.", ".##########.", ".####..####.", ".####..####.", "............"],
  chip:     ["..#.#..#.#..", ".##########.", "#.#......#.#", ".#..####..#.", "##..####..##", ".#..####..#.", "##..####..##", ".#........#.", "#.#......#.#", ".##########.", "..#.#..#.#..", "............"],
  ghost:    ["....####....", "..########..", ".##########.", ".##..##..##.", ".##..##..##.", ".##########.", ".##########.", ".##########.", ".##########.", ".##.##.##.#.", ".#..#..#..#.", "............"],
};

export const ICON_NAMES = Object.keys(LINE);
export const PIXEL_NAMES = Object.keys(PIXEL);

/** Inline SVG markup for one line icon. */
export function lineIcon(name, { size = 24, stroke = 1.75, color = "currentColor" } = {}) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${LINE[name]}</svg>`;
}

/** Inline SVG markup for one 8-bit icon. */
export function pixelIcon(name, { size = 24, color = "currentColor" } = {}) {
  const rects = PIXEL[name].flatMap((row, y) => [...row].map((c, x) => (c === "#" ? `<rect x="${x}" y="${y}" width="1.02" height="1.02"/>` : ""))).join("");
  return `<svg viewBox="0 0 12 12" width="${size}" height="${size}" fill="${color}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
}

/** Put every line icon in a hidden sprite so pages can write <svg class="i"><use href="#i-NAME"/></svg>. */
export function injectSprite(doc = document) {
  if (doc.getElementById("icon-sprite")) return;
  const symbols = Object.entries(LINE).map(([n, d]) => `<symbol id="i-${n}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${d}</symbol>`).join("");
  doc.body.insertAdjacentHTML("afterbegin", `<svg id="icon-sprite" width="0" height="0" style="position:absolute">${symbols}</svg>`);
}
