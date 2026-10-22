# Plan de Arquitectura: 002-chart-grid-alignment

**Módulo:** Dashboard / Gráfico y Franja Semafórica
**Ámbito:** `apps/client`

---

## 1. Arquitectura de Módulos (Clean Architecture & SoC)

### Estructura de Archivos a Crear y Refactorizar:

```text
apps/client/
├── specs/002-chart-grid-alignment/
│   ├── spec.md
│   ├── plan.md
│   └── tasks.md
├── src/
│   ├── hooks/
│   │   └── useDashboardData.ts          # Custom Hook coordinador
│   ├── lib/
│   │   ├── dashboard/
│   │   │   ├── types.ts                 # Interfaces de datos del dashboard
│   │   │   ├── formatters.ts            # Formateadores numéricos y de fechas
│   │   │   ├── chartSeries.ts           # Mapeo de series (1 punto por día real)
│   │   │   ├── chartReferenceAreas.ts   # Construcción de recuadros de anomalías
│   │   │   ├── trackerQuality.ts        # Colores y bloques de franja semafórica
│   │   │   ├── storesAudit.ts           # Métricas y auditoría de tiendas
│   │   │   ├── exportCsv.ts             # Exportación pura de datos a CSV
│   │   │   └── index.ts                 # Barrel export unificado
│   │   └── dashboardUtils.ts            # Re-exportador para compatibilidad total
│   └── components/
│       ├── charts/
│       │   ├── line-chart.tsx           # Geometría SVG corregida (recuadros + medio espacio)
│       │   └── tracker.tsx              # Componente de franja semafórica
│       └── dashboard/
│           └── DashboardEvolutionSection.tsx # Alineación de padding Tracker vs LineChart
└── tests/
    ├── unit/
    │   └── dashboardChart.test.ts       # Pruebas unitarias de series y recuadros
    └── e2e/
        └── chartAlignment.spec.ts       # Prueba visual/E2E con Playwright
```

---

## 2. Decisiones Técnicas y Matemáticas

1. **Eliminación de Puntos Sintéticos:**
   - La función `buildEvolutionChartData` mapeará `series` directamente a filas de Recharts con un único `fechaLabel` por fecha.
   - Ya no se generarán filas con `:start` ni `:end`, restaurando la equidistancia natural en el eje ordinal.

2. **Geometría de Recuadros en `LineChart` SVG:**
   - En el callback `shape` de `ReferenceArea`, Recharts proporciona `x`, `y`, `width` y `height`.
   - Cuando `x1 === x2` (un solo día con anomalía), Recharts calcula `width = 0` o el ancho exacto del tick.
   - Para cubrir el ancho del día completo más medio espacio hacia cada lado:
     - Determinamos el ancho de paso estimado o ancho de banda del día $W$.
     - Expandimos la coordenada horizontal: `actualX = x - W / 2` y `actualWidth = width + W`.
     - De esta forma, el recuadro inicia a mitad de camino del día anterior y finaliza a mitad de camino del día posterior, sin crear puntos intermedios en el dataset.

3. **Alineación de la Franja Semafórica (`Tracker`):**
   - En `DashboardEvolutionSection`, el `LineChart` tiene `yAxisWidth={84}` y `margin={{ left: 12, right: 12 }}`.
   - El área útil del trazado comienza en `84 + 12 = 96px` desde el borde izquierdo del componente.
   - Envolvemos `<Tracker />` con un contenedor estilizado con `pl-[96px] pr-[12px]` para que el primer bloque empiece exactamente alineado con el primer día del gráfico.

4. **Estrategia de Tests (TDD):**
   - Escribir primero `dashboardChart.test.ts` probando que `buildEvolutionChartData` devuelva exactamente la misma cantidad de filas que días reales en la serie y que `buildChartReferenceAreas` retorne los identificadores limpios sin sufijos `:start` o `:end`.
   - Crear prueba en Playwright para validar la presencia de los rectángulos del SVG y su posicionamiento relativo.
