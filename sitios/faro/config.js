/* =========================================================================
   Faro: site settings. Edit this file to connect the form, WhatsApp and media.
   ========================================================================= */

window.FARO_CONFIG = {
  // Contact form. Supported providers:
  // "formsubmit" (active): no account or key. The FIRST message sends an activation
  //   email to `email`; click "Activate Form" once and every lead arrives from then on.
  //   After activating, FormSubmit gives you a random alias: paste it in `email` to hide the address.
  // "web3forms": paste the access key Web3Forms emails you in `accessKey`.
  // "formspree": paste the form endpoint, e.g. "https://formspree.io/f/abcdwxyz", in `endpoint`.
  form: {
    provider: "formsubmit",
    email: "rafael.irizarri.bazan@gmail.com", // formsubmit only
    accessKey: "", // web3forms only
    endpoint: "", // formspree only (web3forms defaults to its own endpoint)
  },

  // WhatsApp number in international format, digits only (e.g. "50760000000").
  // Leave empty to hide the WhatsApp buttons.
  whatsapp: "50764036706", // +507 6403-6706

  // Hero background video (made with HyperFrames, 10 s seamless loop, no audio).
  // Empty = the CSS lighthouse beam alone. Reduced-motion and data-saver users get the CSS version.
  heroVideo: {
    webm: "assets/media/hero.webm",
    mp4: "assets/media/hero.mp4",
    poster: "assets/media/hero-poster.webp",
  },

  // Optional still image behind each service card's animated visual.
  // Keys match services.items[].id in copy.js. Example: marketing: "assets/media/marketing.webp"
  serviceImages: {},
};
