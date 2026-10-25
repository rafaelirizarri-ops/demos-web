/* =========================================================================
   CONPAV: logo intro (HyperFrames + Three.js)
   The globe of the logo is treated as what it draws: a sphere seen from a
   little above. Its eight strokes play three parts:
   - the two orange meridians are lifted onto an invisible sphere and turn
     with it on its own axis, three calm turns that ease in and out;
   - the two ink parallels stay put, like the latitudes of a real globe,
     and grow out from the axis;
   - the four orbit swooshes spiral in from outside and keep circling the
     globe in their own plane, leant back like a ring round a planet.
   Everything stops face on at the same moment, the globe rises and the
   letters CONPAV come up from their baseline.

   Every frame is a pure function of time (no randomness, no clock), and
   the face-on pose projects exactly onto the flat logo: each meridian
   vertex is lifted along the camera ray through its flat position, so the
   last frame matches assets/logo/conpav-stack.svg (the page swaps the
   video for that SVG when it ends).
   ========================================================================= */
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { TessellateModifier } from "three/examples/jsm/modifiers/TessellateModifier.js";
import stackSvg from "../../../assets/logo/conpav-stack.svg";

THREE.ColorManagement.enabled = false; // flat brand colours, no conversions

/* ---------- frame ---------- */
const W = 1440, H = 1080;
const SS = 2;            // supersampling: the GL canvas is drawn at 2x and scaled down
const FPS = 30;
const SUB = 8;           // motion blur: samples per frame
const SHUTTER = 0.5;     // fraction of a frame the shutter stays open
const DURATION = 5.2;

const BG = new THREE.Color("#F5F4F0");    // the site's paper
const INK = new THREE.Color("#292D32");   // the site's graphite (the logo's ink is currentColor)
const ORANGE = new THREE.Color("#F28C6A");
const GHOST = 0.3;                        // strength of a meridian seen through the globe

/* ---------- layout (frame pixels) ---------- */
// Final lockup: the stacked logo (viewBox 244.6 x 160.8) at 64% of the frame height, centred.
const STACK = { w: 244.6, h: 160.8 };
const K_END = (0.64 * H) / STACK.h;
const LOCK_X = (W - STACK.w * K_END) / 2;
const LOCK_Y = (H - STACK.h * K_END) / 2;
// While it spins, the globe alone (116.5 units tall) fills 70% of the frame height, centred.
const K_SPIN = (0.7 * H) / 116.5;

/* ---------- timing (seconds) ---------- */
const SPIN = { t0: 0.3, t1: 3.75, turns: 3 };    // meridians: three calm turns, stopping face on
const ORBIT = { t0: 0.0, t1: 3.75, turns: -1, lean: 38 }; // swooshes: one turn the other way, leaning back
const RISE = { t0: 3.4, t1: 4.15 };               // the globe moves up to make room for the letters
const LETTERS = { t0: 3.7, stagger: 0.05, dur: 0.8 }; // the last letter lands at 4.75 s
const SHADE = { t0: 3.0, t1: 3.65, max: 0.22 };   // a touch of roundness while it turns

/* ---------- easing ---------- */
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const expoOut = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
const power3InOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const smooth = (x) => x * x * (3 - 2 * x);
const lerp = (a, b, t) => a + (b - a) * t;
const ramp = (t, a, b) => smooth(clamp01((t - a) / (b - a)));
const DEG = Math.PI / 180;
const TAU = 2 * Math.PI;

// Turning: the integral of a velocity curve u(1-u)^1.5 (a soft start, a long smooth stop and
// a low peak, so three turns never look fast), tabulated once so the stop lands exactly on a
// whole number of turns.
const TURN_LUT = (() => {
  const n = 2000, lut = new Float64Array(n + 1);
  let acc = 0;
  for (let i = 1; i <= n; i++) {
    const u = (i - 0.5) / n;
    acc += u * Math.pow(1 - u, 1.5);
    lut[i] = acc;
  }
  for (let i = 0; i <= n; i++) lut[i] /= acc;
  return lut;
})();
function turned(t, { t0, t1, turns }) {
  const f = clamp01((t - t0) / (t1 - t0)) * (TURN_LUT.length - 1), i = Math.floor(f);
  const v = i >= TURN_LUT.length - 1 ? 1 : lerp(TURN_LUT[i], TURN_LUT[i + 1], f - i);
  return turns * TAU * v;
}

