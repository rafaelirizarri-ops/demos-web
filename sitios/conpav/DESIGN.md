# CONPAV: design

The source of truth for `sitios/conpav`. Read it before editing the site and update it in the same PR.

Round 3 (2026-10-25) replaced the round 2 world ("lo que queda adentro", a site about slopes). CONPAV is a general civil engineering firm, and the site now speaks to whoever hires one.

## Concept: "plano de luz" (a plan drawn in light)

The company has eighteen works in eight departments since 2011, but few photos, and none of them shows a work whole. So the page explains what it does with a drawing that reads as a drawing, and proves it with what is real: the list of works, the map, the company facts and the photos it has.

- The ground is graphite, like a plan on a dark screen; the light is the site's paper.
- The drawing is one example structure in points of light: a road that crosses a river on a bridge, the river held by walls, a cut slope where the road meets a hill, a building going up on the hilltop. It is never a work of the company and never carries a figure or a name.
- The orange is the logo's. In the drawing it marks the area being explained; on the page it marks the action.
- Proof sits next to the claim: "18 obras" is followed by the eighteen works, "8 departamentos" by the map.

If a decision does not help a contracting entity, a builder or a developer decide to call, it goes.

## Content rule

- General civil engineering: carreteras, puentes, obras hidráulicas, estabilización, edificación. Never "nos especializamos en…": no area is presented as the company's only trade.
- Written for entidades contratantes, constructoras (the company offers to work as their subcontractor), desarrolladores inmobiliarios, and empresas y particulares.
- Nothing that is not confirmed gets written: no placeholder text, no filler, no invented figures. Every figure counts from 2011.
- Each work is named only by its main work (at most eight words), with its department and year. No clients, amounts, scope, people or place names below the department. Two works have no published department: their cell says "—" (read as "Sin dato").
- Building is current work, so Edificación is an area with one work done (housing, 2016), never a showcase.
- "Equipo propio" is confirmed and listed in the company facts.
- No people's names, no team, no portraits, no kinship. The site speaks only about the company.
- Voice: sober, "usted", Spanish of El Salvador, sentence case everywhere.

## Image rule

Real client references first, but quality first: never fake proof.

- A real photo is used when it holds up at its displayed size. It is captioned by its work, department and year only when the company confirms the pairing; otherwise by its type of work.
- When there is no good photo, an illustration explains the kind of work, and it must read as an illustration (points of light, plans, a diagram). It is never captioned or placed as one of the company's works.
- Never an AI-made or AI-retouched photo presented as a real work.
- Real photos and drawings are never mixed in the same list: the works list has no images, the photos live together in "En obra", the drawing lives in the portada.

## Signature gesture: the portada of points

One structure in points of light, with real depth, that the scroll moves through area by area. `hero3d.js`, plain WebGL 1, no library.

- **The scene** (world units, the road along x): ground drawn as scan lines that fade out into the dark; a river channel between two stepped gabion walls with water that flows; a bridge of 80 units (deck, three girders, railings, two piers of two columns); the road on both sides, through a cut slope with mesh, soil nails and a toe wall; a five-storey frame on the hilltop, the top floor columns only. About 37 000 points on large screens, 26 000 on phones.
- **Light:** every point is lit by a light from the upper left and sized by depth, and points add up (additive blending), so lines read solid and far points fade.
- **Arrival:** the structure assembles in building order (ground, river, piers, deck, road, slope, building floor by floor) in 2.8 s, while the title and the offer arrive.
- **Ambient:** each point twinkles at its own pace, a few blink off, a slow band of light sweeps across and the camera drifts a little; at most 30 frames a second. "Pausar animación" stops all of it (WCAG 2.2.2), and it also rests while the pointer is on the text or keyboard focus is in the portada.
- **Scroll:** the portada is 360 % of a screen tall and its drawing stays put (`position: sticky`) while the camera travels along a smooth path through five stops, lingering at each: Puentes (18 %), Obras hidráulicas (36 %), Carreteras (53 %), Estabilización (70 %), Edificación (86 %). The area in view turns orange and the rest dims; at both ends the whole structure is lit, warm. Five bars under the drawing fill on the way to each stop and name the one in view. The offer fades and rises out as the tour begins. Nothing takes the scroll: it only reads it.
- **Layout:** the structure keeps to the space the text leaves (to its right on wide screens, under it on tall ones) and the points behind the text dim to 15 %.
- **Without WebGL or JS:** a still of the opening frame (`assets/img/dots-hero-d-1600`, `-m-800`), made by `media-src/dots/stills.cjs`. With reduced motion: the finished structure, still, no tour.
- **Without a GPU** (software rendering, which is what lab tests like Lighthouse use): no assembly and no twinkle, and it draws only when the scroll moves the camera. Every frame there costs the main thread.

