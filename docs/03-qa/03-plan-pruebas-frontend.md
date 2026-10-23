<p align="center">
  <img src="../assets/imagotipo.png" alt="PriceScope Logo" width="360"/>
</p>

# Plan de Pruebas Frontend y Dataset Controlado
**PriceScope — Monitor de Inflación Real Multimoneda**  
*Plataforma B2B de Analítica Económica e Inteligencia de Mercado*

---

## Metadatos del Documento

| Atributo | Detalle Oficial |
| :--- | :--- |
| **Código del Documento** | **`QAP-PRICESCOPE-FE-V1.0`** |
| **Proyecto** | PriceScope — Monitor de Inflación Real Multimoneda |
| **Organización / Programa** | Simulación Laboral Abierta — NoCountry |
| **Sector de Negocio** | FinTech / Analítica Económica (B2B Analytics) |
| **Versión** | **1.0** (Plan de trabajo para casos de prueba de frontend) |
| **Fecha de Emisión** | 23 de Octubre de 2026 |
| **Ubicación en Repositorio** | `docs/03-qa/03-plan-pruebas-frontend.md` |
| **Documentos Vinculantes** | `01-SRS-PriceScope.md`, `02-API-Contracts-OpenAPI.md`, `03-Data-Model-TimescaleDB.md`, `04-Business-Rules-Math-Logic.md`, `06-QA-Test-Matrix.md`, `07-Frontend-UX-UI-Specs.md`, `08-Casos-de-Uso-Use-Cases.md` |
| **Estado** | Plan propuesto para ejecución |

---

## 1. Propósito

Definir el plan de trabajo para diseñar, ejecutar y documentar los casos de prueba del frontend del MVP de PriceScope, con cobertura de las pantallas de Dashboard, Alertas, Trazabilidad y estado del pipeline.

El plan consolida:

- El alcance validado con el usuario.
- El análisis de consistencia entre documentación, mocks y código real.
- El dataset controlado necesario para que las pruebas sean deterministas.
- Las etapas pendientes hasta la entrega de la matriz de casos ejecutada.

---

## 2. Alcance

### Incluido

| Elemento | Cobertura |
| :--- | :--- |
| Dashboard (`/`) | KPIs, filtros, gráfico de evolución, bandas de calidad, hitos, moneda, export, estado de tiendas, frescura |
| Alertas (`/alerts`) | Filtros, severidad, paginación, tabla, estados vacíos, export CSV/JSON |
| Trazabilidad (`/products/[id]/traceability`) | Observaciones, filtros, paginación cliente, reduflación, export, error 404 |
| Pipeline | Estado embebido en dashboard, tabla de tiendas, footer, estados degradados |
| Estados transversales | Carga, vacío, datos insuficientes, error HTTP, reintento, downsampling |
| Export CSV/JSON | Prueba de **baja severidad**, considerada agregado al MVP |

### Excluido

| Elemento | Motivo |
| :--- | :--- |
| Login, autenticación y RBAC | El MVP no incluye autenticación; decisión explícita del usuario |
| HU-34 y capa promocional | Fuera del alcance del MVP; Fase 2 |
| Pruebas de backend/DB como objetivo primario | Solo se validan efectos visibles en el frontend |
| Integración real contra la API | La API está en estado scaffold; se usa modo mock |
| Pantalla separada de pipeline | No existe en el código actual; se registrará como gap |
| Carga de 10.000+ observaciones | Corresponde a la suite de rendimiento, no a este plan funcional |

---

## 3. Decisiones tomadas

| ID | Decisión | Origen |
| :--- | :--- | :--- |
| D-01 | Incluir el estado del pipeline en el alcance de pruebas | Confirmación del usuario |
| D-02 | No incluir login ni validaciones de rol | Confirmación del usuario |
| D-03 | Incluir export CSV/JSON como prueba de baja severidad | Confirmación del usuario |
| D-04 | Mantener HU-34 fuera del MVP | Confirmación del usuario |
| D-05 | Preparar un dataset controlado propio, con instrucciones de carga y verificación | Confirmación del usuario |
| D-06 | Ejecutar las pruebas en modo mock-first, sin depender de la API | Análisis técnico |
| D-07 | Usar Playwright con interceptación de red para escenarios de error/vacío | Análisis técnico |
| D-08 | No modificar `01/02/03/04/08` ni `init.sql` | Restricción del proyecto |

