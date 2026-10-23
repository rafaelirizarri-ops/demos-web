# CONPAV: design

The source of truth for `sitios/conpav`. Read it before editing the site and update it in the same PR.

## Concept: "lo que queda adentro" (what ends up inside)

Civil works are judged by what the concrete ends up covering: the mesh, the rebar, the bridge footing, the drain under the road. Most of CONPAV's work is exactly that: slopes, drainage, footings and walls. The site shows the finished surface and lets you see what holds it up.

- The canvas is finished concrete.
- The type is road-sign lettering (Barlow).
- The orange is the logo's, the same as a traffic cone on site, and it only marks the action.
- The signature gesture opens the concrete.

If a decision is not about the finished surface or what holds it, it goes.

## Content rule

- Nothing that is not confirmed gets written: no placeholder text, no filler, no invented figures.
- Each work is named only by its main work (at most eight words), with its department and year. No clients, amounts, scope, people or place names below the department.
- No people's names, no team, no portraits. The site speaks only about the company.
- Voice: sober, "usted", Spanish of El Salvador, sentence case everywhere.

## Signature gesture: "la cala"

On site, a *cala* is an inspection opening cut to see what is inside a wall or a pavement. On the page, a fixed frame shows a finished slope; as you scroll, a rectangle opens in its face and shows the slope from inside (mesh, drain pipes, shotcrete half applied) until it fills the frame. It is a before and after told backwards: first the finished work, then how it was made.

- **Photos:** `slope-finished` ("Terminado", source `d5e11b89`, crop `[640, 0, 800, 1000]`) and `slope-mesh` ("Por dentro", source `6ecce5f7`, crop `[360, 250, 840, 1050]`, blue channel −7 % so both concretes match). Both are 4:5, and the frame is never wider than 640 CSS px.
- **Opening:** the inside photo sits on top, cut with `clip-path` from `inset(32% 34% 52% 46%)` to `inset(0)`, with a 1 px edge in the canvas colour.
- **Scroll split:** 0–15 % finished, 15–75 % the opening grows, 75–100 % inside. The frame is sticky inside a 220vh track (160vh on phones), only when the window is 640 px tall or more.
- **Timeline:** `view-timeline: --cala block` on `.cala__track`, `animation-range: contain 0% contain 100%`. Never `view()` on an element inside the sticky stage: its progress freezes while the stage is pinned. Without view timelines, `main.js` writes `--t` from a `requestAnimationFrame` loop with the same split.
- **Labels:** "Terminado" sits on the base photo; "Por dentro" rides the opening's top-left corner on a frame-sized layer moved only with `transform`. Both are solid dark blocks.
- **Controls:** two real buttons under the frame ("Terminado", "Por dentro"), `aria-pressed` flips at 50 %. With the sticky frame they scroll to each end of the track; in windows under 640 px tall they open and close the cut with a 600 ms `clip-path` transition, and the frame shrinks to fit the window.
- **Without JS or with reduced motion:** a static diptych, side by side from 768 px and stacked on phones, each photo with its label, no buttons.
- Photos are never mirrored, stretched or filled with AI to make them line up.
- The section ships when the photo pair is confirmed as the same slope. The CSS and JS are already in place; without `#cala` they do nothing.

## Palette A "Obra real"

Measured from the company's own photos: the pavement (`#A7A297`) lightened for the canvas, the shotcrete (`#D2D2CE`) for reference. Around 95 % neutrals and one action colour.

The orange comes from the logo. `#F28C6A` is the median measured on scanned print; there is no original file, so the redrawn logo is the logo and this value stands.

Components read roles, never raw colours. Each section declares `data-tone="light"` or `data-tone="dark"`, and the tokens are re-scoped inside each tone. Contrast (WCAG 2.x) is given on `--bg` / `--bg-2` of the same tone.