## Palette

Graphite, paper and the logo's orange, with steel for the quietest text (round 3, from Rafa's pick: `#F5F4F0`, `#292D32`, `#E87532` and `#A8ADB0`). The orange stays the logo's `#F28C6A` instead of `#E87532`, so the button and the mark match. About 95 % neutrals.

Components read roles, never raw colours. Each section declares `data-tone="light"` or `data-tone="dark"`, and the tokens are re-scoped inside each tone. Contrast (WCAG 2.x) is given on `--bg` / `--bg-2` of the same tone.

| Token | Light (paper) | Contrast | Dark (graphite) | Contrast |
|---|---|---|---|---|
| `--bg` / `--bg-2` | `#F5F4F0` / `#EBE9E3` | — | `#292D32` / `#32373D` | — |
| `--fg` | `#292D32` | 12.59 / 11.41 | `#F5F4F0` | 12.59 / 10.91 |
| `--fg-2` | `#4E535A` | 7.04 / 6.39 | `#C5C9CC` | 8.31 / 7.20 |
| `--fg-3` | `#5F646A` | 5.42 / 4.92 | `#A8ADB0` (steel) | 6.12 / 5.30 |
| `--line` | `#D6D4CD` | decorative | `#41474E` | decorative |
| `--control` | `#7A7F85` | 3.67 / 3.33 | `#8A9096` | 4.30 / 3.72 |
| `--field` | `#F5F4F0` | — | `#32373D` | — |
| `--action` / `--action-fg` | `#F28C6A` / `#292D32` | text 5.76 | same | text 5.76 |
| `--action-hover` | `#F59E80` | text 6.65 | same | text 6.65 |
| `--action-edge` | 2 px inset `#292D32` | the fill alone is 2.18 | none | 5.76 / 4.99 |
| `--focus` | `#292D32` | 12.59 / 11.41 | `#F28C6A` | 5.76 / 4.99 |
| `--error` | `#A3261B` | 6.69 / 6.07 | `#FF9C8A` | 6.84 / 5.93 |

- The orange is never text on paper, never a section background, and fills at most one button per screen. In the drawing and the map it is light, not ink.
- The WhatsApp float is graphite with a paper glyph and a 2 px paper ring, not WhatsApp green (a white glyph on green is 1.98:1).
- The header takes the tone of the section under it.

**Bands**, at full bleed:

| Section | Tone |
|---|---|
| Portada, Experiencia | dark |
| Qué hacemos, Obras realizadas, Empresa | light `--bg` |
| Para quién | light `--bg-2` |
| En obra, Contacto, footer | dark |

## Type

**Barlow** for text and **Barlow Semi Condensed** for headings, figures and buttons. Barlow (Jeremy Tribby, 2017) comes from California's public signage: plates, road signs, buses. The semi-condensed cut fits long technical words ("Estabilización") on a 350 px phone line.

The logo keeps its own letters and is never imitated with a wide font.

Files are copied to `assets/fonts/` from `@fontsource/barlow@5.3.0` and `@fontsource/barlow-semi-condensed@5.3.0`, byte-identical to Google Fonts, under OFL-1.1 (`assets/fonts/OFL.txt`): Barlow 400 and 500, Semi Condensed 500 and 600, each as `latin` and `latin-ext`. Only Semi Condensed 500 and Barlow 400 latin are preloaded. `font-display: swap` with metric-matched fallbacks, so lines break the same while the fonts load. No weight of 700 or more, no italics, `font-synthesis: none`.

| Role | Face | 390 → 1440 px | Line height |
|---|---|---|---|
| `h1` | SC 500 | 40 → 80 | 1.0 |
| Figures (2011, 18, 8) | SC 500, tabular | 56 → 112 | 0.9 |
| `h2` | SC 500 | 36 → 64 | 1.05 |
| `h3` | SC 500 | 24 → 32 | 1.15 |
| Lead | Barlow 400 | 20 → 22 | 1.4 |
| Body | Barlow 400 | 17 → 18 | 1.55 |
| Fact values, works list | SC 500, tabular | 18 → 20 | 1.3 |
| Contact channels | SC 500 | 28 → 32 | 1.2 |
| Button | SC 600 | 18 | 1 |
| Nav, labels | Barlow 500 | 16 | 1.2 |
| Caption, map labels, tour names | Barlow 400–500 | 14–15 | 1.3–1.45 |