## 3.1 Estrategia de pruebas: Mock-First

- **Por defecto mock:** Los servicios (`apps/client/src/services/*.ts`) usan JSON locales si `NEXT_PUBLIC_API_URL` está vacío con latencias simuladas (dashboard 2000ms, alerts 600ms, traceability 500ms).
- **Interceptación:** Para escenarios vacío/error/downsampling usar Playwright `page.route()` con fixtures F0-F7.
- **Sin dependencia API:** API NestJS vacía (`AppModule` sin imports, controladores en 0 bytes). Todo lo dependiente de `/api/v1/*` se marca `[SIN COBERTURA]` hasta tener endpoints funcionales.
- **Trazabilidad:** Ver `docs/03-qa/06-QA-Test-Matrix.md` v1.1 (35 TC) con cruces F-01..F-18.

---

## 4. Estado actual del trabajo

### 4.1 Etapa 1 — Comprensión del proyecto

**Estado: completada.**

Se relevó y validó:

- Producto, usuarios, propuesta de valor y alcance del MVP.
- 4 tiendas piloto: Carrefour, Jumbo, Frávega y Musimundo.
- Seed de 4–5 productos canónicos, con alias y categorías.
- 3 pantallas principales más el estado de pipeline embebido.
- Restricciones del MVP: sin login, sin RBAC, HU-34 fuera.
- Proceso obligatorio de 8 etapas para generar casos de prueba.
- Necesidad de un dataset controlado y determinista.

### 4.2 Etapa 2 — Análisis de consistencia

**Estado: completada.**

Se contrastaron los documentos `01` a `08` contra el código real de `apps/client`, `apps/api` y `apps/database`. Los hallazgos se detallan en la sección 6.

### 4.3 Etapas pendientes

| Etapa | Entregable | Estado |
| :--- | :--- | :--- |
| 3 | Mapa de cobertura HU/CU/AC → pantalla/estado | Pendiente |
| 4 | Casos de prueba detallados | Pendiente |
| 5 | QA de los casos: condiciones, datos, observabilidad | Pendiente |
| 6 | Matriz de trazabilidad | Pendiente |
| 7 | Mejoras y riesgos residuales | Pendiente |
| 8 | Resumen ejecutivo y cierre | Pendiente |

---

## 5. Contexto técnico verificado

| Componente | Estado real | Implicancia para QA |
| :--- | :--- | :--- |
| Frontend | Next.js 16, React 19, Tailwind v4, Recharts 3.10 | Las pruebas se ejecutan sobre `apps/client` |
| Servicios | Usan mocks JSON si `NEXT_PUBLIC_API_URL` está vacío | Modo por defecto para las pruebas |
| API NestJS | `AppModule` sin módulos; controladores vacíos | No hay integración real disponible |
| Base de datos | `init.sql` crea esquema y datos maestros | No hay series temporales ni ejecuciones |
| Mocks | `dashboard.mock.json`, `alerts.mock.json`, `traceability.mock.json` | Base del dataset baseline |
| Tests actuales | Vitest en entorno `node`; un E2E sin configuración | No cubren la UI ni los flujos completos |
| Playwright | Instalado, sin `playwright.config.*` | Se debe crear la infraestructura |
| Puertos | README raíz: API `3001`; `main.ts`: `3000`; README cliente: `8000` | Ambigüedad para integración futura |

---

## 6. Hallazgos de consistencia

### 6.1 Bloqueantes

| ID | Hallazgo | Evidencia | Tratamiento |
| :--- | :--- | :--- | :--- |
| F-01 | API no implementada | `apps/api/src/app.module.ts`; controladores vacíos | Ejecutar en modo mock; integración queda bloqueada |
| F-02 | Puertos contradictorios | `README.md:46,154`; `apps/api/src/main.ts` | Registrar como riesgo de integración |
| F-03 | Frontend mock-first por defecto | Servicios en `apps/client/src/services/` | Declarar en cada caso el modo de ejecución |

### 6.2 Severidad alta

