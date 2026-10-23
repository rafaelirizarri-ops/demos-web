/* =========================================================================
   CONPAV: behaviour
   - Header: a thin line after 8px of scroll; aria-current follows the section
   - Menu (below 1024px): full screen, Escape closes it, focus stays inside
   - WhatsApp float: shows once the hero is left, hides while Contact is on screen
   - Logo intro: the globe of the logo joins, turns and stops face on, then
     CONPAV appears (a video; the SVG takes over when it ends)
   - Motion (GSAP + ScrollTrigger + SplitText): the portada arrives, section
     titles rise line by line, the main photo of each work fills from the
     bottom up like concrete in the formwork ("colado"), and "Por dentro" is
     the one scene tied to scroll: the parts of the slope get named, one by one
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
  if (!hasIO || !hasGsap) root.classList.remove("js-motion");
  const motion = root.classList.contains("js-motion");

  const WA_URL = "https://wa.me/50372277828";
  const WA_TEXT = "Hola. Escribo desde el sitio web de CONPAV. Quiero cotizar una obra de: ";
  const waLink = (text) => WA_URL + "?text=" + encodeURIComponent(text);

  /* =======================================================================
     Header line and current section
     ======================================================================= */
  const header = $(".header");
  function onScrollHeader() { if (header) header.classList.toggle("is-scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScrollHeader, { passive: true });
  onScrollHeader();

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
  let menuOpen = false;
  function setMenu(open, returnFocus) {
    menuOpen = open;
    menu.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Menú");
    header.classList.toggle("is-open", open);
    header.dataset.tone = open ? "dark" : header.dataset.toneBase;
    root.classList.toggle("menu-open", open);
    updateFloat();
    if (open) { const first = $("a", menu); if (first) first.focus(); }
    else if (returnFocus) toggle.focus();
  }
  if (toggle && menu && header) {
    header.dataset.toneBase = header.dataset.tone || "light";
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
     WhatsApp float: after the hero, never over Contact
     ======================================================================= */
  const fab = $(".wa-float");
  const hero = $("#inicio");
  const contact = $("#contacto");
  let heroIn = true, contactIn = false;
  function updateFloat() { if (fab) fab.classList.toggle("is-shown", !heroIn && !contactIn && !menuOpen); }
  if (fab && hero && hasIO) {
    fab.hidden = false;
    new IntersectionObserver(([e]) => { heroIn = e.isIntersecting; updateFloat(); }).observe(hero);
    if (contact) new IntersectionObserver(([e]) => { contactIn = e.isIntersecting; updateFloat(); }).observe(contact);
  }

  /* =======================================================================
     Logo intro (portada). The video plays once, only when motion is
     allowed; when it ends, fails or does not start, the SVG lockup (drawn
     exactly where the last frame has it) takes its place. Without motion
     the video is never loaded and the SVG is there from the start.
     ======================================================================= */
  const stage = $(".hero__stage");
  const intro = stage && $(".hero__intro", stage);
  if (intro && motion) {
    let watchdog;
    const done = () => { clearTimeout(watchdog); stage.classList.add("is-done"); };
    intro.addEventListener("ended", done);
    // A decode error lands on the video; a source that cannot play (wrong type, or a media query
    // that does not match) fires on that <source>, so only the last one means none will play.
    intro.addEventListener("error", done);
    const sources = $$("source", intro);
    sources[sources.length - 1].addEventListener("error", done);
    // not started after a few seconds, or stuck halfway: show the logo
    watchdog = setTimeout(() => { intro.pause(); done(); }, 3500);
    intro.addEventListener("playing", () => {
      clearTimeout(watchdog);
      watchdog = setTimeout(() => { intro.pause(); done(); }, ((intro.duration || 5.2) - intro.currentTime + 3) * 1000);
    }, { once: true });
    sources.forEach((s) => { s.src = s.dataset.src; });
    intro.load();
    const playing = intro.play();
    if (playing && playing.catch) playing.catch(done);
  } else if (stage) {
    stage.classList.add("is-done");
  }

  /* =======================================================================
     Motion. Every starting state is in styles.css under .js-motion, so the
     page paints already in place and GSAP only takes things to where they
     end. Entrances run once; only the "Por dentro" scene depends on the
     screen, so only it lives in a matchMedia context that is rebuilt on resize.
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

    /* ---------- portada: the offer arrives under the turning globe ---------- */
    const heroTitle = riseLines($(".hero h1"));
    gsap.timeline({ delay: 0.6 })
      .add(heroTitle(), 0)
      .fromTo(".hero__lead, .hero .btn-pair", { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: EASE, stagger: 0.08 }, 0.25);

    // the header logo appears once the portada's logo has gone under the header
    const header = $(".header");
    if (header && stage) {
      ScrollTrigger.create({
        trigger: stage, start: "bottom top+=72",
        onEnter: () => header.classList.add("logo-on"),
        onLeaveBack: () => header.classList.remove("logo-on"),
      });
    }

    /* ---------- section titles and leads ---------- */
    $$("main .section-title").forEach((el) => {
      once(el, riseLines(el));
    });
    $$("main [data-reveal]:not(.section-title)").forEach((el) => {
      gsap.set(el, { y: 20 });
      once(el, () => gsap.to(el, { autoAlpha: 1, y: 0, duration: 0.9, ease: EASE, delay: 0.15 }));
    });

    /* ---------- lists arrive as lists: services, the works table, the facts ---------- */
    [[".services__list > .service", 24], [".ledger tbody tr", 0], [".company__facts .facts__row", 16]].forEach(([sel, y]) => {
      const items = $$(sel);
      if (!items.length) return;
      gsap.set(items, { autoAlpha: 0, y });
      const show = (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.8, ease: EASE, stagger: 0.06, overwrite: true });
      ScrollTrigger.batch(items, { start: "top 92%", end: "bottom top", once: true, onEnter: show, onLeave: show });
    });

    /* ---------- "colado": each work photo fills from the bottom, then its card ---------- */
    $$(".work").forEach((work) => {
      const pic = $(".work__photo picture", work);
      const img = $("img", pic);
      const card = $(".work__card", work);
      gsap.set(img, { scale: 1.12 });
      gsap.set(card, { autoAlpha: 0, y: 24 });
      once(work, () => gsap.timeline()
        .to(pic, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.2, ease: "power3.out" }, 0)
        .to(img, { scale: 1, duration: 1.6, ease: EASE }, 0)
        .to(card, { autoAlpha: 1, y: 0, duration: 0.9, ease: EASE }, 0.35), "top 80%");
    });

    /* ---------- contact: the details and the form ---------- */
    const contactBits = $$(".contact .channels, .contact__form");
    gsap.set(contactBits, { autoAlpha: 0, y: 24 });
    once($(".contact"), () => gsap.to(contactBits, { autoAlpha: 1, y: 0, duration: 0.9, ease: EASE, stagger: 0.08, delay: 0.2 }), "top 70%");

    /* ---------- "Por dentro": the one scene tied to scroll ----------
       The slope under construction gets its parts named in the order they go
       in: the mesh, the drain pipes, the shotcrete. Each cota sets its point,
       draws its line out to the label, then the label is written. On large
       screens the section holds still while it happens (pinned for about one
       screen of scroll); on smaller ones it plays as the photo crosses the
       screen. Scroll is never taken over: no snapping, no jumps. */
    const inside = $(".inside");
    const frame = $(".inside__frame");
    if (inside && frame) {
      const img = $("img", frame);
      const cotas = $$(".cota", frame);
      const labels = $$(".cotas__label", frame);
      // with the object form the handler only runs while one query matches, hence both
      gsap.matchMedia().add({
        scene: "(min-width: 1024px) and (min-height: 640px)",
        pass: "not all and (min-width: 1024px) and (min-height: 640px)",
      }, (ctx) => {
        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: ctx.conditions.scene
            ? { trigger: frame, start: "center 55%", end: "+=110%", pin: inside, scrub: 0.6, anticipatePin: 1 }
            : { trigger: frame, start: "top 70%", end: "bottom 80%", scrub: 0.6 },
        });
        tl.fromTo(img, { scale: 1.08 }, { scale: 1, duration: 1 }, 0);
        cotas.forEach((g, i) => {
          const lines = $$("line", g);
          const dot = $("circle", g);
          const label = labels[i];
          const a = +lines[0].getAttribute("x1"), b = +lines[0].getAttribute("y1");
          const c = +lines[0].getAttribute("x2"), d = +lines[0].getAttribute("y2");
          const at = 0.08 + i * 0.28;
          const fromEnd = label.classList.contains("cotas__label--end");
          tl.fromTo(dot, { scale: 0, transformOrigin: "50% 50%" }, { scale: 1, duration: 0.05 }, at)
            .fromTo(lines, { attr: { x2: a, y2: b } }, { attr: { x2: c, y2: d }, duration: 0.12 }, at + 0.03)
            .fromTo(label, { clipPath: fromEnd ? "inset(0% 0% 0% 100%)" : "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.1 }, at + 0.14);
        });
        tl.to({}, { duration: 0.1 }); // hold the finished picture before the pin lets go
      });
    }

    root.classList.add("motion-on");
    // fonts change line breaks and heights: measure again once they are in
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
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

    const check = (name) => {
      const input = form.elements[name];
      const err = $("#e-" + name, form);
      const help = $("#h-" + name, form);
      const msg = rules[name](input.value);
      err.textContent = msg;
      err.hidden = !msg;
      const ids = [help && help.id, msg && err.id].filter(Boolean).join(" ");
      if (ids) input.setAttribute("aria-describedby", ids); else input.removeAttribute("aria-describedby");
      if (msg) input.setAttribute("aria-invalid", "true"); else input.removeAttribute("aria-invalid");
      return !msg;
    };
    const showSummary = (n) => {
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
      check(name);
      showSummary(Object.keys(rules).filter((n) => form.elements[n].getAttribute("aria-invalid") === "true").length);
    });

    const value = (name) => (form.elements[name] ? form.elements[name].value.trim() : "");
    const waMessage = () => {
      const lines = [WA_TEXT + value("tipo")];
      if (value("nombre")) lines.push("Nombre: " + value("nombre"));
      if (value("empresa")) lines.push("Empresa: " + value("empresa"));
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
      p2.append("Si tiene fotos o planos, puede enviarlos por ", a, ".");
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
