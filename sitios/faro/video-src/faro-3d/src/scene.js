// Faro hero: a lighthouse on a headland at golden hour, the lamp turning.
// Everything is a pure function of time t in [0, LOOP): the water speeds are
// whole tiles per loop, the beam makes one full turn per loop, and the clouds
// use a two-sample flow loop, so frame 0 follows the last frame seamlessly.
import * as THREE from "three";
import { Water } from "three/examples/jsm/objects/Water.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

const root = document.getElementById("root");
const W = Number(root.dataset.width);
const H = Number(root.dataset.height);
const qs = new URLSearchParams(location.search);
const SHOT = qs.get("shot") || root.dataset.shot || "land"; // land | port
const LIGHT = qs.get("light") || root.dataset.light || "dusk"; // dusk | gold
const LOOP = 12;
const FPS = 24;
const TAU = Math.PI * 2;
const deg = THREE.MathUtils.degToRad;

// ---------------------------------------------------------------- noise
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeSimplex3(seed) {
  const rand = mulberry32(seed);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); const s = p[i]; p[i] = p[j]; p[j] = s; }
  const perm = new Uint8Array(512), pm12 = new Uint8Array(512);
  for (let i = 0; i < 512; i++) { perm[i] = p[i & 255]; pm12[i] = perm[i] % 12; }
  const g = [1,1,0,-1,1,0,1,-1,0,-1,-1,0,1,0,1,-1,0,1,1,0,-1,-1,0,-1,0,1,1,0,-1,1,0,1,-1,0,-1,-1];
  const F3 = 1 / 3, G3 = 1 / 6;
  const corner = (gi, x, y, z) => {
    let t = 0.6 - x * x - y * y - z * z;
    if (t < 0) return 0;
    t *= t;
    return t * t * (g[gi] * x + g[gi + 1] * y + g[gi + 2] * z);
  };
  return function (xin, yin, zin) {
    const s = (xin + yin + zin) * F3;
    const i = Math.floor(xin + s), j = Math.floor(yin + s), k = Math.floor(zin + s);
    const t = (i + j + k) * G3;
    const x0 = xin - (i - t), y0 = yin - (j - t), z0 = zin - (k - t);
    let i1, j1, k1, i2, j2, k2;
    if (x0 >= y0) {
      if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
      else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
      else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
    } else {
      if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
      else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
      else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
    }
    const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2 * G3, y2 = y0 - j2 + 2 * G3, z2 = z0 - k2 + 2 * G3;
    const x3 = x0 - 1 + 3 * G3, y3 = y0 - 1 + 3 * G3, z3 = z0 - 1 + 3 * G3;
    const ii = i & 255, jj = j & 255, kk = k & 255;
    return 32 * (
      corner(pm12[ii + perm[jj + perm[kk]]] * 3, x0, y0, z0) +
      corner(pm12[ii + i1 + perm[jj + j1 + perm[kk + k1]]] * 3, x1, y1, z1) +
      corner(pm12[ii + i2 + perm[jj + j2 + perm[kk + k2]]] * 3, x2, y2, z2) +
      corner(pm12[ii + 1 + perm[jj + 1 + perm[kk + 1]]] * 3, x3, y3, z3)
    );
  };
}
const n3 = makeSimplex3(1979);
function fbm3(x, y, z, oct = 5) {
  let a = 0.5, f = 1, s = 0;
  for (let o = 0; o < oct; o++) { s += a * n3(x * f, y * f, z * f); f *= 2.03; a *= 0.5; }
  return s;
}

