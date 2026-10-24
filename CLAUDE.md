# demos-web

Static demo sites that Faro, a small web agency in Panama, builds for prospects before they sign, plus Faro's own site. The working rules live in the project Instructions; this file holds the repo facts.

## Structure
- `sitios/<client>/` is one independent site in plain HTML/CSS/JS. There is no build, lint or test step (the only package.json is `sitios/faro/video-src/faro-3d`, used to render a video).
- Sites and status (update when one signs): `faro` (Faro's own site, indexed), `mareas` (fictional sample; the footer says so), `orthox` (prospect demo), `sen-vietnam` (prospect demo).
- `sitios/<client>/DESIGN.md` is that site's design source of truth. Read it before editing and update it in the same PR. Only faro has one so far.
- Code lives only in this repo. The folders under `/mnt/project-files/sitios/` are old copies: never edit them.
- Everything under `sitios/` is public on the internet, DESIGN.md and video sources included.

## Site builds
- Every new site is level 2 (premium with motion) by default. Level 1 (simple: HTML, CSS and minimal JS, no GSAP) only when Rafa says "simple".
- ALWAYS load the skills `design-playbook`, `impeccable` and `gsap-web-animation` at the start of every site build, and say in the thread and the PR which ones you loaded.
- Level 2 requires GSAP + ScrollTrigger (self-hosted: copy them from `sitios/faro/assets/js/`) with at least a hero reveal, section reveals and one scroll-driven moment: a pinned or scrubbed image or video.
- No scroll-jacking: never take scroll control from the visitor (forced snapping between sections, wheel or swipe turned into slide jumps, a page locked until an animation ends). Scroll-scrubbed hero video or image sequences are allowed. Encode a scrubbed video with every frame as a keyframe (ffmpeg `-g 1`, WebM next to MP4) or draw an image sequence on a canvas, and show a still frame under `prefers-reduced-motion`.

## Marketing-site floor
Every site ships these; the QA pass checks them.
- Sticky header: set `scroll-padding-top` on `html` to the header height, so anchor links and keyboard focus never land under the nav.
- Full-screen hero and pinned sections: `height: 100vh` then `height: 100svh` on the next line, never bare `100vh`, so the hero isn't cut when the phone's browser bar shows. Use `100dvh` only for full-screen overlays such as the open mobile menu: it resizes when the bar hides, which makes pinned sections jump. Scroll-driven size changes come from GSAP, not from the unit.
- Contact forms: every field gets the right `type`, `inputmode` and `autocomplete` (phone `tel`/`tel`, email `email`/`email`, name `name` or `given-name`), so phones open the right keyboard and autofill works.
- Form errors: show each error next to its field, set `aria-invalid="true"` and `aria-describedby` to the message, and move focus to the first invalid field on submit.
- Anything that moves on its own (testimonial carousel, logo marquee, autoplay video loop): visible pause button, pause on hover and focus, static under `prefers-reduced-motion`.
- Layering: one small z-index scale as tokens (`--z-base`, `--z-sticky`, `--z-overlay`, `--z-modal`, `--z-toast`); no ad-hoc numbers like `9999`.

## Deploy
- The Cloudflare Worker `faro-demos` serves all of `sitios/` as static files (Workers Builds connected to this repo, config in the root `wrangler.jsonc`, whose `name` must stay `faro-demos` or the build fails). Merging any PR republishes every demo at `https://faro-demos.faro-web.workers.dev/<client>/`. Merge only with Rafa's explicit OK, as a squash merge with the PR title as the commit title.
- PR preview: every other branch gets `https://<branch>-faro-demos.faro-web.workers.dev/<client>/`, with the branch lowercased and every other character turned into `-` (`claude/conpav-sitio` → `claude-conpav-sitio`). Cloudflare does not comment the link; the status check is `Workers Builds: faro-demos`. Previews send `X-Robots-Tag: noindex`; production does not. Both workers.dev toggles (Worker → Settings → Domains) must stay on, or Cloudflare answers error 1042.
- Headers go in `sitios/_headers` and redirects in `sitios/_redirects` (Cloudflare syntax: one `*` per rule, `:name` for one path segment); neither file is served. `/x.html` and `/x/index.html` 307-redirect to `/x` and `/x/`. A missing page gets the nearest `404.html` up its folder tree (`sitios/<client>/404.html`), else a plain 404.
- Netlify is retired. The old site `demos-webs` stays up only to 301 `demos-webs.netlify.app/*` to the Worker (root `netlify.toml`): never delete it, and ignore its deploy previews and the `demos-web` Netlify checks. The per-site `netlify.toml` files (orthox, mareas, sen-vietnam) are leftovers; Cloudflare ignores them.
- A client who signs gets their own Worker or Pages project and their domain. A Worker custom domain needs the domain's DNS on Cloudflare.
- Follow-up after a thread's PR is merged: `git fetch origin main && git checkout -B <branch> origin/main && git push --force-with-lease -u origin <branch>`.

## Cloud container limits
- Checked 2026-10-23: `*.workers.dev` and `*.pages.dev` (production and previews), `*.netlify.app`, `formsubmit.co`, the CDNs, Unsplash, Instagram, Fresha and Google Maps answer from the container; Degusta does not. Open the Cloudflare preview yourself instead of asking Rafa. The policy has changed before: if a host fails, try it once more, then fall back below.
- Self-host fonts and libraries in `sitios/<client>/assets/` anyway (speed, and no third party can break a demo).
- Text from a blocked site: WebSearch or WebFetch. Photos, downloads and screenshots of a blocked site: Playwright on Rafa's computer when it is connected (folder `~/Documents/websites`), or ask Rafa.

## QA
```
python3 -m http.server 8765 -d sitios &   # http://localhost:8765/<client>/, same shell call as the test
node check.cjs                            # Playwright via require() (CommonJS), browsers in /opt/pw-browsers
CHROME_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome npx -y lighthouse@13.5.0 \
  http://localhost:8765/<client>/ --only-categories=performance,accessibility,seo \
  --chrome-flags="--headless=new --no-sandbox" --output=json --output-path=<scratchpad>/lh.json --quiet
```
- Full checklist (improvement or new site): screenshots at 390, 768, 1280 and 1440; no console errors, broken links or missing files; nothing overflows; motion on a phone and with `prefers-reduced-motion`; keyboard focus and AA contrast; alt text, title and meta; an absolute `og:image` so the link shows a photo on WhatsApp; `noindex` on unsigned prospect demos; every rule in the Marketing-site floor; compare with the approved option and the previous round.
- Targeted change: screenshots at 390 and 1280 plus the console.
- Lighthouse runs locally without compression and swings about 10 points: report the median of 3. On `noindex` demos the `is-crawlable` audit fails by design; report SEO without it. It can also run against the Cloudflare preview (real CDN and compression), where `is-crawlable` fails for every site because of the preview's `noindex` header.
- The test Chromium has no H.264: ship WebM next to every MP4. Video: local HyperFrames CLI plus ffmpeg (see `sitios/faro/video-src/README.md`).
- Forms: Faro uses FormSubmit (address in `config.js`; the first real send triggers an activation email). Test with `page.route('**/formsubmit.co/**', ...)`, never a real send. Mareas' form opens WhatsApp.
- Screenshots go to `/mnt/project-files/capturas/<client>/<round>/`, never into the repo.

## Lessons learned
One line each: `- YYYY-MM-DD: rule (why)`. Propose it in the thread first; it lands with that thread's PR, and Rafa's merge approves it.