Sizes use `clamp()` in `rem + vw` so zoom still works. Measure `46ch`. Nothing under 14 px; fields at 17–18 px so iOS does not zoom.

**Spanish rules:** display line height never under 1.0 (capital accents); `hyphens: auto` only in body text under 768 px; `text-wrap: balance` on headings and `pretty` on paragraphs; a no-break space after one-letter words in headings and inside "El Salvador" and "desde 2011"; years only, with an unspaced en dash for ranges (2019–2020), each in `<time>`; "S.A. de C.V." and phone numbers (`7227-7828`) never break.

## Grid, space, shape

- Columns: 12 from 1024 px, 8 on tablets, 4 on phones. Gutter 24 px (16 on phones), side margin `clamp(20px, 5vw, 80px)`, text at most 1280 px wide.
- Space: 8 px unit; sections `clamp(72px, 10vw, 128px)` apart.
- Radius: 0 on photos, bands and the table; 4 px on buttons, filters, fields and focus; round only on the WhatsApp float.

## The other dot drawings

Everything drawn is drawn in the portada's language: round dots on a grid, paper on graphite, orange for what matters.

- **Map** (`media-src/dots/map-dots.mjs`): El Salvador as 1319 dots, 66 across, one `<path>` per department of zero-length round-capped segments (8.9 KB inline). The eight departments with works light up in orange, from La Unión to Sonsonate, as the map enters, and get a label. Labels hide under 768 px; the caption lists the eight departments in words. Outline: Natural Earth admin-1 via datamaps 0.5.9 (MIT).
- **Area glyphs** (`media-src/dots/glyphs.mjs`): five 16 × 16 drawings in dots, one per area, as an SVG sprite, used in Qué hacemos, the filters and the works list. Always `aria-hidden`; the area name is always written next to them.

## Photos

All photos are the company's own, shown together in "En obra" ("Fotos tomadas por la empresa durante la construcción") in balanced columns (1, 2 or 3). The works list carries no images.

- **Sharpness:** no photo is shown wider than its source width ÷ 1.25.
- **Allowed corrections:** white balance using the concrete as a grey card, and soft levels (0.5 / 99.5 percentiles) on hazy shots. Nothing else: no saturation, HDR, LUTs, black and white, grain, object removal or AI upscaling. Night shots keep their night.
- **Crops** remove date stamps, burnt skies, legible plates and signs, and recognisable faces. Crews may appear, but no face is recognisable at 100 % in the widest file and no uniform shows legible letters or logos.
- **Pipeline:** `media-src/images.mjs` (sharp 0.34.4) reads `media-src/photos.json` and writes AVIF, WebP and a JPEG fallback.

| Caption | File | Source | Crop `[x, y, w, h]` | Widths |
|---|---|---|---|---|
| Estabilización de talud | `slope-street` | `492d2f0b` | `[0, 133, 1600, 1067]` | 480, 800, 1200 |
| Protección de talud · La Unión · 2019–2020 | `retaining-wall-formwork` | `b4dc9b55` | `[252, 0, 896, 1120]` | 480, 800 |
| Pasarela peatonal · San Salvador · 2021–2022 | `footbridge-night` | `eeb12f89` | `[0, 110, 1176, 784]` | 480, 800 |
| Estabilización de talud, en construcción | `slope-mesh` | `6ecce5f7` | `[360, 250, 840, 1050]`, blue −7 % | 480, 800 |
| Bases de puente sobre río · Morazán · 2019 | `bridge-footings` | `5efec4c1` | `[0, 290, 1128, 752]`, levels | 480, 800 |
| Tanque de agua potable · 2020 | `tank-wall` | `831d2cc5` | `[0, 0, 800, 533]`, levels | 480, 800 |
| Pavimento de concreto recién colado | `road-concrete-pour` | `909d1178` | `[0, 275, 1200, 800]` | 480, 800 |

## Motion

