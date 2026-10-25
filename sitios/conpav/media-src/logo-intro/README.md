# Logo intro (HyperFrames + Three.js)

The composition behind `assets/media/logo-intro-1200.*` and `logo-intro-960.*`, the video that opens the site on a first visit: the globe of the logo joins, turns three calm times on its own axis, stops face on, rises, and the letters CONPAV come up from their baseline. Then the page swaps it for the SVG and moves the logo to the header (`main.js`, `runIntro`). 5.2 s at 30 fps, rendered at 1440 × 1080 on the site's paper (`#F5F4F0`), the ink in graphite (`#292D32`).

- `src/intro.js`: the whole animation. It reads the logo from `../../assets/logo/conpav-stack.svg` (bundled as text), so the video always draws the current mark. Every frame is a pure function of time; the last one matches the SVG pixel for pixel, which is what lets the page swap the video for the SVG when it ends.
- `index.html`: the HyperFrames composition (one canvas clip, 5.2 s).
- The page places the SVG over the stage at left 13.4924 %, top 18 %, width 73.0152 %: the lockup is 64 % of the frame height, centred. If `K_END`, `LOCK_X` or `LOCK_Y` change in `intro.js`, change `.intro__lockup` in `styles.css` too.

Render (from this folder):
```
npm i
npm run build                     # esbuild -> intro.bundle.js
cp ../../assets/js/gsap.min.js .
npx hyperframes lint
npx hyperframes render --fps 30 --quality high --workers 4 --output renders/logo-intro.mp4
```

Encode for the web (BT.709 tags so browsers read the paper as `#F5F4F0`):
```
T="-colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv"
for s in 1200:900 960:720; do w=${s%%:*}
  ffmpeg -i renders/logo-intro.mp4 -vf "scale=$s:flags=lanczos:out_color_matrix=bt709" -an -c:v libvpx-vp9 -b:v 0 -crf 38 -row-mt 1 -deadline good -cpu-used 1 -pix_fmt yuv420p $T ../../assets/media/logo-intro-$w.webm
  ffmpeg -i renders/logo-intro.mp4 -vf "scale=$s:flags=lanczos:out_color_matrix=bt709" -an -c:v libx264 -preset veryslow -tune animation -crf 23 -pix_fmt yuv420p -profile:v high -level 4.0 $T -movflags +faststart ../../assets/media/logo-intro-$w.mp4
done
```

Preview one moment in a browser: open `index.html` (after the build) and call `window.__introRender(1.2)`; `window.__introInfo` prints the layout numbers. `intro.bundle.js`, `gsap.min.js` and `renders/` are not committed.
