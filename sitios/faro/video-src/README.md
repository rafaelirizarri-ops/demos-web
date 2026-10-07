# Hero video source (HyperFrames)

`hero.html` is the HyperFrames composition behind `assets/media/hero.*`: a 10 s seamless loop drawn on a canvas from one time value, so frame 0 equals the last frame.

Re-render:
```
npx hyperframes init faro-hero --example blank
cp hero.html faro-hero/index.html && cp ../assets/js/gsap.min.js faro-hero/
cd faro-hero && npx hyperframes render --fps 30 --quality high --output faro-hero.mp4
ffmpeg -i faro-hero.mp4 -vf scale=1600:-2 -an -c:v libvpx-vp9 -b:v 0 -crf 40 ../assets/media/hero.webm
ffmpeg -i faro-hero.mp4 -vf scale=1600:-2 -an -c:v libx264 -crf 27 -pix_fmt yuv420p -movflags +faststart ../assets/media/hero.mp4
```
