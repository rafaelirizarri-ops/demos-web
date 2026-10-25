/* =========================================================================
   CONPAV: behaviour
   - Header: a thin line after 8px of scroll; its tone follows the section
     under it; aria-current follows the section in view
   - Menu (below 1024px): full screen, Escape closes it, focus stays inside
   - WhatsApp float: shows once the portada is left, hides over Contact
   - Logo intro (first visit of the session): the globe turns three times,
     CONPAV appears, and the logo flies to the corner of the header. Any
     scroll, key or tap skips it; it never holds the page.
   - Portada: hero3d.js draws the structure of points; here the scroll moves
     its camera across the areas (ScrollTrigger), the offer gives way to the
     drawing, the five bars fill, and the pause button stops the ambient motion
   - Motion (GSAP + ScrollTrigger + SplitText, Lenis for smooth scroll):
     titles rise line by line, figures count up, the map lights the eight
     departments, lists arrive as lists
   - Works: filter by area, with the count announced
   - Quote form: validation in plain words, FormSubmit by fetch, and a
     WhatsApp message with what was typed if sending fails
   Without JS or with reduced motion everything is visible and usable.
   ========================================================================= */

(function () {
  "use strict";

  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const hasIO = "IntersectionObserver" in window;
  const hasGsap = !!(window.gsap && window.ScrollTrigger && window.SplitText);
  if (!hasIO || !hasGsap) root.classList.remove("js-motion", "intro-on");
  const motion = root.classList.contains("js-motion");
  const clamp01 = (v) => Math.min(1, Math.max(0, v));

  const WA_URL = "https://wa.me/50372277828";
  const WA_TEXT = "Hola. Escribo desde el sitio web de CONPAV. Quiero cotizar una obra de: ";
  const waLink = (text) => WA_URL + "?text=" + encodeURIComponent(text);

  const header = $(".header");
  const headerH = () => (header ? header.offsetHeight : 0);
  let lenis = null;
  let menuOpen = false;

  /* =======================================================================
     Smooth scroll (Lenis) on the GSAP ticker, only with motion
     ======================================================================= */
  if (motion && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* =======================================================================
     Header: the line, the tone of the section under it, the current section
     ======================================================================= */
  const toned = $$("main > section[data-tone], footer[data-tone]");
  let toneTick = 0;
  function onScrollHeader() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
    const y = headerH() / 2;
    let tone = "dark";
    for (const s of toned) {
      const r = s.getBoundingClientRect();
      if (r.top <= y && r.bottom > y) { tone = s.dataset.tone; break; }
    }
    header.dataset.toneBase = tone;
    if (!menuOpen && header.dataset.tone !== tone) header.dataset.tone = tone;
  }
  window.addEventListener("scroll", () => {
    if (!toneTick) toneTick = requestAnimationFrame(() => { toneTick = 0; onScrollHeader(); updateFloat(); });
  }, { passive: true });

  const navLinks = $$('.nav a[href^="#"]');
  if (hasIO && navLinks.length) {
    const byId = new Map(navLinks.map((a) => [a.getAttribute("href").slice(1), a]));
    const sections = $$("main section[id]");
    const current = new Set();
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? current.add(e.target.id) : current.delete(e.target.id)));
      const id = sections.map((s) => s.id).find((i) => current.has(i));
      navLinks.forEach((a) => a.removeAttribute("aria-current"));
      if (id && byId.has(id)) byId.get(id).setAttribute("aria-current", "true");
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => spy.observe(s));
  }

  /* =======================================================================
     Menu (below 1024px)
     ======================================================================= */
  const toggle = $(".menu-toggle");
  const menu = $("#menu");
  function setMenu(open, returnFocus) {
    menuOpen = open;
    menu.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Menú");
    header.classList.toggle("is-open", open);
    header.dataset.tone = open ? "dark" : header.dataset.toneBase || "dark";
    root.classList.toggle("menu-open", open);
    if (lenis) { if (open) lenis.stop(); else lenis.start(); }
    updateFloat();
    if (open) { const first = $("a", menu); if (first) first.focus(); }
    else if (returnFocus) toggle.focus();
  }
  if (toggle && menu && header) {
    toggle.addEventListener("click", () => setMenu(!menuOpen, true));
    menu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false, false); });
    document.addEventListener("keydown", (e) => {
      if (!menuOpen) return;
      if (e.key === "Escape") { e.preventDefault(); setMenu(false, true); return; }
      if (e.key !== "Tab") return;
      // keep focus inside the header (logo, close button, menu links) while it is open
      const items = $$("a[href], button", header).filter((el) => el.offsetParent !== null);
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    window.matchMedia("(min-width: 1024px)").addEventListener("change", (m) => { if (m.matches && menuOpen) setMenu(false, false); });
  }

  /* =======================================================================
     WhatsApp float: after the portada, never over Contact or the menu
     ======================================================================= */
  const fab = $(".wa-float");
  const hero = $("#inicio");
  const contact = $("#contacto");
  let contactIn = false;
  function updateFloat() {
    if (!fab || fab.hidden) return;
    const pastHero = hero ? hero.getBoundingClientRect().bottom < window.innerHeight * 0.6 : true;
    fab.classList.toggle("is-shown", pastHero && !contactIn && !menuOpen);
  }
  if (fab && hasIO) {
    fab.hidden = false;
    if (contact) new IntersectionObserver(([e]) => { contactIn = e.isIntersecting; updateFloat(); }).observe(contact);
  }
  onScrollHeader();

  /* =======================================================================
     In-page links glide with Lenis; the focus follows the target
     ======================================================================= */
  if (lenis) {
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const id = a.getAttribute("href");
      const target = id.length > 1 && document.getElementById(id.slice(1));
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(id === "#inicio" ? 0 : target, { offset: -headerH() - 8, duration: 1.4 });
      history.replaceState(null, "", id);
      if (id !== "#inicio" && target !== $("#main")) {
        if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }
    });
  }

  /* =======================================================================
     Portada. hero3d.js runs first (both scripts are deferred, in order) and
     leaves window.conpavHero; without WebGL it is missing, and the still
     image from the <noscript> takes its place.
     ======================================================================= */
  const H = window.conpavHero;
  const sticky = $(".hero__sticky");
  const heroText = $(".hero__text");
  if (!H && sticky) {
    root.classList.add("no-webgl");
    const ns = $("noscript", sticky);
    if (ns) ns.insertAdjacentHTML("afterend", ns.textContent);
  }
  const tourItems = $$(".tour__item");
  const layout = (k) => { if (H && heroText) H.setLayout(heroText.getBoundingClientRect(), k); };

  // The scroll drives the camera: the offer gives way to the drawing as the
  // tour begins, each bar fills on the way to its area, and the area in view
  // is named. Nothing here takes the scroll; it only reads it.
  let textK = 1;
  function setTour(p) {
    H.setProgress(p);
    const k = 1 - clamp01((p - 0.02) / 0.09);
    if (k !== textK) {
      textK = k;
      heroText.style.opacity = k;
      heroText.style.transform = k < 1 ? "translateY(" + (-(1 - k) * 40).toFixed(1) + "px)" : "";
      heroText.style.visibility = k < 0.02 ? "hidden" : "";
    }
    layout(k);
    let prev = 0.02, best = null, bestD = 0.09;
    tourItems.forEach((li) => {
      const at = H.stops[li.dataset.area];
      $(".tour__fill", li).style.transform = "scaleX(" + clamp01((p - prev) / (at - prev)).toFixed(3) + ")";
      prev = at;
      const d = Math.abs(p - at);
      if (d < bestD) { bestD = d; best = li; }
    });
    tourItems.forEach((li) => li.classList.toggle("is-active", li === best));
  }

  if (H) {
    if (motion) {
      H.setProgress(0);
      layout(1);
      const pause = $(".hero__pause");
      if (pause && H.animated) {
        pause.hidden = false;
        const label = $(".hero__pause-label", pause);
        // The drift also rests while the pointer is on the text or focus is in the hero,
        // and comes back when they leave, unless the button paused it.
        let held = false, hovered = false, focused = false;
        const sync = () => H.setAmbient(!(held || hovered || focused));
        pause.addEventListener("click", () => {
          held = !held;
          pause.setAttribute("aria-pressed", String(held));
          label.textContent = held ? "Reanudar animación" : "Pausar animación";
          sync();
        });
        // the text block spans the screen; its lines, lead and buttons are what is read
        [...heroText.children].forEach((el) => {
          el.addEventListener("pointerenter", (e) => { if (e.pointerType !== "touch") { hovered = true; sync(); } });
          el.addEventListener("pointerleave", () => { if (hovered) { hovered = false; sync(); } });
        });
        // on the button itself, its own state rules
        sticky.addEventListener("focusin", (e) => { focused = e.target !== pause; sync(); });
        sticky.addEventListener("focusout", (e) => { if (!sticky.contains(e.relatedTarget)) { focused = false; sync(); } });
      }
    } else {
      // reduced motion: the finished structure, still, beside the text
      H.still();
      layout(1);
      window.addEventListener("resize", () => layout(1));
    }
  }

  /* =======================================================================
     Logo intro. The video plays once per session; when it ends, its last
     frame is swapped for the two SVG pieces (they match), which fly to the
     header logo while the paper fades and the portada arrives. If it is
     skipped, fails or stalls, the paper just fades.
     ======================================================================= */
  function runIntro(onReveal) {
    const intro = $(".intro");
    if (!motion || !intro || !root.classList.contains("intro-on")) { onReveal(false); return; }
    try { sessionStorage.setItem("conpav-intro", "1"); } catch (e) { /* ignore */ }
    const video = $(".intro__video", intro);
    const lockup = $(".intro__lockup", intro);
    const sources = $$("source", video);
    let over = false, watchdog;
    const SKIP = ["wheel", "touchstart", "keydown", "pointerdown"];
    const skip = () => finish(false);

    const end = () => {
      root.classList.remove("intro-on");
      video.pause();
      sources.forEach((s) => s.removeAttribute("src"));
      video.load();
      intro.remove();
    };
    function finish(fly) {
      if (over) return;
      over = true;
      clearTimeout(watchdog);
      SKIP.forEach((t) => window.removeEventListener(t, skip, true));
      onReveal(true);
      if (!fly) { gsap.to(intro, { autoAlpha: 0, duration: 0.45, ease: "power2.out", onComplete: end }); return; }
      lockup.style.opacity = 1;
      video.style.opacity = 0;
      const tl = gsap.timeline({ onComplete: end });
      [[".intro__globe", ".logo__globe"], [".intro__letters", ".logo__letters"]].forEach(([from, to], i) => {
        const el = $(from, intro), target = $(to, header);
        const a = el.getBoundingClientRect(), b = target.getBoundingClientRect();
        tl.to(el, { x: b.left - a.left, y: b.top - a.top, scale: b.width / a.width, duration: 1.15, ease: "expo.inOut" }, i * 0.07);
      });
      tl.to(intro, { backgroundColor: "rgba(245, 244, 240, 0)", duration: 0.9, ease: "power2.inOut" }, 0.2)
        .to(intro, { color: "#F5F4F0", duration: 0.6, ease: "none" }, 0.45);
    }

    SKIP.forEach((t) => window.addEventListener(t, skip, { capture: true, passive: true }));
    video.addEventListener("ended", () => finish(true));
    // A decode error lands on the video; a source that cannot play (wrong type, or a media query
    // that does not match) fires on that <source>, so only the last one means none will play.
    video.addEventListener("error", skip);
    sources[sources.length - 1].addEventListener("error", skip);
    watchdog = setTimeout(skip, 2500);
    video.addEventListener("playing", () => {
      clearTimeout(watchdog);
      watchdog = setTimeout(skip, ((video.duration || 5.2) - video.currentTime + 2) * 1000);
    }, { once: true });
    sources.forEach((s) => { s.src = s.dataset.src; });
    video.load();
    const playing = video.play();
    if (playing && playing.catch) playing.catch(skip);
  }

  /* =======================================================================
     Motion. Every starting state is in styles.css under .js-motion, so the
     page paints already in place and GSAP only takes things to where they
     end. Entrances run once.
     ======================================================================= */
  if (motion) {
    gsap.registerPlugin(ScrollTrigger, SplitText);
    ScrollTrigger.config({ ignoreMobileResize: true });
    const EASE = "expo.out";

    // Lines rise out of a mask. If the text re-splits while waiting (fonts,
    // width), the new lines wait too; once the rise starts they stay put.
    // The split is undone when the lines land, so the heading is plain text again.
    const riseLines = (el) => {
      let waiting = true;
      const s = SplitText.create(el, {
        type: "lines", mask: "lines", linesClass: "ln", autoSplit: true,
        onSplit: (self) => { gsap.set(self.lines, { yPercent: waiting ? 105 : 0 }); },
      });
      gsap.set(el, { visibility: "visible" });
      return (vars) => {
        waiting = false;
        return gsap.to(s.lines, Object.assign({ yPercent: 0, duration: 1.1, ease: EASE, stagger: 0.08, onComplete: () => s.revert() }, vars));
      };
    };
    // Run once, the first time the element comes into view or is scrolled past
    const once = (el, run, start = "top 85%") => {
      let done = false;
      const go = () => { if (!done) { done = true; run(); } };
      ScrollTrigger.create({ trigger: el, start, end: "bottom top", once: true, onEnter: go, onLeave: go, onEnterBack: go });
    };

    /* ---------- portada: the camera tour ---------- */
    if (H && hero) {
      ScrollTrigger.create({
        trigger: hero,
        start: () => "top " + headerH(),
        end: "bottom bottom",
        invalidateOnRefresh: true,
        onUpdate: (self) => setTour(self.progress),
        onRefresh: (self) => setTour(self.progress),
      });
    }

    /* ---------- portada: the arrival, after the intro or straight away ---------- */
    // With the intro, the title is already painted under the paper (it is the LCP) and stays
    // put; inline, so it keeps showing once .intro-on goes. Without it, its lines rise.
    const introOn = root.classList.contains("intro-on");
    if (introOn) gsap.set(".hero h1", { visibility: "visible" });
    const heroTitle = introOn ? null : riseLines($(".hero h1"));
    runIntro((afterIntro) => {
      if (H) H.assemble();
      const tl = gsap.timeline({ delay: afterIntro ? 0.25 : 0.15 });
      if (heroTitle) tl.add(heroTitle(), 0);
      tl.fromTo(".hero__lead, .hero .btn-pair", { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: EASE, stagger: 0.08 }, afterIntro ? 0.2 : 0.3)
        .fromTo(".hero__tour", { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.2, ease: "power2.out" }, 1.6);
    });

    /* ---------- section titles and leads ---------- */
    $$("main .section-title").forEach((el) => { once(el, riseLines(el)); });
    $$("main [data-reveal]:not(.section-title)").forEach((el) => {
      gsap.set(el, { y: 20 });
      once(el, () => gsap.to(el, { autoAlpha: 1, y: 0, duration: 0.9, ease: EASE, delay: 0.15 }));
    });

    /* ---------- lists arrive as lists ---------- */
    // Opacity, never visibility: links and fields waiting to arrive stay in the tab order,
    // and tabbing to one scrolls it into view, which brings it in.
    [[".figure", 24], [".areas__list > .area", 24], [".clients__list > .client", 24], [".ledger tbody tr", 0], [".company__facts .facts__row", 16], [".shot", 32]].forEach(([sel, y]) => {
      const items = $$(sel);
      if (!items.length) return;
      gsap.set(items, { opacity: 0, y });
      const show = (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.9, ease: EASE, stagger: 0.07, overwrite: true });
      ScrollTrigger.batch(items, { start: "top 92%", end: "bottom top", once: true, onEnter: show, onLeave: show });
    });

    /* ---------- the figures count up ---------- */
    $$(".figure__n[data-count]").forEach((el) => {
      const n = +el.dataset.count, v = { n: 0 };
      el.textContent = "0";
      once(el, () => gsap.to(v, { n, duration: 1.6, ease: "power3.out", delay: 0.2, onUpdate: () => { el.textContent = Math.round(v.n); } }), "top 90%");
    });

    /* ---------- the map lights its departments, from La Unión to Sonsonate ---------- */
    const map = $(".map");
    if (map) {
      const order = ["La Unión", "Morazán", "San Miguel", "Usulután", "San Salvador", "Chalatenango", "La Libertad", "Sonsonate"];
      const worked = order.map((d) => $('.map__dept[data-dept="' + d + '"]', map)).filter(Boolean);
      const labels = order.map((d) => $('.map__label[data-dept="' + d + '"]', map)).filter(Boolean);
      gsap.set(worked, { stroke: "#4A5159" });
      gsap.set(labels, { autoAlpha: 0, y: 6 });
      once(map, () => gsap.timeline()
        .to(worked, { stroke: "#F28C6A", duration: 0.7, ease: "power2.out", stagger: 0.14 }, 0.1)
        .to(labels, { autoAlpha: 1, y: 0, duration: 0.6, ease: EASE, stagger: 0.14 }, 0.3), "top 75%");
    }

    /* ---------- contact: the details and the form ---------- */
    const contactBits = $$(".contact .channels, .contact__form");
    gsap.set(contactBits, { opacity: 0, y: 24 });
    once($(".contact"), () => gsap.to(contactBits, { opacity: 1, y: 0, duration: 0.9, ease: EASE, stagger: 0.08, delay: 0.2 }), "top 70%");

    root.classList.add("motion-on");
    // fonts change line breaks and heights: measure again once they are in
    const refresh = () => { ScrollTrigger.refresh(); if (lenis) lenis.resize(); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
    window.addEventListener("load", refresh);
  }

  /* =======================================================================
     Works: filter by area. Without JS the whole table shows and the
     filter buttons stay hidden.
     ======================================================================= */
  const filters = $(".filters");
  const rows = $$(".ledger tbody tr");
  const workCount = $(".works__count");
  function applyFilter(key) {
    let n = 0, name = "";
    $$(".filter", filters).forEach((b) => {
      const on = b.dataset.filter === key;
      b.setAttribute("aria-pressed", String(on));
      if (on) name = b.firstChild && b.textContent.replace(/\s*\d+\s*$/, "").trim();
    });
    const shown = [];
    rows.forEach((r) => {
      const show = key === "all" || r.dataset.area === key;
      r.hidden = !show;
      if (show) { n++; shown.push(r); }
    });
    workCount.textContent = key === "all" ? "Todas las obras: " + n : name + ": " + n + (n === 1 ? " obra" : " obras");
    if (motion) {
      gsap.fromTo(shown, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out", stagger: 0.03, overwrite: true });
      ScrollTrigger.refresh();
    }
  }
  if (filters && rows.length) {
    filters.hidden = false;
    filters.addEventListener("click", (e) => {
      const b = e.target.closest(".filter");
      if (b) applyFilter(b.dataset.filter);
    });
    // "5 obras realizadas" under each area opens the list on that area
    $$(".area__count[data-filter]").forEach((a) => a.addEventListener("click", () => applyFilter(a.dataset.filter)));
  }

  /* =======================================================================
     Quote form (FormSubmit). Errors show on submit, then as each field is
     left; never while typing. Without JS the form posts normally.
     ======================================================================= */
  const form = $("form[data-quote]");
  if (form) {
    form.noValidate = true;
    const summary = $(".quote__summary", form);
    const fail = $(".quote__fail", form);
    const failWa = $(".quote__wa", form);
    const submit = $(".quote__submit", form);
    const done = $(".quote__done");
    const COUNT = ["", "un", "dos", "tres", "cuatro"];
    let tried = false;
    let sending = false;

    const digits = (v) => {
      let d = v.replace(/[\s().-]/g, "");
      if (/^\+?503\d{8}$/.test(d)) d = d.replace(/^\+?503/, "");
      return d;
    };
    const rules = {
      nombre: (v) => (v.trim() ? "" : "Escriba su nombre."),
      telefono: (v) => {
        if (!v.trim()) return "Escriba un teléfono para poder responderle.";
        return /^\d{8}$/.test(digits(v)) ? "" : "Revise el número: en El Salvador tiene ocho dígitos.";
      },
      email: (v) => (!v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "Revise el correo: debe tener la forma nombre@correo.com."),
      mensaje: (v) => (v.trim() ? "" : "Cuéntenos en pocas palabras qué obra necesita."),
    };

    // On leaving a field (soft), a message that clears keeps its line, invisible, until the
    // next send: if it closed, the button below would move away from a click already on it.
    const check = (name, soft) => {
      const input = form.elements[name];
      const err = $("#e-" + name, form);
      const help = $("#h-" + name, form);
      const msg = rules[name](input.value);
      const keep = soft && !msg && !err.hidden;
      err.classList.toggle("is-spent", keep);
      if (!keep) { err.textContent = msg; err.hidden = !msg; }
      const ids = [help && help.id, msg && err.id].filter(Boolean).join(" ");
      if (ids) input.setAttribute("aria-describedby", ids); else input.removeAttribute("aria-describedby");
      if (msg) input.setAttribute("aria-invalid", "true"); else input.removeAttribute("aria-invalid");
      return !msg;
    };
    const showSummary = (n, soft) => {
      const keep = soft && !n && !summary.hidden;
      summary.classList.toggle("is-spent", keep);
      if (keep) return;
      summary.hidden = !n;
      summary.textContent = n === 1 ? "Falta un dato: revise el campo marcado."
        : n ? "Faltan " + (COUNT[n] || n) + " datos: revise los campos marcados." : "";
    };
    const validate = () => {
      const bad = Object.keys(rules).filter((name) => !check(name));
      showSummary(bad.length);
      return bad;
    };

    form.addEventListener("focusout", (e) => {
      const name = e.target.name;
      if (!tried || !rules[name]) return;
      check(name, true);
      showSummary(Object.keys(rules).filter((n) => form.elements[n].getAttribute("aria-invalid") === "true").length, true);
    });

    const value = (name) => (form.elements[name] ? form.elements[name].value.trim() : "");
    const waMessage = () => {
      const lines = [WA_TEXT + value("tipo")];
      if (value("nombre")) lines.push("Nombre: " + value("nombre"));
      if (value("empresa")) lines.push("Empresa o entidad: " + value("empresa"));
      if (value("cliente")) lines.push("Tipo de cliente: " + value("cliente"));
      if (value("departamento")) lines.push("Departamento: " + value("departamento"));
      if (value("mensaje")) lines.push(value("mensaje").slice(0, 500));
      return lines.join("\n");
    };

    const showDone = () => {
      const name = value("nombre");
      done.textContent = "";
      const h = document.createElement("h3");
      h.textContent = "Solicitud enviada";
      h.tabIndex = -1;
      const p = document.createElement("p");
      p.textContent = "Gracias, " + name + ". Le responderemos al teléfono o al correo que nos dejó.";
      const p2 = document.createElement("p");
      const a = document.createElement("a");
      a.href = waLink(WA_TEXT);
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = "WhatsApp";
      p2.append("Si tiene planos o fotos, puede enviarlos por ", a, ".");
      done.append(h, p, p2);
      form.hidden = true;
      h.focus();
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (sending) return;
      tried = true;
      fail.hidden = true;
      const bad = validate();
      if (bad.length) { form.elements[bad[0]].focus(); return; }
      // a filled trap field means a bot: pretend it went through, send nothing
      if (form.elements._honey && form.elements._honey.value) { showDone(); return; }

      sending = true;
      submit.setAttribute("aria-disabled", "true");
      submit.textContent = "Enviando…";
      try {
        const res = await fetch(form.action.replace("formsubmit.co/", "formsubmit.co/ajax/"), {
          method: "POST",
          headers: { Accept: "application/json" },
          body: new FormData(form),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || String(data.success) !== "true") throw new Error("not sent");
        showDone();
      } catch (err) {
        failWa.href = waLink(waMessage());
        fail.hidden = false;
      } finally {
        sending = false;
        submit.removeAttribute("aria-disabled");
        submit.textContent = "Enviar solicitud";
      }
    });
  }
})();
