# Especificación Formal: 004-traceability-architecture

**Módulo:** Ficha de Producto y Trazabilidad Forense (`/products/{id}/traceability`)  
**Ámbito:** `apps/client`  
**Estado:** Propuesta Formal para Aprobación Técnica  
**Fecha:** 19 de Octubre de 2026  
**Documentos Vinculantes:**
- `docs/01-analisis/02-API-Contracts-OpenAPI.md` (Sección 4.3 `GET /api/v1/products/{id}/traceability` y definiciones TypeScript).
- `docs/01-analisis/07-Frontend-UX-UI-Specs.md` (Sección 3.3 Pantalla 3: Ficha de Producto y Trazabilidad Forense).
- `apps/client/AGENTS.md` y `docs/constitution.md` (Clean Architecture, SoC, SOLID, DRY, KISS, YAGNI, ~40-100 líneas por componente, cero prop drilling, tipado estricto sin `any`, tabular-nums).

---

## 1. Contexto y Objetivos

Actualmente, la página de trazabilidad (`src/app/products/[id]/traceability/page.tsx`) es un monolito rígido de 694 líneas con estado hardcodeado (`productDatabase`), lógica de exportación embebida directamente en el componente visual, tablas estructuradas manualmente y sin desacoplamiento con la capa de datos.

Esta especificación establece la refundación de la arquitectura del módulo de trazabilidad, preparando el sistema para integrarse directamente con la API REST (`GET /api/v1/products/{id}/traceability`) manteniendo conmutación transparente con mocks locales estructurados según el contrato OpenAPI.

### Objetivos Clave:
1. **Contrato Estricto OpenAPI:** Incorporar en `src/types/api.ts` los tipos oficiales del backend (`ProductoCanonicoDetalle`, `ObservacionTrazabilidadItem`, `TraceabilityResponse`).
2. **Desacoplamiento de Servicios:** Implementar `src/services/traceability.service.ts` con consumo configurable vía `NEXT_PUBLIC_API_URL` y fallback robusto a `src/mocks/traceability.mock.json`.
3. **Orquestación Limpia del Estado:** Encapsular la reactividad, filtros opcionales (por tienda y rango de fechas), estados de carga (`Skeleton`) y exportación en el hook `src/hooks/useTraceabilityData.ts`.
4. **Lógica Pura y Formateadores Aislados:** Modularizar en `src/lib/traceability/` utilidades testeables (conversión horaria estricta a ART UTC-3, formateo de precios en pesos y dólares, cálculo de estado de datos y generación de CSV cumpliendo RFC 4180).
5. **Componentización Modular:** Descomponer la pantalla en subcomponentes especializados de ~40-100 líneas en `src/components/traceability/` reutilizando primitivos oficiales (`Card`, `Table`, `Badge`, `Button`, `Skeleton`, `Callout`).
6. **Ubicación Estratégica de Exportación CSV:** Dado que la exportación descarga exclusivamente las observaciones forenses del producto, el botón de acción se ubica en la cabecera de la tabla de observaciones (`TraceabilityObservationsTable.tsx`).
7. **Página Coordinadora Concisa:** Reducir `src/app/products/[id]/traceability/page.tsx` a un coordinador limpio de alto nivel de ~50-80 líneas.

---

## 2. Requerimientos Funcionales en Notación EARS

### RF-01: Contrato Estricto y Tipos de Datos (OpenAPI 3.0)
- **EL SISTEMA** debe definir y exportar en `src/types/api.ts` las interfaces canónicas:
  - `ProductoCanonicoDetalle` (campos: `id`, `slug`, `nombre_normalizado`, `marca`, `modelo`, `categoria`, `contenido_neto_valor`, `contenido_neto_unidad`, `pack`).
  - `ObservacionTrazabilidadItem` (campos: `timestamp_utc`, `tienda_id`, `tienda_nombre`, `url_origen`, `sku_tienda`, `alias_producto`, `precio_regular`, `precio_promocional`, `precio_por_unidad`, `unidad_medida`, `precio_usd`, `estado_dato`, `cotizacion_aplicada`, `cotizacion_aproximada`, `fuente_cotizacion`, `motivo_faltante`).
  - `TraceabilityResponse` (campos: `producto`, `historico_observaciones`).
  - `TraceabilityQueryParams` (campos: `tienda_id`, `fecha_desde`, `fecha_hasta`).
