# demos-web

Sitios demo para prospectos. Cada carpeta en `sitios/` es un sitio estático independiente (HTML + CSS, sin build).

| Sitio | Carpeta | Estado |
|---|---|---|
| Orthox Clínica Dental | `sitios/orthox` | Falta: fotos, horario |
| Sen Vietnam | `sitios/sen-vietnam` | Falta: fotos, horario |
| Faro | `sitios/faro` | ES/EN, logo propio (la F es el faro), intro y escenas fijas con GSAP, video del hero con HyperFrames (`video-src/hero.html`), formulario por FormSubmit (activar con el primer envío) |

## Netlify
El proyecto `demos-webs` publica la carpeta `sitios/` (ver `netlify.toml` en la raíz). Cada demo queda en su propia ruta:
- https://demos-webs.netlify.app/orthox/
- https://demos-webs.netlify.app/sen-vietnam/
- https://demos-webs.netlify.app/faro/

Una demo nueva = una carpeta nueva en `sitios/`. Cada cambio que entra a `main` se publica solo.
Si un cliente cierra, se le crea su propio proyecto de Netlify con Base directory `sitios/<carpeta>` y su dominio.

`capturas/` tiene screenshots de QA (escritorio, móvil, oscuro) y el "antes". Ver `FLUJO-DE-TRABAJO.md`.
