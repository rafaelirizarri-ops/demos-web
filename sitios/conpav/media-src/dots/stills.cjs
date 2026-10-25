/* =========================================================================
   CONPAV: still images of the dots drawing (development only)
   Captures the opening frame of hero3d.js, with the hero text hidden, and
   writes:
   - assets/img/dots-hero-d-1600.{webp,jpg}  1600x1000, shown without WebGL
                                             or JS on screens 700px and up
   - assets/img/dots-hero-m-800.{webp,jpg}   800x1600, the same on phones
   - assets/og/conpav.jpg                    1200x630 share image: logo,
                                             title and the drawing
   Usage, from the repo root, with the QA server running:
     python3 -m http.server 8765 -d sitios &
     node sitios/conpav/media-src/dots/stills.cjs
   Needs Playwright (require) and sharp (media-src/node_modules). Run it
   again whenever hero3d.js changes the opening frame.
   ========================================================================= */
const { chromium } = require("playwright");
const sharp = require("sharp");
const fs = require("node:fs");
const path = require("node:path");

const site = path.resolve(__dirname, "..", "..");
const URL = process.env.CONPAV_URL || "http://localhost:8765/conpav/";
// SwiftShader: WebGL without a GPU, as in the QA runs
const GL = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];

async function capture(browser, width, height) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2 });
  await ctx.addInitScript(() => sessionStorage.setItem("conpav-intro", "1")); // skip the logo intro
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "load" });
  await page.waitForFunction(() => window.conpavHero, null, { timeout: 15000 });
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    const H = window.conpavHero, text = document.querySelector(".hero__text");
    H.setAmbient(false); H.still(); H.setProgress(0); H.setLayout(text.getBoundingClientRect(), 1);
    const st = document.createElement("style");
    st.textContent = ".hero__text, .hero__text *, .hero__tour, .hero__tour * { opacity: 0 !important; visibility: hidden !important; }";
    document.head.appendChild(st);
    H.redraw();
  });
  await page.waitForTimeout(500);
  const png = await page.locator(".hero__canvas").screenshot();
  await ctx.close();
  return png;
}

async function save(png, name, w, h) {
  const img = sharp(png).resize(w, h, { kernel: "lanczos3" });
  await img.clone().jpeg({ quality: 82, progressive: true, mozjpeg: true }).toFile(path.join(site, "assets/img", `${name}.jpg`));
  await img.clone().webp({ quality: 80, effort: 6 }).toFile(path.join(site, "assets/img", `${name}.webp`));
}

function ogHTML(stillPNG) {
  const font = (f) => "data:font/woff2;base64," + fs.readFileSync(path.join(site, "assets/fonts", f)).toString("base64");
  const logo = fs.readFileSync(path.join(site, "index.html"), "utf8").match(/<svg class="logo logo--h"[\s\S]*?<\/svg>/)[0];
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face { font-family: "BSC"; font-weight: 600; src: url(${font("barlow-sc-600-latin.woff2")}) format("woff2"); }
    @font-face { font-family: "B"; font-weight: 400; src: url(${font("barlow-400-latin.woff2")}) format("woff2"); }
    html, body { margin: 0; }
    .og { position: relative; width: 1200px; height: 630px; overflow: hidden; background: #292D32; color: #F5F4F0; }
    .og img { position: absolute; left: 190px; top: -36px; width: 1040px; height: auto; }
    .og .shade { position: absolute; inset: 0; background: linear-gradient(90deg, #292D32 0%, rgba(41,45,50,.92) 34%, rgba(41,45,50,0) 62%); }
    .og .logo { position: absolute; left: 72px; top: 64px; height: 44px; width: auto; color: #F5F4F0; }
    .og h1 { position: absolute; left: 72px; top: 214px; margin: 0; width: 560px; font: 600 72px/1.0 "BSC"; letter-spacing: -0.01em; }
    .og p { position: absolute; left: 72px; bottom: 64px; margin: 0; width: 480px; font: 400 24px/1.3 "B"; color: #C5C9CC; }
  </style></head><body><div class="og">
    <img src="data:image/png;base64,${stillPNG.toString("base64")}" alt="">
    <div class="shade"></div>
    ${logo}
    <h1>Ingeniería civil en todo El&nbsp;Salvador, desde&nbsp;2011</h1>
    <p>Carreteras, puentes, obras hidráulicas, estabilización y edificación</p>
  </div></body></html>`;
}

(async () => {
  const browser = await chromium.launch({ args: GL });
  // desktop: a 1600x1000 canvas under the 72px header; phone: 400x800 under 64px
  const desk = await capture(browser, 1600, 1072);
  const phone = await capture(browser, 400, 864);
  await save(desk, "dots-hero-d-1600", 1600, 1000);
  await save(phone, "dots-hero-m-800", 800, 1600);

  const still = await sharp(desk).resize(1600, 1000, { kernel: "lanczos3" }).png().toBuffer();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.setContent(ogHTML(still), { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const og = await page.locator(".og").screenshot();
  await sharp(og).jpeg({ quality: 84, progressive: true, mozjpeg: true }).toFile(path.join(site, "assets/og/conpav.jpg"));
  await browser.close();

  for (const f of ["img/dots-hero-d-1600.jpg", "img/dots-hero-d-1600.webp", "img/dots-hero-m-800.jpg", "img/dots-hero-m-800.webp", "og/conpav.jpg"]) {
    console.log(`${f}  ${Math.round(fs.statSync(path.join(site, "assets", f)).size / 1000)} KB`);
  }
})();
