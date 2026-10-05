# Cómo trabajamos cada sitio (versión corta)

1. **Prospecto.** Sale de `knowledge/claude/prospectos-ronda-1.md`. Confirmar en Google Maps.
2. **Captura del "antes".** Claude toma screenshot con Playwright de su web actual (o de su perfil de Fresha/IG si no tiene web).
3. **Borrador.** Dos caminos, el que salga mejor:
   - Netlify genera el primer borrador y el código se sube al repo, o
   - Claude lo construye directo en el repo.
4. **Pulido con skills (Claude):**
   - `design-taste-frontend`: crear desde cero sin que se vea "hecho por AI".
   - `redesign-existing-projects`: mejorar un sitio que ya existe (Netlify o del cliente).
   - `minimalist-ui`: cuando el negocio pide algo sobrio (spa, clínica, barbería premium).
   - `web-design-guidelines`: auditoría final (accesibilidad, contraste, móvil) antes de mostrarlo.
5. **QA con Playwright.** Screenshots en escritorio, móvil y modo oscuro; revisar que nada se salga de la pantalla.
6. **GitHub = la fuente de verdad.** Un repo `demos-web` con una carpeta por cliente (`sitios/<cliente>/`). Cada cambio queda guardado y se puede revertir.
7. **Netlify conectado al repo.** Cada push publica solo. Un sitio de Netlify por cliente apuntando a su carpeta (Base directory = `sitios/<cliente>`).
8. **Mensaje al prospecto** (lo mandas tú): captura antes/después + link de Netlify. Claude nunca contacta ni publica sin tu OK.
9. **Si cierra:** dominio propio en Netlify, fotos reales, horario confirmado.
