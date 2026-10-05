# demos-web

Sitios demo para prospectos. Cada carpeta en `sitios/` es un sitio estático independiente (HTML + CSS, sin build).

| Sitio | Carpeta | Estado |
|---|---|---|
| Orthox Clínica Dental | `sitios/orthox` | Falta: fotos, horario |
| Sen Vietnam | `sitios/sen-vietnam` | Falta: fotos, horario |

## Publicar en Netlify (una vez por sitio)
1. Netlify → Add new project → Import an existing project → GitHub → `demos-web`.
2. **Base directory:** `sitios/<carpeta>` (ej. `sitios/orthox`). Build command: vacío. Publish directory: `sitios/<carpeta>`.
3. Deploy. Desde ahí, cada cambio que entre a `main` se publica solo.

`capturas/` tiene screenshots de QA (escritorio, móvil, oscuro) y el "antes". Ver `FLUJO-DE-TRABAJO.md`.
