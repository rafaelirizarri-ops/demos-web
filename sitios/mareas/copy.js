/* Mareas: every word of the site (ES + EN) and the clinic's details.
   Para personalizar: cambia CONFIG y los textos de T. */
window.CONFIG = {
  name: "Clínica Dental Mareas",
  whatsapp: "50760000000",          // número internacional, sin + ni guiones
  phoneShown: "+507 6000-0000",
  address: "Costa del Este, Ciudad de Panamá",
  mapsQuery: "Costa del Este, Panamá"
};

window.T = {
  es: {
    skip: "Saltar al contenido",
    navCta: "Agendar",
    eyebrow: "Odontología general y estética · Costa del Este",
    h1: "Tu próxima cita, <em>a un mensaje</em> de distancia.",
    lead: "Limpiezas, ortodoncia invisible e implantes. Escríbenos por WhatsApp y te confirmamos el mismo día.",
    facts: ["Atendemos en inglés", "Estacionamiento", "Planes de pago"],
    bookTitle: "Agenda tu evaluación",
    days: ["Lun", "Mar", "Mié"],
    waBtn: "Pedir cita por WhatsApp",
    waMsg: (s) => `Hola, quisiera agendar una evaluación${s ? ` el ${s}` : ""}.`,
    cue: "Desliza",
    phone: "O llámanos al",
    under: "Debajo de cada sonrisa hay <em>una estructura</em> que tiene que durar.",
    noteCrown: "Corona de cerámica", noteAbut: "Pilar de titanio", noteScrew: "Implante de titanio",
    capAligner: "Ortodoncia invisible", capVeneers: "Carillas a tu color",
    altAligner: "Alineador transparente sobre piedra travertino",
    altVeneers: "Guía de colores de carillas de porcelana",
    impKicker: "El proceso",
    impTitle: "Un implante, <em>paso a paso</em>.",
    artTitle: "Implante dental: corona, pilar y tornillo de titanio",
    steps: [
      ["Evaluación", "Revisamos la zona y armamos tu plan. Sales sabiendo costo y tiempos.", "Día 1"],
      ["Tomografía 3D", "Medimos el hueso disponible para elegir el implante exacto.", "Semana 1"],
      ["Colocación", "Cirugía breve con anestesia local. Vuelves a casa el mismo día.", "Semana 2"],
      ["Oseointegración", "El hueso abraza el implante y lo vuelve parte de ti.", "3 a 6 meses"],
      ["Corona final", "Colocamos tu pieza definitiva, hecha a tu color.", "1 a 2 citas"]
    ],
    svcTitle: "Tratamientos",
    svcSub: "Precios de referencia. Tu presupuesto exacto sale de la evaluación.",
    svc: [
      ["Limpieza y profilaxis", "Remoción de sarro, pulido y revisión completa.", "Desde $60"],
      ["Blanqueamiento", "Sesión en consultorio con gel de peróxido y protección de encías.", "Desde $250"],
      ["Ortodoncia invisible", "Alineadores transparentes con plan digital de tu sonrisa.", "Desde $2,800"],
      ["Implantes", "Reemplazo fijo de piezas perdidas, corona incluida.", "Desde $1,500"],
      ["Endodoncia", "Tratamiento de conducto para salvar la pieza.", "Desde $300"],
      ["Carillas", "Porcelana o resina para corregir forma y color.", "Desde $350 c/u"]
    ],
    visitTitle: "Te esperamos en <em>Costa del Este</em>.",
    whereT: "Dónde estamos", mapLink: "Abrir en Google Maps",
    hoursT: "Horario",
    hours: [["Lunes a viernes", "8:00 a 6:00"], ["Sábado", "8:00 a 12:00"], ["Domingo", "Cerrado"]],
    payT: "Pagos", payP: "Efectivo, tarjeta, ACH y Yappy. Trabajamos con las principales aseguradoras.",
    foot: "Sitio de muestra con datos de ejemplo. Precios y horarios ilustrativos."
  },
  en: {
    skip: "Skip to content",
    navCta: "Book",
    eyebrow: "General and cosmetic dentistry · Costa del Este",
    h1: "Your next appointment, <em>one message</em> away.",
    lead: "Cleanings, clear aligners and implants. Message us on WhatsApp and we confirm the same day.",
    facts: ["English spoken", "Parking", "Payment plans"],
    bookTitle: "Book your check-up",
    days: ["Mon", "Tue", "Wed"],
    waBtn: "Book on WhatsApp",
    waMsg: (s) => `Hi, I'd like to book a check-up${s ? ` on ${s}` : ""}.`,
    cue: "Scroll",
    phone: "Or call us at",
    under: "Beneath every smile there's <em>a structure</em> built to last.",
    noteCrown: "Ceramic crown", noteAbut: "Titanium abutment", noteScrew: "Titanium implant",
    capAligner: "Clear aligners", capVeneers: "Veneers in your shade",
    altAligner: "Clear aligner on travertine stone",
    altVeneers: "Porcelain veneer shade guide",
    impKicker: "The process",
    impTitle: "An implant, <em>step by step</em>.",
    artTitle: "Dental implant: crown, abutment and titanium screw",
    steps: [
      ["Check-up", "We examine the area and build your plan. You leave knowing cost and timing.", "Day 1"],
      ["3D scan", "We measure the available bone to pick the exact implant.", "Week 1"],
      ["Placement", "A short procedure under local anesthesia. You go home the same day.", "Week 2"],
      ["Healing", "The bone grows around the implant and makes it part of you.", "3 to 6 months"],
      ["Final crown", "We fit your permanent tooth, made in your shade.", "1 to 2 visits"]
    ],
    svcTitle: "Treatments",
    svcSub: "Reference prices. Your exact quote comes from the check-up.",
    svc: [
      ["Cleaning", "Tartar removal, polishing and a full exam.", "From $60"],
      ["Whitening", "In-office session with peroxide gel and gum protection.", "From $250"],
      ["Clear aligners", "Transparent aligners with a digital smile plan.", "From $2,800"],
      ["Implants", "Fixed replacement for missing teeth, crown included.", "From $1,500"],
      ["Root canal", "Treatment that saves the tooth.", "From $300"],
      ["Veneers", "Porcelain or resin to fix shape and shade.", "From $350 each"]
    ],
    visitTitle: "See you in <em>Costa del Este</em>.",
    whereT: "Where we are", mapLink: "Open in Google Maps",
    hoursT: "Hours",
    hours: [["Monday to Friday", "8:00 to 6:00"], ["Saturday", "8:00 to 12:00"], ["Sunday", "Closed"]],
    payT: "Payment", payP: "Cash, card, ACH and Yappy. We work with major insurers.",
    foot: "Sample site with example data. Prices and hours are illustrative."
  }
};
