# MEMORY.md — PriceScope Client (apps/client)

Memoria viva del proyecto entre sesiones (Máximo ~50 líneas).

## Estado Actual

- **Base UI:** Next.js 16 + React 19 + Tailwind CSS v4 + Radix UI + Recharts 3.10.
- **Spec 001 Finalizada:** Dashboard analítico (`/`) alineado temporal y cromáticamente.
- **Spec 002 Finalizada:** Alineación milimétrica de grilla gráfica y franja semafórica en Dashboard.
- **Spec 003 Finalizada:** Módulo de Alertas (`/alerts`) modularizado con servicios y exportación.
- **Spec 004 Finalizada (traceability-architecture):**
  - Desmantelado del archivo monolítico de trazabilidad (de 694 a 78 líneas en `page.tsx`).
  - Subcomponentes modulares en `src/components/traceability/` (~40-90 líneas) usando primitivos oficiales.
  - Botón "Exportar CSV" situado en la cabecera de la tabla de observaciones (ámbito directo de datos).
  - Servicio `traceability.service.ts` desacoplado con soporte `NEXT_PUBLIC_API_URL` y fallback a mock.
  - Custom hook `useTraceabilityData` con control de concurrencia y filtros.
  - Suite de 54 pruebas unitarias en Vitest con 100% de éxito.
- **Auditoría y Pase de UX/UI & Frontend Design Especializado:**
  - Integración de menú de navegación móvil en `Header.tsx` mediante `RiSideBarLine` accesible para tablets y smartphones.
  - Padding responsivo ergonómico en todas las vistas principales (`p-4 sm:p-6 lg:p-8`).
  - Filtros adaptables con comportamiento fluido `w-full sm:w-auto` en Dashboard y Alertas.
  - Cobertura completa de la lista de cero estados (Zero-State Checklist): `EmptyState` integrado en `DashboardStoresTable`, `DashboardEvolutionSection` y `AlertsMilestones`.
  - Eliminación de clichés/tells de IA genérica (`&rarr;` en botones de acción) reemplazado por iconografía semántica (`RiSearchEyeLine`) y foco visual accesible (`focus-visible:ring-2`).

## Decisiones y Justificación Técnica

- **Cohesión de Exportación:** Los botones de exportar residen en la cabecera de la tabla cuando exportan exclusivamente sus filas, y en la cabecera de la página cuando exportan la vista global.
- **Conmutación Transparente de API:** Evaluación de `NEXT_PUBLIC_API_URL` para conmutar directamente al endpoint real sin tocar código de UI.
- **Orquestación Multiagente:** Coordinador autónomo `sdd-coordinator` riguroso en TDD y auditoría formal independiente vía `sdd-reviewer`.

## Aprendizajes y Errores a Evitar

- **CSpell y Convenciones:** Mantener términos de negocio y técnicos sincronizados en `cspell.json`.
- **Zero Errors:** Mantener `npm run check-all` y `npx tsc --noEmit` en 0 errores y 0 advertencias.

## Próximos Pasos en Cola

- Validar la integración con el backend cuando esté desplegado configurando `NEXT_PUBLIC_API_URL`.
