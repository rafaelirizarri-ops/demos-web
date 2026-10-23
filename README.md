# demos-web

Sitios demo para prospectos. Cada carpeta en `sitios/` es un sitio estático independiente (HTML + CSS, sin build).

| Sitio | Carpeta | Estado |
|---|---|---|
| Orthox Clínica Dental | `sitios/orthox` | Falta: fotos, horario |
| Sen Vietnam | `sitios/sen-vietnam` | Falta: fotos, horario |
| Faro | `sitios/faro` | ES/EN, logo propio (la F es el faro), intro y escenas fijas con GSAP, video del hero con HyperFrames (`video-src/hero.html`), formulario por FormSubmit (activar con el primer envío) |

## Cloudflare Pages
El proyecto `faro-demos` de Cloudflare Pages publica la carpeta `sitios/` tal cual (sin build). Cada demo queda en su propia ruta:
- https://faro-demos.pages.dev/orthox/
- https://faro-demos.pages.dev/sen-vietnam/
- https://faro-demos.pages.dev/mareas/
- https://faro-demos.pages.dev/faro/

Una demo nueva = una carpeta nueva en `sitios/`. Cada cambio que entra a `main` se publica solo, y cada PR tiene su vista previa en `https://<rama>.faro-demos.pages.dev/<carpeta>/` (Cloudflare deja el link en el PR). Los headers van en `sitios/_headers`.
Si un cliente cierra, se le crea su propio proyecto de Pages con Root directory `sitios/<carpeta>` y su dominio.

Netlify ya no se usa: el sitio viejo `demos-webs` solo redirige `demos-webs.netlify.app/...` al mismo camino en Cloudflare (ver `netlify.toml` en la raíz), para que los links ya enviados sigan sirviendo.

Las capturas de QA y del "antes" ya no van en el repo, porque todo `sitios/` es público: están en la carpeta del proyecto, en `capturas/<cliente>/<ronda>/`. Las reglas de trabajo están en las Instrucciones del proyecto, los datos técnicos en `CLAUDE.md` y el resumen del flujo en `FLUJO-DE-TRABAJO.md`.
