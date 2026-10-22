/* =========================================================================
   CONPAV: behaviour
   - Header: a thin line after 8px of scroll; aria-current follows the section
   - Menu (below 1024px): full screen, Escape closes it, focus stays inside
   - WhatsApp float: shows once the hero is left, hides while Contact is on screen
   - Reveals: section titles rise in; the main photo of each work fills from
     the bottom up, like concrete filling the formwork ("colado")
   - La cala: the inspection opening. Scroll-linked with a CSS view timeline
     (requestAnimationFrame fallback); two buttons on short windows
   - Quote form: validation in plain words, FormSubmit by fetch, and a
     WhatsApp message with what was typed if sending fails
   Without JS or with reduced motion everything is visible and usable.
   ========================================================================= */

(function () {
  "use strict";

  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const hasIO = "IntersectionObserver" in window;
  if (!hasIO) root.classList.remove("js-motion");
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
     Reveals: titles rise 12px (60ms apart); work photos fill bottom-up once
     ======================================================================= */
  if (motion) {
    const reveal = new IntersectionObserver((entries, obs) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); obs.unobserve(e.target); } });
    }, { threshold: 0.2 });
    $$("[data-reveal]").forEach((el) => {
      const group = $$("[data-reveal]", el.parentElement);
      el.style.transitionDelay = group.indexOf(el) * 60 + "ms";
      reveal.observe(el);
    });
    $$(".work__photo").forEach((el) => reveal.observe(el));
  }

  /* =======================================================================
     La cala: the finished slope opens to show what holds it
     ======================================================================= */
  const cala = $("#cala");
  if (cala && motion) {
    const track = $(".cala__track", cala);
    const frame = $(".cala__frame", cala);
    const sw = $(".cala__switch", cala);
    const [btnBase, btnInside] = $$("button", sw);
    const cssTimeline = !!(window.CSS && CSS.supports && CSS.supports("view-timeline-name: --cala"));
    let mode = "";
    let open = false;
    let ticking = false;

    sw.hidden = false;
    cala.classList.add("is-enhanced");

    const setPressed = (isOpen) => {
      open = isOpen;
      btnBase.setAttribute("aria-pressed", String(!isOpen));
      btnInside.setAttribute("aria-pressed", String(isOpen));
    };
    // 0 when the track's top meets the window's top, 1 when its bottom meets the window's bottom
    const progress = () => {
      const r = track.getBoundingClientRect();
      const run = r.height - window.innerHeight;
      return run > 0 ? clamp(-r.top / run, 0, 1) : 0;
    };
    const update = () => {
      ticking = false;
      if (mode !== "scroll") return;
      const p = progress();
      if (!cssTimeline) frame.style.setProperty("--t", clamp((p - 0.15) / 0.6, 0, 1).toFixed(4));
      if ((p >= 0.5) !== open) setPressed(p >= 0.5);
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    const setMode = () => {
      const next = window.innerHeight >= 640 ? "scroll" : "toggle";
      if (next === mode) return;
      mode = next;
      cala.classList.toggle("is-scroll", mode === "scroll");
      cala.classList.toggle("is-toggle", mode === "toggle");
      cala.classList.toggle("is-js-timeline", mode === "scroll" && !cssTimeline);
      if (mode === "toggle") { frame.style.removeProperty("--t"); cala.classList.toggle("is-open", open); }
      else { cala.classList.remove("is-open"); update(); }
    };
    const go = (toOpen) => {
      if (mode === "scroll") {
        const r = track.getBoundingClientRect();
        const top = window.scrollY + r.top + (toOpen ? r.height - window.innerHeight : 0);
        window.scrollTo({ top: Math.round(top), behavior: "smooth" });
      } else {
        setPressed(toOpen);
        cala.classList.toggle("is-open", toOpen);
      }
    };
    btnBase.addEventListener("click", () => go(false));
    btnInside.addEventListener("click", () => go(true));
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", () => { setMode(); onScroll(); });
    setMode();
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
