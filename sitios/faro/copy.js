/* =========================================================================
   Faro: all site copy lives here, in one object, so ES and EN stay in sync.
   Each language is written natively (not translated line by line).

   How it is used:
   - Elements in index.html carry data-i18n="path.to.key" (text) or
     data-i18n-html="path.to.key" (allows <em>/<br>) or
     data-i18n-attr="attr:path.to.key" (placeholders, aria-labels...).
   - Lists (services, steps, faqs...) are rendered by main.js from the arrays.
   - Add a key in BOTH languages; main.js warns in the console if one is missing.
   ========================================================================= */

window.FARO_COPY = {
  es: {
    meta: {
      title: "Faro | Sistemas de empresa grande para negocios pequeños",
      description:
        "Marketing, web, automatizaciones, correo, agenda, WhatsApp y finanzas para negocios pequeños. Opera como empresa grande, sin pagar como una.",
    },
    nav: {
      services: "Servicios",
      how: "Cómo trabajamos",
      faq: "Preguntas",
      cta: "Hablemos",
      skip: "Saltar al contenido",
      langLabel: "Cambiar idioma",
      menu: "Menú",
    },
    hero: {
      kicker: "Operaciones para negocios pequeños",
      title: "Opera como empresa grande.<br><em>Sin pagar como una.</em>",
      lead:
        "Marketing, web, automatizaciones, correo, agenda, WhatsApp y finanzas. Lo montamos, lo llevamos y lo hacemos crecer. Tú vuelves a dirigir tu negocio.",
      cta: "Agenda una llamada",
      secondary: "Ver servicios",
      scroll: "Desliza",
    },
    problem: {
      label: "El problema",
      lines: [
        "Contestas WhatsApp a las once de la noche.",
        "Tu web sigue diciendo “próximamente”.",
        "Las cuentas viven en una libreta. O en tu cabeza.",
        "Y un equipo completo cuesta lo que todavía no tienes.",
      ],
      close: "No te falta talento.<br><em>Te falta sistema.</em>",
    },
    services: {
      label: "Servicios",
      title: "Siete sistemas.<br><em>Un solo equipo.</em>",
      lead: "Eliges lo que necesitas hoy. Sumas el resto cuando crezcas.",
      hint: "Pasa el cursor por cada tarjeta",
      items: [
        {
          id: "marketing",
          name: "Gestión de marketing",
          title: "Que te encuentren antes que a la competencia.",
          body: "Contenido, redes y campañas con un solo objetivo: que entren clientes, no solo likes.",
          points: ["Calendario de contenido cada mes", "Campañas con presupuesto que tú controlas", "Un reporte claro de qué funcionó"],
        },
        {
          id: "web",
          name: "Creación de websites",
          title: "Una web que vende mientras duermes.",
          body: "Rápida, preciosa en el celular y hecha para que te escriban. Tu mejor vendedor, abierto 24/7.",
          points: ["Diseño a la medida, nunca plantilla", "Lista para Google y para el celular", "Cada botón lleva a reservar o a escribirte"],
        },
        {
          id: "automations",
          name: "Automatizaciones",
          title: "Lo repetitivo, que se haga solo.",
          body: "Conectamos tus herramientas para que la información viaje sin copiar y pegar. Menos errores, más horas libres.",
          points: ["Contactos directo a tu CRM o tu hoja", "Recordatorios y seguimientos automáticos", "Facturas y avisos que salen solos"],
        },
        {
          id: "email",
          name: "Gestión de correo",
          title: "Bandeja en cero. Clientes al día.",
          body: "Ordenamos, filtramos y respondemos con tu voz. Y armamos los correos que traen clientes de vuelta.",
          points: ["Respuestas en horas, no en días", "Plantillas con tu tono", "Campañas a tu lista de clientes"],
        },
        {
          id: "meetings",
          name: "Agenda de reuniones",
          title: "Tu calendario se llena solo.",
          body: "Tus clientes reservan en los horarios que tú abres. Confirmación y recordatorio incluidos. Adiós al “¿a qué hora te queda?”.",
          points: ["Tu propio link de reservas", "Recordatorios que bajan las ausencias", "Sincronizado con tu calendario"],
        },
        {
          id: "whatsapp",
          name: "WhatsApp Business",
          title: "Responde en segundos. Aunque estés a full.",
          body: "Catálogo, respuestas rápidas y mensajes automáticos para que ningún cliente se quede en visto.",
          points: ["Perfil profesional y catálogo", "Bienvenida y respuestas automáticas", "Etiquetas para no perder ninguna venta"],
        },
        {
          id: "finance",
          name: "Finanzas y estructura",
          title: "Números claros. Decisiones tranquilas.",
          body: "Ordenamos ingresos, gastos y procesos para que sepas cuánto ganas de verdad y cómo crecer sin desordenarte.",
          points: ["Tablero de ingresos y gastos", "Procesos y roles por escrito", "Una base lista para crecer o pedir crédito"],
        },
      ],
      // Tiny bits of text that live inside the animated card visuals
      demo: {
        chatIn: "Hola, ¿tienen espacio mañana?",
        chatOut: "¡Sí! Aquí reservas en un clic.",
        inbox: "Bandeja",
        income: "Ingresos",
        costs: "Gastos",
        booked: "Reservado",
      },
    },
    how: {
      label: "Cómo trabajamos",
      title: "Del caos al sistema<br><em>en cuatro pasos.</em>",
      steps: [
        { name: "Diagnóstico", body: "Una llamada corta. Vemos dónde se te escapan el tiempo y el dinero." },
        { name: "Plan", body: "Te proponemos los sistemas que más mueven la aguja, con un precio claro." },
        { name: "Montaje", body: "Lo construimos y lo conectamos todo. Tú sigues vendiendo; nosotros nos encargamos." },
        { name: "Crecimiento", body: "Medimos, ajustamos y sumamos sistemas a medida que tu negocio crece." },
      ],
    },
    results: {
      label: "Resultados",
      title: "Lo que cuentan<br><em>nuestros clientes.</em>",
      note: "Espacio reservado: aquí van testimonios y cifras reales de clientes.",
      items: [
        { quote: "[Testimonio real: qué cambió en su negocio después de trabajar con Faro.]", name: "[Nombre del cliente]", role: "[Negocio · Ciudad]", metric: "[+__%]", metricLabel: "[métrica real, ej. consultas por WhatsApp]" },
        { quote: "[Testimonio real: cuánto tiempo recuperó cada semana.]", name: "[Nombre del cliente]", role: "[Negocio · Ciudad]", metric: "[__ h]", metricLabel: "[métrica real, ej. horas ahorradas por semana]" },
        { quote: "[Testimonio real: cómo se ve ahora su marca en línea.]", name: "[Nombre del cliente]", role: "[Negocio · Ciudad]", metric: "[__×]", metricLabel: "[métrica real, ej. reservas al mes]" },
      ],
    },
    faq: {
      label: "Preguntas",
      title: "Lo que nos<br><em>preguntan siempre.</em>",
      items: [
        { q: "¿Tengo que contratar todos los servicios?", a: "No. Empiezas con uno o dos y sumas el resto cuando tenga sentido para tu negocio." },
        { q: "¿Cuánto cuesta?", a: "Depende de los sistemas que necesites. Después del diagnóstico recibes una propuesta con precio claro, sin letra pequeña." },
        { q: "¿Necesito saber de tecnología?", a: "Para nada. Te explicamos todo en simple y te lo dejamos funcionando." },
        { q: "¿Qué pasa con las herramientas que ya uso?", a: "Trabajamos con lo que ya tienes siempre que se pueda. Solo cambiamos lo que te frena." },
        { q: "¿Cuándo veo resultados?", a: "Lo básico se nota rápido: una web nueva, WhatsApp ordenado, la agenda funcionando. El crecimiento se construye mes a mes." },
        { q: "¿Con qué negocios trabajan?", a: "Con negocios pequeños que quieren crecer: tiendas, restaurantes, clínicas, servicios profesionales y emprendimientos." },
      ],
    },
    contact: {
      label: "Contacto",
      title: "Enciende<br><em>tu faro.</em>",
      lead: "Cuéntanos de tu negocio. Te decimos por dónde empezar.",
      name: "Nombre",
      business: "Negocio",
      email: "Correo",
      phone: "WhatsApp (opcional)",
      needs: "¿Qué necesitas?",
      message: "Cuéntanos un poco más",
      messagePh: "Qué vendes, qué te quita más tiempo, qué quieres lograr…",
      submit: "Enviar mensaje",
      sending: "Enviando…",
      ok: "Listo. Te escribimos muy pronto.",
      error: "Algo falló al enviar. Escríbenos por WhatsApp y lo vemos al momento.",
      notConnected: "El formulario todavía no está conectado. Escríbenos por WhatsApp mientras tanto.",
      or: "¿Prefieres hablar ya?",
      whatsapp: "Escríbenos por WhatsApp",
      waText: "Hola Faro, quiero ordenar y hacer crecer mi negocio.",
      required: "Campo obligatorio",
    },
    footer: {
      tagline: "Sistemas de empresa grande para negocios pequeños.",
      rights: "Todos los derechos reservados.",
      top: "Volver arriba",
    },
  },

  en: {
    meta: {
      title: "Faro | Big-company systems for small businesses",
      description:
        "Marketing, websites, automations, email, scheduling, WhatsApp and finance for small businesses. Run like a big company, without the big-company bill.",
    },
    nav: {
      services: "Services",
      how: "How it works",
      faq: "FAQ",
      cta: "Let’s talk",
      skip: "Skip to content",
      langLabel: "Change language",
      menu: "Menu",
    },
    hero: {
      kicker: "Operations for small businesses",
      title: "Run like a big company.<br><em>Skip the big-company bill.</em>",
      lead:
        "Marketing, web, automations, email, scheduling, WhatsApp and finance. We set it up, run it and scale it. You get back to running your business.",
      cta: "Book a call",
      secondary: "See what we do",
      scroll: "Scroll",
    },
    problem: {
      label: "The problem",
      lines: [
        "You’re answering WhatsApp at 11 p.m.",
        "Your website still says “coming soon.”",
        "Your books live in a notebook. Or in your head.",
        "And a full team costs money you don’t have yet.",
      ],
      close: "You’re not short on talent.<br><em>You’re short on systems.</em>",
    },
    services: {
      label: "Services",
      title: "Seven systems.<br><em>One team.</em>",
      lead: "Start with what you need today. Add the rest as you grow.",
      hint: "Hover over each card",
      items: [
        {
          id: "marketing",
          name: "Marketing management",
          title: "Get found before your competitors do.",
          body: "Content, social and ads built around one goal: customers walking in, not just likes.",
          points: ["A fresh content calendar every month", "Ads on a budget you control", "A plain-English report on what worked"],
        },
        {
          id: "web",
          name: "Website creation",
          title: "A site that sells while you sleep.",
          body: "Fast, gorgeous on mobile and built to get people reaching out. Your best salesperson, open 24/7.",
          points: ["Custom design, never a template", "Ready for Google and every phone", "Every button leads to a booking or a chat"],
        },
        {
          id: "automations",
          name: "Automations",
          title: "The busywork runs itself.",
          body: "We connect your tools so information flows without copy-paste. Fewer mistakes, more hours back.",
          points: ["Leads land straight in your CRM or sheet", "Automatic reminders and follow-ups", "Invoices and notices that send themselves"],
        },
        {
          id: "email",
          name: "Email management",
          title: "Inbox zero. Customers in the loop.",
          body: "We sort, filter and reply in your voice, then build the emails that bring customers back.",
          points: ["Replies in hours, not days", "Templates that sound like you", "Campaigns to your customer list"],
        },
        {
          id: "meetings",
          name: "Meeting scheduling",
          title: "Your calendar fills itself.",
          body: "Clients book the slots you open. Confirmations and reminders included. No more “what time works for you?”",
          points: ["Your own booking link", "Reminders that cut no-shows", "Synced with your calendar"],
        },
        {
          id: "whatsapp",
          name: "WhatsApp Business",
          title: "Reply in seconds. Even on your busiest day.",
          body: "Catalog, quick replies and automated messages, so no customer gets left on read.",
          points: ["A pro profile and product catalog", "Auto greetings and quick replies", "Labels so no sale slips through"],
        },
        {
          id: "finance",
          name: "Finance & business structure",
          title: "Clear numbers. Calm decisions.",
          body: "We organize income, costs and processes so you know what you really make, and how to grow without the chaos.",
          points: ["An income and expense dashboard", "Processes and roles written down", "A setup ready to scale or get financing"],
        },
      ],
      demo: {
        chatIn: "Hi! Any openings tomorrow?",
        chatOut: "Yes! Book here in one tap.",
        inbox: "Inbox",
        income: "Income",
        costs: "Costs",
        booked: "Booked",
      },
    },
    how: {
      label: "How it works",
      title: "From chaos to system<br><em>in four steps.</em>",
      steps: [
        { name: "Diagnose", body: "One quick call. We find where your time and money are leaking." },
        { name: "Plan", body: "We propose the systems that move the needle most, with clear pricing." },
        { name: "Build", body: "We build and connect everything. You keep selling; we handle the rest." },
        { name: "Grow", body: "We measure, fine-tune and add systems as your business grows." },
      ],
    },
    results: {
      label: "Results",
      title: "What our clients<br><em>are saying.</em>",
      note: "Placeholder: real client testimonials and numbers go here.",
      items: [
        { quote: "[Real testimonial: what changed in their business after working with Faro.]", name: "[Client name]", role: "[Business · City]", metric: "[+__%]", metricLabel: "[real metric, e.g. WhatsApp inquiries]" },
        { quote: "[Real testimonial: how much time they win back each week.]", name: "[Client name]", role: "[Business · City]", metric: "[__ h]", metricLabel: "[real metric, e.g. hours saved per week]" },
        { quote: "[Real testimonial: how their brand looks online now.]", name: "[Client name]", role: "[Business · City]", metric: "[__×]", metricLabel: "[real metric, e.g. bookings per month]" },
      ],
    },
    faq: {
      label: "FAQ",
      title: "The questions<br><em>we always get.</em>",
      items: [
        { q: "Do I have to sign up for everything?", a: "Not at all. Start with one or two systems and add more when it makes sense for your business." },
        { q: "How much does it cost?", a: "It depends on what you need. After the diagnosis you get a proposal with clear pricing. No fine print." },
        { q: "Do I need to be techy?", a: "Nope. We explain everything in plain language and hand it over working." },
        { q: "What about the tools I already use?", a: "We build on what you have whenever we can, and only replace what’s holding you back." },
        { q: "When will I see results?", a: "The basics show up fast: a new site, an organized WhatsApp, a working calendar. Growth compounds month after month." },
        { q: "Who do you work with?", a: "Small businesses ready to grow: shops, restaurants, clinics, professional services and startups." },
      ],
    },
    contact: {
      label: "Contact",
      title: "Turn on<br><em>the light.</em>",
      lead: "Tell us about your business. We’ll show you where to start.",
      name: "Name",
      business: "Business",
      email: "Email",
      phone: "WhatsApp (optional)",
      needs: "What do you need?",
      message: "Tell us a bit more",
      messagePh: "What you sell, what eats your time, what you want to achieve…",
      submit: "Send message",
      sending: "Sending…",
      ok: "Got it. We’ll be in touch soon.",
      error: "Something went wrong. Message us on WhatsApp and we’ll sort it out right away.",
      notConnected: "The form isn’t connected yet. Message us on WhatsApp in the meantime.",
      or: "Rather talk now?",
      whatsapp: "Message us on WhatsApp",
      waText: "Hi Faro, I want to organize and grow my business.",
      required: "Required",
    },
    footer: {
      tagline: "Big-company systems for small businesses.",
      rights: "All rights reserved.",
      top: "Back to top",
    },
  },
};
