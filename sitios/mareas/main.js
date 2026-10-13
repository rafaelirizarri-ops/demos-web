/* Mareas: rendering (ES/EN) and the scroll scenes.
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

  // "3.200" in Spanish, "3,200" in English.
  function countText(n, v) {
    const dec = +(n.dataset.dec || 0);
    return (dec ? v.toFixed(dec) : Math.round(v).toLocaleString("en").replace(/,/g, lang === "es" ? "." : ",")) + (n.dataset.suffix || "");
  }

  function render() {
    const t = T[lang];
    root.lang = lang;
    $$("[data-i]").forEach((n) => { const v = t[n.dataset.i]; if (typeof v === "string") n.textContent = v; });
    $$("[data-ih]").forEach((n) => { const v = t[n.dataset.ih]; if (typeof v === "string") n.innerHTML = v.replace("{doc}", C.doctor); });
    $$("[data-i-alt]").forEach((n) => { const v = t[n.dataset.iAlt]; if (typeof v === "string") n.alt = v; });

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

    list($("#revs"), t.revs,
      () => el("li", "rev", '<p class="rev__stars" aria-label="5/5">★★★★★</p><blockquote></blockquote><p class="rev__who"><b></b><span></span></p>'),
      (li, [q, n, tr]) => { li.children[1].textContent = q; li.children[2].children[0].textContent = n; li.children[2].children[1].textContent = tr; });

    list($("#faqs"), t.faqs,
      () => el("details", "qa", "<summary><span></span><i aria-hidden=\"true\"></i></summary><p></p>"),
      (d, [q, a]) => { d.querySelector("summary span").textContent = q; d.querySelector("p").textContent = a; });

    const opts = (sel, items) => {
      const i = Math.max(0, sel.selectedIndex);
      list(sel, items, () => el("option"), (o, v) => (o.textContent = v));
      sel.selectedIndex = i;
    };
    opts($("#fTreat"), t.treats);
    opts($("#fDay"), t.fdays);

    $$(".count").forEach((n) => { if (!n.dataset.run) n.textContent = countText(n, +n.dataset.to); });

    $("#hours").innerHTML = t.hours.map(([d, h]) => `<tr><td>${d}</td><td>${h}</td></tr>`).join("");
    $("#address").textContent = C.address;
    $("#mapLink").href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(C.mapsQuery)}`;
    $("#phoneNote").textContent = `${t.phone} ${C.phoneShown}`;
    $("#foot").textContent = `© ${new Date().getFullYear()} ${C.name}. ${t.foot}`;
    $$(".lang button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    syncWa();
  }

  /* ------------------------------------------------------------------ boot */
  const stage = $(".hero__stage");
  const hero = $(".hero");
  const nav = $("#nav"), waFloat = $(".wa-float");
  // Sections with a light ground switch the nav to dark ink.
  const lightSections = $$("[data-nav]");

  render();
  $("#bookForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const t = T[lang];
    const msg = t.waForm($("#fName").value.trim(), $("#fTreat").value, $("#fDay").value);
    window.open(`https://wa.me/${C.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  });
  let intro = null;
  $$(".lang button").forEach((b) => b.addEventListener("click", () => {
    if (b.dataset.lang === lang) return;
    lang = b.dataset.lang;
    try { localStorage.setItem("mareas-lang", lang); } catch (e) {}
    if (intro && intro.isActive()) intro.progress(1);
    render();
    if (motion) requestAnimationFrame(() => ScrollTrigger.refresh());
  }));

  // Nav: solid after the first scroll, dark text over the light sections.
  const heroLight = $(".hero__light");
  let ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const y = window.scrollY, probe = nav.offsetHeight * 0.5;
      nav.classList.toggle("is-solid", y > 24);
      let light = null;
      for (const s of lightSections) { const r = s.getBoundingClientRect(); if (r.top <= probe && r.bottom > probe) light = s; }
      // The end of the hero surfaces into paper, so treat it as light too.
      const surfaced = !light && hero.getBoundingClientRect().bottom > probe && +getComputedStyle(heroLight).opacity > 0.6;
      nav.classList.toggle("on-light", !!light || surfaced);
      nav.classList.toggle("on-sand", !!light && light.dataset.nav === "sand");
      waFloat.classList.toggle("is-on", y > hero.offsetHeight - window.innerHeight * 0.4);
    });
  }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

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

  // Width changes re-layout the scenes; height-only changes (URL bar) do not.
  let lastW = window.innerWidth;
  addEventListener("resize", () => {
    if (Math.abs(window.innerWidth - lastW) > 1) { lastW = window.innerWidth; ScrollTrigger.refresh(); }
  });

  const copy = $("#heroCopy"), book = $(".hero__book"), facts = $(".hero__facts"), cue = $(".hero__cue");
  const img = $(".hero__img");
  const introEls = [copy, book, facts, cue, nav];
  gsap.set(introEls, { autoAlpha: 0 });

  const fontsReady = document.fonts ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]) : Promise.resolve();
  const imgReady = img.complete ? Promise.resolve() : Promise.race([img.decode().catch(() => {}), new Promise((r) => setTimeout(r, 2500))]);
  Promise.all([fontsReady, imgReady]).then(() => {
    const split = new SplitText($(".h1", copy), { type: "lines", mask: "lines", linesClass: "ln" });
    gsap.set(copy, { autoAlpha: 1 });
    intro = gsap.timeline({ defaults: { ease: "expo.out" }, onComplete: () => split.revert() });
    intro
      .fromTo($(".hero__media picture"), { scale: 1.12 }, { scale: 1, duration: 2.6, ease: "power3.out" }, 0)
      .from($(".eyebrow", copy), { y: 14, autoAlpha: 0, duration: 1 }, 0.25)
      .from(split.lines, { yPercent: 108, duration: 1.4, stagger: 0.1 }, 0.35)
      .from($(".lead", copy), { y: 18, autoAlpha: 0, duration: 1.1 }, 0.85)
      .to(nav, { autoAlpha: 1, duration: 0.8, ease: "power2.out" }, 0.5)
      .fromTo(book, { y: 28, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.2 }, 1.0)
      .to([facts, cue], { autoAlpha: 1, duration: 1, ease: "power2.out" }, 1.25);
    buildScenes();
  });
  // Safety net: never leave the hero hidden if something above fails.
  setTimeout(() => { if (!intro) gsap.set(introEls, { autoAlpha: 1 }); }, 3500);

  function buildScenes() {
    const mm = gsap.matchMedia();
    mm.add({ tall: "(min-height: 540px)" }, (ctx) => {
      if (!ctx.conditions.tall) return;

      /* Hero: the camera sinks below the surface. */
      const under = $(".hero__under");
      const sink = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: hero, start: "top top", end: "bottom bottom", scrub: 0.5 } });
      sink
        .to(cue, { autoAlpha: 0, duration: 0.06 }, 0)
        .to([book, facts], { y: -30, autoAlpha: 0, duration: 0.22, ease: "power1.in" }, 0.04)
        .to(copy, { y: -70, autoAlpha: 0, duration: 0.3, ease: "power1.in" }, 0.08)
        .to(img, { scale: 1.45, yPercent: -16, duration: 0.6, ease: "power1.inOut" }, 0)
        .to(".hero__deep", { opacity: 0.88, duration: 0.42, ease: "power1.in" }, 0.12)
        .to(".hero__caustics", { opacity: 1, duration: 0.25 }, 0.32)
        .to(".hero__shade", { opacity: 0.4, duration: 0.3 }, 0.3)
        .fromTo(under, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.18, ease: "power2.out", immediateRender: false }, 0.46)
        .to(under, { autoAlpha: 0, y: -40, duration: 0.12, ease: "power1.in" }, 0.76)
        // Surface into the light so the dark hero hands over to the paper section without a seam.
        .to(".hero__light", { autoAlpha: 1, duration: 0.14, ease: "power1.inOut" }, 0.86);

      /* Process: the real implant assembles, annotated like a drawing. */
      const box = $("#implant");
      const crown = $(".part--corona", box), abut = $(".part--pilar", box), screw = $(".part--tornillo", box);
      const ring = $(".implant__ring", box), scan = $(".implant__scan", box);
      const notes = $$(".note", box);
      const H = () => box.offsetHeight;
      const steps = $$("#steps li");
      // Offsets measured on the source render (2080px tall window).
      const seatAbut = () => H() * (335 / 2080);
      const seatCrown = () => H() * (713 / 2080);
      const recenter = () => -H() * (356 / 2080);

      gsap.set(steps, { autoAlpha: 0, y: 24 });
      gsap.set(steps[0], { autoAlpha: 1, y: 0 });
      gsap.set([crown, abut, screw], { autoAlpha: 0 });
      gsap.set(crown, { y: () => -H() * 0.05 });
      gsap.set(screw, { y: () => H() * 0.05 });
      gsap.set(notes.map((n) => n.querySelector("i")), { scaleX: 0 });
      gsap.set(notes.map((n) => n.querySelector("span")), { autoAlpha: 0, x: -8 });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: ".proc", start: "top top", end: "bottom bottom", scrub: 0.6, invalidateOnRefresh: true }
      });
      tl.to(".rail__fill", { scaleX: 1, duration: 5 }, 0);
      // 1 · check-up: the pieces come into view, labelled, while the section
      // is still arriving, so the light screen is never empty.
      gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: ".proc", start: "top 85%", end: "top 5%", scrub: 0.6, invalidateOnRefresh: true } })
        .to([crown, abut, screw], { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" }, 0)
        .to(notes.map((n) => n.querySelector("i")), { scaleX: 1, duration: 0.3, stagger: 0.08, ease: "power2.out" }, 0.45)
        .to(notes.map((n) => n.querySelector("span")), { autoAlpha: 1, x: 0, duration: 0.25, stagger: 0.08 }, 0.55);
      // 2 · 3D scan: a beam sweeps the whole piece
      tl.set(scan, { y: 0 }, 1)
        .to(scan, { autoAlpha: 1, duration: 0.08 }, 1.02)
        .to(scan, { y: () => H(), duration: 0.6, ease: "sine.inOut" }, 1.05)
        .to(scan, { autoAlpha: 0, duration: 0.12 }, 1.62);
      // 3 · placement: the implant itself is what goes in first
      tl.to([crown, abut], { opacity: 0.18, duration: 0.3 }, 2)
        .to([notes[0], notes[1]], { autoAlpha: 0, duration: 0.25 }, 2)
        .to(screw, { y: () => -H() * 0.02, duration: 0.5, ease: "power2.inOut" }, 2.1)
        .fromTo(ring, { autoAlpha: 0, scale: 0.85 }, { autoAlpha: 0.9, scale: 1, duration: 0.4, ease: "power2.out" }, 2.4);
      // 4 · osseointegration: bone closes around it, the abutment seats
      tl.to(ring, { scale: 0.93, borderWidth: 3, duration: 0.5 }, 3)
        .to(notes[2], { autoAlpha: 0, duration: 0.2 }, 3)
        .to(screw, { y: 0, duration: 0.3 }, 3)
        .to(abut, { opacity: 1, duration: 0.2 }, 3.3)
        .to(abut, { y: seatAbut, duration: 0.55, ease: "power2.inOut" }, 3.35);
      // 5 · final crown: it drops on and the tooth is centered
      tl.to(ring, { autoAlpha: 0, duration: 0.3 }, 4)
        .to(crown, { opacity: 1, duration: 0.2 }, 4)
        .to(crown, { y: seatCrown, duration: 0.55, ease: "power3.inOut" }, 4.05)
        .to(box, { y: recenter, duration: 0.4, ease: "power2.inOut" }, 4.5);
      for (let i = 1; i < steps.length; i++) {
        tl.to(steps[i - 1], { autoAlpha: 0, y: -24, duration: 0.25, ease: "power1.in" }, i - 0.2)
          .to(steps[i], { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out" }, i + 0.02);
      }
      tl.to({}, { duration: 0.4 }); // hold the finished tooth

      /* Treatments: photos open like a window and drift. */
      $$(".photo").forEach((f) => {
        const frame = $(".photo__frame", f), pic = $("img", f);
        gsap.fromTo(frame, { clipPath: "inset(18% 10% 18% 10% round 18px)" }, { clipPath: "inset(0% 0% 0% 0% round 18px)", ease: "none", scrollTrigger: { trigger: f, start: "top 95%", end: "top 45%", scrub: 0.5 } });
        gsap.fromTo(pic, { scale: 1.18, yPercent: -4 }, { scale: 1, yPercent: 4, ease: "none", scrollTrigger: { trigger: f, start: "top bottom", end: "bottom top", scrub: 0.5 } });
      });
      gsap.utils.toArray(".svc__head, .visit .h2, .visit__grid").forEach((n) => {
        gsap.from(n, { y: 40, autoAlpha: 0, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: n, start: "top 88%", once: true } });
      });
      gsap.set(".svc__row", { y: 36, autoAlpha: 0 });
      ScrollTrigger.batch(".svc__row", {
        start: "top 92%", once: true,
        onEnter: (b) => gsap.to(b, { y: 0, autoAlpha: 1, duration: 1, ease: "expo.out", stagger: 0.08, overwrite: true })
      });
      /* Doctor: the portrait opens, the team photo drifts, the numbers count. */
      const portrait = $(".doc__portrait .doc__frame"), team = $(".doc__team");
      gsap.fromTo(portrait, { clipPath: "inset(14% 12% 14% 12% round 22px)" }, { clipPath: "inset(0% 0% 0% 0% round 22px)", ease: "none", scrollTrigger: { trigger: ".doc__art", start: "top 90%", end: "top 30%", scrub: 0.5 } });
      gsap.fromTo($("img", portrait), { scale: 1.15 }, { scale: 1, ease: "none", scrollTrigger: { trigger: ".doc__art", start: "top bottom", end: "bottom top", scrub: 0.5 } });
      gsap.fromTo(team, { yPercent: 18 }, { yPercent: -10, ease: "none", scrollTrigger: { trigger: ".doc__art", start: "top bottom", end: "bottom top", scrub: 0.6 } });
      gsap.from(".doc__text > *", { y: 34, autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: 0.09, scrollTrigger: { trigger: ".doc__text", start: "top 80%", once: true } });
      $$(".count").forEach((n) => {
        const o = { v: 0 }; n.textContent = countText(n, 0); n.dataset.run = "1";
        gsap.to(o, { v: +n.dataset.to, duration: 1.8, ease: "power2.out", onUpdate: () => (n.textContent = countText(n, o.v)), onComplete: () => delete n.dataset.run, scrollTrigger: { trigger: ".creds", start: "top 88%", once: true } });
      });

      /* Reviews and questions: cards rise in turn. */
      gsap.from(".voices > .wrap > .kicker, .voices > .wrap > .h2", { y: 34, autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: ".voices", start: "top 78%", once: true } });
      gsap.set(".rev", { y: 50, autoAlpha: 0 });
      ScrollTrigger.batch(".rev", { start: "top 90%", once: true, onEnter: (b) => gsap.to(b, { y: 0, autoAlpha: 1, duration: 1.1, ease: "expo.out", stagger: 0.1, overwrite: true }) });
      gsap.from(".faq__title, .qa", { y: 28, autoAlpha: 0, duration: 1, ease: "expo.out", stagger: 0.06, scrollTrigger: { trigger: ".faq", start: "top 82%", once: true } });

      /* Visit: the clinic photo settles behind the text. */
      gsap.fromTo(".visit__bg img", { scale: 1.18, yPercent: -6 }, { scale: 1, yPercent: 6, ease: "none", scrollTrigger: { trigger: ".visit", start: "top bottom", end: "bottom top", scrub: 0.5 } });
      gsap.from(".book", { y: 40, autoAlpha: 0, duration: 1.1, ease: "expo.out", scrollTrigger: { trigger: ".book", start: "top 90%", once: true } });

      gsap.from(".foot__word", { yPercent: 30, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".foot", start: "top 95%", once: true } });
    });
  }
})();
