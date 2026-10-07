/* =========================================================================
   Faro: behaviour
   - Intro: the lamp lights, the beam draws the logo, the logo flies to the header
   - Smooth scroll (Lenis) synced with GSAP ScrollTrigger
   - Hero: headline letters rise, the frame shrinks into a card as you scroll
   - Problem: words light up one by one, then a circle of light opens the answer
   - Services: pinned horizontal track on big screens, swipe carousel elsewhere
   - Marquee whose speed and skew follow your scroll
   - How it works: pinned stepper with rolling numbers
   - Cursor + magnetic buttons + card tilt (mouse only), animated FAQ,
     contact spotlight, footer logo lit by the beam and by your cursor
   - WhatsApp links, optional hero video, contact form (FormSubmit et al.)
   Everything degrades: with no JS or reduced motion the content is all there.
   ========================================================================= */

(function () {
  "use strict";

  const CFG = window.FARO_CONFIG || {};
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const t = (k) => window.Faro.t(k);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);

  // If the motion libraries failed to load, show everything statically
  if (!hasGsap || reduceMotion) root.classList.remove("js-motion");
  const motion = root.classList.contains("js-motion");
  // pinned scenes change the page height after load, so we place the reader ourselves
  if (motion && "scrollRestoration" in history) history.scrollRestoration = "manual";
  if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);
    if (window.SplitText) gsap.registerPlugin(SplitText);
    ScrollTrigger.config({ ignoreMobileResize: true });
  }

  let lenis = null;
  let menuOpen = false;

  /* =======================================================================
     Header: frosted once you scroll, hides going down, returns going up,
     thin amber line shows reading progress
     ======================================================================= */
  const header = $(".header");
  let lastY = window.scrollY;
  function onScroll() {
    const y = window.scrollY;
    const dy = y - lastY;
    lastY = y;
    header.classList.toggle("is-scrolled", y > 24);
    if (!menuOpen) {
      if (dy > 3 && y > window.innerHeight * 0.6) header.classList.add("is-hidden");
      else if (dy < -3 || y < 80) header.classList.remove("is-hidden");
    }
    const max = root.scrollHeight - window.innerHeight;
    header.style.setProperty("--p", max > 0 ? Math.min(1, y / max).toFixed(4) : 0);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- footer year ---------- */
  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ---------- WhatsApp links (hidden until a number is configured) ---------- */
  function setupWhatsApp() {
    const num = String(CFG.whatsapp || "").replace(/\D/g, "");
    $$("[data-wa-link]").forEach((a) => {
      if (!num) { a.hidden = true; return; }
      a.hidden = false;
      a.href = "https://wa.me/" + num + "?text=" + encodeURIComponent(t("contact.waText"));
    });
    $$("[data-wa-block]").forEach((b) => (b.hidden = !num));
  }

  /* ---------- floating WhatsApp: out of the way over the hero, FAQ, contact and footer ---------- */
  function setupWaFloat() {
    const fl = $(".wa-float");
    if (!fl || !("IntersectionObserver" in window)) return;
    const seen = new Set();
    const sync = () => fl.classList.toggle("is-away", seen.size > 0 || menuOpen);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? seen.add(e.target) : seen.delete(e.target)));
      sync();
    }, { threshold: 0.12 });
    [".hero", ".faq", ".contact", ".footer"].forEach((s) => $(s) && io.observe($(s)));
    fl.classList.add("is-away");
    document.addEventListener("faro:menu", sync);
  }

  /* ---------- hero video (optional, loaded after the page is ready) ---------- */
  function setupHeroVideo() {
    const v = CFG.heroVideo || {};
    const video = $(".hero__video");
    const saveData = navigator.connection && navigator.connection.saveData;
    if (!video || (!v.mp4 && !v.webm) || reduceMotion || saveData) return;
    if (v.poster) video.poster = v.poster;
    [["webm", "video/webm"], ["mp4", "video/mp4"]].forEach(([k, type]) => {
      if (!v[k]) return;
      const s = document.createElement("source");
      s.src = v[k]; s.type = type;
      video.appendChild(s);
    });
    video.hidden = false;
    // the video has its own lighthouse, so the CSS beam steps aside once it is playing
    video.addEventListener("playing", () => video.closest(".hero").classList.add("has-video"), { once: true });
    video.load();
    video.play().catch(() => {});
  }

  /* ---------- service visuals only animate while visible (saves battery) ---------- */
  let vizObserver;
  function observeViz() {
    if (vizObserver) vizObserver.disconnect();
    if (!("IntersectionObserver" in window)) {
      $$(".viz").forEach((el) => el.classList.add("is-live"));
      return;
    }
    vizObserver = new IntersectionObserver((entries) => {
      entries.forEach((e) => e.target.classList.toggle("is-live", e.isIntersecting));
    }, { rootMargin: "0px 120px 0px 120px" });
    $$(".viz").forEach((el) => vizObserver.observe(el));
  }

  /* =======================================================================
     Menu (phones / tablets): a circle of night opens from the burger
     ======================================================================= */
  const burger = $(".burger");
  const menu = $("#menu");
  function setMenu(open) {
    if (!burger || !menu || open === menuOpen) return;
    menuOpen = open;
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", t(open ? "nav.close" : "nav.menu"));
    root.classList.toggle("menu-open", open);
    document.dispatchEvent(new CustomEvent("faro:menu"));
    if (open) {
      header.classList.remove("is-hidden");
      menu.hidden = false;
      if (lenis) lenis.stop();
      requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add("is-open")));
      const first = $(".menu__nav a", menu);
      if (first) setTimeout(() => first.focus({ preventScroll: true }), 300);
    } else {
      menu.classList.remove("is-open");
      if (lenis) lenis.start();
      setTimeout(() => { if (!menuOpen) menu.hidden = true; }, reduceMotion ? 0 : 900);
    }
  }
  function setupMenu() {
    if (!burger || !menu) return;
    burger.addEventListener("click", () => setMenu(!menuOpen));
    menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menuOpen) { setMenu(false); burger.focus(); }
    });
    // growing past the tablet layout closes it
    window.matchMedia("(min-width: 1024px)").addEventListener("change", (e) => e.matches && setMenu(false));
  }

  /* ---------- in-page links glide (Lenis) or scroll natively ---------- */
  function setupAnchors() {
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || a.classList.contains("skip")) return;
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const target = id === "#top" ? document.body : $(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(id === "#top" ? 0 : target, { duration: 1.5 });
      else target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      if (id !== "#top") { target.setAttribute("tabindex", "-1"); target.focus({ preventScroll: true }); }
    });
  }

  /* =======================================================================
     Services carousel (phones, tablets, short windows): counter, progress,
     arrows, and cards that ease back as they leave the centre
     ======================================================================= */
  const services = $(".services");
  const vp = $(".services__viewport");
  const countEl = $("[data-count]");
  const servicesBar = $(".services__progress span");
  let lastCount = -1;
  function setCount(i, n) {
    if (!countEl || i === lastCount) return;
    lastCount = i;
    countEl.textContent = String(i + 1).padStart(2, "0");
    if (motion) gsap.fromTo(countEl, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, ease: "expo.out", overwrite: true });
    $(".services__count").lastChild.textContent = " / " + String(n).padStart(2, "0");
  }
  function updateCarousel() {
    if (!vp || services.classList.contains("is-pinned")) return;
    const cards = $$(".card", vp);
    if (!cards.length) return;
    const vr = vp.getBoundingClientRect();
    const pad = parseFloat(getComputedStyle(vp).scrollPaddingLeft) || 0;
    const max = vp.scrollWidth - vp.clientWidth;
    let idx = 0, best = Infinity;
    cards.forEach((c, i) => {
      const r = c.getBoundingClientRect();
      const d = Math.abs(r.left - (vr.left + pad));
      if (d < best) { best = d; idx = i; }
      if (motion) {
        const off = Math.min(1, Math.abs(r.left + r.width / 2 - (vr.left + vr.width / 2)) / vr.width);
        c.style.scale = (1 - off * 0.07).toFixed(3);
        c.style.opacity = (1 - off * 0.45).toFixed(3);
      }
    });
    if (vp.scrollLeft >= max - 4) idx = cards.length - 1;
    setCount(idx, cards.length);
    if (servicesBar) servicesBar.style.setProperty("--p", ((idx + 1) / cards.length).toFixed(3));
    const [prev, next] = $$(".arrow");
    if (prev) prev.disabled = vp.scrollLeft < 4;
    if (next) next.disabled = vp.scrollLeft > max - 4;
  }
  function setupCarousel() {
    if (!vp) return;
    let raf = 0;
    vp.addEventListener("scroll", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(updateCarousel); }, { passive: true });
    window.addEventListener("resize", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(updateCarousel); });
    $$(".arrow").forEach((b) => b.addEventListener("click", () => {
      const card = $(".card", vp);
      if (!card) return;
      const gap = parseFloat(getComputedStyle($(".services__track")).columnGap) || 14;
      vp.scrollBy({ left: (card.getBoundingClientRect().width + gap) * Number(b.dataset.dir), behavior: reduceMotion ? "auto" : "smooth" });
    }));
    updateCarousel();
  }

  /* ---------- card tilt + cursor light (mouse only) ---------- */
  function setupTilt() {
    const track = $(".services__track");
    if (!track || !finePointer || reduceMotion) return;
    track.addEventListener("pointermove", (e) => {
      const card = e.target.closest(".card");
      if (!card) return;
      const inner = $(".card__inner", card);
      const r = inner.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      card.classList.add("is-tilting");
      inner.style.setProperty("--mx", x * 100 + "%");
      inner.style.setProperty("--my", y * 100 + "%");
      inner.style.transform = `rotateX(${(0.5 - y) * 7}deg) rotateY(${(x - 0.5) * 9}deg)`;
    });
    track.addEventListener("pointerout", (e) => {
      const card = e.target.closest(".card");
      if (card && !card.contains(e.relatedTarget)) {
        card.classList.remove("is-tilting");
        $(".card__inner", card).style.transform = "";
      }
    });
  }

  /* ---------- FAQ: answers slide open instead of snapping ---------- */
  function setupFaq() {
    const list = $(".faq__list");
    if (!list) return;
    list.addEventListener("click", (e) => {
      const sum = e.target.closest("summary");
      if (!sum || !motion) return;
      const d = sum.parentElement;
      const body = $(".qa__a", d);
      e.preventDefault();
      const done = () => { gsap.set(body, { clearProps: "height" }); ScrollTrigger.refresh(); };
      if (d.open) {
        gsap.to(body, { height: 0, duration: 0.5, ease: "power3.inOut", onComplete: () => { d.open = false; done(); } });
      } else {
        d.open = true;
        gsap.fromTo(body, { height: 0 }, { height: "auto", duration: 0.7, ease: "expo.out", onComplete: done });
        gsap.fromTo($("p", body), { y: -10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "expo.out", delay: 0.08 });
      }
    });
  }

  /* =======================================================================
     Mouse-only flourishes: custom cursor, magnetic buttons, spotlights
     ======================================================================= */
  function setupCursor() {
    if (!finePointer || !motion) return;
    const cur = $(".cursor");
    const dot = $(".cursor__dot"), ring = $(".cursor__ring");
    if (!cur) return;
    root.classList.add("has-cursor");
    cur.classList.add("is-out");
    const dx = gsap.quickTo(dot, "x", { duration: 0.08 }), dy = gsap.quickTo(dot, "y", { duration: 0.08 });
    const rx = gsap.quickTo(ring, "x", { duration: 0.5, ease: "power3" }), ry = gsap.quickTo(ring, "y", { duration: 0.5, ease: "power3" });
    window.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
      cur.classList.remove("is-out");
    }, { passive: true });
    root.addEventListener("mouseleave", () => cur.classList.add("is-out"));
    window.addEventListener("pointerdown", () => cur.classList.add("is-down"));
    window.addEventListener("pointerup", () => cur.classList.remove("is-down"));
    const HOVER = "a, button, summary, .chip, .card, [data-magnetic]";
    document.addEventListener("pointerover", (e) => cur.classList.toggle("is-hover", !!e.target.closest(HOVER)));
    // over form fields, step aside for the native text cursor
    document.addEventListener("focusin", (e) => e.target.matches("input, textarea") && cur.classList.add("is-out"));
  }

  function setupMagnetic() {
    if (!finePointer || !motion) return;
    $$("[data-magnetic]").forEach((el) => {
      const xTo = gsap.quickTo(el, "x", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.8, ease: "elastic.out(1, 0.4)" });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.28);
        yTo((e.clientY - r.top - r.height / 2) * 0.4);
      });
      el.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
    });
  }

  function setupSpotlights() {
    // contact: the glow follows the mouse
    const contact = $(".contact");
    if (contact && finePointer && !reduceMotion) {
      contact.addEventListener("pointermove", (e) => {
        const r = contact.getBoundingClientRect();
        contact.style.setProperty("--gx", e.clientX - r.left + "px");
        contact.style.setProperty("--gy", e.clientY - r.top + "px");
      });
    }
    // without motion, "tu faro" is simply lit
    if (contact && !motion) contact.classList.add("is-lit");

    // footer logo: a flashlight follows the mouse and the beam turns toward it
    const box = $(".footer__logo");
    const lit = $(".footer__logo-lit");
    if (box && lit && finePointer && !reduceMotion) {
      const LAMP = { x: 124.5 / 1559, y: 128 / 830 }; // lamp position inside the logo
      box.addEventListener("pointermove", (e) => {
        const r = box.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        lit.style.setProperty("--fx", (px * 100).toFixed(1) + "%");
        lit.style.setProperty("--fy", (py * 100).toFixed(1) + "%");
        const ang = Math.atan2((py - LAMP.y) * r.height, Math.max(40, (px - LAMP.x) * r.width)) * 180 / Math.PI;
        lit.style.setProperty("--beam", Math.max(-28, Math.min(28, ang)).toFixed(1) + "deg");
      });
      box.addEventListener("pointerleave", () => {
        lit.style.setProperty("--fx", "-50%");
        lit.style.setProperty("--fy", "-50%");
        lit.style.setProperty("--beam", "0deg");
      });
    }
  }

  /* ---------- contact form ---------- */
  function setupForm() {
    const form = $("[data-form]");
    if (!form) return;
    const status = $(".form__status", form);
    const btn = $(".form__submit", form);
    const say = (msg, kind) => {
      status.textContent = msg;
      status.className = "form__status" + (kind ? " is-" + kind : "");
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (form.botcheck.checked) return; // bot

      // Minimal validation: name + a valid email
      let ok = true;
      ["name", "email"].forEach((n) => {
        const el = form.elements[n];
        const bad = !el.value.trim() || (n === "email" && !/^\S+@\S+\.\S+$/.test(el.value));
        el.setAttribute("aria-invalid", String(bad));
        if (bad && ok) { el.focus(); ok = false; }
      });
      if (!ok) { say(t("contact.required"), "error"); return; }

      const fc = CFG.form || {};
      const configured =
        fc.provider === "formspree" ? /formspree\.io\/f\//.test(fc.endpoint || "")
        : fc.provider === "formsubmit" ? !!fc.email
        : !!fc.accessKey;
      if (!configured) { say(t("contact.notConnected"), "error"); return; }

      const data = {
        name: form.name.value.trim(),
        business: form.business.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        needs: $$('input[name="needs"]:checked', form).map((c) => c.value).join(", "),
        message: form.message.value.trim(),
        language: window.Faro.lang,
      };

      btn.disabled = true;
      const label = btn.textContent;
      btn.textContent = t("contact.sending");
      say("");

      try {
        let res;
        const json = { Accept: "application/json", "Content-Type": "application/json" };
        if (fc.provider === "formsubmit") {
          // FormSubmit: no account; the first message sends an activation email to this address
          res = await fetch("https://formsubmit.co/ajax/" + encodeURIComponent(fc.email), {
            method: "POST", headers: json,
            body: JSON.stringify(Object.assign({ _subject: "Nuevo contacto desde la web de Faro", _template: "table", _captcha: "false" }, data)),
          });
        } else if (fc.provider === "formspree") {
          res = await fetch(fc.endpoint, { method: "POST", headers: json, body: JSON.stringify(data) });
        } else {
          res = await fetch(fc.endpoint || "https://api.web3forms.com/submit", {
            method: "POST", headers: json,
            body: JSON.stringify(Object.assign({ access_key: fc.accessKey, subject: "Nuevo contacto desde la web de Faro", from_name: "Web Faro" }, data)),
          });
        }
        if (!res.ok) throw new Error("HTTP " + res.status);
        form.reset();
        say(t("contact.ok"), "ok");
      } catch (err) {
        say(t("contact.error"), "error");
      } finally {
        btn.disabled = false;
        btn.textContent = label;
      }
    });
  }

  /* =======================================================================
     Smooth scroll
     ======================================================================= */
  function setupLenis() {
    if (!motion || !window.Lenis) return;
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* =======================================================================
     Motion (GSAP). Everything lives inside one matchMedia context, so it is
     rebuilt cleanly when the layout changes (breakpoints, language, resize).
     ======================================================================= */
  let mm = null;
  let splits = [];
  let heroPlayed = false;
  let heroChars = [];
  let reveals = [];
  let motionReady = false; // true once the first build has run (after fonts load)

  // Reveal-on-enter that also copes with content already scrolled past
  // (language switch or resize mid-page): see checkReveals below.
  const whenSeen = (el, run, start = "top 88%") => {
    if (!el) return;
    let done = false, st = null;
    const go = () => {
      if (done) return;
      done = true;
      run();
      if (st) st.kill();
    };
    // onEnterBack covers content you reach scrolling up after jumping past it
    st = ScrollTrigger.create({ trigger: el, start, end: "bottom top", onEnter: go, onEnterBack: go });
    reveals.push({ el, go });
  };
  function checkReveals() {
    const limit = window.innerHeight * 0.88;
    reveals.forEach((r) => { if (r.el.isConnected && r.el.getBoundingClientRect().top < limit) r.go(); });
  }

  const split = (el, vars) => {
    const s = new SplitText(el, Object.assign({ linesClass: "ln", charsClass: "ch", autoSplit: false }, vars));
    splits.push(s);
    return s;
  };

  // The hero arrives: letters rise out of their lines, then the rest follows
  function heroIn(fast) {
    if (!motion) return;
    heroPlayed = true;
    const tl = gsap.timeline();
    tl.to(heroChars, { yPercent: 0, rotate: 0, duration: fast ? 0.8 : 1.3, ease: "expo.out", stagger: fast ? 0.008 : 0.022 })
      .fromTo(".hero .kicker, .hero__lead, .hero__ctas, .hero__scroll", { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 1, ease: "expo.out", stagger: 0.08 }, fast ? 0.1 : 0.45);
    return tl;
  }

  function teardownMotion() {
    if (mm) { mm.revert(); mm = null; }
    splits.forEach((s) => s.revert());
    splits = [];
  }

  function setupMotion() {
    if (!motion) return;
    teardownMotion();
    motionReady = true;
    mm = gsap.matchMedia();
    mm.add({
      wide: "(min-width: 1024px) and (min-height: 600px)",
      tall: "(min-height: 560px)",
      fine: "(hover: hover) and (pointer: fine)",
    }, (ctx) => {
      const { wide, tall } = ctx.conditions;
      const cleanups = [];
      reveals = [];
      const vh = () => window.innerHeight;
      const vw = () => window.innerWidth;

      /* ---------- hero ---------- */
      const title = $(".hero__title");
      const hs = split(title, { type: "lines,words,chars", mask: "lines" }); // words keep "big-company" whole
      heroChars = hs.chars;
      gsap.set(title, { visibility: "visible" });
      if (heroPlayed) {
        gsap.set(".hero .kicker, .hero__lead, .hero__ctas, .hero__scroll", { autoAlpha: 1 });
      } else {
        gsap.set(heroChars, { yPercent: 115, rotate: 7, transformOrigin: "0% 100%" });
      }
      // leaving the hero: the frame shrinks into a rounded card, the image pushes in, the text lifts away
      gsap.timeline({ scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true, invalidateOnRefresh: true } })
        .fromTo(".hero__frame",
          { clipPath: "inset(0px 0px 0px 0px round 0px)" },
          { clipPath: () => `inset(${vh() * 0.05}px ${vw() * 0.04}px ${vh() * 0.16}px ${vw() * 0.04}px round 28px)`, ease: "none" }, 0)
        .to(".hero__media", { scale: 1.18, yPercent: 8, ease: "none" }, 0)
        .to(".hero__inner", { yPercent: -28, autoAlpha: 0.1, ease: "none" }, 0);

      /* ---------- headlines: lines rise out of a mask ---------- */
      $$("[data-split]").forEach((el) => {
        const s = split(el, { type: "lines", mask: "lines" });
        gsap.set(el, { visibility: "visible" });
        gsap.set(s.lines, { yPercent: 110, rotate: 3, transformOrigin: "0% 100%" });
        whenSeen(el, () => gsap.to(s.lines, { yPercent: 0, rotate: 0, duration: 1.3, ease: "expo.out", stagger: 0.1 }));
      });

      /* ---------- labels slide in, blocks fade up ---------- */
      $$("main .label").forEach((el) => {
        if (el.closest(".hero, .problem")) return;
        gsap.set(el, { x: -24, autoAlpha: 0 });
        whenSeen(el, () => gsap.to(el, { x: 0, autoAlpha: 1, duration: 1, ease: "expo.out" }), "top 92%");
      });
      $$(".services__meta, .results__note, .contact__lead, .contact__wa, .form, .faq__list, .footer__grid").forEach((el) => {
        const kids = el.matches(".faq__list, .footer__grid") ? Array.from(el.children) : [el];
        gsap.set(kids, { autoAlpha: 0, y: 34 });
        whenSeen(el, () => gsap.to(kids, { autoAlpha: 1, y: 0, duration: 1.1, ease: "expo.out", stagger: 0.07 }), "top 92%");
      });

      /* ---------- problem → answer: one pinned scene ---------- */
      const problem = $(".problem");
      problem.classList.add("is-pinned");
      cleanups.push(() => problem.classList.remove("is-pinned"));
      const words = $$(".problem .w");
      const answerSplit = split($(".answer__title"), { type: "lines", mask: "lines" });
      const ptl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: ".problem__pin", pin: true, start: "top top", end: () => "+=" + vh() * (tall ? 2.8 : 2.2), scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true, refreshPriority: 3 },
      });
      ptl.to(words, { color: "#f3eee4", duration: 0.25, stagger: 0.09 })
        .to(".problem__stage", { scale: 0.92, autoAlpha: 0.25, duration: 1.1, ease: "power1.in" }, "+=0.35")
        .fromTo(".answer", { clipPath: "circle(0% at 50% 55%)" }, { clipPath: "circle(75% at 50% 55%)", duration: 1.3, ease: "power2.in" }, "<")
        .from(answerSplit.lines, { yPercent: 110, rotate: 3, transformOrigin: "0% 100%", duration: 0.9, stagger: 0.15, ease: "power3.out" }, "-=0.45")
        .from(".answer__sub", { y: 30, autoAlpha: 0, duration: 0.7, ease: "power3.out" }, "-=0.4")
        .to({}, { duration: 0.9 }); // hold on the answer

      /* ---------- services ---------- */
      if (wide) {
        services.classList.add("is-pinned");
        cleanups.push(() => services.classList.remove("is-pinned"));
        const track = $(".services__track");
        const cards = $$(".card", track);
        cards.forEach((c) => { c.style.scale = ""; c.style.opacity = ""; });
        const dist = () => Math.max(0, track.scrollWidth - vp.clientWidth);
        const move = gsap.to(track, {
          x: () => -dist(), ease: "none",
          scrollTrigger: {
            trigger: ".services__pin", pin: true, start: "top top", end: () => "+=" + dist() * 1.1, scrub: 0.7, invalidateOnRefresh: true, refreshPriority: 2,
            onUpdate: (self) => {
              if (servicesBar) servicesBar.style.setProperty("--p", Math.max(0.02, self.progress).toFixed(3));
              setCount(Math.min(cards.length - 1, Math.round(self.progress * (cards.length - 1))), cards.length);
            },
          },
        });
        cards.forEach((card) => {
          // cards arrive from the right: smaller, darker, slightly turned
          gsap.fromTo(card, { scale: 0.84, autoAlpha: 0.3, rotate: 2.5 }, {
            scale: 1, autoAlpha: 1, rotate: 0, ease: "none",
            scrollTrigger: { trigger: card, containerAnimation: move, start: "left 100%", end: "left 58%", scrub: true },
          });
          // the visual drifts inside its frame (parallax)
          const v = $(".card__visual > :last-child", card);
          if (v) gsap.fromTo(v, { xPercent: 12 }, { xPercent: -12, ease: "none", scrollTrigger: { trigger: card, containerAnimation: move, start: "left right", end: "right left", scrub: true } });
        });
      } else {
        lastCount = -1;
        updateCarousel();
        const cards = $$(".services__track .card");
        gsap.set(cards, { x: 90, autoAlpha: 0 });
        whenSeen(vp, () => gsap.to(cards, { x: 0, autoAlpha: 1, duration: 1.2, ease: "expo.out", stagger: 0.08, onComplete: updateCarousel }));
      }

      /* ---------- marquee: speed + skew follow the scroll ---------- */
      const row = $(".marquee__row");
      if (row && row.firstElementChild) {
        let x = 0, skew = 0, live = false, prevY = window.scrollY, dir = 1;
        const w = () => row.firstElementChild.offsetWidth;
        let gw = w();
        const io = new IntersectionObserver(([e]) => (live = e.isIntersecting));
        io.observe(row);
        const tick = () => {
          const y = window.scrollY, v = y - prevY;
          prevY = y;
          if (!live || !gw) return;
          if (v) dir = v > 0 ? 1 : -1;
          x -= (1.2 + Math.min(Math.abs(v) * 0.6, 26)) * dir;
          if (x <= -gw) x += gw;
          if (x > 0) x -= gw;
          skew += (Math.max(-14, Math.min(14, v * 0.45)) - skew) * 0.12;
          gsap.set(row, { x, skewX: -skew });
        };
        const onResize = () => (gw = w());
        gsap.ticker.add(tick);
        window.addEventListener("resize", onResize);
        cleanups.push(() => { gsap.ticker.remove(tick); io.disconnect(); window.removeEventListener("resize", onResize); gsap.set(row, { clearProps: "transform" }); });
      }

      /* ---------- how it works: pinned stepper ---------- */
      const how = $(".how");
      const steps = $$(".step", how);
      if (tall && steps.length) {
        how.classList.add("is-pinned");
        const ticks = document.createElement("div");
        ticks.className = "how__ticks";
        ticks.setAttribute("aria-hidden", "true");
        ticks.innerHTML = steps.map((s) => `<span>${$(".step__name", s).textContent}</span>`).join("");
        $(".how__stage", how).appendChild(ticks);
        const tickEls = $$("span", ticks);
        cleanups.push(() => { how.classList.remove("is-pinned"); ticks.remove(); });

        const n = steps.length;
        const rail = $(".how__rail span", how);
        gsap.set(steps, { autoAlpha: 0, y: 50 });
        gsap.set(steps[0], { autoAlpha: 1, y: 0 });
        gsap.set(".how__digits", { yPercent: 0 });
        const htl = gsap.timeline({
          scrollTrigger: {
            trigger: ".how__pin", pin: true, start: "top top", end: () => "+=" + vh() * n * 0.75, scrub: 0.6, invalidateOnRefresh: true, refreshPriority: 1,
            onUpdate: (self) => {
              if (rail) rail.style.setProperty("--p", self.progress.toFixed(3));
              const i = Math.min(n - 1, Math.round(self.progress * (n - 1)));
              tickEls.forEach((el, k) => el.classList.toggle("is-on", k <= i));
            },
          },
        });
        for (let i = 1; i < n; i++) {
          const at = i - 0.75;
          htl.to(".how__digits", { yPercent: (-100 / n) * i, duration: 0.5, ease: "power3.inOut" }, at)
            .to(steps[i - 1], { autoAlpha: 0, y: -40, duration: 0.22, ease: "power2.in" }, at)
            .to(steps[i], { autoAlpha: 1, y: 0, duration: 0.35, ease: "power3.out" }, at + 0.24);
        }
        htl.to({}, { duration: 0.25 });
        tickEls[0].classList.add("is-on");
      } else {
        gsap.set(steps, { y: 40, autoAlpha: 0 });
        whenSeen($(".steps"), () => gsap.to(steps, { y: 0, autoAlpha: 1, duration: 1, ease: "expo.out", stagger: 0.1 }));
      }

      /* ---------- results: placeholder cards rise, then drift at different speeds ---------- */
      const quotes = $$(".quote");
      gsap.set(quotes, { yPercent: 25, autoAlpha: 0, rotate: 2 });
      whenSeen($(".results__grid"), () => gsap.to(quotes, { yPercent: 0, autoAlpha: 1, rotate: 0, duration: 1.2, ease: "expo.out", stagger: 0.12 }));
      if (wide) {
        quotes.forEach((q, i) => gsap.to(q, { y: [40, -40, 10][i] || 0, ease: "none", scrollTrigger: { trigger: ".results__grid", start: "top bottom", end: "bottom top", scrub: true } }));
      }

      /* ---------- contact: "tu faro" switches on ---------- */
      whenSeen($(".contact__title"), () => $(".contact").classList.add("is-lit"), "top 70%");

      /* ---------- footer: the beam sweeps across and lights the logo ---------- */
      gsap.fromTo(".footer__logo-lit", { "--sweep": 0 }, { "--sweep": 1, ease: "none", scrollTrigger: { trigger: ".footer", start: "top 80%", end: "bottom bottom", scrub: 0.6 } });
      gsap.from(".footer__logo .logo", { yPercent: 18, ease: "none", scrollTrigger: { trigger: ".footer", start: "top bottom", end: "bottom bottom", scrub: true } });

      return () => cleanups.forEach((f) => f());
    });
    ScrollTrigger.refresh();
  }
  if (motion) ScrollTrigger.addEventListener("refresh", checkReveals);

  /* =======================================================================
     Intro: letters rise, the lamp lights, the beam draws, then the logo
     flies into the header while the curtain lifts. Once per session.
     ======================================================================= */
  function runIntro() {
    const intro = $(".intro");
    if (!motion || !intro || root.classList.contains("intro-seen")) {
      if (intro) intro.remove();
      heroIn(false);
      return;
    }
    intro.style.animation = "none";
    root.classList.add("is-intro");
    if (lenis) lenis.stop();

    const box = $(".intro__logo", intro);
    const svg = $("svg", box);
    const letters = $$(".logo-letters path", svg);
    const lamp = $(".logo-lamp", svg), glow = $(".logo-glow", svg), beam = $(".logo-beam", svg);
    const target = $(".brand svg");

    gsap.set(box, { opacity: 1 });
    gsap.set(letters, { y: 140, opacity: 0 });
    gsap.set(lamp, { scale: 0, transformOrigin: "50% 50%" });
    gsap.set(glow, { scale: 0.2, opacity: 0, transformOrigin: "50% 50%" });
    gsap.set(beam, { scaleX: 0, transformOrigin: "0% 50%" });

    const finish = () => {
      root.classList.remove("is-intro");
      intro.remove();
      if (lenis) lenis.start();
      try { sessionStorage.setItem("faro-intro", "1"); } catch (e) { /* ignore */ }
    };

    const tl = gsap.timeline({ onComplete: finish });
    tl.to(letters, { y: 0, opacity: 1, duration: 0.75, ease: "expo.out", stagger: 0.07 }, 0.1)
      .to(lamp, { scale: 1, duration: 0.6, ease: "back.out(3)" }, 0.5)
      .to(glow, { scale: 1, opacity: 1, duration: 0.8, ease: "expo.out" }, 0.55)
      .to(beam, { scaleX: 1, duration: 0.7, ease: "expo.out" }, 0.75)
      .add(() => {
        // FLIP: measure now (fonts and layout are settled) and fly to the header logo
        const a = svg.getBoundingClientRect(), b = target.getBoundingClientRect();
        tl.to(box, { x: b.left - a.left, y: b.top - a.top, scale: b.width / a.width, duration: 1.05, ease: "expo.inOut" }, 1.45);
      }, 1.4)
      .to($(".intro__bg", intro), { scaleY: 0, duration: 1.05, ease: "expo.inOut" }, 1.5)
      .add(() => heroIn(false), 1.75);
  }

  /* =======================================================================
     Boot
     ======================================================================= */
  function boot() {
    setupWhatsApp();
    setupWaFloat();
    observeViz();
    setupMenu();
    setupAnchors();
    setupCarousel();
    setupTilt();
    setupFaq();
    setupForm();
    setupSpotlights();
    window.addEventListener("load", setupHeroVideo, { once: true });
    if (!motion) return;

    setupLenis();
    setupCursor();
    setupMagnetic();
    // wait for the fonts so SplitText measures the real line breaks
    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    Promise.race([fontsReady, new Promise((r) => setTimeout(r, 2000))]).then(() => {
      try {
        setupMotion();
        // arriving with a link like /faro/#contacto: jump there now that the pins exist
        const hashTarget = location.hash.length > 1 && $(location.hash);
        if (hashTarget) rebuild(hashTarget.getBoundingClientRect().top + window.scrollY);
        runIntro();
      } catch (err) {
        // never leave content hidden because of an animation error
        console.error(err);
        root.classList.remove("js-motion");
        const intro = $(".intro");
        if (intro) intro.remove();
        root.classList.remove("is-intro");
        if (lenis) lenis.start();
      }
    });

    // rebuild split text when the width really changes (not on mobile URL-bar resizes)
    let w = window.innerWidth, timer;
    window.addEventListener("resize", () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (Math.abs(window.innerWidth - w) < 40) return;
        w = window.innerWidth;
        rebuild();
      }, 350);
    });
  }

  // keep the reader where they were while everything is re-measured
  function rebuild(y = window.scrollY) {
    setupMotion();
    // Lenis caches the page height: refresh it, or it clamps to the shorter, un-pinned page
    if (lenis) { lenis.resize(); lenis.scrollTo(y, { immediate: true, force: true }); }
    window.scrollTo(0, y);
    ScrollTrigger.update();
    checkReveals();
  }

  // Language switch: undo split text first, then re-hook what depends on the new text
  let langY = 0;
  document.addEventListener("faro:beforelang", () => {
    langY = window.scrollY;
    if (motion && mm) teardownMotion();
  });
  document.addEventListener("faro:lang", () => {
    setupWhatsApp();
    observeViz();
    lastCount = -1;
    if (motion && motionReady) {
      rebuild(langY);
    } else {
      updateCarousel();
    }
  });

  boot();
})();
