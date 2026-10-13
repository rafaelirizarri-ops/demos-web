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

  // Hero background video: a 3D lighthouse at golden hour (HyperFrames, 12 s seamless loop, no audio).
  // "land" plays on landscape screens, "port" on portrait ones (phones, upright tablets).
  // The posters are also in index.html (<picture>), so the hero is never empty.
  // Reduced-motion and data-saver users keep the still poster.
  // mp4 (H.264) plays first; browsers without H.264 get the WebM (VP9) copy.
  heroVideo: {
    land: { mp4: "assets/media/hero-land.mp4", webm: "assets/media/hero-land.webm", poster: "assets/media/hero-land.webp" },
    port: { mp4: "assets/media/hero-port.mp4", webm: "assets/media/hero-port.webm", poster: "assets/media/hero-port.webp" },
  },

  // Optional still image behind each service card's animated visual.
  // Keys match services.items[].id in copy.js. Example: marketing: "assets/media/marketing.webp"
  serviceImages: {},
};
