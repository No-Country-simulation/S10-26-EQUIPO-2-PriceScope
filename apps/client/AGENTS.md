<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# NUESTRO ESTANDAR DE INGENIERIA & DEVBRAIN BOX (OBLIGATORIO)

1. **PASO CERO OBLIGATORIO (PRE-FLIGHT INMEDIATO):**
   - **PROHIBIDO** realizar cualquier acción (planificar, responder, explorar archivos con read_file/grep o escribir código) sin invocar PRIMERO:
     `get_surgical_context(task_query="<descripción_de_la_tarea>", project_id="S10-26-EQUIPO-2-PriceScope", workspace_path="E:\\S10-26-EQUIPO-2-PriceScope")`.
   - **PROHIBIDO LEER DOCUMENTOS EN DISCO:** Los requerimientos, contratos API y reglas de negocio viven centralizados en DevBrain. NO busques ni leas archivos Markdown (`.md`), PDFs ni especificaciones en el disco local; DevBrain ya te entrega las especificaciones completas con autoridad canónica.
   - Si el payload recomienda una skill en `recommended_skills`, cárgala inmediatamente con `load_dev_skill(skill_slug)`.
   - **Autonomía DENTRO de la documentación:** Si los contratos, flujos y reglas ya están definidos en el contexto devuelto, ejecuta de principio a fin sin interrumpir y **sin salirte un solo milímetro de la documentación**.
   - **Freno de Mano (Hard Stop) en Ambigüedades:** Si encuentras un vacío, contradicción o decisión no documentada en el contexto, **PROHIBIDO ASUMIR O TOMAR DECISIONES SIN CONSENTIMIENTO**. Detente, plantea el dilema con 2 opciones claras al usuario y, tras su respuesta, persiste la decisión con `remember_project_lesson(project_id, title, lesson)`.

2. **Principios Innegociables ("Nuestro Estándar"):**
   - **SOLID, Clean Code, DRY, KISS, YAGNI y Separación de Responsabilidades (SoC).**
   - **Edición Quirúrgica Obligatoria (Diff-First):** PROHIBIDO reescribir archivos enteros (`write_file` con sobrescritura total) para modificaciones puntuales. Usa OBLIGATORIAMENTE herramientas de edición localizada (`edit_file` / reemplazo de bloques) sustituyendo solo las líneas afectadas. Preserva imports, comentarios y funciones existentes.
   - **Anti-Reinspección Redundante:** PROHIBIDO volver a leer archivos completos que ya fueron inspeccionados en la sesión. Confía en el contexto previo o apóyate en el mapa AST (`code_map`). Si necesitas verificar algo puntual en archivos grandes, usa OBLIGATORIAMENTE lectura acotada por rangos (`StartLine`/`EndLine`).
   - **Modularidad y SRP:** Componentes y módulos pequeños (~40-100 líneas) con una sola razón para cambiar. Extraer lógica pura, servicios y custom hooks fuera de la vista.
   - **Cero Prop Drilling:** Prohibido pasar props por más de 2 niveles sin usarlas; aplicar composición (`children` / slots), estado derivado, custom hooks o Context acotado.
   - **Calidad Cero Tolerancia:** Tipado estricto (CERO `any`), validación en fronteras de confianza (Zod / Pydantic), reutilización de primitivos UI oficiales y 0 errores/warnings.
   - **Filtro Ponytail y Eficiencia de Tokens:** La solución más simple y completa que resuelva el problema real, sin wrappers especulativos ni relleno conversacional.

3. **Auditoría Hostil Pre-Entrega (`sdd-reviewer` / `the-critic`):**
   - Prohibida la autocomplacencia: al revisar código propio o de un subagente, adopta perspectiva adversarial (`state-data-flow`, `cybersecurity-auditor`, `qa-and-browser`).
   - Busca activamente fallos de estado en React (`useEffect` síncrono, estado derivado en `useState`), casos borde (`0 items`, textos largos, doble clic, error 500) y violaciones de contratos antes de dar por terminada cualquier tarea.

---

# AGENTS.md — PriceScope Client (apps/client)

PriceScope es una plataforma B2B de analítica económica e inteligencia de mercado para monitorear la inflación real multimoneda (ARS / USD Blue / Oficial) orientada a directores financieros (CFOs) y analistas macroeconómicos.