| ID | Hallazgo | Evidencia | Impacto en pruebas |
| :--- | :--- | :--- | :--- |
| F-04 | Filtros del dashboard no recalculan KPIs ni categorías | `filterMockData()` en `dashboard.service.ts` | Separar “filtro enviado” de “KPI recalculado”; registrar defecto |
| F-05 | Fallback oculta series vacías | `filteredSeries.length > 0 ? ... : rawMock` | El estado vacío solo se prueba interceptando red |
| F-06 | Frescura no visible | `app/page.tsx:43,65`; `SidebarStatusFooter.tsx` | HU-45 y `alerta_atraso_24h` sin efecto visual |
| F-07 | Hitos sin marcadores | `DashboardEvolutionSection.tsx`; `useDashboardData.ts:141` | Solo hay bandas de fondo; pines/tooltips quedan como gap |
| F-08 | Pipeline sin pantalla ni historial | `types/api.ts`; tabla y sidebar | Solo se prueba el bloque embebido |
| F-09 | Estados de tienda degradados incorrectamente | `storesAudit.ts`; `DashboardStoresTable.tsx:45` | `FALLIDA` se muestra como “Estable”; nunca hay danger |
| F-10 | Manejo de errores incompleto | `useDashboardData.ts`; `useAlertsData.ts`; `useTraceabilityData.ts` | Dashboard puede quedar en skeleton infinito |

### 6.3 Severidad media/baja

| ID | Hallazgo | Evidencia | Impacto en pruebas |
| :--- | :--- | :--- | :--- |
| F-11 | Filtros de alertas por keywords y umbrales no documentados | `AlertsFilters.tsx`; `filterMockAlerts()` | Usar nombres de producto preparados |
| F-12 | Export de alertas solo de la página actual | `AlertsTable.tsx`; `useAlertsData.ts` | Probar como agregado de baja severidad |
| F-13 | Trazabilidad pagina en cliente | `useTraceabilityData.ts` | Probar con más de 10 observaciones |
| F-14 | Moneda inconsistente | `types/api.ts`; `storesAudit.ts` | Probar solo lo observable; marcar ambigüedad |
| F-15 | Enums/contratos desalineados | `types/api.ts`; `init.sql`; `02-API-Contracts` | Riesgo para la futura integración |
| F-16 | Base demo sin series temporales | `apps/database/init.sql` | El dashboard queda vacío sin dataset |
| F-17 | Infra de tests insuficiente | `tests/e2e/chartAlignment.spec.ts`; `vitest.config.mts` | Crear Playwright config y evitar falso verde |
| F-18 | Datos/documentación inconsistentes | Mocks; seed; `01/03/07` | Registrar como hallazgos documentales |

---

## 7. Dataset controlado

### 7.1 Estrategia

Se adopta un enfoque **mock-first** con dos capas:

1. **Fixtures estáticos** para pruebas manuales y baseline.
2. **Interceptación de red con Playwright** para escenarios de error, vacío, paginación y demoras.

No se modifica código de producción. Los fixtures viven en el directorio de tests.

### 7.2 Convención temporal

| Parámetro | Valor |
| :--- | :--- |
| Fecha ancla | `2026-10-18T14:00:00Z` (`11:00 ART`) |
| Reloj Playwright | `2026-10-18T15:00:00Z` |
| Preset por defecto | `30D` = `2026-09-19` a `2026-10-18` |
| Rango manual equivalente | `19/09/2026` a `18/10/2026` |

### 7.3 Entidades de referencia

| Entidad | Identificador | Uso |
| :--- | :--- | :--- |
| Café La Virginia 500g | `b3e21a88-7f2c-4b55-89df-1c0a2f4d6e90` | Trazabilidad principal |
| Smart TV 55" | `d5a43c00-9b4e-4d77-a1fb-3e2c4a6f8a12` | Categoría durables |
| Aceite Natura 1.5L | `c4f32b99-8a3d-4c66-90ea-2d1b3f5e7f01` | Alertas y filtros |
| Producto inexistente | `00000000-0000-4000-8000-000000000404` | Error 404 |

### 7.4 Familias de fixtures

