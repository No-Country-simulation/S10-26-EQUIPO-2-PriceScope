# Especificación: 002-chart-grid-alignment

**Módulo:** Dashboard / Gráfico de Evolución Temporal y Franja Semafórica
**Ámbito:** `apps/client`

---

## 1. Contexto y Objetivos

El gráfico de evolución temporal (`LineChart`) y la franja semafórica de calidad (`Tracker`) presentan desajustes de alineación y espaciado debido a la inserción de puntos sintéticos de frontera en el dataset ordinal y a la falta de sincronización del margen horizontal con el eje Y.

Objetivos:

1. Eliminar puntos sintéticos intermedios en el dataset (`chartData`) para mantener una distancia uniforme 1:1 entre todos los días del gráfico.
2. Ajustar la geometría de los recuadros de estado (`ReferenceArea`) para que abarquen exactamente el ancho del día más medio paso adicional a cada extremo ($\pm W/2$), calculándolo en el renderizado SVG sin alterar los datos.
3. Sincronizar horizontalmente la franja semafórica (`Tracker`) para que su inicio y fin coincidan al 100% con el eje de días de la gráfica.
4. Desacoplar y modularizar `src/lib/dashboardUtils.ts` en submódulos especializados dentro de `src/lib/dashboard/` y extraer `useDashboardData` a `src/hooks/`.
5. Asegurar cobertura mediante pruebas unitarias (Vitest) y pruebas visuales/E2E (Playwright).

---

## 2. Requerimientos en Notación EARS

### RF-01: Generación de Datos Limpia sin Puntos Sintéticos

- **EL SISTEMA** debe generar `DashboardChartRow[]` conteniendo exactamente un punto por cada registro diario de la serie recibida de la API, sin insertar puntos artificiales (`:start`, `:end` o `isBoundary: true`).
- **CUANDO** existan anomalías en `Canasta Retail` (quiebre de stock, error de captura o sin cotización), **EL SISTEMA** debe asignar valor `null` en dicho punto para permitir el corte físico en Modo Estricto o la interpolación en Modo Continuo sin alterar el espaciado ordinal del eje X.

### RF-02: Geometría de los Recuadros de Referencia (ReferenceArea)

- **CUANDO** se detecte una anomalía o evento en un día $D_i$ (o rango continuo de días $D_{start} \dots D_{end}$), **EL SISTEMA** debe configurar una `ChartReferenceArea` con `x1 = fechaLabel(D_{start})` y `x2 = fechaLabel(D_{end})`.
- **DURANTE** el renderizado en SVG (`shape` de `ReferenceArea`), **EL SISTEMA** debe calcular el ancho del recuadro expandiéndolo medio paso a la izquierda y medio paso a la derecha ($\text{actualX} = x - \text{paso}/2$, $\text{actualWidth} = \text{width} + \text{paso}$), cubriendo el día completo y la mitad del espacio adyacente sin colisionar con los centros de los puntos vecinos.

### RF-03: Sincronización Horizontal 1:1 de la Franja Semafórica

- **MIENTRAS** la franja semafórica (`Tracker`) esté montada debajo del `LineChart`, **EL SISTEMA** debe alinear su cuadrícula de bloques con el área de trazado útil del gráfico aplicando un contenedor con margen/relleno izquierdo equivalente a `yAxisWidth + chartMarginLeft` (96px) y derecho equivalente a `chartMarginRight` (12px).
- **CUANDO** el usuario compare visualmente la vertical de un día en la tabla/gráfico y en la franja, **EL SISTEMA** debe garantizar coincidencia vertical exacta sin desfases.

### RF-04: Modularización de dashboardUtils (Clean Code)

- **EL SISTEMA** debe dividir `lib/dashboardUtils.ts` en módulos concisos de responsabilidad única dentro de `src/lib/dashboard/`:
  - `types.ts`: Tipos y modelos del dashboard.
  - `formatters.ts`: Formateo de fechas y monedas con `tabular-nums`.
  - `chartSeries.ts`: Transformación limpia de series a filas para Recharts.
  - `chartReferenceAreas.ts`: Agrupación de anomalías y configuración de recuadros.
  - `trackerQuality.ts`: Mapeo de bloques semafóricos y paleta de colores.
  - `storesAudit.ts`: Mapeo y auditoría de tiendas piloto.
  - `exportCsv.ts`: Lógica pura de exportación CSV.
  - `index.ts`: Barrel export que preserva compatibilidad con todos los componentes.
  - `src/hooks/useDashboardData.ts`: Custom hook coordinador desacoplado de la lógica matemática.

---

## 3. Criterios de Aceptación (Condición de Hecho)

- [ ] `npm run check-all` pasa con 0 errores y 0 advertencias en ESLint, Prettier y CSpell.
- [ ] Todos los tests unitarios de `chartSeries` y `chartReferenceAreas` pasan en verde.
- [ ] Pruebas visuales/E2E con Playwright validan la alineación de coordenadas y la estructura del SVG.
- [ ] No existen archivos creados o modificados fuera de `apps/client`.
