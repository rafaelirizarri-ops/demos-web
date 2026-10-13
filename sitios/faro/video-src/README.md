# Hero video source (HyperFrames + Three.js)

`faro-3d/` is the HyperFrames composition behind `assets/media/hero-land.*` and `hero-port.*`: a real 3D lighthouse on a headland at golden hour, its lamp turning once every 12 s. Every frame is a pure function of time, so the loop is seamless (frame 0 follows the last frame).

- `src/scene.js`: the whole scene (sky, sea, headland, lighthouse, beams, bloom, grade). Framing per shot: `land` (1920×1080, lighthouse at 70% of the width) and `port` (1080×1920, lighthouse low and centred so the headline sits on the sky).
- `index.html`: the landscape composition. For portrait, change the viewport, body size, `data-width`/`data-height`, the canvas size and `data-shot="port"`.

Re-render:
```
cd faro-3d
npm i three@0.185.0 esbuild@0.25 hyperframes@0.8.140
npx esbuild src/scene.js --bundle --format=iife --minify --target=es2020 --outfile=scene.bundle.js
cp ../../assets/js/gsap.min.js .
npx hyperframes render --fps 24 --quality high --workers 4 --output faro-3d-land.mp4
ffmpeg -i faro-3d-land.mp4 -vf scale=1600:900:flags=lanczos -an -c:v libx264 -preset slow -crf 27 -pix_fmt yuv420p -movflags +faststart ../../assets/media/hero-land.mp4
ffmpeg -i faro-3d-land.mp4 -vf scale=1600:900:flags=lanczos -an -c:v libvpx-vp9 -b:v 0 -crf 40 -row-mt 1 ../../assets/media/hero-land.webm
ffmpeg -i faro-3d-land.mp4 -frames:v 1 -vf scale=1600:900 -quality 78 ../../assets/media/hero-land.webp
```
Portrait: same steps with the portrait `index.html`, scaled to 900×1600.

Preview a single frame in a browser: open `index.html?light=gold` (brighter preset) and call `window.__faroRender(4.93)` (the moment a beam faces the camera).
