# Especificación: 003-alerts-components-integration

**Módulo:** Alertas Inflacionarias e Hitos Macroeconómicos (`/alerts`)  
**Ámbito:** `apps/client`  
**Estado:** Propuesta Formal para Aprobación Técnica  
**Fecha:** 19 de Octubre de 2026

---

## 1. Contexto y Objetivos

Actualmente, la vista de Alertas (`src/app/alerts/page.tsx`) presenta una implementación monolítica de 613 líneas con maquetación HTML cruda (`<table>`, `<select>`, `<button>`, `<div>` con bordes y fondos directos), datos de productos hardcodeados en el cuerpo del componente (`alertsData`), paginación estática no reactiva y ausencia de una capa de servicios y estado desacoplado.

Esta especificación establece la refactorización integral del módulo de Alertas guiada por principios SOLID, Clean Code y la Constitución de PriceScope:

1. **Adopción de Componentes Primitivos Oficiales:** Reemplazar todos los elementos y maquetación cruda por los componentes existentes en `@/components/ui/`: `Card`, `Table`, `Badge`, `Button`, `Select`, `Pagination`, `Skeleton` y `Callout`.
2. **Modularización Visual y Responsabilidad Única (SRP):** Descomponer la vista en subcomponentes atómicos (~40-100 líneas) bajo `src/components/alerts/`, orquestados por un coordinador conciso en `src/app/alerts/page.tsx` (~50-80 líneas).
3. **Desacoplamiento de la Capa de Datos (SoC):** Crear `src/services/alerts.service.ts` con capacidad de conmutación transparente entre el endpoint real `GET /api/v1/alerts` (vía variable de entorno `NEXT_PUBLIC_API_URL`) y fallback determinístico local a `src/mocks/alerts.mock.json` con simulación asíncrona de latencia de red.
4. **Desacoplamiento de Estado y Lógica Pura:** Gestionar el ciclo de vida, filtros, paginación y estado asíncrono mediante el custom hook `src/hooks/useAlertsData.ts`, y aislar funciones matemáticas, clasificación de severidad y exportación en `src/lib/alerts/`.
5. **Alineación 100% con Contrato OpenAPI:** Consumir estrictamente los contratos `AlertsResponse` y `AlertaItem` definidos en `02-API-Contracts-OpenAPI.md`, eliminando todo dato mock hardcodeado en la interfaz.

---

## 2. Requerimientos Funcionales en Notación EARS

### RF-01: Consumo Dinámico del Contrato OpenAPI de Alertas

- **EL SISTEMA** debe tipar las respuestas y parámetros del módulo utilizando las interfaces `AlertsResponse`, `AlertaItem`, `PaginacionMeta` y `AlertsQueryParams`.
- **CUANDO** se monte la vista `/alerts` o cambien los filtros activos (severidad, categoría, tienda o página), **EL SISTEMA** debe solicitar los datos a través de `alerts.service.ts`.
- **SI** la variable de entorno `NEXT_PUBLIC_API_URL` está configurada, **ENTONCES** **EL SISTEMA** debe despachar la solicitud HTTP `GET` al endpoint `/api/v1/alerts` con los query parameters serializados.
- **SI** la variable `NEXT_PUBLIC_API_URL` no está definida o se encuentra vacía, **ENTONCES** **EL SISTEMA** debe cargar los datos desde `src/mocks/alerts.mock.json` aplicando una latencia simulada de red y filtrado en memoria.

### RF-02: Estados de Carga con Primitivos Skeleton

- **MIENTRAS** la petición de datos de alertas esté en tránsito (`isLoading === true`), **EL SISTEMA** debe renderizar marcadores de posición visuales (`Skeleton` de `@/components/ui/skeleton`) en las celdas de la tabla de alertas y en los contadores métricos, preservando la altura y disposición de la página para garantizar CLS < 0.1.
- **CUANDO** la respuesta de datos se complete exitosamente, **EL SISTEMA** debe reemplazar inmediatamente los esqueletos por los datos reales formateados.

### RF-03: Filtrado Reactivo y Restablecimiento

- **CUANDO** el usuario seleccione un nivel de severidad ("all", "danger", "warning", "info"), una categoría canónica o una tienda piloto, **EL SISTEMA** debe actualizar el estado del hook `useAlertsData`, reiniciar la página actual a 1 y recalcular la lista de alertas visibles.
- **CUANDO** el usuario pulse el botón "Limpiar Filtros", **EL SISTEMA** debe restablecer simultáneamente todos los selectores a sus valores por defecto ("all") y devolver el paginado a la página 1.
- **EL SISTEMA** debe implementar los selectores de filtro utilizando el primitivo oficial `Select` (`SelectTrigger`, `SelectContent`, `SelectItem`, `SelectValue`) de `@/components/ui/select`.

### RF-04: Clasificación y Badges de Severidad de Divergencia

- **EL SISTEMA** debe clasificar la severidad de cada alerta en función de su diferencial cambiario en puntos (`diferencial_puntos`):
  - **SI** `diferencial_puntos > 10.0`, **ENTONCES** **EL SISTEMA** debe asignar severidad crítica con `Badge` variante `error` (estilo rose/rojo) y etiqueta `+{valor} pts`.
  - **SI** `5.0 <= diferencial_puntos <= 10.0`, **ENTONCES** **EL SISTEMA** debe asignar severidad moderada con `Badge` variante `warning` (estilo amber/amarillo) y etiqueta `+{valor} pts`.
  - **SI** `diferencial_puntos < 5.0`, **ENTONCES** **EL SISTEMA** debe asignar severidad leve con `Badge` variante `default` o `neutral` y etiqueta `+{valor} pts`.
