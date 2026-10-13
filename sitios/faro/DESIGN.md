# Faro: design notes

**Concept:** the light that welcomes you. A lighthouse at golden hour: warm, calm, and on your side. Faro brings order and visibility to small businesses, so the site feels like arriving home at sunset, not like a cold tech product. The day ends at the contact section: the last bands turn to night and the lamp is the brightest thing on the page ("Enciende tu faro").
**Signature gesture:** light. A real 3D lighthouse turns its lamp in the hero, the logo's F is a lighthouse whose top arm is the beam, a circle of honey light opens the answer ("Te falta sistema"), the blueprint of the lighthouse draws itself step by step, and the beam sweeps the giant footer logo.

## Logo
- Wordmark "Faro" in Inter Display 600 (the letters "aro" are the real glyph outlines). The F is a lighthouse: a tapered tower is the stem (it keeps the F's middle arm), and the lantern plus the top arm are one flat wedge of light, the beam.
- Flat fills only: no gradients, masks or strokes, so it stays sharp from 16px to a billboard.
- Files: `assets/brand/faro-logo.svg` (espresso letters, caramel beam, for light backgrounds), `assets/brand/faro-logo-dark.svg` (cream letters, honey beam) and `favicon.svg` (the lighthouse F alone on an espresso tile).
- The same SVG is inlined in `index.html` four times (intro, header, footer base, footer lit). The letters use `currentColor`; the beam is `.logo-beam`.
- The lamp sits at (81.5, 93.2) in the 1919 × 785 viewBox: that point is the pivot for every beam animation.
- Source: the generator script and the Inter Display instance live outside the site; to change the mark, edit the paths in the SVG files directly.

## Tokens (see `:root` in styles.css)
Golden hour on the light bands, espresso night on the dark ones.

| Role | Value | Use |
|---|---|---|
| Canvas | `#FBF5EC` cream | main light band |
| Alt band | `#F2E7D8` sand | alternate light band, and the card surface on cream |
| Night | `#221913` espresso / `#2E231C` | dark bands (stats, contact, footer, menu) and their surfaces |
| Ink | `#221913` (15.9:1 cream, 14.1:1 sand) | headings and body on light |
| Ink 2 | `#6A5849` (6.2:1 cream, 5.5:1 sand) | second half of headlines, supporting text |
| Ink 3 | `#7D6A5B` (4.7:1 cream) | hints, placeholders |
| Control | `#8F7E70` (3.6:1 cream, 3.2:1 sand) | borders of inputs, ghost buttons, toggles |
| Honey | `#F0A23B` | the light. Fills only on light bands (1.9:1 as text). Espresso on honey = 8.2:1 |
| Caramel | `#C9741A` (3.2:1) | the light as a graphic on light bands: logo beam, lines, plan beam |
| Amber | `#9A4A16` (5.8:1 cream, 5.1:1 sand) | small text accents on light bands |
| Dark tone | ink `#F8EFE3`, ink 2 `#C9B8A6`, ink 3 `#A8978A`, control `#8C7B6E` | the same roles on espresso |

- **Primary button:** "honey is the light, ink is the action". Espresso button with cream text on light bands; honey button with espresso text on dark bands. One primary per screen; the secondary is the same size and radius with an outline only.
- **Hero headline second line:** `#4A3326` (at least 4:1 on the brightest part of the sky). On the honey answer band the second line is `#6B4416` (4:1, large text only).
- **Type:** Inter (variable, opsz + wght, self-hosted in `assets/fonts`, OFL licence). It is the free face closest to Apple's SF. Hierarchy is by scale: display 600 with tight tracking (-0.038em, line-height ~1.0); big numbers 200; body 400–450 at 17px. Never 700+.
- Headline pattern: two lines, the second in Ink 2 (Apple's two-tone headline). Short phrases are kept together with `<span class="nw">` so no single word is orphaned (SplitText ignores `&nbsp;`).
- Display sizes use `min(vw, vh)`, so a short or narrow window never pushes a headline off screen.
- **Radii:** exactly three: 12px (inputs, small UI inside visuals), 24px (cards, form, hero card), pill (buttons, chips, toggles).

## Bands
- Every section has `data-bg` (`cream`, `sand`, `espresso`) and dark ones also have `data-tone="dark"`, which re-scopes the ink tokens.
- Order: hero cream → problem cream → answer honey → stats espresso (a short night interlude) → services sand → how cream → results sand → FAQ cream → contact + footer espresso. The day turns to night at contact.
- With motion on, light bands are transparent and the page colour itself fades between cream and sand as you scroll (main.js sets `--page` from the band at 80% of the viewport). Dark bands always paint solid.
- The header and the custom cursor take the tone of whatever band is under them.

## Hero
- Background: a real 3D lighthouse on a headland at golden hour, made with HyperFrames + Three.js (source in `video-src/faro-3d`, re-render steps in `video-src/README.md`). 12 s seamless loop, no audio.
- Two cuts: `hero-land` (16:9, lighthouse on the right third) and `hero-port` (9:16, lighthouse low so the headline sits on the sky). The switch is at aspect ratio 9/10, in both the `<picture>` poster and `main.js`.
- mp4 (H.264) plays first; browsers without H.264 get the WebM (VP9) copy. The WebP poster is the first frame, so still → motion is seamless. Reduced-motion and data-saver visitors keep the poster. The video pauses when the hero is off screen.
- Text sits on a soft cream haze on the left (bottom on portrait), never on a box.

## Layout at every size
- Mobile-first. Below 1024px: burger + full-screen dark menu.
- Pinned scenes only pin when there is room (main.js adds `.is-pinned`):
  - Problem → answer: always with motion on.
  - Services: horizontal pinned track at ≥1024px wide and ≥600px tall; everywhere else a swipe carousel with counter, progress and arrows.
  - How it works: pinned stepper with the blueprint at ≥560px tall; otherwise a plain list with the blueprint drawn once.
- Everything is rebuilt on breakpoint changes, real width changes and language switches.

## Motion system
- Intro (once per session): the letters rise, the beam switches on pale and warms to caramel, then the logo flies into the header as the cream curtain lifts and the hero lines rise.
- Hero: on scroll the frame shrinks into a rounded card, the lighthouse pushes in and the copy drifts up and fades.
- Problem: each word lights up as you read, then the honey circle opens the answer.
- Stats: the numbers roll down into place like an odometer.
- Services: marquee whose speed and skew follow scroll velocity.
- How it works: the lighthouse blueprint draws itself (foundation, structure, lantern, light) in step with the rolling step number.
- Headlines: lines rise out of a mask. Blocks fade up.
- Mouse only: custom cursor, magnetic buttons, card tilt + light, contact spotlight, footer flashlight + beam that turns toward the cursor.
- Only transform / opacity / clip-path / colour are animated. `prefers-reduced-motion` turns all of it off and shows the static layout, with the blueprint fully drawn.

## References (what we took, and what we did not copy)
Use the best of each; copy none of them.
- **Squarespace:** quality bar. Taken: a cinematic hero with real 3D depth, huge light-weight numbers in a dark band, generous rhythm between bands. Not taken: their layout, copy, black-and-white palette or product shots.
- **Apple:** taken: two-tone headlines, an Inter/SF-style sans with tight tracking, alternating background bands instead of borders or shadows, the ink-coloured primary button. Not taken: SF Pro (licence), white + `#f5f5f7` + blue.
- **Jesko Jets:** taken: realism over illustration (a real lighthouse, not a drawing) and the technical blueprint as a sign of precision. Not taken: navy, jets, their copy.
- **Sweetgreen:** taken: the page colour travelling smoothly from band to band. Not taken: their colours or illustration style.
- **"Your workplace has the answer" (Dala):** taken: one signature visual that the whole page serves. Not taken: violet, the particle brain.

## Rules
- One primary button per screen. Honey is never body text on light bands.
- Headlines big and 600 at most, never bold 700+.
- Content must read without JS motion: GSAP only enhances.

## Don't
- No gradients on buttons or cards, no big soft shadows, no glassmorphism.
- No cold aqua, navy or neon: the palette stays warm.
- No drawn/cartoon lighthouses in the hero: the hero is the real 3D one.
- No invented testimonials or numbers: the Results cards stay marked "Por publicar" until real ones exist. The stats band only states facts about Faro's offer (7 systems, 1 team, 0 new hires).
- No emoji icons, no stock icons.

## Files
- `copy.js`: every word of the site, ES + EN, in one object.
- `config.js`: form provider, WhatsApp number, hero videos, service images.
- `i18n.js`: language toggle (remembered) and rendering of the repeated blocks (cards, stats, the blueprint SVG).
- `main.js`: intro, smooth scroll, bands, scroll scenes, cursor, menu, carousel, form submit.
- `video-src/`: the HyperFrames composition behind the hero videos.
