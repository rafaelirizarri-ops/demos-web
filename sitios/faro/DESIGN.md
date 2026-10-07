# Faro: design notes

**Concept:** a lighthouse over a night sea. Faro brings order and visibility to small businesses that are working in the dark.
**Signature gesture (only one):** the slowly turning lighthouse beam in the hero. The cursor light on the service cards is the same idea at small scale.

## Tokens (see `:root` in styles.css)
| Role | Value | Use |
|---|---|---|
| Canvas | `#07090d` | page background |
| Surface | `#0e1219` / `#161b24` | cards, form / inputs, hover |
| Ink | `#f3eee4` (17.6:1) | headings and body |
| Secondary | `#a9afb8` (9:1) | supporting text, italic half of headlines |
| Tertiary | `#7f8792` (5.4:1) | unlit problem lines, hints |
| Signal | `#ffb23e` | primary button (text `#07090d`, 11:1), beam, small accents only |

- Type: Instrument Serif 400 for display (italic for the second half of headlines), Geist 300–600 for body. Both self-hosted in `assets/fonts`.
- Space: 8px base unit. Sections `clamp(80px, 9vw, 136px)`.
- Radii: exactly three: 10px (inputs, small UI), 20px (cards, form), pill (buttons, chips, toggle).

## Rules
- One amber button per screen. Amber is never used for body text.
- Headlines: big and light (weight 400), never bold.
- Motion only with transform / opacity / clip; everything respects `prefers-reduced-motion`.
- Content must read without JS motion: GSAP only enhances.

## Don't
- No gradients on buttons, no glassmorphism, no big soft shadows.
- No invented testimonials or numbers: the Results section stays as visible placeholders until real ones exist.
- No emoji icons, no stock icons.

## Files
- `copy.js`: every word of the site, ES + EN, in one object.
- `config.js`: form provider/key, WhatsApp number, hero video, service images.
- `i18n.js`: language toggle (remembered) and rendering of the repeated blocks.
- `main.js`: smooth scroll, scroll animations, tilt, form submit.
