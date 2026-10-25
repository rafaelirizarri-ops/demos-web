/* =========================================================================
   CONPAV: portada de puntos
   One example structure drawn in points of light, with real depth (3D):
   a road that crosses a river on a bridge, the river held by stepped
   protection walls, a cut slope with soil nails where the road meets a
   hill, and a building frame going up on the hilltop. It is an illustration
   of the kinds of work the company does, never one of its works, and it
   carries no figures.

   - Plain WebGL 1 (no library): about 37 000 points on large screens and
     26 000 on phones. Size and brightness come from depth and from a light
     on the upper left, so the drawing reads as solid.
   - On load the structure assembles in building order: ground, river, piers,
     deck, road, the slope, then the building floor by floor.
   - Each point twinkles at its own pace, a few blink off, and a slow band of
     light sweeps across. The pause button stops all of it.
   - Scroll (main.js) moves the camera along five stops and lights each area
     in the logo's orange: Puentes, Obras hidráulicas, Carreteras,
     Estabilización, Edificación. At both ends the whole structure is lit.
   main.js drives it through window.conpavHero. Without WebGL it adds
   .no-webgl to <html> and main.js shows a still image instead.
   ========================================================================= */
(function () {
  "use strict";

  const root = document.documentElement;
  const canvas = document.querySelector(".hero__canvas");
  if (!canvas) return;
  const gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: "high-performance" });
  if (!gl) { root.classList.add("no-webgl"); return; }
  // Without a GPU (software rendering) every frame costs the main thread: then the drawing
  // stays still and only redraws when the scroll moves the camera.
  const dbg = gl.getExtension("WEBGL_debug_renderer_info");
  const soft = /swiftshader|llvmpipe|softpipe|software/i.test(dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : "");

  /* ---------- palette (sRGB 0-1) ---------- */
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const BG = hex("#292D32");      // graphite
  const LIGHT = hex("#F5F4F0");   // the site's paper, as light
  const ORANGE = hex("#F28C6A");  // the logo's orange

  /* ---------- areas: the order of uHL ---------- */
  // 0 ground, 1 bridges, 2 hydraulic works, 3 roads, 4 slope stabilisation, 5 building, 6 water (lit with 2)
  const AREAS = ["puentes", "hidraulicas", "carreteras", "estabilizacion", "edificacion"];
  const AREA_ID = { puentes: 1, hidraulicas: 2, carreteras: 3, estabilizacion: 4, edificacion: 5 };

  /* ---------- deterministic randomness ---------- */
  let seed = 20111;
  const rnd = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  /* ---------- the structure ---------- */
  const small = Math.min(window.innerWidth, window.innerHeight) < 600;
  const keepSurface = small || soft ? 0.5 : 1;   // phones (and no GPU) keep every line, half of the surfaces
  const LDIR = (() => { const v = [-0.55, 0.78, 0.32], l = Math.hypot(...v); return v.map((c) => c / l); })();
  const lit = (n, base) => base * (0.32 + 0.68 * Math.max(0, n[0] * LDIR[0] + n[1] * LDIR[1] + n[2] * LDIR[2]));

  const P = [], D = [];
  // the drawing fades out towards its edges, so it floats in the dark
  const edge = (x, z) => smooth(-118, -98, x) * smooth(128, 106, x) * smooth(-64, -44, z) * smooth(46, 30, z);
  function add(x, y, z, b, area, order, surface) {
    if (surface && rnd() > keepSurface) return;
    const e = edge(x, z);
    if (e < 0.02) return;
    P.push(x, y, z);
    D.push(b * e, area, rnd(), order);
  }
  function line(a, b, step, bright, area, order) {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), n = Math.max(1, Math.round(len / step));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      add(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, bright, area, typeof order === "function" ? order(t) : order);
    }
  }

  // Ground: a plateau cut by a river channel held by two stepped walls; the banks rise from the
  // top of the walls to the plateau. On the right, a hill the road cuts through, with a building
  // going up on top.
  const BED = -16;                                                 // the river bed
  const WALLS = [{ x: 9, y0: BED, y1: -12.5 }, { x: 10.6, y0: -12.5, y1: -9.5 }];
  const BANK = (ax) => -9.5 * smooth(40, 10.6, ax);               // from the wall top up to the plateau
  const HILL = (x) => 22 * smooth(54, 84, x);                     // height of the hill behind the cut
  const TOE = -6.6;                                               // the cut starts at the back edge of the road
  const RUN = 0.6;                                                // the cut face: 0.6 back for 1 up
  function ground(x, z) {
    let y = BANK(Math.abs(x));
    const h = HILL(x);
    if (h > 0 && z < TOE) y = Math.max(y, Math.min(h, (TOE - z) / RUN));
    if (h > 0 && z > 7) y -= 2.4 * smooth(7, 30, z) * smooth(54, 84, x);  // fill falling away in front
    y += 0.5 * Math.sin(x * 0.11 + z * 0.07) * Math.sin(z * 0.13 - x * 0.05) * smooth(12, 40, Math.abs(x));
    return y;
  }
  const ROAD_W = 5.5, DECK = { x0: -40, x1: 40, top: 0, bottom: -1.8 };
  const BLD = { x0: 88, x1: 112, z0: -42, z1: -24, base: 22, floor: 3.6, floors: 5 };

  // Ground: scan lines across the site, like a topographic survey, fading out around it
  {
    const dz = small ? 2.5 : 1.8, dx = small ? 1.05 : 0.75;
    for (let z = -64; z <= 46; z += dz) {
      for (let x = -118; x <= 128; x += dx) {
        const jx = x + (rnd() - 0.5) * dx * 0.6, jz = z + (rnd() - 0.5) * 0.2;
        const island = smooth(1.12, 0.5, Math.hypot((jx - 12) / 134, (jz + 10) / 60));
        if (island < 0.04) continue;
        if (Math.abs(jz) < ROAD_W + 0.4 && (jx < DECK.x0 || jx > DECK.x1)) continue; // the road
        if (Math.abs(jx) < 10.5) continue;                                           // river and walls
        if (HILL(jx) > 0.5 && jz < TOE && jz > TOE - HILL(jx) * RUN) continue;        // the cut face
        if (jx > BLD.x0 - 1 && jx < BLD.x1 + 1 && jz > BLD.z0 - 1 && jz < BLD.z1 + 1) continue;
        const y = ground(jx, jz), e = 0.6;
        const nx = ground(jx - e, jz) - ground(jx + e, jz), nz = ground(jx, jz - e) - ground(jx, jz + e);
        const l = Math.hypot(nx, 2 * e, nz);
        add(jx, y, jz, lit([nx / l, (2 * e) / l, nz / l], 0.46) * island, 0, 0.02 + 0.16 * ((jx + 118) / 246) + 0.04 * rnd());
      }
    }
  }

  // River: water that flows (area 6) between two stepped protection walls (area 2)
  {
    for (let z = -64; z <= 46; z += 1.1) for (let x = -8.4; x <= 8.4; x += 1.2) add(x + (rnd() - 0.5) * 0.8, BED + 0.6, z + (rnd() - 0.5) * 0.8, 0.34, 6, 0.2 + 0.05 * rnd(), true);
    const ord = (z) => 0.24 + 0.1 * ((z + 64) / 110);
    [-1, 1].forEach((side) => {
      WALLS.forEach((st, i) => {
        for (let z = -64; z <= 46; z += 0.8) {
          for (let y = st.y0; y <= st.y1; y += 0.8) add(side * st.x, y, z, lit([-side, 0, 0], 0.55), 2, ord(z), true);
          add(side * st.x, st.y1, z, 0.95, 2, ord(z));                                   // the top edge of each step
          if (i === 0) add(side * (st.x + 0.8), st.y1, z, 0.4, 2, ord(z), true);       // the terrace between the steps
        }
        for (let z = -64; z <= 46; z += 4) line([side * st.x, st.y0, z], [side * st.x, st.y1, z], 0.5, 0.7, 2, ord(z)); // gabion joints
      });
    });
  }

  // Bridge: deck, three girders, two piers of two columns with a cap beam, railings
  {
    const along = (x) => 0.34 + 0.18 * ((x - DECK.x0) / (DECK.x1 - DECK.x0));
    for (let x = DECK.x0; x <= DECK.x1; x += 1.3) for (let z = -ROAD_W; z <= ROAD_W; z += 1.3) add(x, DECK.top, z, 0.42, 1, along(x), true);
    for (let x = DECK.x0; x <= DECK.x1; x += 0.7) {
      [-1, 1].forEach((side) => {
        for (let y = DECK.bottom; y <= DECK.top; y += 0.6) add(x, y, side * ROAD_W, lit([0, 0, side], 0.7), 1, along(x), true);
      });
    }
    [[DECK.top, -ROAD_W], [DECK.top, ROAD_W], [DECK.bottom, -ROAD_W], [DECK.bottom, ROAD_W]].forEach(([y, z]) => line([DECK.x0, y, z], [DECK.x1, y, z], 0.32, 1, 1, along));
    [-3.6, 0, 3.6].forEach((z) => {
      line([DECK.x0, -3.1, z], [DECK.x1, -3.1, z], 0.45, 0.62, 1, along);
      for (let x = DECK.x0; x <= DECK.x1; x += 5) line([x, DECK.bottom, z], [x, -3.1, z], 0.4, 0.5, 1, along(x));
    });
    // railings and posts
    [-1, 1].forEach((side) => {
      line([DECK.x0, 1.15, side * ROAD_W], [DECK.x1, 1.15, side * ROAD_W], 0.3, 0.75, 1, along);
      for (let x = DECK.x0; x <= DECK.x1; x += 2.5) line([x, 0, side * ROAD_W], [x, 1.15, side * ROAD_W], 0.3, 0.55, 1, along(x));
    });
    // piers rise from the banks
    [-14, 14].forEach((px) => {
      const foot = ground(px, 0) - 0.3;
      [-3.4, 3.4].forEach((pz) => {
        for (let y = foot; y <= -3.1; y += 0.45) {
          const o = 0.3 + 0.08 * ((y - foot) / (-3.1 - foot));
          for (let k = 0; k < 14; k++) {
            const a = (k / 14) * Math.PI * 2, n = [Math.cos(a), 0, Math.sin(a)];
            add(px + 0.95 * n[0], y, pz + 0.95 * n[2], lit(n, 0.85), 1, o, k % 2 === 1);
          }
        }
      });
      // cap beam
      [[-1.3, -3.1], [1.3, -3.1], [-1.3, -4.6], [1.3, -4.6]].forEach(([dx, y]) => line([px + dx, y, -5], [px + dx, y, 5], 0.3, 0.95, 1, 0.38));
      for (let z = -5; z <= 5; z += 0.6) for (let y = -4.6; y <= -3.1; y += 0.5) add(px - 1.3, y, z, lit([-1, 0, 0], 0.6), 1, 0.38, true);
    });
  }

  // Road on both sides, through the cut: surface, edges, centre dashes (on the deck too)
  {
    const out = (x) => 0.5 + 0.26 * Math.min(1, Math.abs(x) / 120);
    const runs = [[-118, DECK.x0], [DECK.x1, 128]];
    runs.forEach(([a, b]) => {
      for (let x = a; x <= b; x += 1.4) for (let z = -ROAD_W; z <= ROAD_W; z += 1.4) add(x + (rnd() - 0.5) * 0.5, 0, z, 0.32, 3, out(x), true);
      [-ROAD_W, ROAD_W].forEach((z) => line([a, 0.05, z], [b, 0.05, z], 0.34, 0.9, 3, (t) => out(a + (b - a) * t)));
    });
    for (let x = -118; x < 128; x += 6) line([x, 0.08, 0], [x + 3, 0.08, 0], 0.3, 1, 3, out(x));
  }

  // Cut slope: the face, its mesh, soil nails with plates, the toe wall and the crest. Kept dim:
  // one area of five, it reads as the hill under the building until the tour reaches it
  {
    const x0 = 56, x1 = 128;
    const at = (x, u) => { const h = HILL(x); return [x, u * h, TOE - u * h * RUN]; };
    const ord = (x, u) => 0.72 + 0.1 * ((x - x0) / (x1 - x0)) + 0.08 * u;
    for (let x = x0; x <= x1; x += 1.1) {
      const h = HILL(x);
      if (h < 0.6) continue;
      const lenFace = Math.hypot(h, h * RUN), n = Math.max(2, Math.round(lenFace / 1.1));
      for (let i = 0; i <= n; i++) { const u = i / n, p = at(x, u); add(p[0], p[1], p[2], lit([0, RUN / Math.hypot(1, RUN), 1 / Math.hypot(1, RUN)], 0.4), 4, ord(x, u), true); }
    }
    // mesh: two diagonal families
    for (let k = -30; k <= 70; k += 3.2) {
      [1, -1].forEach((dir) => {
        const pts = [];
        for (let u = 0; u <= 1.0001; u += 0.025) {
          const x = x0 + 6 + k + dir * u * 20;
          if (x < x0 + 4 || x > x1) continue;
          if (HILL(x) < 1.5) continue;
          pts.push(at(x, u));
        }
        for (let i = 1; i < pts.length; i++) line(pts[i - 1], pts[i], 0.6, 0.24, 4, ord(pts[i][0], 0.5));
      });
    }
    // soil nails with their plates
    for (let x = x0 + 8; x <= x1 - 2; x += 3.2) {
      const h = HILL(x);
      for (let u = 0.12; u <= 0.92; u += 2.8 / Math.max(h, 1)) {
        const p = at(x, u);
        add(p[0], p[1], p[2] + 0.05, 0.7, 4, ord(x, u));
        [[0.35, 0], [-0.35, 0], [0, 0.3], [0, -0.3]].forEach(([dx, dy]) => add(p[0] + dx, p[1] + dy, p[2] + 0.05 - dy * RUN, 0.42, 4, ord(x, u)));
      }
    }
    line([x0 + 2, 1.6, TOE + 0.1], [x1, 1.6, TOE + 0.1], 0.3, 0.95, 4, (t) => 0.72 + 0.1 * t);   // toe wall
    for (let x = x0 + 2; x <= x1; x += 0.5) add(x, 0.8, TOE + 0.1, 0.5, 4, 0.72 + 0.1 * ((x - x0) / (x1 - x0)));
    const crest = [];
    for (let x = x0 + 3; x <= x1; x += 1) crest.push(at(x, 1));
    for (let i = 1; i < crest.length; i++) line(crest[i - 1], crest[i], 0.35, 0.85, 4, 0.9);
  }

  // Building frame on the hilltop, going up floor by floor; the top floor has columns only
  {
    const xs = [88, 96, 104, 112], zs = [BLD.z0, -33, BLD.z1], top = BLD.floor * BLD.floors;
    const ord = (y) => 0.84 + 0.14 * (y / top);
    xs.forEach((x) => zs.forEach((z) => line([x, BLD.base, z], [x, BLD.base + top, z], 0.3, 0.95, 5, (t) => ord(t * top))));
    for (let f = 1; f < BLD.floors; f++) {
      const y = BLD.base + f * BLD.floor, o = ord(f * BLD.floor);
      xs.forEach((x) => line([x, y, BLD.z0], [x, y, BLD.z1], 0.32, 0.8, 5, o));
      zs.forEach((z) => line([BLD.x0, y, z], [BLD.x1, y, z], 0.32, 0.8, 5, o));
      for (let x = BLD.x0; x <= BLD.x1; x += 1.5) for (let z = BLD.z0; z <= BLD.z1; z += 1.5) add(x, y, z, 0.28, 5, o, true);
      line([BLD.x0, y - 0.45, BLD.z1], [BLD.x1, y - 0.45, BLD.z1], 0.4, 0.55, 5, o); // slab edge
    }
    // ground slab
    xs.forEach((x) => line([x, BLD.base + 0.1, BLD.z0], [x, BLD.base + 0.1, BLD.z1], 0.4, 0.6, 5, 0.84));
    zs.forEach((z) => line([BLD.x0, BLD.base + 0.1, z], [BLD.x1, BLD.base + 0.1, z], 0.4, 0.6, 5, 0.84));
  }

  const COUNT = P.length / 3;
  const pos = new Float32Array(P), dat = new Float32Array(D);

  /* ---------- GL ---------- */
  const VS = `
    precision highp float;
    attribute vec3 aPos;
    attribute vec4 aDat;            // brightness, area, phase, order
    uniform mat4 uMVP;
    uniform mat4 uMV;
    uniform float uTime, uReveal, uAmbient, uSweep, uDim, uScale, uDpr, uLift;
    uniform float uHL[7];
    uniform vec4 uMask;             // the text block in NDC (x0, y0, x1, y1): points behind it dim
    uniform float uMaskK;           // how present the text block is (0 to 1)
    uniform vec3 uLight, uOrange;
    varying vec3 vCol;
    void main() {
      float ph = aDat.z;
      float rev = clamp((uReveal - aDat.w) * 6.0, 0.0, 1.0);
      vec3 p = aPos;
      p.y -= (1.0 - rev) * 2.5;
      vec4 mv = uMV * vec4(p, 1.0);
      gl_Position = uMVP * vec4(p, 1.0);
      float depth = max(-mv.z, 1.0);
      int a = int(aDat.y + 0.5);
      float h = uHL[a];
      float tw = 1.0 - uAmbient * 0.38 * (0.5 + 0.5 * sin(uTime * (0.55 + ph * 1.7) + ph * 61.0));
      if (fract(ph * 37.0) > 0.975) tw *= mix(1.0, 0.08, uAmbient * step(0.9, sin(uTime * 0.42 + ph * 93.0)));
      if (a == 6) tw *= 0.7 + 0.3 * uAmbient * sin(aPos.z * 0.45 + uTime * 1.6 + ph * 3.0);
      float sweep = uAmbient * exp(-pow((aPos.x - uSweep) / 11.0, 2.0));
      float fog = clamp(1.35 - depth / 290.0, 0.32, 1.0);
      float dim = 1.0 - uDim * 0.5 * (1.0 - h);
      float lift = uLift * step(0.5, aDat.y);   // structures, not the ground
      vec2 ndc = gl_Position.xy / gl_Position.w;
      float inMask = smoothstep(uMask.x - 0.06, uMask.x + 0.04, ndc.x) * smoothstep(uMask.z + 0.06, uMask.z - 0.04, ndc.x)
                   * smoothstep(uMask.y - 0.06, uMask.y + 0.04, ndc.y) * smoothstep(uMask.w + 0.06, uMask.w - 0.04, ndc.y);
      float b = aDat.x * tw * fog * dim * (1.0 + 0.55 * sweep) * (1.0 + 0.7 * h) * (1.0 + 0.7 * lift) * (1.0 - 0.85 * inMask * uMaskK) * rev;
      vCol = mix(uLight, uOrange, clamp(h * 1.1, 0.0, 1.0)) * b;
      gl_PointSize = clamp(uScale * (0.55 + 0.45 * aDat.x + 0.35 * h) / depth, 0.9 * uDpr, 6.5 * uDpr) * (0.6 + 0.4 * rev) * (1.0 + 0.2 * lift);
    }`;
  const FS = `
    precision mediump float;
    varying vec3 vCol;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      float a = smoothstep(0.5, 0.18, d);
      gl_FragColor = vec4(vCol * a, 1.0);
    }`;
  function shader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  let prog, loc, buf;
  function setupGL() {
    prog = gl.createProgram();
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    loc = {};
    ["uMVP", "uMV", "uTime", "uReveal", "uAmbient", "uSweep", "uDim", "uScale", "uDpr", "uLift", "uHL", "uMask", "uMaskK", "uLight", "uOrange"].forEach((n) => { loc[n] = gl.getUniformLocation(prog, n); });
    const aPos = gl.getAttribLocation(prog, "aPos"), aDat = gl.getAttribLocation(prog, "aDat");
    buf = [gl.createBuffer(), gl.createBuffer()];
    gl.bindBuffer(gl.ARRAY_BUFFER, buf[0]); gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf[1]); gl.bufferData(gl.ARRAY_BUFFER, dat, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(aDat); gl.vertexAttribPointer(aDat, 4, gl.FLOAT, false, 0, 0);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE); // light adds up
    gl.uniform3fv(loc.uLight, LIGHT);
    gl.uniform3fv(loc.uOrange, ORANGE);
    gl.clearColor(BG[0], BG[1], BG[2], 1);
  }
  try { setupGL(); } catch (e) { root.classList.add("no-webgl"); return; }

  /* ---------- camera: five stops along the scroll, an overview at each end ---------- */
  const STOPS = [
    { p: 0.0, pos: [-20, 20, 70], at: [70, 6, -20], tall: { pos: [-80, 16, -6], at: [50, 10, -16] } },
    { p: 0.18, pos: [-40, 5, 56], at: [0, -5, 0], area: 1 },
    { p: 0.36, pos: [0, 8, 64], at: [0, -11, -24], area: 2 },
    { p: 0.53, pos: [30, 14, 42], at: [72, 1, -2], area: 3 },
    { p: 0.70, pos: [64, 20, 50], at: [86, 10, -16], area: 4 },
    { p: 0.86, pos: [54, 42, 10], at: [100, 28, -33], area: 5 },
    { p: 1.0, pos: [-40, 64, 150], at: [30, 0, -20], tall: { pos: [-90, 44, 10], at: [36, 4, -12] } },
  ];
  const cr = (p0, p1, p2, p3, t) => {
    const t2 = t * t, t3 = t2 * t;
    return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
  };
  function along(key, p, tall) {
    let i = 0;
    while (i < STOPS.length - 2 && p > STOPS[i + 1].p) i++;
    const v = (s) => (tall && s.tall ? s.tall : s)[key];
    const a = STOPS[Math.max(0, i - 1)], b = STOPS[i], c = STOPS[i + 1], d = STOPS[Math.min(STOPS.length - 1, i + 2)];
    let t = (p - b.p) / (c.p - b.p);
    t = t * t * (3 - 2 * t); // linger at each stop
    return [0, 1, 2].map((k) => cr(v(a)[k], v(b)[k], v(c)[k], v(d)[k], t));
  }
  // at both ends the whole structure is lit (the whole firm); in between, one area at a time
  const lift = (p) => Math.max(1 - smooth(0, 0.11, p), smooth(0.9, 1, p));
  const highlight = (p) => {
    const hl = new Float32Array(7), all = 0.22 * lift(p);
    STOPS.forEach((s) => { if (s.area) hl[s.area] = Math.max(all, Math.exp(-Math.pow((p - s.p) / 0.075, 2))); });
    hl[6] = hl[2];
    return hl;
  };

  /* ---------- matrices ---------- */
  function perspective(fovy, aspect, near, far, sx, sy) {
    const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    return [f / aspect, 0, 0, 0, 0, f, 0, 0, sx, sy, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0];
  }
  function lookAt(e, c) {
    let z = [e[0] - c[0], e[1] - c[1], e[2] - c[2]];
    let l = Math.hypot(...z); z = z.map((v) => v / l);
    let x = [z[2], 0, -z[0]]; // up x z with up = (0, 1, 0)
    l = Math.hypot(...x) || 1; x = x.map((v) => v / l);
    const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
    return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0,
      -(x[0] * e[0] + x[1] * e[1] + x[2] * e[2]), -(y[0] * e[0] + y[1] * e[1] + y[2] * e[2]), -(z[0] * e[0] + z[1] * e[1] + z[2] * e[2]), 1];
  }
  function mul(a, b) {
    const o = new Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
    return o;
  }

  /* ---------- state ---------- */
  const FOV = 34 * Math.PI / 180;
  let W = 0, H = 0, dpr = 1, frame = 0;
  let progress = 0, reveal = 1.3, revealFrom = null, ambient = soft ? 0 : 1, ambientTarget = ambient;
  let mask = [9, 9, 9, 9], maskK = 0;   // the text block in NDC, and how present it is
  let visible = true, running = false, dirty = false, last = 0, t0 = performance.now();
  const REVEAL_MS = 2800;

  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = soft ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (w === W && h === H) return;
    W = w; H = h;
    canvas.width = W; canvas.height = H;
    gl.viewport(0, 0, W, H);
    requestDraw();
  }
  // Calls that change the view draw once, on the next frame (several in one frame draw once)
  let pending = 0;
  function requestDraw() {
    if (running) { dirty = true; return; }
    if (!pending) pending = requestAnimationFrame((now) => { pending = 0; draw(now); });
  }

  function draw(now) {
    now = now || performance.now();
    const time = (now - t0) / 1000;
    if (revealFrom !== null) {
      const u = Math.min(1, (now - revealFrom) / REVEAL_MS);
      reveal = 1.3 * (1 - Math.pow(1 - u, 2.2));
      if (u >= 1) revealFrom = null;
    }
    ambient += (ambientTarget - ambient) * 0.08;
    if (Math.abs(ambientTarget - ambient) < 0.002) ambient = ambientTarget;

    const aspect = W / H;
    const wide = aspect > 1.15;
    // keep the structure in the space the text leaves: to its right on wide screens, under it on tall ones
    let sx = 0, sy = 0, pull = 1 + 0.5 * Math.min(1, Math.max(0, (1.15 - aspect) / 0.6));
    if (maskK > 0) {
      if (wide) sx = -0.85 * maskK * (Math.min(mask[2], 0.4) + 1) / 2;
      else { sy = -maskK * (Math.max(mask[1], -0.4) - 1) / 2; pull += 0.25 * maskK; }
    }
    const at = along("at", progress, !wide);
    let eye = along("pos", progress, !wide);
    eye = eye.map((v, k) => at[k] + (v - at[k]) * pull);
    const drift = ambient * 1.4;
    eye[0] += Math.sin(time * 0.16) * drift; eye[1] += Math.sin(time * 0.11 + 1) * drift * 0.6;

    const proj = perspective(FOV, aspect, 1, 900, sx, sy);
    const view = lookAt(eye, at);
    const hl = highlight(progress);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniformMatrix4fv(loc.uMVP, false, new Float32Array(mul(proj, view)));
    gl.uniformMatrix4fv(loc.uMV, false, new Float32Array(view));
    gl.uniform1f(loc.uTime, time);
    gl.uniform1f(loc.uReveal, reveal);
    gl.uniform1f(loc.uAmbient, ambient);
    gl.uniform1f(loc.uSweep, -150 + ((time * 26) % 300));
    gl.uniform1f(loc.uDim, Math.max(...hl));
    gl.uniform1f(loc.uScale, 0.36 * (H / (2 * Math.tan(FOV / 2))));
    gl.uniform1f(loc.uDpr, dpr);
    gl.uniform1f(loc.uLift, lift(progress));
    gl.uniform1fv(loc.uHL, hl);
    gl.uniform4fv(loc.uMask, mask);
    gl.uniform1f(loc.uMaskK, maskK);
    gl.drawArrays(gl.POINTS, 0, COUNT);
  }

  // The twinkle needs no more than 30 frames a second; the assembly, the scroll and resizing
  // draw on every frame.
  function loop(now) {
    frame = 0;
    if (!visible || document.hidden) { running = false; return; }
    if (dirty || revealFrom !== null || now - last > 30) { draw(now); last = now; dirty = false; }
    if (ambient > 0 || ambientTarget > 0 || revealFrom !== null) { frame = requestAnimationFrame(loop); running = true; }
    else running = false;
  }
  function kick() { if (!running && visible && !document.hidden) { running = true; frame = requestAnimationFrame(loop); } else if (!running) draw(); }

  new ResizeObserver(resize).observe(canvas);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }).observe(canvas);
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) kick(); });
  canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); cancelAnimationFrame(frame); running = false; });
  canvas.addEventListener("webglcontextrestored", () => { try { setupGL(); W = H = 0; resize(); kick(); } catch (err) { root.classList.add("no-webgl"); } });

  resize();

  window.conpavHero = {
    areas: AREAS,
    count: COUNT,
    /** false without a GPU: no assembly, no twinkle, nothing to pause */
    animated: !soft,
    /** where each area is lit along the scroll (0 to 1) */
    stops: Object.fromEntries(STOPS.filter((s) => s.area).map((s) => [Object.keys(AREA_ID).find((k) => AREA_ID[k] === s.area), s.p])),
    /** assemble the structure (plays once) */
    assemble() { if (soft) { requestDraw(); return; } reveal = 0; revealFrom = performance.now(); kick(); },
    /** 0 to 1 along the scroll */
    setProgress(p) { progress = Math.min(1, Math.max(0, p)); requestDraw(); },
    /** twinkle, blink and sweep on or off */
    setAmbient(on) { if (soft) return; ambientTarget = on ? 1 : 0; if (!on && !running) { ambient = 0; draw(); } kick(); },
    /** the text block (a DOMRect) and how present it is (0 to 1): the structure keeps to the
        space it leaves, and the points behind it dim so the text stays clear */
    setLayout(r, k) {
      const c = canvas.getBoundingClientRect();
      maskK = r && c.width ? Math.min(1, Math.max(0, k == null ? 1 : k)) : 0;
      if (maskK) mask = [((r.left - c.left) / c.width) * 2 - 1, 1 - ((r.bottom - c.top) / c.height) * 2, ((r.right - c.left) / c.width) * 2 - 1, 1 - ((r.top - c.top) / c.height) * 2];
      requestDraw();
    },
    /** a finished, still frame (reduced motion, captures) */
    still() { ambientTarget = ambient = 0; reveal = 1.3; revealFrom = null; draw(); },
    redraw() { draw(); },
  };
  root.classList.add("has-hero3d");
})();