Level 2: GSAP 3.15 with ScrollTrigger and SplitText, and Lenis 1.3.26 for smooth scrolling, all self-hosted in `assets/js/`. Sober, like concrete settling: it decelerates (`expo.out`) and never bounces. Only `transform`, `opacity` and `clip-path` animate on the page.

- **Smooth scroll:** Lenis (`lerp: 0.1`) wired to ScrollTrigger and the GSAP ticker. It only eases the visitor's own scroll: no snapping, no jumps, anchors glide to their section. Off with reduced motion and while the menu is open.
- **Logo intro:** once per session, before the page (see Logo).
- **Portada:** the structure assembles; without the intro the title rises line by line out of a mask (1.1 s, 80 ms apart); the lead and the buttons rise 20 px and fade in; the tour bars fade in last. With the intro the title is already there under the paper.
- **The scroll tour:** the signature gesture, above.
- **Section titles** rise line by line out of a mask, once; the split is undone when they land. Leads rise and fade. Never letter by letter.
- **Lists arrive as lists:** figures, areas, clients, the works rows, facts and photos, 70 ms apart. Opacity only, never visibility, so links and fields waiting to arrive stay in the tab order.
- **Figures:** "18" counts up once from 0 (1.6 s). It is the only counter, and it counts a real number.
- **Map:** the worked departments light up from east to west, then their labels.
- **Filters:** the rows that stay rise in quickly (0.5 s).
- **Never:** scroll-jacking (snapping between sections, wheel turned into jumps, a page locked until an animation ends), parallax on photos, marquees, custom cursors, magnetic buttons, autoplay carousels.
- **`prefers-reduced-motion: reduce`:** no intro, no GSAP motion, no Lenis, the drawing still.
- **Without JS** everything is visible. `.js-motion` hides only the starting states and is set before first paint; `main.js` removes it if GSAP is missing, and if `main.js` never runs a CSS failsafe shows everything after 4 s (the intro after 9 s).

## Components

- **Focus:** a 3 px ring in `--focus`, 3 px offset, 4 px radius, on everything focusable. The skip link is an orange block.
- **Header:** sticky, 64 px tall (72 on desktop), logo left, nav (Qué hacemos, Para quién, Obras, Empresa, Contacto) in Barlow 500 16 px that marks the current section with a 2 px underline. It takes the tone of the section under it. Below 1024 px a 44 × 44 button opens a full-screen dark menu with "Escribir por WhatsApp" at the bottom; Escape closes it and focus stays inside.
- **Portada:** the drawing fills the screen under the header. The text sits left on wide screens (at most 48 vw) and on top on phones: `h1` "Ingeniería civil en todo El Salvador, desde 2011", a lead naming the five areas and the clients, and the button pair. Under the drawing, the tour bars and the pause button (a visually hidden label on phones).
- **Button pair:** 52 px tall, SC 600 18 px, no arrows. Primary: orange fill, graphite text, the WhatsApp glyph, the ink edge on paper. Secondary: transparent with a 2 px `--fg` edge.
- **Experiencia:** `h2`, lead "Obra pública y privada desde 2011, de La Unión a Sonsonate.", four figures in a `<dl>` (Desde 2011, Obras realizadas 18, Departamentos 8, Clientes: Entidades públicas y privadas), then the map.
- **Qué hacemos:** lead "Cinco áreas de la ingeniería civil, con equipo propio." One row per area: glyph, `h3`, one plain line, and a link "N obras realizadas" that filters the works list. Thin rules between rows; no cards.
- **Para quién:** four columns under a rule, each an `h3` and one line.
- **Obras realizadas:** filter buttons (Todas 18 and one per area with its count, `aria-pressed`, the count announced in a live region), then a real `<table>`: year, work, area (glyph and short name), department. On phones each row becomes three lines.
- **En obra:** the seven photos in columns, each with its caption.
- **Empresa:** one paragraph and the facts as a `<dl>`: razón social, actividad, sede, desde, obras en, equipo propio.
- **Contact:** channels as large links with a small label above. The form: nombre, empresa o entidad (optional), tipo de cliente (optional), teléfono o WhatsApp, correo (optional), tipo de obra (the five areas or "Otra"), departamento, and the message. Errors show on submit and then on leaving each field, never while typing; a message that clears on leaving a field keeps its line, invisible, until the next send, so the button never moves out from under a click. It posts to FormSubmit by `fetch`; if that fails, a WhatsApp link carries what was typed. Without JS it posts normally to `gracias.html`.
- **Footer:** stacked logo, legal name, "San Salvador, El Salvador", nav and "Sitio por Faro". No copyright year.
- **WhatsApp float:** 56 px circle, bottom right. It appears after the portada and hides over Contact or while the menu is open.