// Periodic 2D gradient noise for a tileable sea normal map.
function makePeriodic2(seed) {
  const rand = mulberry32(seed);
  const gx = new Float32Array(256), gy = new Float32Array(256);
  for (let i = 0; i < 256; i++) { const a = rand() * TAU; gx[i] = Math.cos(a); gy[i] = Math.sin(a); }
  const perm = new Uint8Array(256);
  for (let i = 0; i < 256; i++) perm[i] = i;
  for (let i = 255; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); const s = perm[i]; perm[i] = perm[j]; perm[j] = s; }
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  return function (x, y, period) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const h = (ix, iy) => perm[(perm[((ix % period) + period) % period & 255] + (((iy % period) + period) % period)) & 255];
    const d = (ix, iy, dx, dy) => { const k = h(ix, iy); return gx[k] * dx + gy[k] * dy; };
    const u = fade(xf), v = fade(yf);
    const a = d(xi, yi, xf, yf) + u * (d(xi + 1, yi, xf - 1, yf) - d(xi, yi, xf, yf));
    const b = d(xi, yi + 1, xf, yf - 1) + u * (d(xi + 1, yi + 1, xf - 1, yf - 1) - d(xi, yi + 1, xf, yf - 1));
    return a + v * (b - a);
  };
}

function makeSeaNormals(size = 512) {
  const pn = makePeriodic2(42);
  const hgt = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      let s = 0, amp = 1;
      for (let o = 0; o < 6; o++) {
        const P = 6 * (1 << o);
        // stretch along x so the swell reads as wind-driven rows
        const n = pn(u * P * 1.0, v * P * 1.0, P);
        s += amp * (o < 2 ? 1 - Math.abs(n) * 1.6 : n);
        amp *= 0.52;
      }
      hgt[y * size + x] = s;
    }
  }
  const data = new Uint8Array(size * size * 4);
  const k = 2.4;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const l = hgt[y * size + ((x - 1 + size) % size)], r = hgt[y * size + ((x + 1) % size)];
      const d = hgt[((y - 1 + size) % size) * size + x], u = hgt[((y + 1) % size) * size + x];
      let nx = (l - r) * k, ny = (d - u) * k, nz = 1;
      const len = Math.hypot(nx, ny, nz); nx /= len; ny /= len; nz /= len;
      const i = (y * size + x) * 4;
      data[i] = (nx * 0.5 + 0.5) * 255; data[i + 1] = (ny * 0.5 + 0.5) * 255; data[i + 2] = (nz * 0.5 + 0.5) * 255; data[i + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

// ---------------------------------------------------------------- renderer
const canvas = document.getElementById("gl");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: "high-performance" });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(SHOT === "land" ? 26 : 38, W / H, 0.5, 30000);

// ---------------------------------------------------------------- light
const LIGHTS = {
  // the sun has just touched the horizon off the right edge: amber glow behind the tower,
  // warm rose overhead, lamp and windows on
  dusk: {
    elev: 0.8, az: 122, exp: 0.45,
    horSun: [2.7, 1.45, 0.5], hor: [1.3, 0.74, 0.46], mid: [0.92, 0.52, 0.48], zen: [0.4, 0.29, 0.4],
    glow: [2.6, 1.4, 0.5], glowWide: [1.1, 0.55, 0.2],
    sunCol: 0xffa766, sunI: 2.4, hemiSky: 0xd9a99a, hemiGround: 0x3a2620, hemiI: 1.1, envI: 0.9,
    fog: [1.45, 0.84, 0.5], fogD: 0.00085, beam: 0.7, cover: 0.5, water: 0x17191a, dist: 4.6, size: 2.4,
    cloudLit: [1.9, 1.05, 0.62], cloudShade: [0.62, 0.42, 0.46], bloomT: 2.6,
  },
  // a touch earlier: the sun still up, everything brighter and more golden
  gold: {
    elev: 1.5, az: 136, exp: 0.9,
    horSun: [2.8, 1.7, 0.85], hor: [1.35, 0.98, 0.74], mid: [0.95, 0.74, 0.66], zen: [0.5, 0.46, 0.55],
    glow: [3.0, 1.8, 0.8], glowWide: [1.1, 0.7, 0.3],
    sunCol: 0xffb877, sunI: 2.6, hemiSky: 0xd8b9a8, hemiGround: 0x3a2a20, hemiI: 0.6, envI: 0.5,
    fog: 0xe0b896, fogD: 0.0011, beam: 0.35, cover: 0.58, water: 0x1a1c1d, dist: 3.4, size: 2.2,
    cloudLit: [1.9, 1.3, 0.9], cloudShade: [0.8, 0.62, 0.62],
  },
};
const L = Object.assign({}, LIGHTS[LIGHT], JSON.parse(qs.get("p") || "{}"));
renderer.toneMappingExposure = L.exp;
const sunDir = new THREE.Vector3().setFromSphericalCoords(1, deg(90 - L.elev), deg(L.az));
const v3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);

