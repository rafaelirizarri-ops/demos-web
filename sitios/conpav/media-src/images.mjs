/* =========================================================================
   CONPAV: image pipeline (development only, never deployed as a page)
   Reads photos.json and the original photos, and writes:
   - assets/img/<name>-<crop>-<width>.avif  AVIF q45 (q40 at 1600)
   - assets/img/<name>-<crop>-<width>.webp  WebP q65
   - assets/img/<name>-d-800.jpg            JPEG q72 fallback for <img src>
   - assets/og/<name>.jpg                   Open Graph image, 1200x630,
                                             JPEG q78 progressive
   Per photo: crop per device (m = mobile 4:5, d = desktop 3:2 or 4:5 and
   every screen when there is no m, t = 3:2 thumbnail), the declared colour
   corrections only, sRGB output without metadata, never an upscale.
   Prints a size table and exits 1 if a file is over budget or a width is
   asked for that the crop does not have. Run on every photo, it also lists
   the files in assets/img and assets/og that photos.json no longer makes.

   Usage (from the repo root):
     node sitios/conpav/media-src/images.mjs
     node sitios/conpav/media-src/images.mjs --only slope-street
     node sitios/conpav/media-src/images.mjs --src /path/to/originals
   Originals are found by the 8-character ID prefix of their file name.
   It never touches the HTML: <picture> elements are written by hand.
   ========================================================================= */

import sharp from "sharp";
import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const site = path.resolve(here, "..");
const OUT_IMG = path.join(site, "assets", "img");
const OUT_OG = path.join(site, "assets", "og");

/* Originals live outside the repo and are never copied into it. */
const DEFAULT_SOURCES = [
  "/mnt/project-files/uploads/hearth",
  "/mnt/project-files/concretos-pavimentos/media",
];

/* ---------- formats and budgets ---------- */
const WIDTHS = [160, 320, 480, 800, 1200, 1600]; // 160 and 320: thumbnails only
const AVIF_QUALITY = (w) => (w >= 1600 ? 40 : 45);
const WEBP_QUALITY = 65;
const JPEG_QUALITY = 72;
const JPEG_WIDTH = 800;
const OG = { width: 1200, height: 630, quality: 78, budgetKB: 300 };
// AVIF budget per width, in KB (1 KB = 1000 bytes). A photo can lower it
// with "budgetKB" in photos.json (the hero: 200 KB at 1200).
const AVIF_BUDGET_KB = { 160: 15, 320: 40, 480: 60, 800: 130, 1200: 230, 1600: 250 };

/* Allowed shapes per crop key, as width / height. */
const SHAPES = {
  m: { "4:5": 4 / 5 },
  d: { "3:2": 3 / 2, "4:5": 4 / 5 },
  t: { "3:2": 3 / 2 },
};
const MAX_ROTATE = 3; // degrees, to straighten a horizon

/* ---------- arguments ---------- */
const args = process.argv.slice(2);
const sources = [];
let only = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--src") sources.push(args[++i]);
  else if (args[i] === "--only") only = args[++i];
  else fail(`Unknown argument: ${args[i]}`);
}
if (!sources.length) sources.push(...DEFAULT_SOURCES);

const problems = [];
const rows = [];

function fail(msg) {
  console.error(`images.mjs: ${msg}`);
  process.exit(1);
}

const kb = (bytes) => (bytes / 1000).toFixed(1);

/* ---------- find an original by its ID prefix ---------- */
const listings = new Map();
async function findOriginal(id) {
  const hits = [];
  for (const dir of sources) {
    if (!listings.has(dir)) {
      try {
        listings.set(dir, await readdir(dir));
      } catch {
        listings.set(dir, []);
      }
    }
    for (const f of listings.get(dir)) if (f.startsWith(id)) hits.push(path.join(dir, f));
  }
  if (hits.length !== 1) {
    throw new Error(`${id}: expected 1 original, found ${hits.length} in ${sources.join(", ")}`);
  }
  return hits[0];
}

/* ---------- checks ---------- */
function checkRect(label, rect, width, height) {
  if (!Array.isArray(rect) || rect.length !== 4 || rect.some((v) => !Number.isInteger(v) || v < 0)) {
    throw new Error(`${label}: rect must be [left, top, width, height] in whole pixels`);
  }
  const [x, y, w, h] = rect;
  if (w < 1 || h < 1 || x + w > width || y + h > height) {
    throw new Error(`${label}: rect ${rect.join(",")} falls outside the ${width}x${height} original`);
  }
}

function checkShape(label, key, rect) {
  const shapes = SHAPES[key];
  if (!shapes) throw new Error(`${label}: unknown crop "${key}" (use m, d or t)`);
  const [, , w, h] = rect;
  // within 1 px of the exact ratio
  const ok = Object.values(shapes).some((r) => Math.abs(w / r - h) <= 1);
  if (!ok) throw new Error(`${label}: ${w}x${h} is not ${Object.keys(shapes).join(" or ")}`);
}