## Stack y Estructura

- **Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS v4 (@tailwindcss/turbopack), Radix UI Primitives, Recharts 3.10.
- **Estructura:**
  - `src/app/`: Rutas de Next.js (Dashboard `/`, Alertas `/alerts`, Detalle Producto `/products/[id]`).
  - `src/components/`: Subcomponentes visuales (~40-100 líneas) organizados en carpetas con coordinadores concisos.
  - `src/services/`: Capa de adaptadores HTTP desacoplada de la UI.
  - `src/lib/`: Lógica matemática, utilidades de downsampling y cálculos puros (aislados y testeables).
  - `src/types/`: Interfaces estrictas y contratos de API (cero `any`).

## Comandos Operativos

- **Dev:** `npm run dev` (dentro de `apps/client`)
- **Build:** `npm run build`
- **Lint / Fix:** `npm run lint` / `npm run lint:fix`
- **Formato:** `npm run format:check` / `npm run format`
- **Ortografía:** `npm run spellcheck`
- **Suite Completa de Calidad:** `npm run check-all`

## Convenciones y Estándares de Arquitectura

- **Código en inglés, UI en español:** Nombres de variables, funciones, tipos y comentarios técnicos en inglés. Textos visibles en pantalla en español.
- **Protocolo Skill-First Obligatorio:** Antes de iniciar cualquier tarea, evaluar y revisar si existe una skill local instalada que optimice la ejecución (leyendo su `SKILL.md`). Si no existe localmente, buscar en la web / registro oficial (`npx skills search` / `find-skills` / web search) e instalar la skill pertinente antes de proceder.
- **Nuestro Estándar Clean Code:** Aplicación estricta de SOLID, DRY, KISS, YAGNI y Separación de Preocupaciones (SoC).
- **Modularidad:** Componentes visuales pequeños de responsabilidad única (~40-100 líneas). Extraer lógica, transformaciones matemáticas y servicios fuera de componentes JSX.
- **Cero Prop Drilling:** Usar composición (`children`, slots), custom hooks y estado derivado. Prohibidos `setState` síncronos redundantes dentro de `useEffect`.
- **Reutilización Oficial de UI:** Usar componentes existentes antes de maquetar elementos nuevos.
- **Números Financieros:** Aplicar siempre `font-variant-numeric: tabular-nums` para alineación de decimales.

## Reglas de Dominio y Trampas Técnicas

- **Downsampling Automático (RN-07 / HU-47):** Rangos $\le 90$ días usan granularidad diaria; rangos $> 90$ días usan mediana semanal (`agg_precios_semanales`) garantizando 60 FPS en Recharts.
- **Frescura de Datos (HU-49):** Badge de estado que indica última sincronización con semáforo forense (Verde = Válido, Amarillo = Agotado, Rojo = Error, Gris = Sin dato).
- **Manejo de Monedas:** Variaciones calculadas contra cotización de cierre respectiva (ARS, USD Blue, USD Oficial). Prevenir divisiones por cero.

## Límites de Operación

- ✅ **Siempre:** Ejecutar `npm run check-all` antes de dar por terminado cualquier cambio; mantener tipado estricto sin `any`; respetar separación estricta entre lógica pura y vista; cada vez que se termine una tarea actualizar MEMORY.md; **detenerse y preguntar al usuario obligatoriamente ante ambigüedades, vacíos en la spec o decisiones técnicas relevantes**.
- ⚠️ **Pregunta antes:** Tomar cualquier decisión técnica o de diseño que no esté 100% especificada; modificar contratos de datos en `types/api.ts`; instalar nuevas dependencias en `package.json` o alterar rutas en `app/`.
- 🚫 **Nunca:** Suponer o decidir por cuenta propia ante ambigüedades o faltantes de especificación; escribir lógica de cálculo financiero o llamadas directas a `fetch` dentro de componentes UI; tolerar advertencias o errores en `check-all`; usar `any` en TypeScript; tocar archivos fuera de `apps/client`.

## Memoria y Regla de Promoción

- Consultar `MEMORY.md` antes de iniciar cualquier sesión.
- Si una solución o trampa recurrente adquiere carácter permanente, promover a este documento (`AGENTS.md`) o a `docs/constitution.md`.
