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

Las capturas de QA y del "antes" ya no van en el repo, porque todo `sitios/` es público: están en la carpeta del proyecto, en `capturas/<cliente>/<ronda>/`. Las reglas de trabajo están en las Instrucciones del proyecto, los datos técnicos en `CLAUDE.md` y el resumen del flujo en `FLUJO-DE-TRABAJO.md`.