- **EL SISTEMA** prohíbe terminantemente el uso del tipo `any` en todos los archivos del módulo.

### RF-02: Servicio Desacoplado con Fallback a Mocks (`traceability.service.ts`)
- **CUANDO** se solicite la trazabilidad de un producto mediante `getTraceabilityData(id, params)`:
  - **SI** la variable de entorno `process.env.NEXT_PUBLIC_API_URL` está configurada y no vacía, **ENTONCES** **EL SISTEMA** debe realizar una solicitud HTTP `GET` al endpoint `${NEXT_PUBLIC_API_URL}/api/v1/products/${id}/traceability` adjuntando los parámetros de consulta válidos.
  - **SI** la variable de entorno `NEXT_PUBLIC_API_URL` no está configurada, o si la llamada a la API falla por error de red/servidor, **ENTONCES** **EL SISTEMA** debe resolver la información a partir de `src/mocks/traceability.mock.json` indexando por el `id` o `slug` solicitado, aplicando una latencia de red simulada (~400-600ms) y aplicando los filtros en memoria.
- **SI** el identificador del producto no existe en el catálogo mock ni en el servicio, **ENTONCES** **EL SISTEMA** debe lanzar un error o retornar `null` controlado para renderizar un estado vacío/404 amigable.

### RF-03: Custom Hook de Orquestación (`useTraceabilityData.ts`)
- **EL SISTEMA** debe encapsular en `src/hooks/useTraceabilityData.ts` toda la interacción reactiva del módulo:
  - Carga asíncrona controlada con indicadores `isLoading`, `error` y `data`.
  - Gestión de filtros activos: `tienda_id` (todas o tienda específica) y rango de fechas (`fecha_desde`, `fecha_hasta`).
  - Métricas derivadas y observaciones filtradas listas para consumo de la UI.
  - Función de exportación de observaciones forenses a archivo CSV (`exportObservationsCsv`).
- **CUANDO** cambie el `productId` o se modifique cualquiera de los filtros de tienda o fecha, **ENTONCES** **EL SISTEMA** debe reactivar la carga de datos sin generar bucles infinitos ni llamadas redundantes en renderizado.

### RF-04: Lógica Pura y Formateadores (`src/lib/traceability/`)
- **EL SISTEMA** debe aislar en módulos independientes bajo `src/lib/traceability/`:
  - `formatters.ts`:
    - Conversión de `timestamp_utc` a hora local argentina (ART = UTC-3) con formato estricto `DD/MM/YYYY HH:mm ART`.
    - Formateo monetario en pesos (`$12.000,00`) y dólares (`$10,00`) utilizando `Intl.NumberFormat("es-AR")`.
    - Formateo de precio unitario (`$24.000,00/kg` o `$X/L`).
  - `status.ts`:
    - Asignación de clases y variantes de `Badge` según el `EstadoDato`:
      - `DATO_VALIDO`: Variante éxito/default (Verde), etiqueta "Disponible" o "Dato Válido".
      - `AGOTADO`: Variante advertencia/warning (Amarillo/Ámbar), etiqueta "Agotado".
      - `ERROR_CAPTURA`: Variante error/destructive (Rojo), etiqueta "Error Captura".
      - `SIN_DATO`: Variante neutra (Gris), etiqueta "Sin Dato".
  - `exportCsv.ts`:
    - Generación y descarga de archivos `.csv` cumpliendo RFC 4180 con encabezados legibles: `Fecha y Hora (ART)`, `Tienda`, `SKU`, `Alias en Góndola`, `Precio Regular (ARS)`, `Precio Promo (ARS)`, `Precio Unitario`, `Unidad`, `Precio (USD)`, `Estado Dato`, `Cotización Aplicada`, `Cotización Aproximada`, `Fuente Cotización`, `Motivo Faltante`, `URL Origen`.