/* ---------- logo geometry ---------- */
const doc = new DOMParser().parseFromString(stackSvg, "image/svg+xml");
const [inkD, orangeD, lettersD] = [...doc.querySelectorAll("path")].map((p) => p.getAttribute("d"));
const subpaths = (d) => d.match(/M[^M]+/g);
const loader = new SVGLoader();
const shapesOf = (d) => {
  const data = loader.parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`);
  return data.paths.flatMap((p) => p.toShapes(false));
};
const [A, B, C, D] = subpaths(inkD).map(shapesOf);      // ink: left swoosh, middle and upper parallels, bottom swoosh
const [E, F, G, Hm] = subpaths(orangeD).map(shapesOf);  // orange: top arc, right crescent, right and left meridians

// Globe centre: the middle of the parallels' and meridians' box (stack coordinates).
const box = new THREE.Box2();
[B, C, G, Hm].flat().forEach((sh) => sh.extractPoints(32).shape.forEach((p) => box.expandByPoint(p)));
const GC = box.getCenter(new THREE.Vector2());
let rIn = 0;
[G, Hm].flat().forEach((sh) => sh.extractPoints(32).shape.forEach((p) => { rIn = Math.max(rIn, Math.hypot(p.x - GC.x, p.y - GC.y)); }));
const R_SPHERE = rIn * 1.12;

/* ---------- camera ---------- */
// The plane z = 0 through the globe's centre is drawn at K_SPIN px per unit.
const CAM_D = 380;
const FOV = 2 * Math.atan(H / (2 * K_SPIN * CAM_D)) / DEG;
const camera = new THREE.PerspectiveCamera(FOV, W / H, 10, 2000);
camera.position.set(0, 0, CAM_D);
camera.lookAt(0, 0, 0);
camera.updateMatrixWorld();
camera.updateProjectionMatrix();
const baseProjection = camera.projectionMatrix.clone();

// Lift a flat point (globe-centred, y up) onto the sphere along the camera ray
// through it, so it projects back exactly where it was drawn.
function lift(x, y, R) {
  const r2 = x * x + y * y, Dc = CAM_D;
  const s = (Dc * Dc - Math.sqrt(Dc * Dc * (R * R - r2) + r2 * R * R)) / (r2 + Dc * Dc);
  return new THREE.Vector3(s * x, s * y, Dc * (1 - s));
}

const tess = new TessellateModifier(1.2, 10);
// Flat geometry in globe-centred units (y up), normals facing the camera.
function flatGeometry(shapes) {
  return shapes.map((sh) => {
    const g = new THREE.ShapeGeometry(sh, 48);
    g.translate(-GC.x, -GC.y, 0);
    g.scale(1, -1, 1);
    return g;
  });
}
// The same, lifted onto the sphere with radial normals.
function sphereGeometry(shapes, R) {
  return shapes.map((sh) => {
    let g = new THREE.ShapeGeometry(sh, 48);
    g = tess.modify(g);
    const pos = g.getAttribute("position");
    const nrm = new Float32Array(pos.count * 3);
    for (let v = 0; v < pos.count; v++) {
      const p = lift(pos.getX(v) - GC.x, -(pos.getY(v) - GC.y), R);
      pos.setXYZ(v, p.x, p.y, p.z);
      p.normalize();
      nrm.set([p.x, p.y, p.z], v * 3);
    }
    g.setAttribute("normal", new THREE.BufferAttribute(nrm, 3));
    return g;
  });
}

/* ---------- materials ---------- */
const vert = /* glsl */ `
  varying vec3 vN;
  varying vec3 vP;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vP = mv.xyz;
    vN = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mv;
  }`;
const frag = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uBg;
  uniform float uSide;    // 1: the side facing the camera, -1: the side facing away (seen through)
  uniform float uGhost;
  uniform float uShade;
  uniform float uAlpha;
  varying vec3 vN;
  varying vec3 vP;
  void main() {
    float facing = dot(normalize(vN), normalize(-vP));
    if (facing * uSide <= 0.0) discard;
    vec3 c = uColor;
    if (uSide < 0.0) c = mix(uBg, uColor, uGhost);
    else c *= 1.0 - uShade * (1.0 - facing);
    gl_FragColor = vec4(c, uAlpha);
  }`;