// art-directed sky: a warm gradient by elevation, warmer toward the sun's azimuth, plus the sun glow
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  depthWrite: false,
  fog: false,
  uniforms: {
    uSun: { value: sunDir.clone() },
    uHorSun: { value: v3(L.horSun) }, uHor: { value: v3(L.hor) }, uMid: { value: v3(L.mid) }, uZen: { value: v3(L.zen) },
    uGlow: { value: v3(L.glow) }, uGlowWide: { value: v3(L.glowWide) },
  },
  vertexShader: /* glsl */ `
    varying vec3 vDir;
    void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform vec3 uSun, uHorSun, uHor, uMid, uZen, uGlow, uGlowWide;
    varying vec3 vDir;
    void main(){
      vec3 d = normalize(vDir);
      float e = d.y;
      vec2 a = normalize(d.xz + 1e-5), b = normalize(uSun.xz + 1e-5);
      float toward = max(dot(a, b), 0.0);
      vec3 hor = mix(uHor, uHorSun, pow(toward, 4.0));
      vec3 mid = mix(uMid, uMid * vec3(1.18, 1.05, 0.9), pow(toward, 2.0));
      vec3 col = mix(hor, mid, smoothstep(0.0, 0.2, e));
      col = mix(col, uZen, smoothstep(0.16, 0.8, e));
      col = mix(col, hor * 0.55, smoothstep(0.0, -0.06, e));
      float s = max(dot(d, uSun), 0.0);
      col += uGlow * pow(s, 28.0) + uGlowWide * pow(s, 5.0) * (1.0 - smoothstep(-0.05, 0.4, e));
      gl_FragColor = vec4(col, 1.0);
    }`,
});
const sky = new THREE.Mesh(new THREE.SphereGeometry(10000, 64, 32), skyMat);

const pmrem = new THREE.PMREMGenerator(renderer);
const envScene = new THREE.Scene();
envScene.add(new THREE.Mesh(sky.geometry, skyMat));
const envRT = pmrem.fromScene(envScene);
scene.add(sky);
scene.environment = envRT.texture;
scene.environmentIntensity = L.envI;

const sunLight = new THREE.DirectionalLight(L.sunCol, L.sunI);
sunLight.position.copy(sunDir).multiplyScalar(400);
scene.add(sunLight);
scene.add(new THREE.HemisphereLight(L.hemiSky, L.hemiGround, L.hemiI));

scene.fog = new THREE.FogExp2(Array.isArray(L.fog) ? new THREE.Color(L.fog[0], L.fog[1], L.fog[2]) : L.fog, L.fogD);

// ---------------------------------------------------------------- sea
const seaNormals = makeSeaNormals(512);
const water = new Water(new THREE.PlaneGeometry(12000, 12000), {
  textureWidth: 1024,
  textureHeight: 1024,
  waterNormals: seaNormals,
  sunDirection: sunDir.clone(),
  sunColor: L.sunCol,
  waterColor: L.water,
  distortionScale: L.dist,
  fog: true,
});
water.rotation.x = -Math.PI / 2;
water.material.uniforms.size.value = L.size;
// whole tiles per loop, so the sea repeats exactly every LOOP seconds
water.material.fragmentShader = water.material.fragmentShader
  .replace("vec2 uv0 = ( uv / 103.0 ) + vec2(time / 17.0, time / 29.0);", `vec2 uv0 = ( uv / 103.0 ) + vec2(time / ${LOOP.toFixed(1)}, 0.0);`)
  .replace("vec2 uv1 = uv / 107.0-vec2( time / -19.0, time / 31.0 );", `vec2 uv1 = uv / 61.0 - vec2( 0.0, time / ${LOOP.toFixed(1)} );`)
  .replace("vec2 uv2 = uv / vec2( 8907.0, 9803.0 ) + vec2( time / 101.0, time / 97.0 );", "vec2 uv2 = uv / vec2( 8907.0, 9803.0 );")
  .replace("vec2 uv3 = uv / vec2( 1091.0, 1027.0 ) - vec2( time / 109.0, time / -113.0 );", "vec2 uv3 = uv / vec2( 1091.0, 1027.0 );");
