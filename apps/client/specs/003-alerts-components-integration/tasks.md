# Desglose de Tareas Atómicas: 003-alerts-components-integration

**Módulo:** Alertas Inflacionarias e Hitos Macroeconómicos (`/alerts`)  
**Ámbito:** `apps/client`  
**Total de Tareas:** 10 tareas atómicas (Máximo permitido: 10)  
**Estado:** Planificación Formal  
**Fecha:** 19 de Octubre de 2026

---

## Matriz de Tareas de Implementación

- [x] **Tarea 1: Incorporar Tipos y Contratos de Alertas en `src/types/api.ts` y `src/lib/alerts/types.ts`**  
      _Objetivo:_ Declarar las interfaces oficiales estipuladas en el contrato OpenAPI (`AlertaItem`, `AlertsResponse`) y los tipos complementarios del dominio de alertas (`AlertsQueryParams`, `SeverityLevel`, `AlertMilestoneItem`).  
      _Archivos afectados:_ `src/types/api.ts`, `src/lib/alerts/types.ts`.  
      _Hecho cuando:_ `AlertaItem`, `AlertsResponse` y los tipos de query y parámetros compilen estrictamente con `tsc --noEmit` sin advertencias y sin ningún uso de `any`.

- [x] **Tarea 2: Implementar Adaptador HTTP y Servicio de Alertas en `src/services/alerts.service.ts`**  
      _Objetivo:_ Crear el servicio de lectura de alertas conmutando entre la URL de producción (`process.env.NEXT_PUBLIC_API_URL` -> `GET /api/v1/alerts`) y el fallback local a `src/mocks/alerts.mock.json` con simulación asíncrona de latencia y filtrado/paginado en memoria.  
      _Archivos afectados:_ `src/services/alerts.service.ts`.  
      _Hecho cuando:_ Las funciones `getAlertsData(params)` y `getAlertsMilestones()` retornen promesas fuertemente tipadas cumpliendo el contrato OpenAPI tanto con URL definida como en modo offline/mock.

- [x] **Tarea 3: Implementar Módulos de Lógica Pura y Formateo en `src/lib/alerts/`**  
      _Objetivo:_ Desarrollar utilidades de formateo (`formatters.ts`), clasificación matemática de severidad (`severity.ts`), exportación a archivos CSV/JSON (`exportAlerts.ts`), hitos de mercado (`milestones.ts`) y su exportador principal (`index.ts`).  
      _Archivos afectados:_ `src/lib/alerts/formatters.ts`, `src/lib/alerts/severity.ts`, `src/lib/alerts/exportAlerts.ts`, `src/lib/alerts/milestones.ts`, `src/lib/alerts/index.ts`.  
      _Hecho cuando:_ Las funciones de formateo agreguen `tabular-nums`, calculen las variantes de badge correctas para los diferenciales (`>10 pts` -> error, `5..10 pts` -> warning, `<5 pts` -> default) y exporten cadenas CSV cumpliendo RFC 4180.

- [x] **Tarea 4: Implementar Pruebas Unitarias para Formateo, Severidad y Servicios**  
      _Objetivo:_ Garantizar la cobertura y solidez de las funciones matemáticas, de clasificación y del adaptador HTTP con Vitest.  
      _Archivos afectados:_ `src/lib/alerts/__tests__/alertsLib.test.ts`, `src/services/__tests__/alerts.service.test.ts`.  
      _Hecho cuando:_ `npm run test` ejecute y apruebe al 100% las pruebas unitarias validando umbrales de severidad, generación de CSV, formateo de moneda y conmutación del servicio.

- [x] **Tarea 5: Desarrollar Custom Hook `src/hooks/useAlertsData.ts`**  
      _Objetivo:_ Centralizar el estado de la vista (filtros, paginación, estado de carga asíncrona, alertas filtradas y métricas derivadas de alertas críticas) en un custom hook limpio sin efectos síncronos redundantes.  
      _Archivos afectados:_ `src/hooks/useAlertsData.ts`, `src/hooks/index.ts`.  
      _Hecho cuando:_ El hook administre `isLoading`, reactive la búsqueda al modificar filtros, pagine correctamente y exporte acciones controladas sin generar prop drilling ni advertencias de react-hooks.

