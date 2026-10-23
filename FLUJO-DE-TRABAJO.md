# Cómo trabajamos cada sitio (versión corta)

> Las reglas completas están en las Instrucciones del proyecto y los datos técnicos en `CLAUDE.md`. Si algo de aquí choca con ellas, ganan ellas.

1. **Prospecto.** Sale de `knowledge/claude/prospectos-ronda-1.md`. Confirmar en Google Maps.
2. **Captura del "antes".** Claude toma screenshot con Playwright de su web actual (o de su perfil de Fresha/IG si no tiene web). Desde la nube esos sitios están bloqueados: se hace con la computadora de Rafa conectada, o Rafa la manda.
3. **Borrador.** Claude lo construye directo en el repo.
4. **Pulido con skills (Claude):**
   - `design-taste-frontend`: crear desde cero sin que se vea "hecho por AI".
   - `redesign-existing-projects`: mejorar un sitio que ya existe (una demo anterior o la web del cliente).
   - `minimalist-ui`: cuando el negocio pide algo sobrio (spa, clínica, barbería premium).
   - `web-design-guidelines`: auditoría final (accesibilidad, contraste, móvil) antes de mostrarlo.
5. **QA con Playwright y Lighthouse.** La lista está en `CLAUDE.md`. Las capturas van a la carpeta del proyecto (`capturas/<cliente>/<ronda>/`), no al repo, porque todo `sitios/` es público.
6. **GitHub = la fuente de verdad.** Un repo `demos-web` con una carpeta por cliente (`sitios/<cliente>/`). Cada cambio queda guardado y se puede revertir.
7. **Cloudflare conectado al repo.** Un solo Worker (`faro-demos`) publica todo `sitios/` en `faro-demos.faro-web.workers.dev/<cliente>/`. Cada PR tiene su vista previa, que Claude abre y revisa antes de pedir el OK; fusionar publica todas las demos a la vez, y solo se fusiona con el OK de Rafa. Si un cliente cierra, se le crea su propio Worker o proyecto de Pages con su dominio.
8. **Mensaje al prospecto:** captura antes/después + link. Claude lo redacta. Por correo lo envía desde el Gmail de Rafa cuando Rafa escribe "manda"; por WhatsApp o Instagram lo manda Rafa.
9. **Si cierra:** su propio proyecto en Cloudflare con su dominio, fotos reales, horario confirmado.