/* ---------- the original, straightened if asked ---------- */
// Returns a factory of fresh sharp pipelines plus the size the rects refer
// to. Rotation changes the canvas, so a rotated photo is kept as raw pixels
// (no re-encoding) and its rects are read in the straightened image.
async function loadOriginal(file, rotate) {
  if (!rotate) {
    const { width, height } = await sharp(file).metadata();
    return { open: () => sharp(file), width, height };
  }
  const { data, info } = await sharp(file)
    .rotate(rotate, { background: "#000000" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const raw = { width: info.width, height: info.height, channels: info.channels };
  return { open: () => sharp(data, { raw }), width: info.width, height: info.height };
}

/* ---------- colour: white balance and soft levels ---------- */
// The corrections allowed by DESIGN.md, nothing else: per-channel gains
// (white balance with the concrete as a grey card) and soft levels that map
// the lower/upper luminance percentiles to black and white. Both are linear,
// so they are applied as one sharp.linear() and every crop of a photo gets
// the same mapping (the percentiles are measured on the "d" crop).
async function colourMapping(original, adjust, rect) {
  const gains = adjust.channels || [1, 1, 1];
  if (gains.length !== 3 || gains.some((g) => !(g > 0.5 && g < 1.5))) {
    throw new Error(`channels must be three gains between 0.5 and 1.5`);
  }
  let a = 1;
  let b = 0;
  if (adjust.levels) {
    const [lo, hi] = adjust.levels;
    if (!(lo >= 0 && lo < 5 && hi > 95 && hi <= 100)) throw new Error(`levels must be soft: [0-5, 95-100]`);
    const { data } = await original
      .open()
      .extract({ left: rect[0], top: rect[1], width: rect[2], height: rect[3] })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const hist = new Array(256).fill(0);
    for (let i = 0; i < data.length; i += 3) {
      const y = 0.2126 * data[i] * gains[0] + 0.7152 * data[i + 1] * gains[1] + 0.0722 * data[i + 2] * gains[2];
      hist[Math.min(255, Math.round(y))]++;
    }
    const total = data.length / 3;
    const at = (p) => {
      let n = 0;
      for (let v = 0; v < 256; v++) {
        n += hist[v];
        if (n >= (total * p) / 100) return v;
      }
      return 255;
    };
    const black = at(lo);
    const white = at(hi);
    if (white - black < 64) throw new Error(`levels: range ${black}-${white} too narrow`);
    a = 255 / (white - black);
    b = -black * a;
  }
  return { mul: gains.map((g) => g * a), add: [b, b, b] };
}

/* ---------- one crop of one photo ---------- */
async function cropped(original, rect, colour) {
  let img = original.open().extract({ left: rect[0], top: rect[1], width: rect[2], height: rect[3] });
  if (colour) img = img.linear(colour.mul, colour.add);
  // Keep an 8-bit sRGB master of the crop; every size is resized from it.
  const { data, info } = await img
    .toColorspace("srgb")
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, info };
}

function fromMaster(master) {
  const { width, height, channels } = master.info;
  return sharp(master.data, { raw: { width, height, channels } });
}

// Writes one output and returns its weight and real pixel size.
const written = new Set();
async function save(file, { data, info }) {
  await writeFile(file, data);
  written.add(file);
  return { bytes: data.length, size: `${info.width}x${info.height}` };
}

/* ---------- main ---------- */
const config = JSON.parse(await readFile(path.join(here, "photos.json"), "utf8"));
await mkdir(OUT_IMG, { recursive: true });
await mkdir(OUT_OG, { recursive: true });

const names = new Set();
for (const photo of config.photos) {
  if (only && photo.name !== only) continue;
  const label = `${photo.id} ${photo.name}`;
  try {
    if (!/^[0-9a-f]{8}$/.test(photo.id)) throw new Error(`id must be the 8-character ID prefix`);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(photo.name)) throw new Error(`name must be lowercase-with-hyphens`);
    if (names.has(photo.name)) throw new Error(`name is used twice`);
    names.add(photo.name);
    if (!photo.crops || !photo.crops.d) throw new Error(`every photo needs a "d" crop`);

    const file = await findOriginal(photo.id);
    const adjust = photo.adjust || {};
    const rotate = adjust.rotate || 0;
    if (Math.abs(rotate) > MAX_ROTATE) throw new Error(`rotate is limited to ${MAX_ROTATE} degrees`);
    const original = await loadOriginal(file, rotate);

    for (const [key, crop] of Object.entries(photo.crops)) {
      checkRect(`${label} ${key}`, crop.rect, original.width, original.height);
      checkShape(`${label} ${key}`, key, crop.rect);
    }
    if (photo.og) checkRect(`${label} og`, photo.og.rect, original.width, original.height);

    const colour =
      adjust.channels || adjust.levels ? await colourMapping(original, adjust, photo.crops.d.rect) : null;

    for (const [key, crop] of Object.entries(photo.crops)) {
      const master = await cropped(original, crop.rect, colour);
      const cw = crop.rect[2];
      const widths = crop.widths || [];
      if (!widths.length) throw new Error(`${key}: no widths`);
      if (key === "m" && widths.some((w) => w > 800)) throw new Error(`m: phones get 800 px at most`);
      if (key !== "t" && widths.some((w) => w < 480)) throw new Error(`${key}: 160 and 320 are for "t" only`);

      for (const w of widths) {
        if (!WIDTHS.includes(w)) throw new Error(`${key}: width ${w} is not one of ${WIDTHS.join(", ")}`);
        if (w > cw) throw new Error(`${key}: width ${w} asked for, but the crop is only ${cw} px wide`);
        const base = `${photo.name}-${key}-${w}`;
        const resized = () => fromMaster(master).resize({ width: w, kernel: "lanczos3" });
        const avif = await save(
          path.join(OUT_IMG, `${base}.avif`),
          await resized().avif({ quality: AVIF_QUALITY(w), chromaSubsampling: "4:2:0" }).toBuffer({ resolveWithObject: true }),
        );
        const webp = await save(
          path.join(OUT_IMG, `${base}.webp`),
          await resized().webp({ quality: WEBP_QUALITY, effort: 6 }).toBuffer({ resolveWithObject: true }),
        );
        const limit = photo.budgetKB?.[w] ?? AVIF_BUDGET_KB[w];
        const over = avif.bytes > limit * 1000;
        if (over) problems.push(`${base}.avif is ${kb(avif.bytes)} KB, budget ${limit} KB`);
        rows.push([base, avif.size, kb(avif.bytes), kb(webp.bytes), "", `${limit}`, over ? "OVER" : "ok"]);
      }

      if (key === "d") {
        if (cw < JPEG_WIDTH) throw new Error(`d: the JPEG fallback needs ${JPEG_WIDTH} px, the crop has ${cw}`);
        const base = `${photo.name}-d-${JPEG_WIDTH}`;
        const jpg = await save(
          path.join(OUT_IMG, `${base}.jpg`),
          await fromMaster(master)
            .resize({ width: JPEG_WIDTH, kernel: "lanczos3" })
            .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
            .toBuffer({ resolveWithObject: true }),
        );
        rows.push([`${base}.jpg`, jpg.size, "", "", kb(jpg.bytes), "", "ok"]);
      }
    }

    if (photo.og) {
      const r = photo.og.rect;
      if (Math.abs(r[2] / (OG.width / OG.height) - r[3]) > 1) throw new Error(`og: rect must be 1200:630`);
      if (r[2] < OG.width) throw new Error(`og: the crop must be at least ${OG.width} px wide`);
      const master = await cropped(original, r, colour);
      const og = await save(
        path.join(OUT_OG, `${photo.name}.jpg`),
        await fromMaster(master)
          .resize({ width: OG.width, height: OG.height, kernel: "lanczos3", fit: "fill" })
          .jpeg({ quality: OG.quality, progressive: true, mozjpeg: true })
          .toBuffer({ resolveWithObject: true }),
      );
      const over = og.bytes > OG.budgetKB * 1000;
      if (over) problems.push(`og/${photo.name}.jpg is ${kb(og.bytes)} KB, budget ${OG.budgetKB} KB`);
      rows.push([`og/${photo.name}.jpg`, og.size, "", "", kb(og.bytes), `${OG.budgetKB}`, over ? "OVER" : "ok"]);
    }
  } catch (err) {
    problems.push(`${label}: ${err.message}`);
  }
}

/* ---------- files that photos.json no longer produces ---------- */
// Only listed, never deleted: a renamed or dropped photo leaves its old
// files behind, and they must be removed by hand (and from the HTML).
const stale = [];
if (!only && !problems.length) {
  for (const dir of [OUT_IMG, OUT_OG]) {
    for (const f of await readdir(dir)) {
      const file = path.join(dir, f);
      if (!written.has(file)) stale.push(path.relative(site, file));
    }
  }
}

/* ---------- report ---------- */
const head = ["file", "size", "AVIF KB", "WebP KB", "JPEG KB", "budget", ""];
const all = [head, ...rows];
const widthsCol = head.map((_, i) => Math.max(...all.map((r) => String(r[i]).length)));
for (const r of all) {
  console.log(r.map((c, i) => (i < 2 ? String(c).padEnd(widthsCol[i]) : String(c).padStart(widthsCol[i]))).join("  "));
}
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error(`- ${p}`);
  process.exit(1);
}
console.log(`\n${rows.length} rows, all within budget.`);
if (stale.length) {
  console.warn(`\n${stale.length} file(s) not produced by photos.json (delete them if nothing uses them):`);
  for (const f of stale) console.warn(`- ${f}`);
}
