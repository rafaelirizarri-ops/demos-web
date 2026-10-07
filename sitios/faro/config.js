/* =========================================================================
   Faro: site settings. Edit this file to connect the form, WhatsApp and media.
   ========================================================================= */

window.FARO_CONFIG = {
  // Contact form. Supported providers: "web3forms" or "formspree".
  // web3forms: paste the access key Web3Forms emails you.
  // formspree: paste the form endpoint, e.g. "https://formspree.io/f/abcdwxyz".
  form: {
    provider: "web3forms",
    accessKey: "", // web3forms only
    endpoint: "https://api.web3forms.com/submit",
  },

  // WhatsApp number in international format, digits only (e.g. "50760000000").
  // Leave empty to hide the WhatsApp buttons.
  whatsapp: "",

  // Hero background video (optional). Empty = the CSS lighthouse beam alone.
  heroVideo: {
    webm: "",
    mp4: "",
    poster: "",
  },

  // Optional still image behind each service card's animated visual.
  // Keys match services.items[].id in copy.js. Example: marketing: "assets/media/marketing.webp"
  serviceImages: {},
};