| Token | Light | Contrast | Dark (asphalt) | Contrast |
|---|---|---|---|---|
| `--bg` / `--bg-2` | `#E9E5DD` / `#DCD7CD` | — | `#1E1D1A` / `#2A2925` | — |
| `--fg` | `#1E1D1A` | 13.42 / 11.75 | `#EEEAE2` | 14.05 / 12.13 |
| `--fg-2` | `#4A463F` | 7.47 / 6.54 | `#BEB8AD` | 8.55 / 7.38 |
| `--fg-3` | `#5C574E` | 5.71 / 5.00 | `#9C968B` | 5.74 / 4.96 |
| `--line` | `#C9C3B7` | decorative | `#3A3833` | decorative |
| `--control` | `#7A746A` | 3.69 / 3.23 | `#7E786E` | 3.85 / 3.33 |
| `--field` | `#E9E5DD` | — | `#2A2925` | — |
| `--action` / `--action-fg` | `#F28C6A` / `#1E1D1A` | text 7.01 | same | text 7.01 |
| `--action-hover` | `#F59E80` | text 8.09 | same | text 8.09 |
| `--action-edge` | 2 px inset `#1E1D1A` | the fill alone is 1.91 | none | 7.01 / 6.06 |
| `--focus` | `#1E1D1A` | 13.42 / 11.75 | `#F28C6A` | 7.01 / 6.06 |
| `--error` | `#A3261B` | 5.86 / 5.14 | `#FF9C8A` | 8.33 / 7.19 |

- On light bands the orange button carries an inner ink edge, like the black outline of the globe in the logo.
- The orange is never text, never a thin line on light, never a section background, and fills at most one button per screen.
- The WhatsApp float is asphalt (`#1E1D1A`, glyph `#EEEAE2`, 2 px ring `#E9E5DD`), not WhatsApp green: a white glyph on green is 1.98:1.

**Bands**, alternating at full bleed:

| Section | Tone |
|---|---|
| Portada, Obras | light `--bg` |
| Qué hacemos, Empresa | light `--bg-2` |
| La cala, Turno de noche, Contacto, footer | dark |

The two alternatives shown in round 1 were B "Turno de noche" (the whole page in night asphalt, the cala in light) and C "Plano técnico" (plan paper, plotter ink, dimension lines in the cala, orange only in the logo).

## Type

**Barlow** for text and **Barlow Semi Condensed** for headings, facts and buttons. Barlow (Jeremy Tribby, 2017) comes from California's public signage: plates, road signs, buses. It is the lettering of the finished surface. The semi-condensed cut fits long technical words ("Estabilización") on a 350 px phone line at 44 px.

The logo keeps its own letters and is never imitated with a wide font.

Files are copied to `assets/fonts/` from `@fontsource/barlow@5.3.0` and `@fontsource/barlow-semi-condensed@5.3.0`, byte-identical to Google Fonts, under OFL-1.1 (`assets/fonts/OFL.txt`):

- Barlow 400: body, leads, captions, fields.
- Barlow 500: nav, form labels, `strong`.
- Semi Condensed 500: `h1` to `h3`, facts, the works list.
- Semi Condensed 600: buttons and cala labels.

Each weight comes as a `latin` and a `latin-ext` file. Only Semi Condensed 500 and Barlow 400 latin are preloaded.

`font-display: swap` with metric-matched fallbacks (`size-adjust` and overrides on Arial/Liberation/Roboto) so lines break the same while the fonts load. No weight of 700 or more, no italics, `font-synthesis: none`.

| Role | Face | 390 → 1440 px | Line height | Tracking |
|---|---|---|---|---|
| `h1` | SC 500 | 44 → 88 | 1.0 | −0.015em |
| `h2` | SC 500 | 36 → 64 | 1.05 | −0.01em |
| `h3` | SC 500 | 28 → 40 | 1.1 | −0.005em |
| Lead | Barlow 400 | 20 → 22 | 1.4 | 0 |
| Body | Barlow 400 | 17 → 18 | 1.55 | 0 |
| Fact values, works list | SC 500, tabular | 18 → 20 | 1.3 | 0 |
| Button | SC 600 | 18 | 1 | +0.01em |
| Nav, form labels | Barlow 500 | 16 | 1.2 | 0 |
| Caption | Barlow 400 | 15 | 1.45 | 0 |
| Fact labels, credit, cala labels | SC 500/600 | 14 | 1.3 | +0.01em |

Sizes use `clamp()` in `rem + vw` so zoom still works. Measure `46ch`. Nothing under 14 px; fields at 17–18 px so iOS does not zoom.

**Spanish rules:**

- **Accents on capitals:** capital accents climb to about 0.89 em in the semi-condensed display. Display line height never goes under 1.0, and a heading whose second or later line starts with Á, É, Í, Ó, Ú or Ñ gets `.t-acento` (1.12) or is rewritten.
- **Hyphenation and wrapping:** `hyphens: auto` only in paragraphs, lists and captions under 768 px. `text-wrap: balance` on headings and `pretty` on paragraphs. A no-break space after one-letter words in headings (`y&nbsp;carreteras`).
- **Dates:** years only, with an unspaced en dash for ranges (2019–2020), each in `<time>`.
- **Names and numbers:** "S.A. de C.V." never breaks. Phone numbers are written `7227-7828` and never break.

