// Copied from the AHA faculty talk (misc/aha26-faculty-talk, deck/bubble.js, 4 Nov 2026); keep the two in step.
// iMessage chat bubbles (iOS 26, dark mode), as one freeform path for Ctx.path.
//
// Geometry measured off Apple's own iOS 26 Messages renders (Apple Newsroom, WWDC25: the Live Translation and Apple Cash
// pictures, sent, received and dark tails all agree to within a pixel) and checked against the reference screenshot.
// Everything scales with the font size: 1 em = pt / 72 inches.
//   • line height 1.19 em (SF Pro; Arial in PowerPoint is set at 1.2 em here)
//   • padding 0.62 em above and below the text, 0.83 em either side
//   • corner radius 1.22 em = half a one-line bubble: one line is a capsule; more lines keep the same corners
//   • the tail hangs under the bottom corner on the sender's side: it leaves the corner, drops straight down and flicks
//     out to a point 0.43 em below the body and 0.47 em in from its side edge (it never sticks out past the side), then
//     curves back up to the bottom edge, which it meets smoothly 1.59 em in from the side.
//   • gaps: 0.25 em between bubbles in a run from one sender (only the last has a tail), 0.6 em when the sender changes.

export const EM = (pt) => pt / 72;
const R_EM = 1.22, PAD_X = 0.83, PAD_Y = 0.62, LINE_H = 1.2;
// The tail, in em: u inward from the body's tail-side edge, v down from its bottom edge.
// Fitted to the three reference tails: 0.01 em RMS, 0.03 em (under a pixel) worst.
const TAIL = {
  th: 56,                // the corner arc runs this far (degrees, from the side edge) before the tail takes over
  a: 0.25,               // handle out of the corner, along the arc's tangent (smooth join)
  tip: [0.47, 0.43],     // the point
  tipIn: 27, d: 0.21,    // the outer edge arrives at the tip heading down and 27° outward, handle d
  tipOut: 11.5, h1: 0.68, // the inner edge leaves the tip heading inward and 11.5° up, handle h1
  join: 1.59, h2: 0.68,  // ... and lands level on the bottom edge this far in, handle h2
};

// Standard dark mode. The reference screenshot is darker (sent 2555B6, received 181818, a faint rim on the grey):
// that is iOS with Increase Contrast on, which deepens both bubbles.
export const BUBBLE_COLORS = {
  sent: "0A84FF",        // iMessage blue (Apple system blue, dark)
  received: "262628",    // the dark-mode grey bubble
  sentText: "FFFFFF",
  receivedText: "FFFFFF",
};

// Sizes in inches for text at `pt`. Body width = text width + 2·padX; height = lines·lineH + 2·padY.
// The tail adds tailDrop below the body (tailOut = 0: nothing past its side edge).
export function bubbleMetrics(pt) {
  const e = EM(pt);
  return {
    em: e, r: R_EM * e, padX: PAD_X * e, padY: PAD_Y * e, lineH: LINE_H * e,
    tailOut: 0, tailDrop: TAIL.tip[1] * e, tailTipIn: TAIL.tip[0] * e, tailBase: TAIL.join * e,
    gapRun: 0.25 * e, gapTurn: 0.6 * e,
  };
}

// The bubble's outline: (x, y, w, h) is the body, the rounded rectangle the text sits in. side "right" (sent) puts the
// tail at the bottom-right corner, "left" (received) at the bottom-left. o.pt: the text size (sets the corner radius and
// the tail's size; default 20). o.tail === false: the plain body, for bubbles before the last in a run.
// With the tail the shape reaches tailDrop (0.43 em) below y + h and no further out on any other side; all control
// points lie inside that box, so Ctx.path's bounding box is (x, y, w, h + tailDrop).
export function bubblePath(x, y, w, h, side, o = {}) {
  const e = EM(o.pt || 20), r = Math.min(R_EM * e, h / 2, w / 2), k = 0.5523 * r, R = x + w, B = y + h;
  const pts = [[x + r, y], [R - r, y], { x: R, y: y + r, c1: [R - r + k, y], c2: [R, y + r - k] }];
  if (o.tail === false) {
    pts.push([R, B - r], { x: R - r, y: B, c1: [R, B - r + k], c2: [R - r + k, B] });
  } else {
    // (u, v) in em → slide inches, from the bottom-right corner
    const P = (u, v) => [R - u * e, B + v * e];
    const rad = (d) => (d * Math.PI) / 180, t = rad(TAIL.th), re = r / e;
    const kt = (4 / 3) * Math.tan(t / 4) * re; // handle for a t-radian arc
    const p1 = [re * (1 - Math.cos(t)), -re * (1 - Math.sin(t))], tan = [Math.sin(t), Math.cos(t)];
    const [tu, tv] = TAIL.tip, ai = rad(TAIL.tipIn), ao = rad(TAIL.tipOut);
    // On a bubble too narrow for the tail's base, land it where the far corner begins.
    const join = Math.min(TAIL.join, w / e - re), h2 = Math.min(TAIL.h2, join - tu);
    pts.push(
      P(0, -re), // down the side to the corner
      { x: P(...p1)[0], y: P(...p1)[1], c1: P(0, -re + kt), c2: P(p1[0] - kt * tan[0], p1[1] - kt * tan[1]) },
      { x: P(tu, tv)[0], y: P(tu, tv)[1], c1: P(p1[0] + TAIL.a * tan[0], p1[1] + TAIL.a * tan[1]), c2: P(tu + TAIL.d * Math.sin(ai), tv - TAIL.d * Math.cos(ai)) },
      { x: P(join, 0)[0], y: P(join, 0)[1], c1: P(tu + TAIL.h1 * Math.cos(ao), tv - TAIL.h1 * Math.sin(ao)), c2: P(join - h2, 0) },
    );
  }
  pts.push([x + r, B], { x, y: B - r, c1: [x + r - k, B], c2: [x, B - r + k] }, [x, y + r], { x: x + r, y, c1: [x, y + r - k], c2: [x + r - k, y] });
  // Drop zero-length lines (a one-line bubble has no straight sides).
  const end = (p) => (Array.isArray(p) ? p : [p.x, p.y]);
  const out = pts.filter((p, i) => !i || !Array.isArray(p) || Math.hypot(p[0] - end(pts[i - 1])[0], p[1] - end(pts[i - 1])[1]) > 1e-6);
  if (side !== "left") return out;
  const m = (p) => [2 * x + w - p[0], p[1]];
  return out.map((p) => (Array.isArray(p) ? m(p) : { x: 2 * x + w - p.x, y: p.y, c1: m(p.c1), c2: m(p.c2) }));
}