scene.add(water);

// ---------------------------------------------------------------- headland
const HEAD_TOP = 6.2;
function headlandHeight(x, z) {
  // elliptical island, flat grassy top, steep broken cliffs
  const ex = x / 30, ez = z / 22;
  let d = Math.sqrt(ex * ex + ez * ez);
  d += fbm3(x * 0.045, 0.3, z * 0.045, 4) * 0.28;
  const cliff = 1 - THREE.MathUtils.smoothstep(d, 0.78, 0.98);
  const top = HEAD_TOP + fbm3(x * 0.07, 3.1, z * 0.07, 4) * 0.9 + Math.max(0, 0.55 - d) * 1.6;
  let h = -5 + (top + 5) * Math.pow(cliff, 0.55);
  // ledges and strata on the cliff faces
  // two rocky shoulders so the skyline is not a flat slab
  const hump = (cx, cz, rx, rz, hgt) => { const q = ((x - cx) / rx) ** 2 + ((z - cz) / rz) ** 2; return hgt * Math.exp(-q * 2.2); };
  h += cliff * (hump(-19, -4, 9, 8, 3.2) + hump(20, 2, 7, 9, 2.2) + hump(-8, -12, 6, 5, 1.6)) * (0.8 + 0.4 * fbm3(x * 0.2, z * 0.2, 4.4, 3));
  const face = cliff * (1 - cliff) * 4;
  h += face * (fbm3(x * 0.25, z * 0.25, 7.7, 4) * 1.4 + Math.sin(h * 2.2 + fbm3(x * 0.1, z * 0.1, 1.3, 2) * 3) * 0.25);
  return h;
}
function buildHeadland() {
  const seg = 220, size = 84;
  const geo = new THREE.PlaneGeometry(size, size, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    pos.setY(i, headlandHeight(x, z));
  }
  // push the cliff faces sideways with noise so they break into buttresses instead of a smooth curtain
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const e = 0.4;
    const gx = headlandHeight(x + e, z) - headlandHeight(x - e, z);
    const gz = headlandHeight(x, z + e) - headlandHeight(x, z - e);
    const steep = Math.min(1, Math.hypot(gx, gz) / 3);
    const k = steep * 1.6;
    pos.setX(i, x + fbm3(x * 0.35, y * 0.5, z * 0.35, 3) * k);
    pos.setZ(i, z + fbm3(z * 0.35, y * 0.5 + 5.0, x * 0.35, 3) * k);
    pos.setY(i, y + fbm3(x * 0.6, y * 0.6, z * 0.6, 3) * steep * 0.5);
  }
  geo.computeVertexNormals();
  const nrm = geo.attributes.normal;
  const cols = new Float32Array(pos.count * 3);
  const rock = new THREE.Color(0x7a6a5b), rockDark = new THREE.Color(0x3e352e), wet = new THREE.Color(0x221e1b);
  const grass = new THREE.Color(0x7d7a3c), grassDry = new THREE.Color(0xa88f52);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const ny = nrm.getY(i);
    const v = fbm3(x * 0.3, y * 0.3, z * 0.3, 3);
    c.copy(rock).lerp(rockDark, THREE.MathUtils.clamp(0.45 + v * 0.9, 0, 1));
    if (y < 1.2) c.lerp(wet, THREE.MathUtils.smoothstep(1.2 - y, 0, 1.4));
    const g = THREE.MathUtils.smoothstep(ny, 0.72, 0.9) * THREE.MathUtils.smoothstep(y, HEAD_TOP - 1.6, HEAD_TOP - 0.4);
    if (g > 0) {
      const gc = grass.clone().lerp(grassDry, THREE.MathUtils.clamp(0.5 + fbm3(x * 0.12, 9.1, z * 0.12, 3) * 1.4, 0, 1));
      c.lerp(gc, g);
    }
    cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(cols, 3));
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, metalness: 0, envMapIntensity: 0.6 }));
  return mesh;
}
scene.add(buildHeadland());