### RF-05: Componentes Modulares de Interfaz (`src/components/traceability/`)
- **EL SISTEMA** debe organizar los componentes de interfaz en archivos de responsabilidad única (~40 a 100 líneas cada uno) utilizando los primitivos de `@/components/ui/`:
  1. `TraceabilityHeader.tsx`:
     - Botón de retorno al Dashboard o Alertas (`Link` con ícono `RiArrowLeftLine`).
     - Título principal, identificador del producto y badge de estatus forense.
  2. `TraceabilityProductCard.tsx`:
     - Tarjeta con ficha técnica canónica: Nombre normalizado, Marca, Modelo, Categoría, Contenido Neto (valor y unidad) y Configuración de Pack.
     - Callout informativo si se detectan eventos de reduflación o variaciones de gramaje.
  3. `TraceabilityObservationsTable.tsx`:
     - Tabla tabular de observaciones append-only con cabecera y celdas numéricas con clase `tabular-nums`.
     - **Botón "Exportar CSV" ubicado en la barra de herramientas de la cabecera de la tabla**, dado que exporta exclusivamente los datos de las observaciones de la tabla.
     - Enlace seguro a la URL original de la tienda (`target="_blank"` y `rel="noopener noreferrer"`).
     - Representación de valores nulos como guiones (`--`) o indicadores explícitos, prohibiendo mostrar $0 cuando el dato sea inexistente.
     - Renderizado de `Skeleton` en las filas durante el estado de carga (`isLoading === true`).
  4. `TraceabilityAuditFooter.tsx`:
     - Tarjeta inferior de metadatos de auditoría algorítmica: Versión del pipeline (v1.0), Política de corte cambiario (fijación 23:59:59 ART) y TTL de fallback cambiario (72h).
  5. `index.ts`:
     - Archivo barril que reexporta todos los componentes modulares de trazabilidad.

### RF-06: Página Coordinadora Concisa (`page.tsx`)
- **EL SISTEMA** debe simplificar `src/app/products/[id]/traceability/page.tsx` a un orquestador conciso de ~50-80 líneas que resuelva los parámetros de ruta (`use(params)`), instancie `useTraceabilityData` y delegue el renderizado a los subcomponentes modulares.

### RF-07: Pruebas Unitarias (`tests/unit/traceability.test.ts` / `src/lib/traceability/__tests__/`)
- **EL SISTEMA** debe incluir cobertura de tests unitarios que verifiquen:
  - Formateo de fechas a zona horaria ART UTC-3.
  - Formateo de monedas y precios por unidad.
  - Asignación de estilos de badges según el estado del dato.
  - Generación sintáctica válida de CSV según RFC 4180.
  - Conmutación del servicio `traceability.service.ts` entre URL real y fallback mock.

### RF-08: Calidad Cero Tolerancia
- **EL SISTEMA** debe superar la suite completa de calidad (`npm run check-all`) con 0 errores y 0 advertencias en ESLint, Prettier, CSpell y Vitest, logrando compilación limpia en `npm run build`.

---

## 3. Requerimientos No Funcionales y Restricciones Técnicas

1. **Aislamiento de Entorno:** Todo el código se desarrollará exclusivamente dentro de `apps/client`.
2. **KISS & YAGNI:** Se implementará la lógica estrictamente requerida sin abstracciones especulativas.
3. **Internacionalización y Convenciones:** Nombres de archivos, tipos, funciones y variables en inglés; interfaz gráfica y textos visibles en español técnico financiero.
4. **Seguridad Web:** Los enlaces externos a tiendas deben incluir `rel="noopener noreferrer"` para mitigar vulnerabilidades de tabnabbing.
5. **Legibilidad Numérica:** Todos los importes y cotizaciones deben usar `font-variant-numeric: tabular-nums` para evitar oscilaciones de ancho en tablas y fichas técnicas.
