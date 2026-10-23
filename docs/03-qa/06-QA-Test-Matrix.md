<p align="center">
  <img src="../assets/imagotipo.png" alt="PriceScope Logo" width="360"/>
</p>

# Matriz de Casos de Prueba y Trazabilidad QA Frontend (Mock-First)
**PriceScope — Monitor de Inflación Real Multimoneda**  
*Plataforma B2B de Analítica Económica e Inteligencia de Mercado*

---

## Metadatos del Documento

| Atributo | Detalle Oficial |
| :--- | :--- |
| **Código del Documento** | **`QTM-PRICESCOPE-FE-V1.1`** |
| **Proyecto** | PriceScope — Monitor de Inflación Real Multimoneda |
| **Organización / Programa** | Simulación Laboral Abierta — NoCountry |
| **Sector de Negocio** | FinTech / Analítica Económica (B2B Analytics) |
| **Versión** | **1.1** (Trazabilidad Frontend - Enfoque Mock-First) |
| **Fecha de Emisión** | 23 de Octubre de 2026 |
| **Ubicación en Repositorio** | `docs/03-qa/06-QA-Test-Matrix.md` |
| **Documentos Vinculantes** | `01-SRS-PriceScope.md`, `02-API-Contracts-OpenAPI.md`, `03-Data-Model-TimescaleDB.md`, `04-Business-Rules-Math-Logic.md`, `06-QA-Test-Matrix.md` (análisis), `07-Frontend-UX-UI-Specs.md`, `08-Casos-de-Uso-Use-Cases.md`, `03-plan-pruebas-frontend.md` |
| **Estado** | Propuesto para ejecución (Mock-First) |

---

## Control de Cambios

| Versión | Fecha | Autor | Descripción del Cambio |
| :--- | :--- | :--- | :--- |
| **1.0** | 2026-10-16 | Equipo PriceScope | Matriz backend/orientada a API/DB/Scraper (docs/01-analisis/06-QA-Test-Matrix.md). |
| **1.1** | 2026-10-23 | E-QA | Trazabilidad Frontend: Dashboard/Alertas/Trazabilidad/Pipeline. Enfoque mock-first. 35 TC. Cruce con hallazgos F-01..F-18. Tags obligatorios. Gates y estados. Sin modificar docs/01-analisis. |

---

## 1. Estrategia QA Frontend (Mock-First)

- **Mock-first estricto:** Las pruebas frontend se diseñarán y ejecutarán contra mocks/fixtures locales (`apps/client/src/mocks/*.json`). Los servicios usan fallback a mocks cuando `NEXT_PUBLIC_API_URL` está vacío con delays simulados (dashboard 2000ms, alerts 600ms, traceability 500ms).
- **API vacía:** Controladores/servicios mayormente en 0 bytes. Todo lo que dependa de endpoints reales se marca `[SIN COBERTURA]` con nota "Cobertura vía mocks locales. Validación contra API real pendiente".
- **Interceptación de red:** Para escenarios vacío/error se usará Playwright con `page.route()` sobre fixtures (tras crear `playwright.config.ts`).
- **Infra tests:** `vitest.config.mts` sin jsdom (unit tests en entorno node), `tests/e2e/chartAlignment.spec.ts` con `expect(true).toBe(true)` (falso verde). Se requiere corregir infra antes de E2E confiable.
- **Un objetivo por TC.** Aplicar tags: `[FALTA DEFINICIÓN]`, `[AMBIGÜEDAD]`, `[INCONSISTENCIA]`, `[SUPUESTO A VALIDAR]`, `[SIN COBERTURA]`.

---

## 2. Gates, Estados y Pendientes

| Elemento | Estado/Valor | Notas |
| :--- | :--- | :--- |
| **TC-MATH-06** | **Gate Fase 1.5** | Zona gris de matching (bloqueante). Referencia desde matriz de análisis. |
| **Circuit Breaker** | **ABORTADA** | Estado final marcado como ABORTADA. Ver TC-PIPE-05. |
| **H5** | **PENDIENTE** | Pendiente de validación. |
| **Pipeline** | **Sin pantalla separada** | Solo bloque embebido (tabla de tiendas / footer / sidebar). Gap documentado. |