function strokeMaterial(color, side) {
  return new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: {
      uColor: { value: color.clone() },
      uBg: { value: BG.clone() },
      uSide: { value: side },
      uGhost: { value: GHOST },
      uShade: { value: 0 },
      uAlpha: { value: 1 },
    },
    side: THREE.DoubleSide,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
}
const flatMaterial = (color) => new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, depthTest: false, depthWrite: false });

/* ---------- scene ---------- */
// Draw order (the SVG's, so the face-on frame matches it): meridians seen through the globe,
// then the ink strokes, then the orange ones.
const scene = new THREE.Scene();
const ORDER = { ghost: 0, ink: 10, orange: 20 };

// Orbit swooshes: flat, circling in their own plane, which leans back while it is fast.
const orbitPlane = new THREE.Group();
const orbit = new THREE.Group();
orbitPlane.add(orbit);
scene.add(orbitPlane);
const swooshes = [
  { shapes: A, color: INK, order: ORDER.ink + 0, delay: 0.0, from: 200 },
  { shapes: D, color: INK, order: ORDER.ink + 3, delay: 0.1, from: 200 },
  { shapes: E, color: ORANGE, order: ORDER.orange + 0, delay: 0.05, from: 200 },
  { shapes: F, color: ORANGE, order: ORDER.orange + 1, delay: 0.15, from: 200 },
].map((s) => {
  const pivot = new THREE.Group();
  orbit.add(pivot);
  const mat = flatMaterial(s.color);
  flatGeometry(s.shapes).forEach((g) => { const m = new THREE.Mesh(g, mat); m.renderOrder = s.order; pivot.add(m); });
  return { ...s, pivot, mat };
});

// Parallels: flat and still, grown out from the axis.
const parallels = [
  { shapes: B, order: ORDER.ink + 1, delay: 0.3 },
  { shapes: C, order: ORDER.ink + 2, delay: 0.42 },
].map((s) => {
  const pivot = new THREE.Group();
  scene.add(pivot);
  const mat = flatMaterial(INK);
  flatGeometry(s.shapes).forEach((g) => { const m = new THREE.Mesh(g, mat); m.renderOrder = s.order; pivot.add(m); });
  return { ...s, pivot, mat };
});

// Meridians: the logo's own two, on the sphere, turning on its axis.
const spin = new THREE.Group();
scene.add(spin);
const meridians = [];
[{ shapes: G, order: ORDER.orange + 2 }, { shapes: Hm, order: ORDER.orange + 3 }].forEach((s) => {
  const geos = sphereGeometry(s.shapes, R_SPHERE + 0.6); // just over the parallels
  const back = strokeMaterial(ORANGE, -1), front = strokeMaterial(ORANGE, 1);
  geos.forEach((g) => {
    const mb = new THREE.Mesh(g, back); mb.renderOrder = ORDER.ghost; spin.add(mb);
    const mf = new THREE.Mesh(g, front); mf.renderOrder = s.order; spin.add(mf);
  });
  meridians.push({ back, front });
});

/* ---------- letters (flat, frame pixels, y down) ---------- */
const letterScene = new THREE.Scene();
const letterCam = new THREE.OrthographicCamera(0, W, 0, H, -10, 10);
const letterMat = new THREE.MeshBasicMaterial({ color: INK, side: THREE.DoubleSide });
const LETTER_TOP = 128.6, LETTER_BOTTOM = 160.8; // stack coordinates of the letters' band
const letters = shapesOf(lettersD)
  .map((sh) => ({ sh, minX: Math.min(...sh.getPoints().map((p) => p.x)) }))
  .sort((a, b) => a.minX - b.minX)
  .map(({ sh }) => {
    const m = new THREE.Mesh(new THREE.ShapeGeometry(sh, 48), letterMat);
    m.scale.set(K_END, K_END, 1);
    letterScene.add(m);
    return m;
  });
const lettersBottomPx = LOCK_Y + LETTER_BOTTOM * K_END;
const letterRisePx = (LETTER_BOTTOM - LETTER_TOP) * K_END * 1.08;

/* ---------- renderer ---------- */
const gl = document.createElement("canvas");
gl.width = W * SS; gl.height = H * SS;
const renderer = new THREE.WebGLRenderer({ canvas: gl, antialias: true, preserveDrawingBuffer: true, alpha: false });
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.setPixelRatio(1);
renderer.setSize(W * SS, H * SS, false);
renderer.setClearColor(BG, 1);
renderer.autoClear = false;

