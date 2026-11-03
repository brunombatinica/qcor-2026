// Page order of the style book, grouped for the index. Each id is styles/<id>.js.
export const GROUPS = [
  ["Geometry", ["bauhaus", "tangram", "cards", "byrne", "albers", "lewitt", "pleasures", "destijl"]],
  ["Systems", ["apple", "google", "swiss", "braun", "aicher", "crouwel", "glass", "terminal"]],
  ["Information", ["tufte", "ft", "manim", "isotype", "periodic", "transit", "ecg"]],
  ["Print and drawing", ["deco", "mon", "riso", "popart", "comic", "isometric", "brutal"]],
  ["Technical and made", ["blueprint", "patent", "circuit", "lego", "sketch"]],
];
export const STYLES = GROUPS.flatMap(([, ids]) => ids);
