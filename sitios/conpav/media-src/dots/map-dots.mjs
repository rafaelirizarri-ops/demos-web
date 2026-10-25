// Dot map of El Salvador for the "Experiencia" section of sitios/conpav.
// Reads the 14 departments from slv.topo.json (Natural Earth admin-1, via datamaps 0.5.9, MIT),
// lays a square grid of dots over the country and writes one <path> of dots per department
// into ../../index.html, between <!-- map:dots --> and <!-- /map:dots -->.
// Departments with works get class "is-worked" (the list is WORKED below) and a label at the
// centre of their dots (LABEL_NUDGE moves a label, in grid steps, where two would touch).
// Usage (from this folder): node map-dots.mjs
import { readFileSync, writeFileSync } from "node:fs";

const WORKED = ["San Salvador", "La Libertad", "Sonsonate", "Chalatenango", "Usulután", "San Miguel", "La Unión", "Morazán"];
const LABEL_NUDGE = {};
const COLS = 66;        // dots across the country's width
const DOT = 0.34;       // dot radius, as a share of the grid step

const topo = JSON.parse(readFileSync(new URL("./slv.topo.json", import.meta.url), "utf8"));
const { scale, translate } = topo.transform;

// decode the delta-encoded, quantized arcs to [lon, lat]
const arcs = topo.arcs.map((arc) => {
  let x = 0, y = 0;
  return arc.map(([dx, dy]) => { x += dx; y += dy; return [x * scale[0] + translate[0], y * scale[1] + translate[1]]; });
});
const ring = (ids) => ids.flatMap((i, k) => {
  const pts = i < 0 ? arcs[~i].slice().reverse() : arcs[i];
  return k ? pts.slice(1) : pts;
});

// equirectangular, scaled for the country's latitude so the shape is true
const LAT0 = 13.7 * Math.PI / 180;
const proj = ([lon, lat]) => [lon * Math.cos(LAT0), -lat];

const depts = topo.objects.slv.geometries.map((g) => {
  const polys = g.type === "Polygon" ? [g.arcs] : g.arcs;
  return { name: g.properties.name, polys: polys.map((p) => p.map((r) => ring(r).map(proj))) };
});

const all = depts.flatMap((d) => d.polys.flat(2));
const minX = Math.min(...all.map((p) => p[0])), maxX = Math.max(...all.map((p) => p[0]));
const minY = Math.min(...all.map((p) => p[1])), maxY = Math.max(...all.map((p) => p[1]));
const step = (maxX - minX) / COLS;
const W = COLS, H = Math.ceil((maxY - minY) / step);

const inRing = (x, y, r) => {
  let c = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i], [xj, yj] = r[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const inPoly = (x, y, poly) => inRing(x, y, poly[0]) && !poly.slice(1).some((h) => inRing(x, y, h));

// one dot per grid cell centre; a cell belongs to the department that contains its centre
const dots = new Map(depts.map((d) => [d.name, []]));
for (let row = 0; row < H; row++) {
  for (let col = 0; col < W; col++) {
    const x = minX + (col + 0.5) * step, y = minY + (row + 0.5) * step;
    const d = depts.find((dep) => dep.polys.some((p) => inPoly(x, y, p)));
    if (d) dots.get(d.name).push([col + 0.5, row + 0.5]);
  }
}

// each dot is a zero-length segment with a round cap, as wide as the dot:
// the first absolute, the rest relative to the one before, so the path stays small
const dotsPath = (pts) => pts.map(([x, y], i) => (i ? `m${x - pts[i - 1][0]} ${y - pts[i - 1][1]}h0` : `M${x} ${y}h0`)).join("");
const paths = depts
  .sort((a, b) => WORKED.includes(a.name) - WORKED.includes(b.name))
  .map((d) => `<path class="map__dept${WORKED.includes(d.name) ? " is-worked" : ""}" data-dept="${d.name}" d="${dotsPath(dots.get(d.name))}"/>`);
const svg = `<svg class="map__dots" viewBox="0 0 ${W} ${H}" fill="none" stroke-width="${2 * DOT}" stroke-linecap="round" aria-hidden="true" focusable="false">${paths.join("")}</svg>`;
const pct = (v, of) => +((v / of) * 100).toFixed(2);
const labels = WORKED.map((name) => {
  const d = dots.get(name), n = LABEL_NUDGE[name] || [0, 0];
  const cx = d.reduce((s, p) => s + p[0], 0) / d.length + n[0], cy = d.reduce((s, p) => s + p[1], 0) / d.length + n[1];
  return `<span class="map__label" data-dept="${name}" style="left: ${pct(cx, W)}%; top: ${pct(cy, H)}%">${name}</span>`;
});

const page = new URL("../../index.html", import.meta.url);
const html = readFileSync(page, "utf8");
const re = /(<!-- map:dots -->)[\s\S]*?(<!-- \/map:dots -->)/;
if (!re.test(html)) throw new Error("index.html has no <!-- map:dots --> markers");
writeFileSync(page, html.replace(re, `$1${svg}<div class="map__labels" aria-hidden="true">${labels.join("")}</div>$2`));
const count = [...dots.values()].reduce((n, d) => n + d.length, 0);
console.log(`${count} dots, ${W} x ${H} grid, ${(svg.length / 1024).toFixed(1)} KB`);
