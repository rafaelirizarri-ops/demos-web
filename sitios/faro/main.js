/* =========================================================================
   Faro: behaviour
   - Smooth scroll (Lenis) synced with GSAP ScrollTrigger
   - Headline line reveals (SplitText), problem lines that "light up",
     pinned horizontal services track, steps rail, subtle hero parallax
   - Card tilt + cursor light, live card visuals only while on screen
   - WhatsApp links, optional hero video, contact form (Web3Forms/Formspree)
   Everything degrades: with no JS or reduced motion the content is all there.
   ========================================================================= */

(function () {
  "use strict";

  const CFG = window.FARO_CONFIG || {};
  const root = document.documentElement;
  const t = (k) => window.Faro.t(k);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);

  // If the motion libraries failed to load, show everything statically
  if (!hasGsap || reduceMotion) root.classList.remove("js-motion");

  /* ---------- header: solid background once you leave the hero ---------- */
  const header = document.querySelector(".header");
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- footer year ---------- */
  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ---------- WhatsApp links (hidden until a number is configured) ---------- */
  function setupWhatsApp() {
    const num = String(CFG.whatsapp || "").replace(/\D/g, "");
    document.querySelectorAll("[data-wa-link]").forEach((a) => {
      if (!num) { a.hidden = true; return; }
      a.hidden = false;
      a.href = "https://wa.me/" + num + "?text=" + encodeURIComponent(t("contact.waText"));
    });
    document.querySelectorAll("[data-wa-block]").forEach((b) => (b.hidden = !num));
  }

  /* ---------- hero video (optional, loaded after the page is ready) ---------- */
  function setupHeroVideo() {
    const v = CFG.heroVideo || {};
    const video = document.querySelector(".hero__video");
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
    video.load();
    video.play().catch(() => {});
  }

  /* ---------- service visuals only animate while visible (saves battery) ---------- */
  let vizObserver;
  function observeViz() {
    if (vizObserver) vizObserver.disconnect();
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(".viz").forEach((el) => el.classList.add("is-live"));
      return;
    }
    vizObserver = new IntersectionObserver((entries) => {
      entries.forEach((e) => e.target.classList.toggle("is-live", e.isIntersecting));
    }, { rootMargin: "0px 200px 0px 200px" });
    document.querySelectorAll(".viz").forEach((el) => vizObserver.observe(el));
  }

  /* ---------- card tilt + cursor light (mouse only) ---------- */
  function setupTilt() {
    const track = document.querySelector(".services__track");
    if (!track || !finePointer || reduceMotion) return;
    track.addEventListener("pointermove", (e) => {
      const card = e.target.closest(".card");
      if (!card) return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      card.style.setProperty("--mx", x * 100 + "%");
      card.style.setProperty("--my", y * 100 + "%");
      card.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 6}deg) rotateY(${(x - 0.5) * 8}deg) translateZ(0)`;
    });
    track.addEventListener("pointerout", (e) => {
      const card = e.target.closest(".card");
      if (card && !card.contains(e.relatedTarget)) card.style.transform = "";
    });
  }

  /* ---------- contact form ---------- */
  function setupForm() {
    const form = document.querySelector("[data-form]");
    if (!form) return;
    const status = form.querySelector(".form__status");
    const btn = form.querySelector(".form__submit");
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
      const configured = fc.provider === "formspree" ? /formspree\.io\/f\//.test(fc.endpoint || "") : !!fc.accessKey;
      if (!configured) { say(t("contact.notConnected"), "error"); return; }

      const data = {
        name: form.name.value.trim(),
        business: form.business.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        needs: [...form.querySelectorAll('input[name="needs"]:checked')].map((c) => c.value).join(", "),
        message: form.message.value.trim(),
        language: window.Faro.lang,
      };

      btn.disabled = true;
      const label = btn.textContent;
      btn.textContent = t("contact.sending");
      say("");

      try {
        let res;
        if (fc.provider === "formspree") {
          res = await fetch(fc.endpoint, { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" }, body: JSON.stringify(data) });
        } else {
          res = await fetch(fc.endpoint || "https://api.web3forms.com/submit", {
            method: "POST",
            headers: { Accept: "application/json", "Content-Type": "application/json" },
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
     Motion (GSAP). Rebuilt from scratch whenever the language changes,
     because the text (and so the line breaks and widths) changes.
     ======================================================================= */
  let lenis, ctx, splits = [];

  function setupLenis() {
    if (reduceMotion || !window.Lenis || !hasGsap) return;
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    // In-page anchors go through Lenis so they glide too
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href");
      const target = id === "#top" ? 0 : document.querySelector(id);
      if (target === null) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: id === "#top" ? 0 : -70, duration: 1.4 });
      if (target && target.focus) target.setAttribute("tabindex", "-1"), target.focus({ preventScroll: true });
    });
  }

  function teardownMotion() {
    splits.forEach((s) => s.revert());
    splits = [];
    if (ctx) { ctx.revert(); ctx = null; }
  }

  function setupMotion() {
    if (!hasGsap) return;
    gsap.registerPlugin(ScrollTrigger);
    if (window.SplitText) gsap.registerPlugin(SplitText);

    teardownMotion();

    ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      /* Problem lines light up as they cross the middle of the screen (works with reduced motion too: it is a colour change, not movement) */
      gsap.utils.toArray(".problem__line").forEach((line) => {
        ScrollTrigger.create({ trigger: line, start: "top 62%", toggleClass: "is-lit" });
      });

      /* Steps rail fills with light */
      const steps = document.querySelector(".steps");
      if (steps) {
        steps.style.setProperty("--rail", reduceMotion ? 1 : 0);
        if (!reduceMotion) {
          gsap.to(steps, { "--rail": 1, ease: "none", scrollTrigger: { trigger: steps, start: "top 70%", end: "bottom 60%", scrub: true } });
        }
      }

      if (reduceMotion) return;

      /* Headlines: lines rise out of a mask */
      document.querySelectorAll("[data-split]").forEach((el) => {
        el.style.visibility = "visible";
        if (!window.SplitText) return;
        {
          const split = new SplitText(el, { type: "lines", mask: "lines", linesClass: "split-line-inner", autoSplit: false });
          splits.push(split);
          const isHero = el.classList.contains("hero__title");
          gsap.from(split.lines, {
            yPercent: 110, duration: 1.2, ease: "expo.out", stagger: 0.09,
            delay: isHero ? 0.15 : 0,
            scrollTrigger: isHero ? null : { trigger: el, start: "top 85%", once: true },
          });
        }
      });

      /* Hero: supporting text arrives after the headline, then everything drifts on scroll */
      gsap.from(".hero .kicker, .hero__lead, .hero__ctas, .hero__scroll", { y: 24, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.08, delay: 0.5 });
      gsap.to(".hero__inner", { yPercent: -18, opacity: 0.2, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
      gsap.to(".hero__media", { yPercent: 18, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

      /* Generic fade-up for blocks */
      const reveal = gsap.utils.toArray(".services__lead, .step, .quote, .qa, .form, .contact__lead, .contact__wa, .results__note, .problem__close");
      gsap.set(reveal, { opacity: 0, y: 28, visibility: "visible" });
      ScrollTrigger.batch(reveal, {
        start: "top 88%", once: true,
        onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1, ease: "expo.out", stagger: 0.08, overwrite: true }),
      });

      /* Desktop: pin the services and scroll the cards sideways */
      mm.add("(min-width: 1024px)", () => {
        const track = document.querySelector(".services__track");
        const pin = document.querySelector(".services__pin");
        const bar = document.querySelector(".services__progress span");
        const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
        const tween = gsap.to(track, {
          x: () => -distance(), ease: "none",
          scrollTrigger: {
            trigger: pin, start: "top top", end: () => "+=" + distance(), pin: true, scrub: 0.6, invalidateOnRefresh: true,
            onUpdate: (self) => bar && gsap.set(bar, { scaleX: self.progress }),
          },
        });
        // cards ease in as they enter from the right
        gsap.utils.toArray(".card").forEach((card) => {
          gsap.from(card, { opacity: 0.25, scale: 0.94, ease: "none", scrollTrigger: { trigger: card, containerAnimation: tween, start: "left 100%", end: "left 60%", scrub: true } });
        });
      });

      /* Mobile/tablet: cards fade up one by one */
      mm.add("(max-width: 1023px)", () => {
        gsap.utils.toArray(".card").forEach((card) => {
          gsap.from(card, { opacity: 0, y: 40, duration: 1, ease: "expo.out", scrollTrigger: { trigger: card, start: "top 90%", once: true } });
        });
      });
    });

    ScrollTrigger.refresh();
  }

  /* ---------- boot ---------- */
  function boot() {
    setupWhatsApp();
    observeViz();
    setupTilt();
    setupForm();
    setupLenis();
    // wait for fonts so SplitText measures the real line breaks
    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    Promise.race([fontsReady, new Promise((r) => setTimeout(r, 2500))]).then(setupMotion);
    window.addEventListener("load", setupHeroVideo, { once: true });
  }

  // Language switch: undo split text first, then re-hook what depends on the new lists
  document.addEventListener("faro:beforelang", () => { if (hasGsap) teardownMotion(); });
  document.addEventListener("faro:lang", () => {
    setupWhatsApp();
    observeViz();
    setupMotion();
  });

  boot();
})();
