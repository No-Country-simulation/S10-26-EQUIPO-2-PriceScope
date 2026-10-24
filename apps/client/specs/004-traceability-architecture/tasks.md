# Desglose de Tareas Atómicas: 004-traceability-architecture

**Módulo:** Ficha de Producto y Trazabilidad Forense (`/products/{id}/traceability`)  
**Ámbito:** `apps/client`  
**Total de Tareas:** 9 tareas atómicas (Límite máximo permitido: 10)  
**Estado:** Planificación Formal  
**Fecha:** 19 de Octubre de 2026  

---

## Matriz de Tareas de Implementación

- [x] **Tarea 1: Incorporar Tipos y Contratos OpenAPI en `src/types/api.ts`**  
      _Objetivo:_ Definir y exportar las interfaces canónicas estipuladas en el contrato OpenAPI: `ProductoCanonicoDetalle`, `ObservacionTrazabilidadItem`, `TraceabilityResponse` y `TraceabilityQueryParams`.  
      _Archivos afectados:_ `src/types/api.ts`.  
      _Hecho cuando:_ Las interfaces estén declaradas, no exista ningún uso de `any`, y `npm run check-all` valide los tipos sin advertencias.

- [x] **Tarea 2: Implementar Servicio Desacoplado `src/services/traceability.service.ts`**  
      _Objetivo:_ Crear el servicio de acceso a datos con conmutación dinámica: consumir `GET ${NEXT_PUBLIC_API_URL}/api/v1/products/${id}/traceability` si la variable de entorno está presente, o recurrir al mock local `src/mocks/traceability.mock.json` con simulación de latencia asíncrona.  
      _Archivos afectados:_ `src/services/traceability.service.ts`.  
      _Hecho cuando:_ La función `getTraceabilityData(id, params)` retorne una promesa fuertemente tipada con `TraceabilityResponse` tanto en entorno con API configurada como en modo mock local.

- [x] **Tarea 3: Implementar Lógica Pura y Formateadores en `src/lib/traceability/`**  
      _Objetivo:_ Desarrollar utilidades puras para formateo de fechas a hora local de Argentina (`DD/MM/YYYY HH:mm ART`), formateo monetario con `tabular-nums`, mapeo de estados de datos a variantes de `Badge` y generación de archivo CSV cumpliendo RFC 4180.  
      _Archivos afectados:_ `src/lib/traceability/formatters.ts`, `src/lib/traceability/status.ts`, `src/lib/traceability/exportCsv.ts`, `src/lib/traceability/index.ts`.  
      _Hecho cuando:_ Las funciones puras conviertan correctamente fechas UTC a ART, manejen valores nulos con marcadores `--`, clasifiquen variantes de badge (`DATO_VALIDO`, `AGOTADO`, `ERROR_CAPTURA`, `SIN_DATO`) y generen cadenas CSV escapadas correctamente.

- [x] **Tarea 4: Desarrollar Suite de Pruebas Unitarias para Trazabilidad**  
      _Objetivo:_ Implementar tests unitarios exhaustivos con Vitest para validar los formateadores, la clasificación de estados de datos, la generación de CSV y el servicio conmutador.  
      _Archivos afectados:_ `tests/unit/traceability.test.ts` (o `src/lib/traceability/__tests__/traceability.test.ts`).  
      _Hecho cuando:_ `npm run test` ejecute las pruebas unitarias y reporte 100% de éxito en la suite de trazabilidad.

- [x] **Tarea 5: Desarrollar Custom Hook `src/hooks/useTraceabilityData.ts`**  
      _Objetivo:_ Implementar el custom hook que gestiona el ciclo de vida, estados de carga (`isLoading`), errores, filtros por tienda/fecha, memoización de métricas y la función de exportación de observaciones.  
      _Archivos afectados:_ `src/hooks/useTraceabilityData.ts`, `src/hooks/index.ts`.  
      _Hecho cuando:_ El hook cargue los datos a partir del `productId`, gestione las transiciones de estado sin bucles infinitos y provea la función `exportObservationsCsv()`.


- [x] **Tarea 6: Construir Componentes `TraceabilityHeader.tsx` y `TraceabilityProductCard.tsx`**  
      _Objetivo:_ Crear la cabecera ejecutiva con navegación y badges de auditoría (`TraceabilityHeader`), y la ficha técnica canónica con desglose de contenido neto, pack y callout de reduflación (`TraceabilityProductCard`) usando primitivos oficiales.  
      _Archivos afectados:_ `src/components/traceability/TraceabilityHeader.tsx`, `src/components/traceability/TraceabilityProductCard.tsx`.  
      _Hecho cuando:_ Ambos componentes tengan entre 40 y 100 líneas cada uno, utilicen primitivos `Card`, `Badge` y `Callout`, y presenten la ficha técnica sin maquetación HTML cruda.

- [x] **Tarea 7: Construir Componente `TraceabilityObservationsTable.tsx` con Botón de Exportar en Cabecera**  
      _Objetivo:_ Desarrollar la tabla cronológica append-only con primitivos `Table`, `Badge` y `Skeleton`, integrando el botón "Exportar CSV" en la cabecera de la tabla (porque exporta únicamente las observaciones de la tabla) y asegurando enlaces externos seguros (`rel="noopener noreferrer"`).  
      _Archivos afectados:_ `src/components/traceability/TraceabilityObservationsTable.tsx`.  
      _Hecho cuando:_ La tabla presente celdas con `tabular-nums`, renderice skeletons en estado de carga, contenga el botón de descarga CSV en su cabecera y el archivo no exceda las 100 líneas.

- [x] **Tarea 8: Construir `TraceabilityAuditFooter.tsx` y Barrel Export `src/components/traceability/index.ts`**  
      _Objetivo:_ Desarrollar la tarjeta inferior de metadatos de auditoría algorítmica (versión v1.0, sincronización 23:59:59 ART y TTL de fallback 72h) y unificar los exports del módulo en `index.ts`.  
      _Archivos afectados:_ `src/components/traceability/TraceabilityAuditFooter.tsx`, `src/components/traceability/index.ts`.  
      _Hecho cuando:_ La tarjeta exponga claramente los metadatos forenses requeridos en las especificaciones UX/UI y `index.ts` exporte limpiamente todos los subcomponentes.

- [x] **Tarea 9: Refactorizar Página Coordinadora Concisa en `src/app/products/[id]/traceability/page.tsx` y Validación de Calidad**  
      _Objetivo:_ Reemplazar el archivo monolítico actual de 694 líneas por un coordinador conciso (~50-80 líneas) que consuma `useTraceabilityData` y delegue en los subcomponentes, verificando la calidad integral del proyecto.  
      _Archivos afectados:_ `src/app/products/[id]/traceability/page.tsx`.  
      _Hecho cuando:_ `page.tsx` no supere las 80 líneas, renderice de punta a punta la vista de trazabilidad y la suite completa `npm run check-all` pase con 0 errores y 0 advertencias.