const out = document.getElementById("out");
const ctx = out.getContext("2d");
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = "high";

/* ---------- pose at time t ---------- */
const ndc = new THREE.Matrix4();
function pose(t) {
  // Swooshes spiral in from outside, then circle with the orbit.
  swooshes.forEach((s) => {
    const u = expoOut(clamp01((t - s.delay) / 1.3));
    s.pivot.rotation.z = s.from * DEG * (1 - u);
    s.pivot.scale.setScalar(lerp(2.1, 1, u));
    s.mat.opacity = ramp(t, s.delay, s.delay + 0.35);
  });
  orbit.rotation.z = turned(t, ORBIT);
  orbitPlane.rotation.x = ORBIT.lean * DEG * (1 - ramp(t, 1.0, 3.55));

  // Parallels grow out from the axis.
  parallels.forEach((s) => {
    const u = expoOut(clamp01((t - s.delay) / 1.1));
    s.pivot.scale.set(Math.max(u, 1e-4), 1, 1);
    s.mat.opacity = ramp(t, s.delay, s.delay + 0.2);
  });

  // Meridians come round from behind and turn with the globe.
  const enter = expoOut(clamp01((t - 0.3) / 1.2));
  spin.rotation.y = turned(t, SPIN) - 150 * DEG * (1 - enter);
  const shade = SHADE.max * (1 - ramp(t, SHADE.t0, SHADE.t1));
  meridians.forEach(({ back, front }) => {
    const a = ramp(t, 0.3, 0.6);
    back.uniforms.uAlpha.value = a;
    front.uniforms.uAlpha.value = a;
    front.uniforms.uShade.value = shade;
  });

  // Where the globe sits in the frame: centred and growing a touch while it spins,
  // then up and smaller into the stacked lockup.
  const grow = lerp(0.88, 1, ramp(t, 0, SPIN.t1));
  const rise = power3InOut(clamp01((t - RISE.t0) / (RISE.t1 - RISE.t0)));
  const k = lerp(K_SPIN * grow, K_END, rise);
  const cx = lerp(W / 2, LOCK_X + GC.x * K_END, rise);
  const cy = lerp(H / 2, LOCK_Y + GC.y * K_END, rise);
  const s = k / K_SPIN;
  ndc.set(
    s, 0, 0, (cx - W / 2) / (W / 2),
    0, s, 0, -(cy - H / 2) / (H / 2),
    0, 0, 1, 0,
    0, 0, 0, 1,
  );
  camera.projectionMatrix.multiplyMatrices(ndc, baseProjection);

  // Letters rise from below their baseline, one after another.
  letters.forEach((m, i) => {
    const u = clamp01((t - LETTERS.t0 - i * LETTERS.stagger) / LETTERS.dur);
    m.position.set(LOCK_X, LOCK_Y + (1 - expoOut(u)) * letterRisePx, 0);
    m.visible = u > 0;
  });
}

function drawGL() {
  renderer.setScissorTest(false);
  renderer.clear();
  renderer.render(scene, camera);
  // letters: clipped at their baseline so they come up out of it (GL origin is bottom-left)
  const bottom = Math.round((H - lettersBottomPx - 1) * SS);
  renderer.setScissorTest(true);
  renderer.setScissor(0, bottom, W * SS, H * SS - bottom);
  renderer.render(letterScene, letterCam);
  renderer.setScissorTest(false);
}

/* ---------- render a frame (motion blur by averaging sub-frames) ---------- */
function renderAt(time) {
  const t = Math.min(Math.max(time, 0), DURATION);
  for (let k = 0; k < SUB; k++) {
    const tk = Math.min(Math.max(t + ((k + 0.5) / SUB - 0.5) * SHUTTER / FPS, 0), DURATION);
    pose(tk);
    drawGL();
    ctx.globalAlpha = 1 / (k + 1);
    ctx.drawImage(gl, 0, 0, W, H);
  }
  ctx.globalAlpha = 1;
}

window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
window.__introRender = renderAt;
window.__introInfo = { GC: [GC.x, GC.y], R_SPHERE, K_END, LOCK_X, LOCK_Y, K_SPIN, FOV };
renderAt(window.__hfThreeTime || 0);