function boulder(seed, r, x, z, sy = 0.7) {
  const geo = mergeVertices(new THREE.IcosahedronGeometry(1, 4));
  geo.deleteAttribute("normal");
  const p = geo.attributes.position;
  const o = seed * 13.1;
  for (let i = 0; i < p.count; i++) {
    const vx = p.getX(i), vy = p.getY(i), vz = p.getZ(i);
    const k = 1 + fbm3(vx * 1.3 + o, vy * 1.3, vz * 1.3 - o, 4) * 0.45;
    p.setXYZ(i, vx * k, vy * k * sy, vz * k);
  }
  geo.computeVertexNormals();
  const tone = 0.55 + mulberry32(seed)() * 0.35;
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: new THREE.Color(0x645649).multiplyScalar(tone), roughness: 0.9 }));
  m.scale.setScalar(r);
  m.position.set(x, -0.2, z);
  m.rotation.y = seed;
  return m;
}
{
  const r = mulberry32(77);
  for (let i = 0; i < 70; i++) {
    const a = r() * TAU, rr = 0.9 + r() * 0.24;
    const x = Math.cos(a) * 30 * rr, z = Math.sin(a) * 22 * rr;
    scene.add(boulder(i + 1, 0.8 + r() * 2.8, x, z, 0.45 + r() * 0.45));
  }
}

// ---------------------------------------------------------------- lighthouse
function towerTexture() {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 1024;
  const g = c.getContext("2d");
  g.fillStyle = "#efe9df"; g.fillRect(0, 0, 512, 1024);
  const r = mulberry32(5);
  // weathering streaks running down from the gallery
  for (let i = 0; i < 260; i++) {
    const x = r() * 512, w = 1 + r() * 5, len = 80 + r() * 600, a = 0.02 + r() * 0.05;
    const grd = g.createLinearGradient(0, 0, 0, len);
    grd.addColorStop(0, `rgba(70,60,52,${a})`); grd.addColorStop(1, "rgba(70,60,52,0)");
    g.fillStyle = grd; g.fillRect(x, 0, w, len);
  }
  // salt grime at the base
  const base = g.createLinearGradient(0, 1024, 0, 820);
  base.addColorStop(0, "rgba(60,52,44,0.35)"); base.addColorStop(1, "rgba(60,52,44,0)");
  g.fillStyle = base; g.fillRect(0, 820, 512, 204);
  // fine plaster noise
  const img = g.getImageData(0, 0, 512, 1024);
  for (let i = 0; i < img.data.length; i += 4) {
    const d = (r() - 0.5) * 10;
    img.data[i] += d; img.data[i + 1] += d; img.data[i + 2] += d;
  }
  g.putImageData(img, 0, 0);
  // small deep windows climbing the tower (u = 0 faces the camera)
  const wins = [[0.02, 0.62], [0.0, 0.40], [0.52, 0.52], [0.5, 0.28], [0.98, 0.18]];
  for (const [u, v] of wins) {
    g.fillStyle = "#2a2420"; g.fillRect(u * 512 - 9, v * 1024 - 22, 18, 44);
    g.fillStyle = "rgba(255,255,255,0.35)"; g.fillRect(u * 512 - 11, v * 1024 + 22, 22, 4);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

const LH = new THREE.Group();
LH.position.set(0, HEAD_TOP - 0.3, 0);
scene.add(LH);

const TOWER_H = 24;
const white = new THREE.MeshStandardMaterial({ map: towerTexture(), roughness: 0.78, metalness: 0 });
const red = new THREE.MeshStandardMaterial({ color: 0x8a2a1c, roughness: 0.55, metalness: 0.05 });
const iron = new THREE.MeshStandardMaterial({ color: 0x2b2522, roughness: 0.45, metalness: 0.6 });
{
  const pts = [];
  pts.push(new THREE.Vector2(0, 0), new THREE.Vector2(3.9, 0), new THREE.Vector2(3.9, 1.1), new THREE.Vector2(3.35, 1.25));
  for (let i = 0; i <= 24; i++) {
    const y = 1.25 + (TOWER_H - 1.25) * (i / 24);
    const k = 1 - i / 24;
    pts.push(new THREE.Vector2(2.25 + 1.1 * Math.pow(k, 1.35), y));
  }
  pts.push(new THREE.Vector2(0, TOWER_H));
  const tower = new THREE.Mesh(new THREE.LatheGeometry(pts, 96), white);
  LH.add(tower);
}
// corbelled gallery
const corbel = new THREE.Mesh(new THREE.CylinderGeometry(3.25, 2.3, 1.1, 64), white);
corbel.position.y = TOWER_H + 0.1; LH.add(corbel);
const deck = new THREE.Mesh(new THREE.CylinderGeometry(3.35, 3.35, 0.32, 64), red);
deck.position.y = TOWER_H + 0.8; LH.add(deck);
// railing
{
  const railY = TOWER_H + 0.96;
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * TAU;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.1, 6), iron);
    post.position.set(Math.cos(a) * 3.2, railY + 0.55, Math.sin(a) * 3.2);
    LH.add(post);
  }
  for (const y of [railY + 1.08, railY + 0.55]) {
    const rail = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.055, 6, 96), iron);
    rail.rotation.x = Math.PI / 2; rail.position.y = y; LH.add(rail);
  }
}
// lantern room
const LAMP_Y = TOWER_H + 3.0;
{
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.95, 1.95, 1.0, 16), red);
  base.position.y = TOWER_H + 1.45; LH.add(base);
  const glass = new THREE.Mesh(
    new THREE.CylinderGeometry(1.82, 1.82, 2.5, 16, 1, true),
    new THREE.MeshPhysicalMaterial({ color: 0xffe9c8, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.28, emissive: 0xffb15a, emissiveIntensity: 0.35, side: THREE.DoubleSide, depthWrite: false })
  );
  glass.position.y = TOWER_H + 3.2; LH.add(glass);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU;
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.09, 2.5, 0.09), iron);
    m.position.set(Math.cos(a) * 1.84, TOWER_H + 3.2, Math.sin(a) * 1.84);
    LH.add(m);
  }
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 0.22, 32), iron);
  ring.position.y = TOWER_H + 4.5; LH.add(ring);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(2.0, 48, 16, 0, TAU, 0, Math.PI / 2), red);
  dome.scale.y = 0.72; dome.position.y = TOWER_H + 4.6; LH.add(dome);
  const vent = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 12), iron);
  vent.position.y = TOWER_H + 6.25; LH.add(vent);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 6), iron);
  rod.position.y = TOWER_H + 7.0; LH.add(rod);
}
// the lamp and its lens
const lampMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.82, 0.55).multiplyScalar(14) });
const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 12), lampMat);
lamp.position.y = LAMP_Y; LH.add(lamp);
const lampLight = new THREE.PointLight(0xffc27a, 60, 18, 2);
lampLight.position.y = LAMP_Y; LH.add(lampLight);