- [x] **Tarea 6: Construir Componentes `AlertsHeader.tsx` y `AlertsFilters.tsx` con Primitivos Oficiales**  
      _Objetivo:_ Desarrollar la cabecera ejecutiva (`AlertsHeader`) y la barra de filtros dinámicos (`AlertsFilters`) utilizando los componentes oficiales `Card`, `Badge`, `Button` y `Select` de `@/components/ui/`.  
      _Archivos afectados:_ `src/components/alerts/AlertsHeader.tsx`, `src/components/alerts/AlertsFilters.tsx`.  
      _Hecho cuando:_ Ambos componentes tengan menos de 100 líneas cada uno, utilicen `Select` primitivo (no `<select>` crudo de HTML), reflejen dinámicamente las alertas críticas y limpien los filtros al accionar el botón correspondiente.

- [x] **Tarea 7: Construir Componente de Historial de Hitos Macroeconómicos con `Callout` Primitivo**  
      _Objetivo:_ Desarrollar `AlertsMilestones.tsx` utilizando el primitivo oficial `Callout` de `@/components/ui/callout` para renderizar las tarjetas contextuales de reduflación y política comercial con control de expansión/colapso (3 vs 6 hitos).  
      _Archivos afectados:_ `src/components/alerts/AlertsMilestones.tsx`.  
      _Hecho cuando:_ Las tarjetas usen variantes oficiales de `Callout` (`purple`, `teal`, `warning`, `default`), el botón alterne fluidamente entre vista compacta y extendida, y el archivo tenga menos de 100 líneas.

- [x] **Tarea 8: Construir Componente de Tabla Forense con `Table` Primitivo y `Skeleton`**  
      _Objetivo:_ Desarrollar `AlertsTable.tsx` utilizando los primitivos `Card`, `Table` (`TableHeader`, `TableRow`, `TableHead`, `TableBody`, `TableCell`), `Badge` y `Skeleton` de `@/components/ui/` para desplegar las 50 alertas por página con enlaces a trazabilidad.  
      _Archivos afectados:_ `src/components/alerts/AlertsTable.tsx`.  
      _Hecho cuando:_ La tabla no contenga etiquetas `<table>` crudas, muestre esqueletos de carga durante `isLoading === true`, presente celdas con alineación numérica `tabular-nums` y enlace a `/products/{id}/traceability`.

- [x] **Tarea 9: Construir Componente `AlertsPagination.tsx` y Barrel Export `src/components/alerts/index.ts`**  
      _Objetivo:_ Modularizar los controles de paginación reutilizando el primitivo `Pagination` oficial de `@/components/ui/pagination` y exponer todos los subcomponentes del módulo mediante un archivo de índice unificado.  
      _Archivos afectados:_ `src/components/alerts/AlertsPagination.tsx`, `src/components/alerts/index.ts`.  
      _Hecho cuando:_ La barra de paginación refleje fielmente `pagina_actual`, deshabilite "Anterior" en la página 1 y "Siguiente" en la última página, y `index.ts` exporte los 5 subcomponentes de alertas.

- [x] **Tarea 10: Integrar Coordinador de Página Conciso en `src/app/alerts/page.tsx` y Validar Calidad Total**  
      _Objetivo:_ Refactorizar `src/app/alerts/page.tsx` reduciéndolo a un coordinador conciso (~50-80 líneas) libre de maquetación cruda y llamadas directas, consumiendo `useAlertsData` y los componentes de `src/components/alerts/`.  
      _Archivos afectados:_ `src/app/alerts/page.tsx`.  
      _Hecho cuando:_ `page.tsx` contenga menos de 90 líneas, la página funcione fluidamente en el navegador y la suite completa `npm run check-all` (lint, prettier, cspell, test) pase con 0 errores y 0 advertencias.