- **EL SISTEMA** debe computar en tiempo real el contador global de "Alertas Críticas Activas" en la cabecera a partir del dataset recibido.

### RF-05: Paginación Adaptativa Oficial (HU-46)

- **EL SISTEMA** debe gobernar la paginación de la tabla mediante el componente primitivo `Pagination` de `@/components/ui/pagination` (`PaginationContent`, `PaginationItem`, `PaginationLink`, `PaginationPrevious`, `PaginationNext`, `PaginationEllipsis`).
- **CUANDO** el usuario pulse un número de página o los botones "Anterior" / "Siguiente", **EL SISTEMA** debe actualizar la página activa y refrescar el conjunto de registros visibles.
- **SI** la página actual es la primera (`currentPage === 1`), **ENTONCES** **EL SISTEMA** debe deshabilitar el botón "Anterior".
- **SI** la página actual es la última (`currentPage === total_paginas`), **ENTONCES** **EL SISTEMA** debe deshabilitar el botón "Siguiente".

### RF-06: Historial de Hitos Macroeconómicos con Primitivo Callout

- **EL SISTEMA** debe renderizar las tarjetas explicativas de causas macroeconómicas e hitos de reduflación utilizando el componente primitivo `Callout` de `@/components/ui/callout`.
- **MIENTRAS** el interruptor `showAllMilestones` esté inactivo (`false`), **EL SISTEMA** debe mostrar de forma predeterminada los 3 hitos más recientes.
- **CUANDO** el usuario active el control "Ver historial completo", **EL SISTEMA** debe expandir la grilla mostrando la totalidad de hitos registrados, y contraerla al pulsar "Mostrar solo recientes".

### RF-07: Exportación de Datos Forenses (CSV y JSON)

- **CUANDO** el usuario haga clic en "Exportar CSV", **EL SISTEMA** debe generar y disparar la descarga de un archivo `.csv` cumpliendo RFC 4180 con las columnas forenses de las alertas (`ID, Producto, Tienda, Variación ARS %, Variación USD %, Diferencial Pts, Cotización Usada, Cobertura %, Regla Faltantes`).
- **CUANDO** el usuario haga clic en "Exportar JSON", **EL SISTEMA** debe disparar la descarga del archivo `.json` con el arreglo serializado de las alertas visibles.

---

## 3. Requerimientos No Funcionales y Restricciones Técnicas

1. **Confinamiento de Entorno (Constitución Art. 1):** Todo cambio y creación de archivos debe realizarse estrictamente dentro de `apps/client`.
2. **Modularidad y Tamaño de Archivos (Clean Code & Constitución Art. 4):**
   - Subcomponentes visuales en `src/components/alerts/`: ~40-100 líneas por archivo.
   - Coordinador en `src/app/alerts/page.tsx`: ~50-80 líneas sin lógica inline.
   - Funciones puras en `src/lib/alerts/`: funciones testeables sin efectos secundarios de renderizado.
3. **Cero Prop Drilling y Estado Limpio (Constitución Art. 5):** Todo el estado de la vista debe concentrarse en `useAlertsData.ts` y transferirse por interfaces bien delimitadas. Prohibidos `setState` redundantes dentro de `useEffect`.
4. **Formato Financiero (Constitución Art. 7):** Todos los valores numéricos, porcentajes y cotizaciones deben presentarse con la clase Tailwind `tabular-nums`.
5. **Tipado Estricto (Constitución Art. 9):** Cero uso de `any`. Todos los tipos deben derivar de `src/types/api.ts` o contratos de interfaz complementarios en `src/lib/alerts/types.ts`.
6. **Calidad de Código y Suite de Validación:** El código resultante debe pasar `npm run check-all` (ESLint, Prettier, CSpell, Vitest) con 0 errores y 0 advertencias.

---

## 4. Criterios de Aceptación (Condición de Hecho)

- [ ] La página `/alerts` renderiza al 100% mediante componentes primitivos oficiales de `@/components/ui/` (`Card`, `Table`, `Badge`, `Button`, `Select`, `Pagination`, `Skeleton`, `Callout`).
- [ ] No existen datos de alertas hardcodeados en los componentes de interfaz; todo proviene de `useAlertsData` y `alerts.service.ts`.
- [ ] El servicio `alerts.service.ts` conmuta entre `NEXT_PUBLIC_API_URL` y el mock local `src/mocks/alerts.mock.json` con latencia simulada.
- [ ] El hook `useAlertsData.ts` orquesta el filtrado reactivo por severidad, tienda, categoría y la paginación.
- [ ] Los subcomponentes modulares residen en `src/components/alerts/` y no superan el estándar de ~100 líneas.
- [ ] La vista coordinadora `src/app/alerts/page.tsx` se reduce a ~50-80 líneas limpias y legibles.
- [ ] La exportación a CSV y JSON genera descargas correctas basadas en los datos cargados.
- [ ] La suite de calidad `npm run check-all` se ejecuta exitosamente con 0 errores y 0 advertencias.