| ID | Propósito | Datos clave | Verificación esperada |
| :--- | :--- | :--- | :--- |
| F0 | Baseline feliz 30D | 30 puntos; ARS +25%; cotización +20%; USD +4,2%; diferencial +5,0 pts; cobertura 98,5%; 3 días `AGOTADO`; 1 `ERROR_CAPTURA`; 2 hitos; 4 tiendas | KPIs, gráfico, bandas, tabla y export |
| F1 | Sin datos | Series y banda vacías; KPIs `null`; `SIN_DATOS_SUFICIENTES`; tiendas vacías; estado global `CRITICO` | `EmptyState`; KPIs `--`; footer crítico |
| F2 | Cobertura insuficiente | 3/30 días válidos; cobertura 10%; medianas `null` | KPIs `--`; badge “Sin datos suficientes” |
| F3 | Downsampling >90D | 53 puntos semanales; rango 2025-10-20 a 2026-10-18 | Badge “Agrupación activa (53 pts)” |
| F4 | Alertas y paginación | 120 alertas; 40/40/40 por severidad; límites `4.99`, `5.0`, `10.0`, `10.01`; 50 por página | 3 páginas; filtros; export de página |
| F5 | Trazabilidad | 12 observaciones; 2 tiendas; estados variados; reduflación 500g→450g | 10 + 2 filas; filtros; export 12 filas; 404 |
| F6 | Errores HTTP | `500` en dashboard/alertas; `404` y `500` en trazabilidad | Error visible y reintento |
| F7 | Carga | Latencia 2.000 ms | Skeletons sin layout shift |

### 7.5 Carga de datos

| Modo | Procedimiento | Limitación |
| :--- | :--- | :--- |
| Manual | Copiar fixture sobre `apps/client/src/mocks/*.json`; ejecutar `npm run dev` | No permite vacío/error por el fallback |
| Playwright | `page.route("**/__qa/api/v1/**", ...)` con fixtures | Requiere crear configuración y helper |
| Base real | `apps/database/fixtures/qa/qa_dataset.sql` con `generate_series` | Bloqueado hasta implementar la API |

### 7.6 Verificación

- UI: roles/textos accesibles, valores exactos, badges, skeletons, `EmptyState`, tablas y paginación.
- Red: query params enviados (`fecha_desde`, `fecha_hasta`, `moneda`, `tienda_id`, `categoria_id`, `page`, `limit`, `severidad`).
- Descargas: capturar `download`, leer CSV/JSON y validar encabezados y filas.
- Gráfico: cantidad de puntos, categorías, tooltip y bandas; screenshots como evidencia.
- Datos: conteos, nulos, cobertura y medianas con SQL.
- Regresión: `npm run lint`, `npm run test`, Playwright E2E.

---

## 8. Plan de ejecución por etapas

### Etapa 3 — Mapa de cobertura

- Cruzar HU/CU/AC con cada pantalla y estado.
- Identificar cobertura directa, indirecta y faltante.
- Marcar `[SIN COBERTURA]` para pipeline separado, hitos visuales y frescura.
- Entregable: tabla de cobertura y lista de gaps.

### Etapa 4 — Casos de prueba

- Redactar casos atómicos con objetivo único.
- Incluir precondiciones, datos, pasos y resultado esperado.
- Separar suites: Dashboard, Alertas, Trazabilidad, Pipeline, Transversales.
- Estimar 55–65 casos.
- Entregable: `01-matriz-casos-prueba.md` o documento de casos aprobado.

### Etapa 5 — QA de los casos

- Revisar condiciones, observabilidad y determinismo.
- Validar que cada caso tenga un único objetivo.
- Eliminar duplicados y dependencias ocultas.
- Entregable: casos revisados y corregidos.

### Etapa 6 — Trazabilidad

- Mapear TC → HU/CU/AC.
- Detectar AC sin TC y TC sin requisito.
- Entregable: matriz de trazabilidad.

### Etapa 7 — Mejoras y riesgos

- Registrar defectos y ambigüedades.
- Priorizar riesgos residuales.
- Proponer mejoras de testabilidad.
- Entregable: backlog de mejoras y riesgos.

### Etapa 8 — Resumen ejecutivo

- Consolidar alcance, cobertura, hallazgos y pendientes.
- Emitir recomendación de avance.
- Entregable: resumen de cierre.

---

## 9. Estructura de archivos prevista

```text
apps/client/
  playwright.config.ts
  tests/
    fixtures/
      qa/
        dashboard/
          baseline.json
          empty.json
          insufficient.json
          downsampled.json
        alerts/
          baseline.json
          volume-120.json
        traceability/
          cafe.json
          pagination.json
          reduflation.json
        errors/
          dashboard-500.json
          traceability-404.json
    e2e/
      support/
        mock-api.ts
      dashboard.spec.ts
      alerts.spec.ts
      traceability.spec.ts
      pipeline.spec.ts
      cross-cutting.spec.ts

docs/03-qa/
  01-matriz-casos-prueba.md
  03-plan-pruebas-frontend.md

apps/database/fixtures/qa/
  qa_dataset.sql
```