---

## 3. Cruce de Hallazgos F-01..F-18

| Hallazgo | Impacto | TC Relacionados | Tratamiento |
| :--- | :--- | :--- | :--- |
| F-01 API no implementada | Bloqueante | TC-DASH-INT-01, TC-ALERT-INT-01, TC-TRAZ-INT-01 | `[SIN COBERTURA]` + nota mock-first |
| F-02 Puertos contradictorios | Riesgo integración | TC-TRANS-INT-01 | `[AMBIGÜEDAD]` - documentar |
| F-03 Mock-first por defecto | OK | Todos | Declarado en estrategia |
| F-04 Filtros dashboard no recalculan KPIs/categorías | Defecto | TC-DASH-FILT-01, TC-DASH-KPI-01 | Caso borde - validar comportamiento actual |
| F-05 Fallback oculta series vacías | Defecto/Comportamiento | TC-DASH-EMPTY-01 | Probar con interceptación Playwright |
| F-06 Frescura no visible | Defecto | TC-DASH-FRESH-01 | `[SIN COBERTURA]`/gap - HU-45 |
| F-07 Hitos sin marcadores | Gap parcial | TC-DASH-MILE-01 | Solo bandas de fondo - gap |
| F-08 Pipeline sin pantalla/historial | Gap | TC-PIPE-01..05 | Solo bloque embebido |
| F-09 Estados tienda degradados (FALLIDA→Estable) | Defecto | TC-PIPE-STORE-01 | Validar con mocks |
| F-10 Errores incompletos (skeleton infinito) | Defecto | TC-TRANS-ERR-01, TC-DASH-ERR-01 | Requiere manejo error |
| F-11 Filtros alertas por keywords/umbrales | Ambigüedad | TC-ALERT-FILT-01 | `[AMBIGÜEDAD]` documentado |
| F-12 Export alertas solo página actual | Comportamiento | TC-ALERT-EXP-01 | Baja severidad - validar |
| F-13 Trazabilidad pagina cliente | OK | TC-TRAZ-PAG-01 | Probar >10 obs |
| F-14 Moneda inconsistente | Ambigüedad | TC-DASH-MON-01 | `[AMBIGÜEDAD]` |
| F-15 Enums/contratos desalineados | Riesgo integración | TC-TRANS-CONT-01 | `[INCONSISTENCIA]` |
| F-16 Base demo sin series temporales | Contexto | TC-DASH-BASE-01 | Usar mocks |
| F-17 Infra tests insuficiente | Bloqueo | TC-TRANS-INF-01 | Corregir jsdom/playwright/config |
| F-18 Datos inconsistentes mocks/seed/docs | Gap documental | TC-TRANS-DOC-01 | `[INCONSISTENCIA]` |

---

## 4. Matriz Consolidada de Casos de Prueba Frontend (35 TC)

