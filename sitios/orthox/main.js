// Orthox: scroll suave (Lenis) + animaciones ligadas al scroll (GSAP ScrollTrigger).
// Con "reducir movimiento" no se activa nada: la página queda estática y completa.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  if (reduce || !window.gsap || !window.ScrollTrigger) {
    root.classList.add('static');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  root.classList.add('motion');

  // Scroll suave, sincronizado con ScrollTrigger
  if (window.Lenis) {
    const lenis = new Lenis({ lerp: 0.1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { offset: -72 });
    }));
  }

  // Entrada del hero: las líneas suben desde su máscara
  gsap.from('.hero-title .line > span', { yPercent: 105, duration: 1.2, ease: 'expo.out', stagger: 0.08 });
  gsap.from('.hero-foot', { opacity: 0, y: 16, duration: 1, ease: 'expo.out', delay: 0.4 });

  // Profundidad al salir del hero: cada línea se va a distinta velocidad
  gsap.utils.toArray('.hero-title .line').forEach((line, i) => {
    gsap.to(line, {
      yPercent: -30 - i * 25, opacity: 0.15, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });
  });

  // Aparición de bloques al entrar en pantalla
  gsap.utils.toArray('.reveal').forEach(el => {
    gsap.from(el, {
      opacity: 0, y: 32, duration: 1, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });

  // Tratamientos: cada palabra se desliza un poco al entrar
  gsap.utils.toArray('.t-list h3').forEach(h => {
    gsap.from(h, {
      xPercent: -6, ease: 'none',
      scrollTrigger: { trigger: h, start: 'top bottom', end: 'center 55%', scrub: true },
    });
  });

  // Proceso: se fija la sección y los dientes pasan de torcidos a alineados
  const teeth = gsap.utils.toArray('.tooth');
  const steps = gsap.utils.toArray('.step');
  const setStep = n => steps.forEach((s, i) => s.classList.toggle('is-on', i === n));

  // Estado inicial desalineado (viene en data-*), rotando sobre el centro de cada diente
  teeth.forEach(t => gsap.set(t, { x: t.dataset.x * 1.5, y: t.dataset.y * 1.5, rotation: t.dataset.r * 1.5, transformOrigin: '50% 50%' }));

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: '.process', start: 'top top', end: '+=260%', pin: '.process-pin', scrub: 0.6,
      onUpdate: self => setStep(Math.min(steps.length - 1, Math.floor(self.progress * steps.length * 0.999))),
    },
  });
  tl.to({}, { duration: 0.2 })
    .fromTo('.bracket', { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.12, stagger: 0.01 })
    .fromTo('.wire', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.15 }, '<')
    .to(teeth, { x: 0, y: 0, rotation: 0, duration: 0.45, ease: 'power2.inOut', stagger: 0.01 })
    .to('.bracket', { scale: 0, autoAlpha: 0, duration: 0.1, stagger: 0.005 })
    .to('.wire', { opacity: 0, duration: 0.08 }, '<')
    .to('.arch', { scale: 1.06, duration: 0.1, transformOrigin: '50% 50%' }, '<');

  // Teléfono final: escala sutil al entrar
  gsap.from('.phone', {
    scale: 0.92, opacity: 0, transformOrigin: '0% 100%', ease: 'expo.out', duration: 1.2,
    scrollTrigger: { trigger: '.phone', start: 'top 85%', once: true },
  });
})();
