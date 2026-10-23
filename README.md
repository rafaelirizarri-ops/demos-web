# demos-web

Sitios demo para prospectos. Cada carpeta en `sitios/` es un sitio estático independiente (HTML + CSS, sin build).

| Sitio | Carpeta | Estado |
|---|---|---|
| Orthox Clínica Dental | `sitios/orthox` | Falta: fotos, horario |
| Sen Vietnam | `sitios/sen-vietnam` | Falta: fotos, horario |
| Faro | `sitios/faro` | ES/EN, logo propio (la F es el faro), intro y escenas fijas con GSAP, video del hero con HyperFrames (`video-src/hero.html`), formulario por FormSubmit (activar con el primer envío) |

## Cloudflare
El Worker `faro-demos` de Cloudflare publica la carpeta `sitios/` tal cual (sin build; la configuración está en `wrangler.jsonc`). Cada demo queda en su propia ruta:
- https://faro-demos.faro-web.workers.dev/orthox/
- https://faro-demos.faro-web.workers.dev/sen-vietnam/
- https://faro-demos.faro-web.workers.dev/mareas/
- https://faro-demos.faro-web.workers.dev/faro/

Una demo nueva = una carpeta nueva en `sitios/`. Cada cambio que entra a `main` se publica solo, y cada rama tiene su vista previa en `https://<rama>-faro-demos.faro-web.workers.dev/<carpeta>/` (la rama en minúsculas, con `-` en vez de `/`). Los headers van en `sitios/_headers`.
Si un cliente cierra, se le crea su propio Worker (o proyecto de Pages) con su dominio.

Netlify ya no se usa: el sitio viejo `demos-webs` solo redirige `demos-webs.netlify.app/...` al mismo camino en Cloudflare (ver `netlify.toml` en la raíz), para que los links ya enviados sigan sirviendo.

Las capturas de QA y del "antes" ya no van en el repo, porque todo `sitios/` es público: están en la carpeta del proyecto, en `capturas/<cliente>/<ronda>/`. Las reglas de trabajo están en las Instrucciones del proyecto, los datos técnicos en `CLAUDE.md` y el resumen del flujo en `FLUJO-DE-TRABAJO.md`.