// keeper's house: lights on, someone is home
{
  const house = new THREE.Group();
  house.position.set(-6.8, HEAD_TOP - 0.5, 3.2);
  house.rotation.y = 0.25;
  const walls = new THREE.Mesh(new THREE.BoxGeometry(7, 3.4, 4.4), white);
  walls.position.y = 1.7; house.add(walls);
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-2.5, 0); roofShape.lineTo(0, 1.9); roofShape.lineTo(2.5, 0); roofShape.lineTo(-2.5, 0);
  const roof = new THREE.Mesh(new THREE.ExtrudeGeometry(roofShape, { depth: 7.4, bevelEnabled: false }), red);
  roof.rotation.y = Math.PI / 2; roof.position.set(-3.7, 3.4, 0); house.add(roof);
  const winMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.72, 0.4).multiplyScalar(2.2) });
  for (const x of [-2.2, 0.2, 2.4]) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 1.05), winMat);
    w.position.set(x, 1.9, 2.21); house.add(w);
  }
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.6, 0.7), white);
  chimney.position.set(2.2, 4.6, -0.6); house.add(chimney);
  scene.add(house);
}

// ---------------------------------------------------------------- beams
const beamMat = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  side: THREE.DoubleSide,
  uniforms: { uColor: { value: new THREE.Color(1.0, 0.8, 0.52) }, uStrength: { value: L.beam } },
  vertexShader: /* glsl */ `
    varying float vAlong; varying vec3 vN; varying vec3 vView; varying vec3 vWorld;
    void main() {
      vAlong = position.x / 170.0;
      vN = normalize(normalMatrix * normal);
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vView = -mv.xyz;
      vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: /* glsl */ `
    uniform vec3 uColor; uniform float uStrength;
    varying float vAlong; varying vec3 vN; varying vec3 vView; varying vec3 vWorld;
    float hash(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
    float vnoise(vec3 p){
      vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
      return mix(mix(mix(hash(i), hash(i+vec3(1,0,0)), f.x), mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
                 mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x), mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y), f.z);
    }
    void main() {
      float edge = abs(dot(normalize(vN), normalize(vView)));
      edge = pow(edge, 2.2);
      float fall = pow(clamp(1.0 - vAlong, 0.0, 1.0), 1.8) * smoothstep(0.0, 0.02, vAlong);
      float haze = 0.75 + 0.5 * vnoise(vWorld * 0.08);
      float a = edge * fall * haze * uStrength;
      gl_FragColor = vec4(uColor * a, 1.0);
    }`,
});
function beamGeometry() {
  const g = new THREE.CylinderGeometry(0.45, 10, 170, 48, 1, true);
  g.translate(0, -85, 0);
  g.rotateZ(Math.PI / 2);
  return g;
}
const beamPivot = new THREE.Group();
beamPivot.position.y = LAMP_Y;
LH.add(beamPivot);
for (const a of [0, Math.PI]) {
  const b = new THREE.Mesh(beamGeometry(), beamMat);
  b.rotation.y = a;
  b.rotation.z = deg(-1.2);
  beamPivot.add(b);
}

// glow + flare sprites at the lamp
function glowTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, "rgba(255,240,215,1)");
  grd.addColorStop(0.12, "rgba(255,206,140,0.55)");
  grd.addColorStop(0.4, "rgba(255,170,90,0.12)");
  grd.addColorStop(1, "rgba(255,150,70,0)");
  g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const glowTex = glowTexture();
const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, color: 0xffffff }));
glow.position.y = LAMP_Y; LH.add(glow);
const streak = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, color: 0xffd9a8 }));
streak.position.y = LAMP_Y; LH.add(streak);

// ---------------------------------------------------------------- clouds
const cloudMat = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  side: THREE.BackSide,
  fog: false,
  uniforms: {
    uPhase: { value: 0 },
    uSun: { value: sunDir.clone() },
    uLit: { value: v3(L.cloudLit) },
    uShade: { value: v3(L.cloudShade) },
    uCover: { value: L.cover },
  },
  vertexShader: /* glsl */ `
    varying vec3 vDir;
    void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position.z = gl_Position.w * 0.9999; }`,
  fragmentShader: /* glsl */ `
    uniform float uPhase; uniform vec3 uSun; uniform vec3 uLit; uniform vec3 uShade; uniform float uCover;
    varying vec3 vDir;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
      return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
    float fbm(vec2 p){ float s=0.0, a=0.5; mat2 r=mat2(1.6,1.2,-1.2,1.6); for(int i=0;i<6;i++){ s+=a*noise(p); p=r*p; a*=0.5; } return s; }
    float field(vec2 p){
      // two samples drifting with the wind, cross-faded over the loop and renormalised
      vec2 wind = vec2(0.55, 0.12);
      float a = fbm(p + wind * uPhase);
      float b = fbm(p + wind * (uPhase - 1.0));
      float w = uPhase;
      float m = mix(a, b, w);
      return (m - 0.5) / sqrt(w*w + (1.0-w)*(1.0-w)) + 0.5;
    }
    void main(){
      vec3 d = normalize(vDir);
      if (d.y < 0.0) discard;
      vec2 p = d.xz / (d.y + 0.07) * vec2(0.8, 1.5);
      float n = field(p * 0.9);
      float n2 = field(p * 0.9 + uSun.xz * 0.05);
      float cover = smoothstep(uCover, uCover + 0.22, n);
      cover *= smoothstep(0.0, 0.035, d.y) * (1.0 - smoothstep(0.32, 0.75, d.y));
      float s = max(dot(d, uSun), 0.0);
      float shade = clamp((n - n2) * 4.0 + 0.45, 0.0, 1.0);
      vec3 col = mix(uShade, uLit, shade * 0.75 + pow(s, 6.0) * 0.6);
      gl_FragColor = vec4(col, cover * 0.82);
    }`,
});
const clouds = new THREE.Mesh(new THREE.SphereGeometry(9000, 64, 32), cloudMat);
scene.add(clouds);

// ---------------------------------------------------------------- framing
// subject placement on screen (fractions of the frame) and the camera that delivers it
const FRAME = SHOT === "land"
  ? { dist: 175, height: 3.2, sx: 0.70, horizon: 0.64, lookYaw: -18 }
  : { dist: 230, height: 3.0, sx: 0.60, horizon: 0.77, lookYaw: -18 };
{
  const yaw = deg(FRAME.lookYaw); // direction the camera sits from the lighthouse, around Y
  const cpos = new THREE.Vector3(Math.sin(yaw) * FRAME.dist, FRAME.height, Math.cos(yaw) * FRAME.dist);
  camera.position.copy(cpos);
  camera.lookAt(0, FRAME.height, 0);
  // shift the aim so the tower lands at sx and the horizon at the requested height
  const vHalf = deg(camera.fov / 2);
  const hHalf = Math.atan(Math.tan(vHalf) * camera.aspect);
  const yawOff = Math.atan((FRAME.sx - 0.5) * 2 * Math.tan(hHalf));
  const pitch = Math.atan((FRAME.horizon - 0.5) * 2 * Math.tan(vHalf));
  camera.rotateY(yawOff);
  camera.rotateX(pitch);
  camera.updateMatrixWorld();
}
// windows on the tower face the camera
LH.children[0].rotation.y = Math.atan2(camera.position.x, camera.position.z);

// ---------------------------------------------------------------- post
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 0 }));
composer.setPixelRatio(1);
composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.45, 0.6, L.bloomT || 2.6);
composer.addPass(bloom);
const grade = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uSeed: { value: 0 }, uAspect: { value: W / H } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform float uSeed; uniform float uAspect; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p + uSeed * 17.13, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      vec2 q = (vUv - 0.5) * vec2(uAspect, 1.0);
      float vig = smoothstep(1.25, 0.25, length(q) * 1.05);
      c.rgb *= mix(0.72, 1.0, vig);
      c.rgb += (hash(vUv * 1024.0) - 0.5) * 0.035 * (0.35 + c.rgb);
      gl_FragColor = c;
    }`,
});
composer.addPass(grade);
composer.addPass(new OutputPass());