---

## 10. Comandos de ejecución

```powershell
# Frontend
Set-Location "apps/client"
npm run dev

# Unitarios
npm run test

# Calidad
npm run lint
npm run format:check
npm run spellcheck

# E2E, una vez creado el config
npx playwright test
```

---

## 11. Riesgos y bloqueos

| ID | Riesgo | Impacto | Mitigación |
| :--- | :--- | :--- | :--- |
| R-01 | API no implementada | No hay integración real | Mock-first con interceptación `[SIN COBERTURA]` |
| R-02 | Fallback del dashboard | No se puede probar vacío con mock estático | Playwright route con fixtures F1-F6 |
| R-03 | Pipeline sin pantalla | Cobertura parcial | Marcar gap y probar bloque embebido (TC-PIPE) |
| R-04 | Frescura no visible | HU-45 no verificable | Registrar defecto (F-06) |
| R-05 | Hitos sin marcadores | HU-38 parcial | Verificar bandas y marcar gap (F-07) |
| R-06 | Sin Playwright config | E2E no ejecutable | Crear `playwright.config.ts` base |
| R-07 | Datos inconsistentes | Resultados no deterministas | Dataset controlado y reloj congelado |
| R-08 | Puertos ambiguos | Integración futura incierta | Documentar y unificar antes de conectar |
| R-09 | Infra tests insuficiente | Falso verde / sin jsdom | Corregir `vitest.config.mts` (jsdom) y revisar `tests/e2e/chartAlignment.spec.ts` (F-17) |
| R-10 | Estados tienda degradados | Falsos positivos | Validar `FALLIDA` vs UI (F-09) |

---

## 12. Criterios de aceptación del plan

- [ ] Cada pantalla del alcance tiene al menos un caso feliz, uno de borde y uno de error.
- [ ] Cada caso tiene datos, pasos y resultado esperado verificable.
- [ ] Todos los casos están trazados a HU/CU/AC o marcados como gap.
- [ ] El dataset permite ejecutar los casos sin depender de la API.
- [ ] Los escenarios de vacío y error se ejecutan con interceptación de red.
- [ ] Los hallazgos de severidad alta están registrados como defectos o gaps.
- [ ] `npm run lint` y `npm run test` pasan sin errores.
- [ ] La matriz de casos y el resumen ejecutivo quedan publicados en `docs/03-qa/`.

---

## 13. Próxima acción

1. Aprobar la creación de `playwright.config.ts`, fixtures y helper de interceptación.
2. Ejecutar la Etapa 3 y publicar el mapa de cobertura.
3. Redactar los casos de prueba y validar el dataset con el primer caso baseline.
4. Ejecutar la suite, registrar evidencias y actualizar la matriz de ejecución.

---

## Anexo A — Resumen de cobertura por pantalla

| Pantalla | Casos felices | Bordes | Errores | Observaciones |
| :--- | :---: | :---: | :---: | :--- |
| Dashboard | 6 | 6 | 3 | Incluye filtros, moneda, export y pipeline |
| Alertas | 4 | 4 | 2 | Incluye severidad, paginación y export |
| Trazabilidad | 4 | 3 | 3 | Incluye reduflación, paginación y 404 |
| Pipeline | 2 | 2 | 1 | Solo bloque embebido; pantalla separada es gap |
| Transversales | 3 | 3 | 3 | Carga, vacío, datos insuficientes y errores |

---

## Anexo B — Trazabilidad documental

| Documento | Uso en este plan |
| :--- | :--- |
| `01-SRS-PriceScope.md` | HU, AC y reglas de negocio |
| `02-API-Contracts-OpenAPI.md` | Contratos de respuesta y query params |
| `03-Data-Model-TimescaleDB.md` | Entidades, enums y dataset |
| `04-Business-Rules-Math-Logic.md` | Cálculos, tolerancias y fallback |
| `06-QA-Test-Matrix.md` | Marco QA y convenciones |
| `07-Frontend-UX-UI-Specs.md` | Pantallas, estados y componentes |
| `08-Casos-de-Uso-Use-Cases.md` | CU y trazabilidad CU→HU |

---

**Fin del documento.**