## Grid, space, shape

- Columns: 12 from 1024 px, 8 on tablets, 4 on phones. Gutter 24 px (16 on phones), side margin `clamp(20px, 5vw, 80px)`, text at most 1280 px wide; photos may run to the edge of their side.
- Space: 8 px unit; scale 8 · 16 · 24 · 32 · 48 · 64 · 96 · 128. Sections are `clamp(72px, 10vw, 128px)` apart.
- Radius: 0 on photos, bands, labels and the table (concrete edges); 4 px on buttons, fields and focus; round only on the WhatsApp float.

## Photos

- All photos are the company's own. The layout is built on tall frames in columns that reach the edge, not on full-screen panoramas: most source photos are portrait and none is over 1600 px.
- **Sharpness:** no photo is shown wider than its source width ÷ 1.25.
- **Allowed corrections:** white balance using the concrete as a grey card, and soft levels (0.5 / 99.5 percentiles) on hazy shots. Nothing else: no saturation, HDR, LUTs, black and white, grain, object removal or AI upscaling. Night shots keep their night.
- **Crops** remove date stamps, burnt skies, legible plates and signs, and recognisable faces.
- **People:** crews at work may appear, but no face is recognisable at 100 % in the widest file and no uniform shows legible letters or logos.
- **Pipeline:** `media-src/images.mjs` (sharp 0.34.4) reads `media-src/photos.json` and writes AVIF, WebP and a JPEG fallback per crop: `-d` desktop, `-m` phone, `-t` thumbnail.

| Use | File | Source | Crop `[x, y, w, h]` | Max CSS width |
|---|---|---|---|---|
| Portada | `road-concrete-pour` | `909d1178` | `[0, 50, 1200, 1500]` | 960 |
| Thumbnail, `og:image`, under the cala | `slope-street` | `492d2f0b` | d `[0, 133, 1600, 1067]`, m `[240, 0, 960, 1200]`, t `[80, 160, 1200, 800]`, og `[0, 300, 1600, 840]` | 1280 |
| Bases de puente sobre río | `bridge-footings` | `5efec4c1` | d `[0, 290, 1128, 752]`, m `[150, 200, 800, 1000]` | 902 |
| Protección de talud | `retaining-wall-formwork` | `b4dc9b55` | `[252, 0, 896, 1120]` | 640 |
| Tanque de agua potable | `tank-wall` | `831d2cc5` | d `[0, 0, 800, 533]`, m `[60, 0, 480, 600]` | 640 |
| Turno de noche | `footbridge-night` | `eeb12f89` | d `[0, 110, 1176, 784]`, m `[268, 24, 908, 1135]` | 940 |
| La cala | `slope-finished`, `slope-mesh` | see the cala | — | 640 |

## Motion

Sober, like concrete settling: it decelerates and never bounces. Only `transform`, `opacity` and `clip-path` animate, with easing `cubic-bezier(.2, .7, .2, 1)`.

- **La cala:** tied to scroll, no inertia.
- **"Colado":** the main photo of each work block fills from the bottom up, like concrete filling formwork: `clip-path: inset(100% 0 0 0)` → `inset(0)`, 700 ms, once, when 20 % is visible. Thumbnails, the table and the portada never animate.
- **Text:** section titles and leads rise 12 px and fade in over 400 ms, 60 ms apart. Never letter by letter.
- **Interface:** hover and focus in 160–200 ms; the header's bottom line appears after 8 px of scroll.
- **Never:** scroll-smoothing libraries, parallax, Ken Burns, counters, marquees, custom cursors, magnetic buttons, autoplay carousels.
- **`prefers-reduced-motion: reduce`** turns all of it off: no reveals, the cala is the diptych, no smooth scrolling.
- **Without JS** everything is visible: `.js` and `.js-motion` are set before first paint.

## Components

