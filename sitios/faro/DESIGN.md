# Faro: design notes

**Concept:** a lighthouse over a night sea. Faro brings order and visibility to small businesses that are working in the dark.
**Signature gesture:** light. The lamp lights the logo in the intro, the beam turns in the hero, a circle of amber light opens the answer ("Te falta sistema"), and the beam sweeps across the giant footer logo.

## Logo
- Wordmark "Faro" in Instrument Serif with a capital F that is also the lighthouse: the stem is the tower, an amber lamp sits on top, and the F's top arm is the beam of light reaching over "aro".
- Files: `assets/brand/faro-logo.svg` (master) and `favicon.svg`. The same SVG is inlined in `index.html` four times (intro, header, footer base, footer lit) with unique id prefixes (`in-`, `hd-`, `fb-`, `fl-`).
- On light backgrounds use the letters in `#07090d`; keep the lamp and beam amber.

## Tokens (see `:root` in styles.css)
| Role | Value | Use |
|---|---|---|
| Canvas | `#07090d` | page background |
| Surface | `#0e1219` / `#161b24` | cards, form / hover |
| Ink | `#f3eee4` (17.6:1) | headings and body |
| Secondary | `#a9afb8` (9:1) | supporting text, italic half of headlines |
| Tertiary | `#7f8792` (5.4:1) | hints, placeholders |
| Signal | `#ffb23e` | primary button (text `#07090d`, 11:1), beam, the answer screen |

- Type: Instrument Serif 400 for display (italic for the second half of headlines), Geist 300–600 for body. Both self-hosted in `assets/fonts`.
- Display sizes use `min(vw, vh)`, so a short or narrow window never pushes a headline off screen.
- Radii: exactly three: 10px (inputs, small UI), 20px (cards, form), pill (buttons, chips, toggles).

## Layout at every size
- Mobile-first. Below 1024px: burger + full-screen menu.
- Pinned scenes only pin when there is room (main.js adds `.is-pinned`):
  - Problem → answer: always with motion on.
  - Services: horizontal pinned track at ≥1024px wide and ≥600px tall; everywhere else a swipe carousel with counter, progress and arrows (mouse).
  - How it works: pinned stepper at ≥560px tall; otherwise a plain list.
- Everything is rebuilt on breakpoint changes, real width changes and language switches.

## Motion system
- Intro (once per session): letters rise, lamp lights, beam draws, the logo flies into the header while the curtain lifts.
- Hero: letters rise out of their lines; on scroll the frame shrinks into a rounded card and the image pushes in.
- Headlines: lines rise out of a mask. Labels slide in. Blocks fade up.
- Marquee: service names, speed and skew follow scroll velocity.
- Mouse only: custom cursor, magnetic buttons, card tilt + light, contact spotlight, footer flashlight + beam that turns toward the cursor.
- Only transform / opacity / clip / color are animated. `prefers-reduced-motion` turns all of it off and shows the static layout.

## Rules
- One amber button per screen. Amber is never used for body text.
- Headlines: big and light (weight 400), never bold.
- Content must read without JS motion: GSAP only enhances.

## Don't
- No gradients on buttons, no big soft shadows.
- No invented testimonials or numbers: the Results cards stay marked "Por publicar" until real ones exist.
- No emoji icons, no stock icons.

## Files
- `copy.js`: every word of the site, ES + EN, in one object.
- `config.js`: form provider/key, WhatsApp number, hero video, service images.
- `i18n.js`: language toggle (remembered) and rendering of the repeated blocks.
- `main.js`: intro, smooth scroll, scroll scenes, cursor, menu, carousel, form submit.