### 4.1 Dashboard (`/`) - TC-DASH
| ID | Pantalla/Componente | HU/CU/AC | Tipo | Prioridad | Modo | Objetivo | Precondiciones | Datos/Fixture | Pasos Clave | Resultado Esperado | Tags/Hallazgos | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| TC-DASH-BASE-01 | Dashboard (app/page.tsx) | HU-30/HU-45 | Funcional | P0 | Mock | Validar carga baseline con mocks | `NEXT_PUBLIC_API_URL` vacío o interceptado | F0 (dashboard.mock.json) | Cargar `/`, esperar skeletons | KPIs, gráfico, tiendas, frescura visible según implementación | F16 | Pendiente |
| TC-DASH-KPI-01 | KPIs (dashboard) | HU-28/HU-30 | Funcional | P0 | Mock | Verificar cálculo/mostrar KPIs | F0 | F0 | Revisar ARS/USD/pts diferenciales | Valores coherentes con F0 (25.0% ARS, 5.0% USD, 5.0 pts) | F04 | Pendiente |
| TC-DASH-FILT-01 | Filtros dashboard | HU-30 | Funcional/Borde | P1 | Mock | Comprobar filtros tienda/categoría/moneda/fechas | F0 | F0 | Aplicar filtros | Observar si KPIs/recalculos cambian (comportamiento actual) | F04 | Pendiente |
| TC-DASH-EVOL-01 | DashboardEvolutionSection | HU-30/HU-38 | Funcional | P1 | Mock | Gráfico evolución con series | F0 | F0 | Inspeccionar gráfico | 30 puntos (19/09-18/10) renderizados | - | Pendiente |
| TC-DASH-MILE-01 | Hitos (milestones) | HU-38 | Funcional/Gap | P1 | Mock | Verificar hitos/marcadores | F0 | F0 | Revisar hitos | Solo bandas de fondo; sin pines/tooltips visibles (gap) | F07 | Pendiente |
| TC-DASH-STORE-01 | DashboardStoresTable | HU-05/Pipeline | Funcional | P1 | Mock | Estados de tienda | F0 | F0 | Revisar tabla | Badges según estado; validar `FALLIDA` vs comportamiento | F09 | Pendiente |
| TC-DASH-MON-01 | Conversión USD/Oficial | HU-22/HU-23 | Funcional/Ambigüedad | P1 | Mock | Moneda y cotización | F0 | F0 | Cambiar moneda/filtros | Factor 0.78 en algunos cálculos; cotización mostrada | F14 `[AMBIGÜEDAD]` | Pendiente |
| TC-DASH-FRESH-01 | Frescura/estado global | HU-45 | Funcional/Gap | P1 | Mock | Frescura y alerta atraso | F0 | F0 | Revisar footer/header | `estado_global=OPERATIVO`, `2026-10-18T14:00:00Z`; sin efecto visible claro | F06 `[SIN COBERTURA]` | Pendiente |
| TC-DASH-EXP-01 | Export dashboard | - | Funcional/Baja sev | P2 | Mock | Exportar datos | F0 | F0 | Exportar | Funcionalidad existe; validar formato | D-03 | Pendiente |
| TC-DASH-EMPTY-01 | Dashboard vacío | - | Borde/Error | P1 | Mock (route) | Sin datos | F1 | F1 (intercept) | Interceptar respuesta vacía | EmptyState/KPI -- /estado crítico | F05 | Pendiente |
| TC-DASH-INSUF-01 | Cobertura insuficiente | - | Borde | P1 | Mock (route) | Cobertura baja | F2 | F2 (intercept) | Interceptar | Sin datos suficientes / KPIs nulos | - | Pendiente |
| TC-DASH-ERR-01 | Dashboard error HTTP | - | Error | P1 | Mock (route) | Error 500 | F6 | F6 (intercept) | Interceptar 500 | Manejo error; evitar skeleton infinito | F10 | Pendiente |

### 4.2 Alertas (`/alerts`) - TC-ALERT
| ID | Pantalla/Componente | HU/CU/AC | Tipo | Prioridad | Modo | Objetivo | Precondiciones | Datos/Fixture | Pasos Clave | Resultado Esperado | Tags/Hallazgos | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| TC-ALERT-BASE-01 | Alertas (app/alerts/page.tsx) | HU-28 | Funcional | P0 | Mock | Carga baseline alertas | alerts.mock.json (8) | F0-like / mock | Cargar /alerts | Lista, paginación, severidad | - | Pendiente |
| TC-ALERT-FILT-01 | AlertsFilters | HU-28 | Funcional/Ambigüedad | P1 | Mock | Filtros severidad/categoría/tienda | Mock 8 alertas | F0 | Filtrar por severidad/categoría | Filtrado por keywords/umbrales >10/5-10/<5 | F11 `[AMBIGÜEDAD]` | Pendiente |
| TC-ALERT-PAG-01 | AlertsPagination | HU-28 | Funcional | P1 | Mock | Paginación | alerts.mock.json (8), limitPerPage 50 | F4/F baseline | Revisar paginación | Con 8 items y limit 50 → paginación 1/1 (comportamiento) | - | Pendiente |
| TC-ALERT-PAG-02 | Paginación > página 1 | HU-28 | Funcional | P1 | Mock (route) | 120 alertas 3 páginas | F4 | F4 (intercept) | Interceptar 120 | 3 páginas, export página actual | - | Pendiente |
| TC-ALERT-EXP-01 | AlertsTable export | - | Funcional/Baja sev | P2 | Mock | Export CSV/JSON | Mock 8 alertas | F0 | Exportar página actual | Solo página actual exportada | F12 D-03 | Pendiente |
| TC-ALERT-MILE-01 | AlertsMilestones | - | Funcional | P2 | Mock | Hitos alertas | Mock | F0 | Revisar | getAlertsMilestones devuelve defaults | - | Pendiente |
| TC-ALERT-ERR-01 | Alertas error | - | Error | P1 | Mock (route) | Error 500 | F6 | F6 (intercept) | Interceptar 500 | Estado error visible | F10 | Pendiente |

