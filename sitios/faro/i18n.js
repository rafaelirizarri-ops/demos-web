/* =========================================================================
   Faro: language engine + list rendering.
   Reads window.FARO_COPY (copy.js), fills [data-i18n*] elements and renders
   the repeating blocks (problem words, service cards, marquee, steps,
   results, FAQ).
   Runs synchronously at the end of <body>, so text is in place before paint.
   ========================================================================= */

(function () {
  "use strict";

  const COPY = window.FARO_COPY;
  const LANGS = Object.keys(COPY); // ["es", "en"]
  const STORE_KEY = "faro-lang";

  /* ---------- helpers ---------- */

  // Resolve "a.b.c" inside the copy object of one language
  const get = (lang, path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), COPY[lang]);

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // localStorage can throw (private mode, blocked storage): never let it break the page
  const store = {
    get() { try { return localStorage.getItem(STORE_KEY); } catch (e) { return null; } },
    set(v) { try { localStorage.setItem(STORE_KEY, v); } catch (e) { /* ignore */ } },
  };

  // Dev aid: warn when a key exists in one language but not the other
  (function checkParity() {
    const walk = (a, b, path) => {
      Object.keys(a).forEach((k) => {
        const p = path ? path + "." + k : k;
        if (!(k in b)) console.warn("[faro] missing in other language:", p);
        else if (a[k] && typeof a[k] === "object") walk(a[k], b[k], p);
      });
    };
    walk(COPY.es, COPY.en, "");
    walk(COPY.en, COPY.es, "");
  })();

  /* ---------- small animated visuals inside each service card ---------- */

  const viz = {
    marketing: () => `
      <svg class="viz__svg" viewBox="0 0 240 140" aria-hidden="true">
        <g class="viz-grid"><path d="M0 35H240M0 70H240M0 105H240"/></g>
        <g class="viz-bars">${[18, 30, 26, 44, 40, 62, 74].map((h, i) => `<rect x="${14 + i * 32}" y="${130 - h}" width="14" height="${h}" rx="2" style="--i:${i}"/>`).join("")}</g>
        <path class="viz-line" pathLength="1" d="M8 118 C40 112 52 100 78 98 S120 86 140 70 S190 40 232 18"/>
        <circle class="viz-dot" cx="232" cy="18" r="5"/>
      </svg>`,

    web: () => `
      <div class="viz-browser" aria-hidden="true">
        <div class="viz-browser__bar"><i></i><i></i><i></i><span></span></div>
        <div class="viz-browser__body">
          <b class="vb vb--title" style="--i:0"></b>
          <b class="vb vb--line" style="--i:1"></b>
          <b class="vb vb--line vb--short" style="--i:2"></b>
          <b class="vb vb--cta" style="--i:3"></b>
          <div class="vb-row"><b class="vb vb--card" style="--i:4"></b><b class="vb vb--card" style="--i:5"></b><b class="vb vb--card" style="--i:6"></b></div>
        </div>
      </div>`,

    automations: () => `
      <svg class="viz__svg" viewBox="0 0 240 140" aria-hidden="true">
        <path id="fa-p1" class="viz-wire" d="M40 70 C80 70 80 30 120 30"/>
        <path id="fa-p2" class="viz-wire" d="M40 70 C80 70 80 110 120 110"/>
        <path id="fa-p3" class="viz-wire" d="M120 30 C160 30 160 70 200 70"/>
        <path id="fa-p4" class="viz-wire" d="M120 110 C160 110 160 70 200 70"/>
        ${[1, 2, 3, 4].map((n) => `<circle class="viz-pulse" r="3.5"><animateMotion dur="2.4s" begin="${(n % 2) * 0.6 + (n > 2 ? 1.2 : 0)}s" repeatCount="indefinite"><mpath href="#fa-p${n}"/></animateMotion></circle>`).join("")}
        <g class="viz-node"><circle cx="40" cy="70" r="16"/><path d="M33 70h14M40 63v14"/></g>
        <g class="viz-node"><circle cx="120" cy="30" r="14"/><path d="M114 30h12"/></g>
        <g class="viz-node"><circle cx="120" cy="110" r="14"/><path d="M114 110h12"/></g>
        <g class="viz-node viz-node--end"><circle cx="200" cy="70" r="18"/><path d="M192 70l6 6 10-12"/></g>
      </svg>`,

    email: (d) => `
      <div class="viz-inbox" aria-hidden="true">
        <div class="viz-inbox__head"><span>${esc(d.inbox)}</span><b class="viz-inbox__count"><i>4</i><i>0</i></b></div>
        ${[0, 1, 2, 3].map((i) => `<div class="viz-mail" style="--i:${i}"><span class="viz-mail__dot"></span><span class="viz-mail__from"></span><span class="viz-mail__sub"></span></div>`).join("")}
      </div>`,

    meetings: (d) => `
      <div class="viz-cal" aria-hidden="true">
        ${Array.from({ length: 21 }, (_, i) => {
          const on = [2, 5, 8, 9, 13, 16, 18].indexOf(i);
          return `<span class="viz-cal__cell${on > -1 ? " is-on" : ""}" style="--i:${on}">${i === 9 ? `<em>${esc(d.booked)}</em>` : ""}</span>`;
        }).join("")}
      </div>`,

    whatsapp: (d) => `
      <div class="viz-chat" aria-hidden="true">
        <p class="viz-bubble viz-bubble--in">${esc(d.chatIn)}</p>
        <p class="viz-typing"><i></i><i></i><i></i></p>
        <p class="viz-bubble viz-bubble--out">${esc(d.chatOut)}<span>✓✓</span></p>
      </div>`,

    finance: (d) => `
      <div class="viz-fin" aria-hidden="true">
        <div class="viz-fin__bars">
          ${[[40, 34], [52, 38], [58, 36], [70, 40], [84, 42], [96, 44]].map(([a, b], i) =>
            `<div class="viz-fin__col" style="--i:${i}"><b style="--h:${a}%"></b><b style="--h:${b}%"></b></div>`).join("")}
        </div>
        <div class="viz-fin__legend"><span><i></i>${esc(d.income)}</span><span><i></i>${esc(d.costs)}</span></div>
      </div>`,
  };


  /* ---------- technical plan of the lighthouse (Cómo trabajamos) ----------
     Four groups, one per step: foundation, structure, lantern, light.
     Drawn lines use pathLength="1" so main.js can draw them with the steps. */
  function planSvg(labels) {
    const cx = 230;
    const L = (y) => 175 + (560 - y) * (23 / 345); // tower's left edge at height y
    const R = (y) => 2 * cx - L(y);
    const d = (s) => `<path pathLength="1" d="${s}"/>`;
    const lead = (s) => `<path class="plan__lead" pathLength="1" d="${s}"/>`;
    const label = (txt, x, y, anchor) => `<text class="plan__label" x="${x}" y="${y}" text-anchor="${anchor || "end"}">${esc(txt)}</text>`;
    const hatch = Array.from({ length: 15 }, (_, i) => `M${124 + i * 16} 602l10-10`).join("");
    const g1 = [
      d("M104 590H356"),
      d("M140 590V560H320V590"),
      d("M140 575H320M170 560V575M210 560V575M250 560V575M290 560V575M155 575V590M190 575V590M230 575V590M270 575V590M305 575V590"),
      `<path class="plan__hatch" pathLength="1" d="${hatch}"/>`,
      lead("M114 575H136"),
      label(labels[0], 108, 579),
    ];
    const courses = [492, 424, 356, 288].map((y) => `M${L(y).toFixed(1)} ${y}H${R(y).toFixed(1)}`).join("");
    const g2 = [
      d(`M175 560L198 215M285 560L262 215`),
      d(courses),
      d("M218 560V534A12 12 0 0 1 242 534V560"),
      d("M224 452h12v18h-12zM224 384h12v18h-12zM224 316h12v18h-12zM224 248h12v18h-12z"),
      d("M332 560V215M326 560H338M326 215H338"),
      lead(`M114 388H${(L(388) - 4).toFixed(1)}`),
      label(labels[1], 108, 392),
    ];
    const posts = Array.from({ length: 9 }, (_, i) => `M${190 + i * 10} 207V195`).join("");
    const g3 = [
      d("M186 215H274V207H186Z"),
      d(posts + "M188 195H272"),
      d("M205 195V157H255V195M222 195V157M238 195V157"),
      d("M199 157H261M205 157A25 22 0 0 1 255 157"),
      d("M230 135V117"),
      `<circle pathLength="1" cx="230" cy="114" r="3"/>`,
      lead("M114 176H201"),
      label(labels[2], 108, 180),
    ];
    const g4 = [
      `<path class="plan__beam" d="M238 172L400 128V224L238 180Z"/>`,
      `<path class="plan__ray" pathLength="1" d="M238 172L400 128M238 180L400 224"/>`,
      `<circle class="plan__lamp" cx="230" cy="176" r="7"/>`,
      label(labels[3], 396, 116, "end"),
    ];
    const grp = (i, parts) => `<g class="plan__g" data-g="${i}">${parts.join("")}</g>`;
    return `<svg class="plan__svg" viewBox="0 0 400 640" focusable="false">${grp(0, g1)}${grp(1, g2)}${grp(2, g3)}${grp(3, g4)}</svg>`;
  }

  /* ---------- list renderers (keyed by data-list) ---------- */

  const renderers = {
    // One sentence per line; every word is its own span so it can "light up" on scroll
    "problem.lines": (items) => items.map((t) =>
      `<span class="problem__s">${t.split(" ").map((w) => `<span class="w">${esc(w)}</span>`).join(" ")}</span>`).join(" "),

    "services.items": (items, lang) => {
      const demo = get(lang, "services.demo");
      const imgs = (window.FARO_CONFIG && window.FARO_CONFIG.serviceImages) || {};
      return items.map((s, i) => `
        <li class="card" data-service="${s.id}" tabindex="0" aria-labelledby="svc-${s.id}">
          <div class="card__inner">
            <div class="card__visual viz viz--${s.id}">
              ${imgs[s.id] ? `<img class="card__img" src="${imgs[s.id]}" alt="" loading="lazy" decoding="async">` : ""}
              ${viz[s.id] ? viz[s.id](demo) : ""}
            </div>
            <div class="card__body">
              <p class="card__meta"><span class="card__num">${String(i + 1).padStart(2, "0")}</span> ${esc(s.name)}</p>
              <h3 class="card__title" id="svc-${s.id}">${esc(s.title)}</h3>
              <p class="card__text">${esc(s.body)}</p>
              <ul class="card__points">${s.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
            </div>
            <span class="card__light" aria-hidden="true"></span>
          </div>
        </li>`).join("");
    },

    // Contact form chips reuse the service names, so they always match the cards
    "services.chips": (_, lang) =>
      get(lang, "services.items").map((s) => `
        <label class="chip"><input type="checkbox" name="needs" value="${esc(s.name)}"><span>${esc(s.name)}</span></label>`).join(""),

    // Service names, twice, so the marquee can loop seamlessly
    "services.marquee": (_, lang) => {
      const group = get(lang, "services.items").map((s) =>
        `<span class="marquee__item">${esc(s.name)}</span><i class="marquee__dot"></i>`).join("");
      return `<div class="marquee__group">${group}</div><div class="marquee__group">${group}</div>`;
    },

    // Big light figures: the number is real text, main.js only animates it
    "stats.items": (items) => items.map((it) => `
      <li class="stat">
        <span class="stat__n" data-n="${Number(it.n)}">${Number(it.n)}</span>
        <span class="stat__t">${esc(it.text)}</span>
      </li>`).join(""),

    "how.plan": (labels) => planSvg(labels),

    "how.steps": (items) => items.map((s, i) => `
      <li class="step" data-step="${i}">
        <span class="step__num">${String(i + 1).padStart(2, "0")}</span>
        <h3 class="step__name">${esc(s.name)}</h3>
        <p class="step__body">${esc(s.body)}</p>
      </li>`).join(""),

    // Placeholder cards: clearly marked as pending until real testimonials arrive
    "results.items": (items, lang) => items.map((r) => `
      <li class="quote">
        <span class="quote__badge">${esc(get(lang, "results.pending"))}</span>
        <p class="quote__metric">${esc(r.metric)}</p>
        <p class="quote__label">${esc(r.metricLabel)}</p>
        <blockquote class="quote__text">${esc(r.quote)}</blockquote>
        <p class="quote__who"><b>${esc(r.name)}</b><span>${esc(r.role)}</span></p>
      </li>`).join(""),

    "faq.items": (items) => items.map((f) => `
      <details class="qa">
        <summary><span>${esc(f.q)}</span><i aria-hidden="true"></i></summary>
        <div class="qa__a"><p>${esc(f.a)}</p></div>
      </details>`).join(""),
  };

  /* ---------- apply a language ---------- */

  function apply(lang) {
    if (!COPY[lang]) lang = "es";
    // let main.js undo split headlines etc. before the text is replaced
    document.dispatchEvent(new CustomEvent("faro:beforelang", { detail: { lang } }));
    const root = document.documentElement;
    root.lang = lang;

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const v = get(lang, el.dataset.i18n);
      if (v != null) el.textContent = v;
    });
    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      const v = get(lang, el.dataset.i18nHtml);
      if (v != null) el.innerHTML = v; // only trusted copy from copy.js
    });
    document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      el.dataset.i18nAttr.split(";").forEach((pair) => {
        const [attr, path] = pair.split(":");
        const v = get(lang, path);
        if (v != null) el.setAttribute(attr.trim(), v);
      });
    });
    document.querySelectorAll("[data-list]").forEach((el) => {
      const key = el.dataset.list;
      const fn = renderers[key];
      if (fn) el.innerHTML = fn(get(lang, key), lang);
    });

    // <title>, meta description and the toggle state
    document.title = get(lang, "meta.title");
    const md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute("content", get(lang, "meta.description"));
    document.querySelectorAll(".lang__btn").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));

    window.Faro.lang = lang;
    document.dispatchEvent(new CustomEvent("faro:lang", { detail: { lang } }));
  }

  /* ---------- boot ---------- */

  window.Faro = window.Faro || {};
  window.Faro.t = (path) => get(window.Faro.lang, path);
  window.Faro.setLang = (lang) => { store.set(lang); apply(lang); };

  const saved = store.get();
  apply(LANGS.indexOf(saved) > -1 ? saved : "es"); // Spanish by default

  document.querySelectorAll(".lang__btn").forEach((b) =>
    b.addEventListener("click", () => window.Faro.setLang(b.dataset.lang)));
})();
