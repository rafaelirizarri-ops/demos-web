# demos-web

Static demo sites that Faro, a small web agency in Panama, builds for prospects before they sign, plus Faro's own site. The working rules live in the project Instructions; this file holds the repo facts.

## Structure
- `sitios/<client>/` is one independent site in plain HTML/CSS/JS. There is no build, lint or test step. The only package.json files are tools: `sitios/faro/video-src/faro-3d` (renders a video) and `sitios/conpav/media-src` (sharp, generates the image crops; `node_modules/` is ignored).
- Sites and status (update when one signs): `faro` (Faro's own site, indexed), `mareas` (fictional sample; the footer says so), `orthox` (prospect demo), `sen-vietnam` (prospect demo), `conpav` (client site in progress; `noindex` by header in the root `netlify.toml` while it lives on demos-webs, its own domain comes later).
- `sitios/<client>/DESIGN.md` is that site's design source of truth. Read it before editing and update it in the same PR. faro and conpav have one so far.
- Code lives only in this repo. The folders under `/mnt/project-files/sitios/` are old copies: never edit them.
- Everything under `sitios/` is public on the internet, DESIGN.md and video sources included.

## Deploy
- The Netlify site `demos-webs` publishes all of `sitios/` (root `netlify.toml`: `publish = "sitios"`, `command = ""`). Merging any PR republishes every demo at `https://demos-webs.netlify.app/<client>/`. Merge only with Rafa's explicit OK, as a squash merge with the PR title as the commit title.
- PR preview: `https://deploy-preview-<N>--demos-webs.netlify.app/<client>/`, status check `netlify/demos-webs/deploy-preview`. The second project, `demos-web` (no s), is a duplicate: ignore it.
- Per-site `netlify.toml` files (orthox, mareas, sen-vietnam) are only read by a client's own Netlify project; demos-webs ignores them.
- Follow-up after a thread's PR is merged: `git fetch origin main && git checkout -B <branch> origin/main && git push --force-with-lease -u origin <branch>`.

## Cloud container limits
- Blocked: `*.netlify.app`, `api.netlify.com`, `formsubmit.co`, CDNs (unpkg, jsdelivr, cdnjs), Unsplash, Instagram and its CDN, Google Maps and its image hosts, Fresha, Degusta, and most reference sites. npm and Google Fonts work.
- Self-host fonts and libraries in `sitios/<client>/assets/`.
- Text from blocked sites: WebSearch or WebFetch. Photos, downloads and screenshots of blocked sites: Playwright on Rafa's computer when it is connected (folder `~/Documents/websites`), or ask Rafa.

## QA
```
python3 -m http.server 8765 -d sitios &   # http://localhost:8765/<client>/, same shell call as the test
node check.cjs                            # Playwright via require() (CommonJS), browsers in /opt/pw-browsers
CHROME_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome npx -y lighthouse@13.5.0 \
  http://localhost:8765/<client>/ --only-categories=performance,accessibility,seo \
  --chrome-flags="--headless=new --no-sandbox" --output=json --output-path=<scratchpad>/lh.json --quiet
```
- Full checklist (improvement or new site): screenshots at 390, 768, 1280 and 1440; no console errors, broken links or missing files; nothing overflows; motion on a phone and with `prefers-reduced-motion`; keyboard focus and AA contrast; alt text, title and meta; an absolute `og:image` so the link shows a photo on WhatsApp; `noindex` on unsigned prospect demos; compare with the approved option and the previous round.
- Targeted change: screenshots at 390 and 1280 plus the console.
- Lighthouse runs locally without compression and swings about 10 points: report the median of 3. On `noindex` demos the `is-crawlable` audit fails by design; report SEO without it.
- The test Chromium has no H.264: ship WebM next to every MP4. Video: local HyperFrames CLI plus ffmpeg (see `sitios/faro/video-src/README.md`).
- Forms: Faro uses FormSubmit (address in `config.js`; the first real send triggers an activation email). Test with `page.route('**/formsubmit.co/**', ...)`, never a real send. Mareas' form opens WhatsApp.
- Screenshots go to `/mnt/project-files/capturas/<client>/<round>/`, never into the repo.

## Lessons learned
One line each: `- YYYY-MM-DD: rule (why)`. Propose it in the thread first; it lands with that thread's PR, and Rafa's merge approves it.