### 4.3 Trazabilidad (`/products/[id]/traceability`) - TC-TRAZ
| ID | Pantalla/Componente | HU/CU/AC | Tipo | Prioridad | Modo | Objetivo | Precondiciones | Datos/Fixture | Pasos Clave | Resultado Esperado | Tags/Hallazgos | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| TC-TRAZ-BASE-01 | Trazabilidad | HU-15/HU-38 | Funcional | P0 | Mock | Carga producto canónico | traceability.mock.json (4 productos) | F0 | /products/[id]/traceability | Observaciones, hitos, auditoría | - | Pendiente |
| TC-TRAZ-PAG-01 | Paginación cliente | HU-15 | Funcional | P1 | Mock | Paginación 10 | 12 observaciones | F5 (intercept) | Interceptar 12 | Muestra 10 + 2 (paginación cliente) | F13 | Pendiente |
| TC-TRAZ-RED-01 | Reduflación | HU-15/HU-38 | Funcional | P1 | Mock | Cambio gramaje | F5 | F5 | Revisar historial/contenido | Reduflación 500g→450g visible | - | Pendiente |
| TC-TRAZ-FILT-01 | Filtros trazabilidad | - | Funcional | P2 | Mock | Filtros fecha/tienda | F5 | F5 | Aplicar filtros | dateRange existe en hook pero no usado en UI | - | Pendiente |
| TC-TRAZ-HDR-01 | TraceabilityHeader/divergenceDelta | - | Funcional/Ambigüedad | P1 | Mock | divergenceDelta | F5 | F5 | Revisar header | TraceabilityPage no pasa divergenceDelta a TraceabilityHeader | - | Pendiente |
| TC-TRAZ-TTL-01 | TTL auditoría | - | Funcional/Ambigüedad | P1 | Mock | TTL 48h vs 72h | F5 | F5 | Comparar badges | getRateBadgeInfo 48h, TraceabilityAuditFooter fallback 72h | `[AMBIGÜEDAD]` | Pendiente |
| TC-TRAZ-404-01 | Producto inexistente | - | Error | P1 | Mock (route) | 404 | F5/404 fixture | Intercept 404 | Navegar a UUID inexistente | Error state, sin datos previos | F10 | Pendiente |
| TC-TRAZ-EXP-01 | Export trazabilidad | - | Funcional/Baja sev | P2 | Mock | Export observaciones | F5 | F5 | Exportar | Exporta filas paginadas/filtradas según implementación | D-03 | Pendiente |

