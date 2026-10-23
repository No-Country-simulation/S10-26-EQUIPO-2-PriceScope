# Pruebas Manuales - Dashboard (Mock-First)

**Proyecto:** PriceScope  
**Archivo:** `docs/03-qa/04-pruebas-manuales-dashboard.md`  
**Fecha:** 23 de Octubre de 2026  
**Modo:** Mock-first (sin API funcional). Usar mocks locales o interceptación con Playwright.  
**Ambiente:** `apps/client` - Next.js 16, React 19, Tailwind v4  

---

## Objetivo
Validar funcionalidad del Dashboard (`/`) con enfoque mock-first, cubriendo KPIs, filtros, gráfico de evolución, hitos, estados de tiendas, frescura, pipeline embebido, export, estados vacío/error e infra de tests.

---

## Precondiciones
- [ ] Clonar/estar en repo `S10-26-EQUIPO-2-PriceScope`
- [ ] `apps/client` con dependencias instaladas (`npm install`)
- [ ] `NEXT_PUBLIC_API_URL` vacío o no definido (usa mocks por defecto)
- [ ] Mocks disponibles: `apps/client/src/mocks/dashboard.mock.json`, `alerts.mock.json`, `traceability.mock.json`
- [ ] Navegador con DevTools (Network/Console) para validar requests/fallbacks
- [ ] (Opcional) Playwright configurado para interceptación

---

## Datos de Referencia (Baseline)
| Campo | Valor (dashboard.mock.json) |
| :--- | :--- |
| `estado_global` | `OPERATIVO` |
| `frescura.timestamp` | `2026-10-18T14:00:00Z` |
| `frescura.alerta_atraso_24h` | `false` |
| `kpis.variacion_ars_mediana` | `25.0%` |
| `kpis.variacion_usd_mediana` | `5.0%` |
| `kpis.diferencial_puntos` | `5.0 pts` |
| `kpis.cotizacion_blue` | `1200` |
| Series | 30 puntos (2026-09-19 a 2026-10-18) |
| Tiendas | 4 (Carrefour, Jumbo, Frávega, Musimundo) |
| Hitos | 2 |
| Bandas calidad | 30 |

---

## Casos de Prueba Manuales

### A. Carga y Estado Base (TC-DASH-BASE-01, TC-DASH-KPI-01)
| ID | Acción | Resultado Esperado | Estado (OK/NO/NA) | Evidencia |
| :--- | :--- | :--- | :--- | :--- |
| PM-DASH-01 | Abrir `/` | Página carga, muestra skeletons breves y luego datos. Sin error en consola. | ____ | Screenshot |
| PM-DASH-02 | Verificar KPIs | Se muestran variación ARS/USD, diferencial puntos, cotización. Valores coherentes con baseline. | ____ | Screenshot |
| PM-DASH-03 | Verificar frescura | Se muestra timestamp `2026-10-18T14:00:00Z` y estado global `OPERATIVO`. | ____ | Screenshot |
| PM-DASH-04 | Verificar tiendas | Tabla de tiendas con 4 filas. Badge "N Tiendas Activas" siempre muestra conteo (verificar comportamiento). | ____ | Screenshot |

### B. Gráfico, Hitos y Bandas (TC-DASH-EVOL-01, TC-DASH-MILE-01)
| ID | Acción | Resultado Esperado | Estado (OK/NO/NA) | Evidencia |
| :--- | :--- | :--- | :--- | :--- |
| PM-DASH-05 | Revisar gráfico evolución | Se renderizan ~30 puntos. Eje fechas correcto (sep-oct 2026). Tooltip funcional. | ____ | Screenshot |
| PM-DASH-06 | Revisar hitos | Hitos presentes en datos pero no se ven marcadores/pines claros en gráfico. Solo bandas de fondo si existen. (Gap F-07) | ____ | Screenshot |
| PM-DASH-07 | Revisar bandas calidad | Bandas de calidad visibles. Semáforos/coherentes con datos. | ____ | Screenshot |

