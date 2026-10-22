# Tareas de Implementación: 002-chart-grid-alignment

**Módulo:** Dashboard / Gráfico y Franja Semafórica
**Ámbito:** `apps/client`

---

## Desglose Atómico de Tareas (TDD Estricto)

- [x] **T1: Modularización de dashboardUtils en submódulos especializados**
  - Crear carpeta `src/lib/dashboard/` con `types.ts`, `formatters.ts`, `chartSeries.ts`, `chartReferenceAreas.ts`, `trackerQuality.ts`, `storesAudit.ts`, `exportCsv.ts` y `index.ts`.
  - Extraer `useDashboardData` a `src/hooks/useDashboardData.ts`.
  - Mantener `src/lib/dashboardUtils.ts` como re-exportador retrocompatible.
  - _Hecho cuando:_ Todos los archivos existan en `src/lib/dashboard/` y `npx tsc --noEmit` pase sin errores.

- [x] **T2: TDD - Pruebas unitarias para series limpias y reference areas**
  - Crear `tests/unit/dashboardChart.test.ts` con casos de prueba para `buildEvolutionChartData` y `buildChartReferenceAreas`.
  - Probar que no existan puntos sintéticos `:start` o `:end` y que `chartData.length === series.length`.
  - Probar que los identificadores y rangos de las áreas de referencia coincidan con las fechas reales de inicio y fin.
  - _Hecho cuando:_ El test unitario esté escrito y falle en rojo debido a la lógica actual con puntos sintéticos.

- [x] **T3: Refactor de chartSeries y chartReferenceAreas (Puntos 1:1 sin duplicación)**
  - Eliminar la inserción de puntos sintéticos de frontera en `chartSeries.ts`.
  - Actualizar `chartReferenceAreas.ts` para usar directamente las etiquetas cortas de fecha reales (`x1 = startLabel`, `x2 = endLabel`).
  - _Hecho cuando:_ Los tests unitarios de T2 pasen en verde al 100%.

- [x] **T4: Ajuste geométrico de recuadros en LineChart (ancho del día + mitad de espacio)**
  - Modificar el renderizador `shape` de `ReferenceArea` en `src/components/charts/line-chart.tsx`.
  - Implementar la expansión horizontal $\pm W/2$ por día de anomalía para cubrir el ancho del día y la mitad de la separación adyacente a cada extremo sin desalinear la escala ordinal.
  - _Hecho cuando:_ La propiedad `shape` dibuje el rectángulo expandido según las coordenadas del eje X sin provocar distorsiones.

- [x] **T5: Sincronización y alineación 100% de la Franja Semafórica (Tracker)**
  - Ajustar el contenedor de `<Tracker />` en `src/components/dashboard/DashboardEvolutionSection.tsx` con `pl-[96px] pr-[12px]` correspondiente al eje Y y márgenes del gráfico.
  - Ajustar el espaciado interno para que cada bloque coincida exactamente con la vertical de su día en el gráfico.
  - _Hecho cuando:_ El inicio de la barra semafórica coincida verticalmente con el inicio del trazado de datos del gráfico.

- [x] **T6: Pruebas visuales y de integración con Playwright**
  - Crear prueba E2E/visual `tests/e2e/chartAlignment.spec.ts` que monte la página principal, verifique la presencia del SVG de Recharts, las áreas de referencia y la alineación horizontal del Tracker.
  - _Hecho cuando:_ La suite de Playwright ejecute y valide la geometría de los componentes.

- [x] **T7: Suite de Calidad Completa y Auditoría Final**
  - Ejecutar `npm run check-all` (ESLint, Prettier, CSpell).
  - Validar que no existan advertencias ni errores (`0 errores, 0 advertencias`).
  - Auditar con `sdd-reviewer` para emitir el veredicto formal.
  - _Hecho cuando:_ `check-all` esté completamente limpio y el revisor emita `VEREDICTO: APROBADO`.