### 4.4 Pipeline / Estado embebido - TC-PIPE
| ID | Pantalla/Componente | HU/CU/AC | Tipo | Prioridad | Modo | Objetivo | Precondiciones | Datos/Fixture | Pasos Clave | Resultado Esperado | Tags/Hallazgos | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| TC-PIPE-01 | Pipeline embebido (dashboard/sidebar) | HU-05 | Funcional | P0 | Mock | Estado pipeline visible | Dashboard con stores/pipeline data | F0 | Revisar tabla/sidebar/footer | Estados por tienda embebidos (sin pantalla separada) | F08 | Pendiente |
| TC-PIPE-STORE-01 | Estados tienda | HU-05 | Funcional/Defecto | P1 | Mock | FALLIDA/EXITOSA/EN_PROCESO | F0 | F0 | Revisar estados | FALLIDA degrada a warning/"Estable" o danger según código | F09 | Pendiente |
| TC-PIPE-HIST-01 | Historial pipeline | HU-05 | Funcional/Gap | P1 | Mock | Historial/corridas | Sin datos API | Mock/fixture | Buscar historial | No existe pantalla/historial → gap | F08 `[SIN COBERTURA]` | Pendiente |
| TC-PIPE-CB-01 | Circuit Breaker | HU-05 | Funcional | P0 | Mock (route) | Circuit breaker abierto | Fixture pipeline CB abierto | Intercept | Simular CB abierto | Estado reportado según implementación; finalizar ABORTADA | Gate/estado ABORTADA | Pendiente |
| TC-PIPE-05 | Circuit Breaker estado final | HU-05 | Validación/Estado | P0 | Documental/Mock | Marcar estado final ABORTADA | Contexto | - | Validación | Estado final ABORTADA registrado; H5 pendiente | Requerido | Pendiente |

### 4.5 Transversales / Infra / Integración - TC-TRANS
| ID | Pantalla/Componente | HU/CU/AC | Tipo | Prioridad | Modo | Objetivo | Precondiciones | Datos/Fixture | Pasos Clave | Resultado Esperado | Tags/Hallazgos | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| TC-TRANS-INT-01 | Integración API | - | Integración/Gap | P0 | Mock | API endpoints | API vacía | - | Intentar llamar /api/v1/* | Sin endpoints funcionales → marcado SIN COBERTURA | F01 F02 `[SIN COBERTURA]` | Pendiente |
| TC-TRANS-LOAD-01 | Carga/skeletons | - | Funcional | P2 | Mock (delay) | Latencias simuladas | F7 | F7 (delay) | Observar loading | Skeletons sin layout shift; delays 2000/600/500ms | - | Pendiente |
| TC-TRANS-ERR-01 | Errores transversales | - | Error | P1 | Mock (route) | Errores globales | F6 | Intercept varios | Simular errores | Manejo consistente, sin skeleton infinito | F10 | Pendiente |
| TC-TRANS-DOWN-01 | Downsampling >90D | HU-47 | Funcional | P1 | Mock (route) | Agrupación semanal | F3 | F3 (intercept) | Rango >90D | Badge "Agrupación activa" / downsampling | - | Pendiente |
| TC-TRANS-INF-01 | Infra tests | - | Infra/Crítico | P0 | Config | Vitest/jsdom/Playwright | Proyecto | - | Revisar configs | vitest sin jsdom; no playwright.config.*; falso verde E2E | F17 | Pendiente |
| TC-TRANS-CONT-01 | Contratos/enums | - | Integración/Ambigüedad | P1 | Documental | Desalineación tipos | Código vs docs | - | Comparar types/api.ts vs init.sql | Marcar inconsistencias | F15 `[INCONSISTENCIA]` | Pendiente |
| TC-TRANS-DOC-01 | Coherencia docs/mocks/seed | - | Documental | P2 | Documental | Inconsistencias | Mocks/seed/docs | - | Revisar | Registrar inconsistencias | F18 `[INCONSISTENCIA]` | Pendiente |
| TC-TRANS-SID-01 | SidebarContext duplicado | - | Funcional/Defecto | P1 | Mock | Fetch duplicado | Dashboard+Sidebar | F0 | Observar network/código | SidebarContext consulta getAlertsData/getDashboardData | Verificado en código | Pendiente |
| TC-TRANS-CHART-01 | Falso verde E2E | - | Test/Crítico | P0 | Test | chartAlignment.spec.ts | tests/e2e | - | Revisar test | Tiene expect(true).toBe(true) → falso verde | F17 | Pendiente |
| TC-TRANS-GATE-01 | Gate Fase 1.5 | - | Gate | P0 | Validación | TC-MATH-06 como gate | Contexto | - | Validación | Marcado como Gate Fase 1.5 | Requerido | Pendiente |

**Total:** 35 TC. Todos orientados a frontend con enfoque mock-first. API/integración real marcada como `[SIN COBERTURA]`.