- **Focus:** a 3 px ring in `--focus`, 3 px offset, 4 px radius, on everything focusable.
- **Header:** sticky, `--bg`, 64 px tall (72 on desktop), logo left, nav in Barlow 500 16 px `--fg-2` that turns `--fg` with a 2 px underline on hover and on the current section. Below 1024 px a 44 × 44 menu button opens a full-screen dark menu with "Escribir por WhatsApp" at the bottom. Escape closes it and focus stays inside.
- **Button pair (portada):** 52 px tall, SC 600 18 px, no arrows.
  - Primary: `--action` fill, `--action-fg` text, `--action-edge`, and the monochrome WhatsApp glyph inline.
  - Secondary: transparent with a 2 px `--fg` edge, `--bg-2` on hover.
  - Every "Pedir cotización" points to `#contacto`.
- **Service row:** `h3`, technical line in `--fg`, plain line in `--fg-2`, a "Ver obra" link when a block exists, and a 160 px 3:2 thumbnail from 1024 px. Thin rules between rows; no cards, no icons.
- **Work block:** photo on 7 columns out to the edge, fact card on 5 with `h3` and a `<dl>` between `--line` rules; the zigzag flips on every other block.
- **Works list:** a real `<table>` named by its `h3`, `<th scope="col">`, rows of at least 56 px. Year in tabular figures, work in SC 500 20 px, department in `--fg-2`. On phones each row becomes two lines (year and department, then the work).
- **Contact:** channels as large links (28–32 px) with a small label above and at least 48 px of target. The form has visible labels above the fields, a `--field` background with a 1 px `--control` edge, and errors in `--error`. Errors show on submit and then on leaving each field, never while typing. It posts to FormSubmit by `fetch`; if that fails, a WhatsApp link carries what was typed. Without JS it posts normally to `gracias.html`.
- **Footer:** follows Contact's tone after a thin rule: stacked logo, legal name, "San Salvador, El Salvador", nav and "Sitio por Faro" at 14 px `--fg-3`. No copyright year.
- **WhatsApp float:** 56 px circle, bottom right at 20 px plus the safe area. It appears after leaving the portada and hides while Contact is on screen or the menu is open.

## Logo

- The company's existing mark, redrawn as SVG over a 300 dpi scan: same curves, same proportions, two flat colours (`#F28C6A` and ink as `currentColor`).
  - Horizontal version (globe left, CONPAV right) for the header at 30 px tall.
  - Stacked version for the footer.
  - The globe alone for the favicon and touch icon.
- On dark bands the ink turns into the dark tone's `--fg`; the orange stays.
- "S.A de C.V." is left out of the mark on the web because it cannot be read at 30 px; the full legal name is in the footer.
- Never add helmets, cranes, cones, gears, buildings, perspective roads, bricks, wrenches, shields, hexagons or gradients. No new or "improved" version without the company's approval.

## What each reference gave

- **Squarespace:** full-bleed bands that alternate light and dark (here, concrete and asphalt) and radii with intent.
- **Awwwards:** achromatic discipline with one functional accent, and paired buttons.
- **Apple:** a change of band instead of borders or shadows, and facts as text, not pills.
- **Jesko Jets:** the real beats the illustrated, slow motion, and the thin technical line (the cala's edge).
- **Dala:** one gesture the whole page serves, and one accent.

## Don't

- Construction stock (hard hat on blueprints, handshakes, engineer with tablet), 3D renders, machinery illustrations, emoji.
- Gradients, hazard-tape stripes, concrete or rust textures, glass effects, big shadows.
- Stencil, military or grunge lettering; Bebas or Impact in caps.
- Hero with three icon cards, Mission / Vision / Values, an icon per service, uppercase eyebrows, decorative "01 / 02" numbering.
- Animated counters, ISO or safety seals, testimonials, client logos.
- Hero sliders, dark overlays on photos to carry text, parallax.

## Engineering notes

- Plain HTML, CSS and JS; no build step. `main.js` is about 14 KB unminified and does nothing that the page needs to be readable.
- Fonts and every asset are self-hosted under `assets/`.
- While it lives on the faro-demos Worker the whole folder is `noindex` through `sitios/_headers` (`X-Robots-Tag`). `gracias.html` and `404.html` also carry `<meta name="robots" content="noindex">`.
- The Worker answers any missing path under `/conpav/`, however deep, with `404.html`, so that page uses root-relative `/conpav/` paths; the other pages stay relative. On the client's own domain, `/conpav/` becomes `/` there and in the absolute URLs (`og:url`, `og:image`, JSON-LD `url`, the form's `_next`).
- JSON-LD is a hand-written `Organization` with confirmed data only, including `openingHoursSpecification` for Monday to Friday 08:00–17:00 and Saturday 09:00–15:00.