## Logo

- The company's existing mark, redrawn as SVG over a 300 dpi scan: same curves, same proportions, two flat colours (`#F28C6A` and ink as `currentColor`). Horizontal version for the header (its globe and letters are two groups, for the intro), stacked for the footer, the globe alone for the favicon. "S.A de C.V." is left out of the mark on the web; the full legal name is in the footer. The redraw still needs the company's approval.
- Never add helmets, cranes, cones, gears, buildings, perspective roads, bricks, wrenches, shields, hexagons or gradients.
- **Intro** (`assets/media/logo-intro-1200` and `-960`, WebM VP9 and MP4 H.264, 5.2 s, no sound): on the first visit of the session, on paper over the whole screen. The globe's eight strokes join, the meridians make three calm turns on the globe's axis and stop face on, the globe rises and the letters come up. At the end the video swaps for the two SVG pieces, which fly to the header logo (1.15 s, `expo.inOut`) while the paper fades into the portada. Any wheel, touch, key or click skips it; if it fails or stalls, the paper just fades. It never locks the scroll. Source: `media-src/logo-intro/`.

## What each reference gave

- **pravah.com** (Rafa's reference for this round): a technical subject drawn in points of light, with depth, that the scroll moves through. We took the idea of an explanatory drawing in light and a calm, continuous scroll; not its subject, palette or type.
- **Jesko Jets:** the real beats the illustrated where the real exists (the photos, the list), slow motion, thin technical lines.
- **Apple:** a sticky scene the scroll plays through without taking control, and facts as text.
- **Squarespace:** full-bleed bands that alternate dark and light.
- **Awwwards:** achromatic discipline with one functional accent, and paired buttons.
- **Dala:** one gesture the whole page serves, a structure of points as the signature.

## Don't

- AI photos, retouched "renders" or stock presented as the company's work; a drawing captioned or listed as a work.
- "Nos especializamos en…", or any wording that narrows the company to one area.
- Figures, names or places inside the drawing.
- Construction stock (hard hat on blueprints, handshakes, engineer with tablet), machinery illustrations, emoji.
- Gradients on the interface, hazard-tape stripes, concrete or rust textures, glass effects, big shadows.
- Stencil, military or grunge lettering; Bebas or Impact in caps.
- Hero with three icon cards, Mission / Vision / Values, uppercase eyebrows, decorative "01 / 02" numbering.
- ISO or safety seals, testimonials, client logos.
- Hero sliders, dark overlays on photos to carry text, parallax on photos.

## Engineering notes

- Plain HTML, CSS and JS; no build step for the page. `main.js` (26 KB, 9 KB gzipped) and `hero3d.js` (26 KB, 10 KB gzipped) do nothing the page needs to be readable. GSAP, ScrollTrigger, SplitText and Lenis load with `defer` before them (144 KB, 55 KB gzipped).
- Built assets and their sources: the intro video (`media-src/logo-intro/`), the photos (`media-src/images.mjs`), the map and the glyphs (`media-src/dots/`, written into `index.html` between markers), the portada stills and the share image (`media-src/dots/stills.cjs`; run it again whenever the opening frame changes). Never edit an output by hand.
- Layers come from the z-index tokens in `:root` (`--z-back` only inside the portada's isolated sticky, then base, sticky, overlay, modal and toast); no other numbers.
- Lighthouse runs without a GPU, so it measures the portada's still mode. Round 3, local, median of 3: performance 87, accessibility 100.
- While it lives on the faro-demos Worker the whole folder is `noindex` through `sitios/_headers` (`X-Robots-Tag`). `gracias.html` and `404.html` also carry `<meta name="robots" content="noindex">`.
- The Worker answers any missing path under `/conpav/` with `404.html`, so that page uses root-relative `/conpav/` paths; the other pages stay relative. On the client's own domain, `/conpav/` becomes `/` there and in the absolute URLs (`og:url`, `og:image`, JSON-LD `url`, the form's `_next`).
- JSON-LD is a hand-written `Organization` with confirmed data only (areas in `knowsAbout`, opening hours Monday to Friday 08:00–17:00 and Saturday 09:00–15:00).
