/* Mareas: rendering (ES/EN), the tide canvas, and the scroll scenes.
   - Content renders without motion; GSAP only enhances.
   - Smooth scroll (Lenis) only with a mouse/trackpad. Touch keeps native
     scrolling, which is what feels right (and never glitches) on phones.
   - Sticky stages are plain CSS `position: sticky` (no GSAP pin), sized in
     svh, so the mobile URL bar never makes the page jump. */
(() => {
  "use strict";
  const C = window.CONFIG, T = window.T;
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
  const motion = !reduce && !!gsap && !!ScrollTrigger;
  if (motion) root.classList.add("motion");

  let lang = "es";
  try { const s = localStorage.getItem("mareas-lang"); if (s === "es" || s === "en") lang = s; } catch (e) {}
  let slot = "";
  const times = ["9:00", "11:30", "3:00"];

  /* ---------------------------------------------------------------- render */
  function waHref() {
    return `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(T[lang].waMsg(slot))}`;
  }
  function syncWa() { $$(".js-wa").forEach((a) => (a.href = waHref())); }

  // Lists are built once, then only their text changes, so scroll scenes
  // keep pointing at the same elements after a language switch.
  function list(container, items, build, fill) {
    if (container.children.length !== items.length) {
      container.innerHTML = "";
      items.forEach((it, i) => container.appendChild(build(it, i)));
    }
    items.forEach((it, i) => fill(container.children[i], it, i));
  }
  const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html) n.innerHTML = html; return n; };
  const pad = (i) => String(i + 1).padStart(2, "0");

  function render() {
    const t = T[lang];
    root.lang = lang;
    $$("[data-i]").forEach((n) => { const v = t[n.dataset.i]; if (typeof v === "string") n.textContent = v; });
    $$("[data-ih]").forEach((n) => { const v = t[n.dataset.ih]; if (typeof v === "string") n.innerHTML = v; });

    list($("#facts"), t.facts, () => el("li"), (li, v) => (li.textContent = v));

    list($("#slots"), t.days, () => {
      const b = el("button"); b.type = "button";
      b.addEventListener("click", () => {
        slot = slot === b.dataset.s ? "" : b.dataset.s;
        $$("#slots button").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.s === slot)));
        syncWa();
      });
      return b;
    }, (b, d, i) => {
      const was = b.dataset.s && b.dataset.s === slot;
      b.dataset.s = `${d} ${times[i]}`; b.textContent = b.dataset.s;
      if (was) slot = b.dataset.s;
      b.setAttribute("aria-pressed", String(b.dataset.s === slot));
    });

    list($("#steps"), t.steps,
      () => el("li", "", '<span class="step__n"></span><h3></h3><p></p><span class="when"></span>'),
      (li, [h, p, w], i) => { li.children[0].textContent = pad(i); li.children[1].textContent = h; li.children[2].textContent = p; li.children[3].textContent = w; });

    list($("#services"), t.svc,
      () => el("li", "svc__row", '<span class="svc__i"></span><h3></h3><p></p><span class="svc__price"></span>'),
      (li, [h, p, pr], i) => { li.children[0].textContent = pad(i); li.children[1].textContent = h; li.children[2].textContent = p; li.children[3].textContent = pr; });

    $("#hours").innerHTML = t.hours.map(([d, h]) => `<tr><td>${d}</td><td>${h}</td></tr>`).join("");
    $("#address").textContent = C.address;
    $("#mapLink").href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(C.mapsQuery)}`;
    $("#phoneNote").textContent = `${t.phone} ${C.phoneShown}`;
    $("#foot").textContent = `© ${new Date().getFullYear()} ${C.name}. ${t.foot}`;
    $$(".lang button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    syncWa();
  }

  /* ------------------------------------------------------------ tide canvas */
  const stage = $(".hero__stage");
  const canvas = $(".tide");
  const copyTop = $("#heroCopy");
  const copyUnder = $(".hero__copy--under");
  const gauge = $(".gauge");

  const tide = {
    level: motion ? 0 : 0.13,  // share of the stage covered by water
    t: 0, w: 0, h: 0, dpr: 1, ctx: canvas.getContext("2d"),
    box: { x: 0, y: 0, w: 0, h: 0 },
    clipTop: "", clipUnder: "",
    layers: [
      { off: -34, a1: 1.0, a2: 0.6, k1: 1.1, k2: 2.3, s1: 0.55, s2: 0.35, p: 0.8, fill: "rgba(76,195,196,0.10)" },
      { off: -16, a1: 0.9, a2: 0.5, k1: 1.5, k2: 2.9, s1: -0.45, s2: 0.5, p: 2.1, fill: "rgba(14,53,58,0.92)" },
      { off: 0, a1: 1.0, a2: 0.45, k1: 1.25, k2: 3.1, s1: 0.4, s2: -0.6, p: 4.0, fill: "#0a2b30", foam: true }
    ],
    resize() {
      const r = stage.getBoundingClientRect();
      this.w = r.width; this.h = r.height;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(this.w * this.dpr);
      canvas.height = Math.round(this.h * this.dpr);
      this.amp = Math.max(6, Math.min(14, this.w * 0.009));
      this.measure();
      this.draw();
    },
    measure() {
      const s = stage.getBoundingClientRect(), c = copyTop.getBoundingClientRect();
      this.box = { x: c.left - s.left, y: c.top - s.top, w: c.width, h: c.height };
    },
    y(x, L) {
      const base = this.h - this.level * (this.h + 3 * this.amp) + L.off * (this.amp / 12);
      const u = (x / this.w) * Math.PI * 2;
      return base + this.amp * (L.a1 * Math.sin(u * L.k1 + this.t * L.s1 + L.p) + L.a2 * Math.sin(u * L.k2 + this.t * L.s2));
    },
    draw() {
      const { ctx, w, h, dpr } = this;
      if (!w) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const step = Math.max(8, w / 90);
      for (const L of this.layers) {
        ctx.beginPath();
        ctx.moveTo(0, h + 2);
        for (let x = 0; x <= w + step; x += step) ctx.lineTo(x, this.y(x, L));
        ctx.lineTo(w + step, h + 2);
        ctx.closePath();
        ctx.fillStyle = L.fill;
        ctx.fill();
        if (L.foam) {
          ctx.beginPath();
          for (let x = 0; x <= w + step; x += step) x ? ctx.lineTo(x, this.y(x, L)) : ctx.moveTo(x, this.y(x, L));
          ctx.strokeStyle = "rgba(127,224,220,0.55)";
          ctx.lineWidth = 1.25;
          ctx.stroke();
        }
      }
      this.clip();
      if (gauge) {
        gauge.style.setProperty("--lvl", this.level.toFixed(3));
        gauge.firstElementChild.textContent = (this.level * 2.4).toFixed(1);
      }
    },
    // The copy above the waterline stays white; the copy below turns sea-teal.
    clip() {
      const L = this.layers[2], b = this.box;
      let top, under;
      const ys = [];
      const n = 24;
      for (let i = 0; i <= n; i++) ys.push(this.y(b.x + (b.w * i) / n, L) - b.y);
      const min = Math.min(...ys), max = Math.max(...ys);
      if (min >= b.h) { top = "none"; under = "inset(100% 0 0 0)"; }
      else if (max <= 0) { top = "inset(0 0 100% 0)"; under = "none"; }
      else {
        const pts = ys.map((y, i) => `${((b.w * i) / n).toFixed(1)}px ${y.toFixed(1)}px`);
        under = `polygon(${pts.join(",")},${b.w}px ${b.h + 60}px,0px ${b.h + 60}px)`;
        top = `polygon(0px -60px,${b.w}px -60px,${pts.reverse().join(",")})`;
      }
      if (top !== this.clipTop) { copyTop.style.clipPath = top === "none" ? "" : top; this.clipTop = top; }
      if (under !== this.clipUnder) { copyUnder.style.clipPath = under === "none" ? "none" : under; this.clipUnder = under; }
    }
  };

  /* ------------------------------------------------------------------ boot */
  render();
  $$(".lang button").forEach((b) => b.addEventListener("click", () => {
    if (b.dataset.lang === lang) return;
    lang = b.dataset.lang;
    try { localStorage.setItem("mareas-lang", lang); } catch (e) {}
    if (intro && intro.isActive()) intro.progress(1);
    render();
    requestAnimationFrame(() => { tide.measure(); tide.draw(); if (ScrollTrigger) ScrollTrigger.refresh(); });
  }));

  let lastW = 0;
  const ro = new ResizeObserver(() => {
    tide.resize();
    // Width changes re-layout the scenes; height-only changes (URL bar) do not.
    if (motion && Math.abs(window.innerWidth - lastW) > 1) { lastW = window.innerWidth; ScrollTrigger.refresh(); }
  });
  ro.observe(stage);
  new ResizeObserver(() => { tide.measure(); tide.clip(); }).observe(copyTop);
  tide.resize();
  lastW = window.innerWidth;

  // Nav background + floating WhatsApp, in every mode.
  const nav = $("#nav"), waFloat = $(".wa-float"), hero = $(".hero");
  let ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const y = window.scrollY;
      nav.classList.toggle("is-solid", y > 24);
      waFloat.classList.toggle("is-on", y > hero.offsetHeight - window.innerHeight * 0.4);
    });
  }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  let intro = null;
  if (!motion) return;

  /* ---------------------------------------------------------------- motion */
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  // Smooth scroll with mouse/trackpad only.
  let lenis = null;
  if (fine && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.95 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    const target = id === "#top" ? document.body : $(id);
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(id === "#top" ? 0 : target, { duration: 1.4 });
    else window.scrollTo({ top: id === "#top" ? 0 : target.getBoundingClientRect().top + scrollY, behavior: "smooth" });
  }));

  // Waves move only while the hero is on screen.
  let heroVisible = true;
  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }).observe(hero);
  gsap.ticker.add((time, dt) => {
    if (!heroVisible) return;
    tide.t += Math.min(dt, 50) / 1000;
    tide.draw();
  });

  const intro0 = { level: 0 };
  const introEls = [copyTop, copyUnder, $(".hero__book"), $(".hero__facts"), $(".hero__cue"), gauge, nav];
  gsap.set([$(".hero__book"), $(".hero__facts"), $(".hero__cue"), gauge, nav], { autoAlpha: 0 });
  gsap.set([copyTop, copyUnder], { autoAlpha: 0 });

  const fontsReady = document.fonts ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]) : Promise.resolve();
  fontsReady.then(() => {
    tide.measure();
    const splits = [];
    const lines = [];
    [copyTop, copyUnder].forEach((c) => {
      const s = new SplitText($(".h1", c), { type: "lines", mask: "lines", linesClass: "ln" });
      splits.push(s); lines.push(s.lines);
    });
    gsap.set([copyTop, copyUnder], { autoAlpha: 1 });
    intro = gsap.timeline({
      defaults: { ease: "expo.out" },
      onComplete: () => { splits.forEach((s) => s.revert()); tide.measure(); }
    });
    intro
      .to(intro0, { level: 0.13, duration: 2.2, ease: "power3.out", onUpdate: () => { if (!scrubbed) tide.level = intro0.level; } }, 0)
      .from($$(".eyebrow", stage), { y: 14, autoAlpha: 0, duration: 1 }, 0.25);
    lines.forEach((ls) => intro.from(ls, { yPercent: 108, duration: 1.4, stagger: 0.1 }, 0.35));
    intro
      .from($$(".lead", stage), { y: 18, autoAlpha: 0, duration: 1.1 }, 0.85)
      .to(nav, { autoAlpha: 1, duration: 0.8, ease: "power2.out" }, 0.5)
      .fromTo($(".hero__book"), { y: 28, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.2 }, 1.0)
      .to([$(".hero__facts"), $(".hero__cue"), gauge], { autoAlpha: 1, duration: 1, ease: "power2.out" }, 1.25);
    buildScenes();
  });
  // Safety net: never leave the hero hidden if something above fails.
  setTimeout(() => { if (!intro) gsap.set(introEls, { autoAlpha: 1 }); }, 3500);

  let scrubbed = false;
  function buildScenes() {
    const mm = gsap.matchMedia();
    mm.add({ tall: "(min-height: 540px)", short: "(max-height: 539px)" }, (ctx) => {
      const { tall } = ctx.conditions;
      if (!tall) return;

      /* Hero: the tide rises over the promise and becomes the next section. */
      const book = $(".hero__book"), facts = $(".hero__facts"), cue = $(".hero__cue");
      ScrollTrigger.create({
        trigger: hero, start: "top top", end: "bottom bottom", scrub: true,
        onUpdate: (self) => {
          const p = self.progress;
          scrubbed = p > 0.001;
          const from = intro0.level;
          // water reaches the top at 70%, then the submerged promise holds a beat
          tide.level = from + (1 - from) * gsap.parseEase("power1.in")(Math.min(1, p / 0.7));
          if (!heroVisible) tide.draw();
        }
      });
      const out = gsap.timeline({ scrollTrigger: { trigger: hero, start: "top top", end: "bottom bottom", scrub: 0.4 } });
      out
        .to(cue, { autoAlpha: 0, duration: 0.1 }, 0)
        .to([book, facts], { y: -30, autoAlpha: 0, duration: 0.35, ease: "power1.in" }, 0.05)
        .to(gauge, { autoAlpha: 0, duration: 0.1 }, 0.66)
        .to($$(".lead", stage), { autoAlpha: 0, duration: 0.2 }, 0.45)
        // the submerged promise dissolves while the process rises into view
        .to([copyTop, copyUnder], { autoAlpha: 0, y: -24, duration: 0.1, ease: "power1.in" }, 0.76)
        .fromTo([$(".proc__text"), $(".proc__art")], { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.12, ease: "power1.out", immediateRender: true }, 0.88);

      /* Process: an implant is placed, step by step. */
      const steps = $$("#steps li");
      const art = $(".implant");
      const q = (s) => $(s, art);
      gsap.set(steps, { autoAlpha: 0, y: 24 });
      gsap.set(steps[0], { autoAlpha: 1, y: 0 });
      gsap.set(q(".mark"), { svgOrigin: "200 200" });
      gsap.set(q(".screw"), { y: -260 });
      gsap.set(q(".abut"), { y: -60 });
      gsap.set(q(".crown"), { y: -120 });
      gsap.set($$(".osseo circle", art), { scale: 0, transformOrigin: "50% 50%" });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: ".proc", start: "top top", end: "bottom bottom", scrub: 0.6 }
      });
      tl.to(".rail__fill", { scaleX: 1, duration: 5 }, 0);
      // 1 · check-up: the empty space gets marked
      tl.fromTo(q(".mark"), { scale: 0.6, autoAlpha: 0, svgOrigin: "200 200" }, { scale: 1, autoAlpha: 1, duration: 0.5, ease: "power2.out" }, 0)
        .to(q(".mark circle"), { rotation: 90, svgOrigin: "200 200", duration: 1 }, 0)
        .to(q(".mark"), { autoAlpha: 0, scale: 1.15, duration: 0.3 }, 0.85);
      // 2 · 3D scan: a beam sweeps the bone
      tl.to(q(".scan"), { autoAlpha: 1, duration: 0.2 }, 1)
        .fromTo(q(".scan__beam"), { y: 0 }, { y: 190, duration: 0.45, ease: "sine.inOut" }, 1.05)
        .to(q(".scan__beam"), { y: 40, duration: 0.4, ease: "sine.inOut" }, 1.5)
        .to(q(".scan"), { autoAlpha: 0, duration: 0.25 }, 1.85);
      // 3 · placement: the implant screws down into the bone
      tl.to(q(".screw"), { autoAlpha: 1, duration: 0.15 }, 2)
        .to(q(".screw"), { y: 0, duration: 0.75, ease: "power2.inOut" }, 2)
        .fromTo(q(".threads"), { y: -36 }, { y: 0, duration: 0.75, ease: "power2.inOut" }, 2);
      // 4 · osseointegration: bone grows around it
      tl.to(q(".osseo"), { autoAlpha: 1, duration: 0.1 }, 3)
        .to($$(".osseo circle", art), { scale: 1, duration: 0.5, stagger: 0.03, ease: "back.out(2)" }, 3.05)
        .to(q(".bone"), { attr: { fill: "#11444a" }, duration: 0.6 }, 3.1);
      // 5 · final crown
      tl.to(q(".abut"), { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out" }, 4)
        .to(q(".crown"), { autoAlpha: 1, duration: 0.2 }, 4.3)
        .to(q(".crown"), { y: 0, duration: 0.5, ease: "power3.out" }, 4.3)
        .to($$(".osseo circle", art), { autoAlpha: 0.45, duration: 0.3 }, 4.4);
      // copy crossfades at each boundary
      for (let i = 1; i < steps.length; i++) {
        tl.to(steps[i - 1], { autoAlpha: 0, y: -24, duration: 0.25, ease: "power1.in" }, i - 0.2)
          .to(steps[i], { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out" }, i + 0.02);
      }
      tl.to({}, { duration: 0.4 }); // hold the finished tooth

      /* Gentle reveals below. */
      gsap.utils.toArray(".svc__head, .visit .h2, .visit__grid, .visit .btn").forEach((n) => {
        gsap.from(n, { y: 40, autoAlpha: 0, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: n, start: "top 88%", once: true } });
      });
      gsap.set(".svc__row", { y: 36, autoAlpha: 0 });
      ScrollTrigger.batch(".svc__row", {
        start: "top 92%", once: true,
        onEnter: (b) => gsap.fromTo(b, { y: 36, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, ease: "expo.out", stagger: 0.08, overwrite: true })
      });
      gsap.from(".foot__word", { yPercent: 30, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".foot", start: "top 95%", once: true } });

      return () => { scrubbed = false; tide.level = intro0.level || 0.13; tide.draw(); };
    });
  }
})();
