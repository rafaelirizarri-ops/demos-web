# Image pipeline

Development only: nothing in this folder is linked from the site. `images.mjs` turns the original photos into the responsive files that `index.html` uses, following `photos.json`. The originals never enter this repo.

## Run

```
cd sitios/conpav/media-src
npm ci                                # sharp 0.34.4, pinned
node images.mjs                       # every photo
node images.mjs --only slope-street   # one photo, by its output name
node images.mjs --src /path/to/dir    # originals in another folder (repeatable)
```

By default the originals are read from the private project folders `/mnt/project-files/uploads/hearth/` and `/mnt/project-files/concretos-pavimentos/media/` (video posters). Each one is found by the first 8 characters of its file name, the photo ID.

The script prints a size table and exits with an error if a file is over budget, if a width is asked for that the crop does not have, or if a crop has the wrong shape. Run on every photo, it also lists the files in `assets/img/` and `assets/og/` that `photos.json` no longer produces: it never deletes them, so remove them by hand once nothing in the HTML uses them. Same input, same bytes: running it twice changes nothing.

## What it writes

Only to `../assets/img/` and `../assets/og/`. It never touches the HTML.

| File | Format |
|---|---|
| `assets/img/<name>-<crop>-<width>.avif` | AVIF q45 (q40 at 1600 px), 4:2:0 |
| `assets/img/<name>-<crop>-<width>.webp` | WebP q65 |
| `assets/img/<name>-d-800.jpg` | JPEG q72, the fallback in `<img src>` |
| `assets/og/<name>.jpg` | Open Graph image, 1200×630, JPEG q78 progressive (only for a photo with `og`) |

Every output is sRGB without metadata (phone originals carry GPS) and is never wider than its crop: nothing is upscaled.

AVIF budget per width: 480 px, 60 KB; 800 px, 130 KB; 1200 px, 230 KB; 1600 px, 250 KB; thumbnails, 15 KB at 160 px and 40 KB at 320 px. The Open Graph image: 300 KB. `budgetKB` lowers a limit for one photo (the hero: 200 KB at 1200 px). 1 KB = 1000 bytes.

## photos.json

`photos.json` is public. It lists only published photos, with their ID, crops, corrections and output name: no project, place, client or curation notes.

An entry with every field (real entries use only what they need):

```json
{
  "id": "492d2f0b",
  "name": "slope-street",
  "adjust": { "channels": [1, 1, 0.93], "levels": [0.5, 99.5], "rotate": 0 },
  "crops": {
    "d": { "rect": [0, 133, 1600, 1067], "widths": [800, 1200, 1600] },
    "m": { "rect": [240, 0, 960, 1200], "widths": [480, 800] },
    "t": { "rect": [80, 160, 1200, 800], "widths": [160, 320] }
  },
  "og": { "rect": [0, 300, 1600, 840] },
  "budgetKB": { "1200": 200 }
}
```

- `id`: the first 8 characters of the original's file name.
- `name`: what the photo shows, in English, lowercase with hyphens (`slope-finished`, `bridge-footings`, `footbridge-night`). Never a place, project, river, road or company.
- `rect`: `[left, top, width, height]` in pixels of the original.
- Crops:
  - `d` (required): desktop, 3:2 or 4:5. When there is no `m`, it serves every screen, and the mobile `<source>` lists only its 480 and 800 files. It also gives the JPEG fallback, so it must be at least 800 px wide.
  - `m`: mobile, 4:5, only when the phone needs a different framing. Widths 480 and 800 at most: phones never get more than 800w.
  - `t`: thumbnail for the services index, 3:2, widths 160 and 320.
- `widths`: from 480, 800, 1200 and 1600 (160 and 320 for `t`), only those the crop can give.
- `adjust`: only the corrections that `DESIGN.md` allows. `channels`: white balance as gains for red, green and blue, with the concrete as the grey card. `levels`: soft levels for hazy photos, mapping those luminance percentiles to black and white (measured on the `d` crop and applied to every crop). `rotate`: straighten a horizon, 3° at most; the rects are then read in the straightened image. Night photos keep their night. Nothing else: no saturation, HDR, LUT, black and white, grain, retouching, mirroring or AI upscaling.
- `og`: the crop for the link preview, 1200:630 and at least 1200 px wide.

## Add a photo

1. The client sends the photos as a WhatsApp Document (sent as a photo, WhatsApp compresses them), with the main work only and, where approved, the department and year. Faro puts them in the private project folder, never in this repo.
2. Check the original at 100 %: no recognisable face; no legible letters or logos on uniforms, plates, signs, machines, cranes or formwork panels; no date stamp. Logos are cropped out, never blurred or erased. If no crop removes them, the photo is not used. The verdict goes in the private curation notes, not here.
3. Add an entry to `photos.json`: ID, name, crops, widths and only the corrections it needs.
4. Run `node images.mjs --only <name>`.
5. Open the widest file of every crop at 100 % and check it again: each file in `assets/` can be opened on its own. If anything can be read, tighten the crop and run it again.
6. Write the `<picture>` by hand (below), with the `width` and `height` of each crop on its `<source>` for zero layout shift. Only the hero gets a preload and `fetchpriority="high"`; every other image is `loading="lazy"`.
7. Add the photo to the photo table in `DESIGN.md`, take screenshots at 390 and 1280 px and open the PR.

## Caching

`/*/assets/*` is served as immutable for a year. Once a file has been published, never change it under the same name: give the photo a new `name` (`slope-street-v2`), run the script, update the HTML and delete the old files. Before the first publish, regenerate freely.

## `<picture>` pattern

```html
<picture>
  <source type="image/avif" media="(max-width: 699px)" sizes="100vw" width="960" height="1200"
          srcset="assets/img/slope-street-m-480.avif 480w, assets/img/slope-street-m-800.avif 800w">
  <source type="image/avif" sizes="(min-width: 1024px) 50vw, 100vw" width="1600" height="1067"
          srcset="assets/img/slope-street-d-800.avif 800w, assets/img/slope-street-d-1200.avif 1200w, assets/img/slope-street-d-1600.avif 1600w">
  <!-- the same two sources in image/webp -->
  <img src="assets/img/slope-street-d-800.jpg" width="1600" height="1067" alt="" loading="lazy" decoding="async">
</picture>
```

Write the real `alt` in Spanish: what the photo shows, with the right technical term, in 80 to 150 characters.
