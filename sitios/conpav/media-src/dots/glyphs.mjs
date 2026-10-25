// Dot glyphs for the five areas of sitios/conpav: each one a small drawing made of dots,
// in the same language as the portada. Writes an SVG sprite of <symbol>s into ../../index.html,
// between <!-- glyphs --> and <!-- /glyphs -->. Usage (from this folder): node glyphs.mjs
import { readFileSync, writeFileSync } from "node:fs";

const R = 0.62;                 // dot radius, on a 16 x 16 grid
const f = (n) => +n.toFixed(2);
const dot = ([x, y]) => `M${f(x)} ${f(y)}h0`;   // a zero-length segment with a round cap, as wide as the dot
// dots along a segment, about `step` apart, ends included
const seg = (a, b, step = 1.6) => {
  const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
  return Array.from({ length: n + 1 }, (_, i) => [a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n]);
};
const uniq = (pts) => {
  const out = [];
  pts.forEach((p) => { if (!out.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 1.1)) out.push(p); });
  return out;
};

const G = {
  // a road in perspective: two edges meeting towards the horizon, dashes down the middle
  carreteras: [...seg([1.5, 14.5], [6.2, 2.5], 1.75), ...seg([14.5, 14.5], [9.8, 2.5], 1.75), [8, 13.6], [8, 11.6], [8, 8.4], [8, 6.6], [8, 4]],
  // a deck on two piers over the ground line
  puentes: [...seg([0.8, 5.5], [15.2, 5.5], 1.6), ...seg([4.6, 7.3], [4.6, 13.6], 1.6), ...seg([11.4, 7.3], [11.4, 13.6], 1.6), ...seg([0.8, 3.6], [0.8, 3.6]), ...seg([15.2, 3.6], [15.2, 3.6]), ...seg([4.6, 3.6], [11.4, 3.6], 1.7)],
  // water between two channel walls
  hidraulicas: [...seg([1.2, 2], [1.2, 14.4], 1.55), ...seg([14.8, 2], [14.8, 14.4], 1.55),
    ...[6.2, 9.8, 13.4].flatMap((y, r) => [3.9, 6.1, 8.3, 10.5, 12.3].map((x, i) => [x + (r % 2) * 0.9 - 0.45, y + ((i % 2) ? -0.55 : 0.55)]))],
  // a cut slope with its nails, above the road
  estabilizacion: [...seg([1, 14.6], [15, 14.6], 1.75), ...seg([3, 12.6], [13.6, 1.6], 1.7),
    [8.2, 12.4], [11.2, 12.4], [14.2, 12.4], [11.2, 9.4], [14.2, 9.4], [14.2, 6.4], [10, 9.6]].filter(Boolean),
  // a building frame: three columns, four floors
  edificacion: [...[2, 8, 14].flatMap((x) => seg([x, 1.6], [x, 14.6], 1.62)), ...[1.6, 5.9, 10.3, 14.6].flatMap((y) => seg([2, y], [14, y], 1.5))],
};

const symbols = Object.entries(G).map(([k, pts]) =>
  `<symbol id="g-${k}" viewBox="0 0 16 16"><path fill="none" stroke="currentColor" stroke-width="${2 * R}" stroke-linecap="round" d="${uniq(pts).map(dot).join("")}"/></symbol>`).join("");
const sprite = `<svg class="sprite" aria-hidden="true" focusable="false">${symbols}</svg>`;

const page = new URL("../../index.html", import.meta.url);
const html = readFileSync(page, "utf8");
const re = /(<!-- glyphs -->)[\s\S]*?(<!-- \/glyphs -->)/;
if (!re.test(html)) throw new Error("index.html has no <!-- glyphs --> markers");
writeFileSync(page, html.replace(re, `$1${sprite}$2`));
console.log(Object.entries(G).map(([k, p]) => `${k} ${uniq(p).length}`).join(", "), `${(sprite.length / 1024).toFixed(1)} KB`);