### C. Filtros, Moneda y Pipeline Embebido (TC-DASH-FILT-01, TC-DASH-MON-01, TC-PIPE-01)
| ID | Acción | Resultado Esperado | Estado (OK/NO/NA) | Evidencia |
| :--- | :--- | :--- | :--- | :--- |
| PM-DASH-08 | Aplicar filtro por tienda | UI filtra; observar si KPIs se recalculan. Documentar comportamiento (puede no recalcular - F-04). | ____ | Screenshot/Notas |
| PM-DASH-09 | Cambiar moneda/filtros | Revisar conversión USD vs Oficial. Factor 0.78 observado en código. Documentar ambigüedad. | ____ | Notas |
| PM-DASH-10 | Revisar pipeline embebido | Tabla/sidebar/footer muestran estados de tiendas. Sin pantalla separada. | ____ | Screenshot |
| PM-DASH-11 | Revisar estado FALLIDA | Si existe estado FALLIDA, verificar si se muestra como "Estable"/warning o danger (F-09). | ____ | Notas |

### D. Export y Acciones (TC-DASH-EXP-01)
| ID | Acción | Resultado Esperado | Estado (OK/NO/NA) | Evidencia |
| :--- | :--- | :--- | :--- | :--- |
| PM-DASH-12 | Exportar CSV/JSON | Descarga funciona. Revisar contenido básico. (Baja severidad D-03) | ____ | Archivo descargado |

### E. Estados Vacío, Insuficiente, Error (TC-DASH-EMPTY-01, TC-DASH-INSUF-01, TC-DASH-ERR-01)
*Requiere interceptación con Playwright o modificar mocks temporalmente. Si no se puede interceptar, marcar NA y documentar.*

| ID | Acción | Resultado Esperado | Estado (OK/NO/NA) | Evidencia |
| :--- | :--- | :--- | :--- | :--- |
| PM-DASH-13 | Simular respuesta vacía ([]) | EmptyState visible. KPIs muestran "--" o estado crítico. Sin skeleton infinito. | ____ | Screenshot |
| PM-DASH-14 | Simular cobertura insuficiente (3/30 días) | "Sin datos suficientes" o KPIs nulos. Comportamiento según código. | ____ | Screenshot |
| PM-DASH-15 | Simular error 500 | Error visible con opción reintento. NO queda en skeleton infinito (F-10). | ____ | Screenshot |

### F. Verificación Código/Infra (TC-TRANS-*)
| ID | Acción | Resultado Esperado | Estado (OK/NO/NA) | Evidencia |
| :--- | :--- | :--- | :--- | :--- |
| PM-INF-01 | Revisar `apps/client/vitest.config.mts` | Confirmar entorno `node` sin `jsdom`. (Bloqueo F-17) | ____ | Archivo |
| PM-INF-02 | Revisar `apps/client/tests/e2e/chartAlignment.spec.ts` | Verificar `expect(true).toBe(true)` (falso verde F-17). | ____ | Archivo |
| PM-INF-03 | Buscar `playwright.config.*` | No existe. Crear si se ejecuta E2E. (F-17) | ____ | Búsqueda |
| PM-INF-04 | Revisar `SidebarContext.tsx` | Confirma fetch a `getAlertsData`/`getDashboardData` (posible duplicado). | ____ | Archivo |
| PM-INF-05 | Revisar `DashboardEvolutionSection.tsx` | `milestones` recibido pero no usado (F-07). | ____ | Archivo |

---

## Checklist de Validación Rápida
- [ ] Dashboard carga con mocks sin errores
- [ ] KPIs/frescura coherentes con baseline
- [ ] Gráfico renderiza puntos
- [ ] Pipeline embebido visible
- [ ] Export funciona (baja severidad)
- [ ] Errores/vacío manejados con interceptación (o documentados)
- [ ] Hallazgos críticos documentados (F-04,F-07,F-09,F-10)
- [ ] Infra issues registrados (F-17)

---

## Notas
- **Mock-first:** Si `NEXT_PUBLIC_API_URL` está definido y apunta a API vacía, los servicios pueden fallar - usar mocks o dejar vacío.
- **Tags:** Marcar hallazgos con `[AMBIGÜEDAD]`, `[INCONSISTENCIA]`, `[SIN COBERTURA]` según corresponda.
- **Trazabilidad:** Relacionar con `docs/03-qa/06-QA-Test-Matrix.md` v1.1.
- **Sin modificar código:** Solo observación y documentación.