// ---------------------------------------------------------------- time
const camFlat = new THREE.Vector3();
const beamDir = new THREE.Vector3();
function renderAt(time) {
  const t = ((time % LOOP) + LOOP) % LOOP;
  const u = t / LOOP;
  water.material.uniforms.time.value = t;
  cloudMat.uniforms.uPhase.value = u;
  const theta = deg(40) - TAU * u;
  beamPivot.rotation.y = theta;

  // flash when a beam swings toward the camera
  camFlat.set(camera.position.x, 0, camera.position.z).normalize();
  let flare = 0;
  for (const off of [0, Math.PI]) {
    const a = theta + off;
    beamDir.set(Math.cos(a), 0, -Math.sin(a));
    flare = Math.max(flare, Math.pow(Math.max(0, beamDir.dot(camFlat)), 40));
  }
  const g = LIGHT === "gold" ? 7 : 9;
  glow.scale.setScalar(g + flare * 70);
  glow.material.opacity = 0.75 + flare * 0.25;
  streak.scale.set(14 + flare * 260, 0.9 + flare * 3.5, 1);
  streak.material.opacity = 0.18 + flare * 0.8;
  lampLight.intensity = 60 + flare * 160;
  bloom.strength = 0.45 + flare * 0.5;

  grade.uniforms.uSeed.value = Math.round(t * FPS) % 24;
  composer.render();
}

window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
window.__faroRender = renderAt;
renderAt(window.__hfThreeTime || 0);
