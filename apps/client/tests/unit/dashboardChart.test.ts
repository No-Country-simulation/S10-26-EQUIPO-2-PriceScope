import { describe, expect, it } from "vitest";
import {
  buildChartReferenceAreas,
  buildDailyQualityTrackerData,
  buildEvolutionChartData,
  STATUS_COLORS,
} from "@/lib/dashboard";
import { getDashboardData } from "@/services/dashboard.service";
import type { PuntoSerie } from "@/types/api";

describe("buildEvolutionChartData - Sin puntos sintéticos en el eje X", () => {
  const mockSeries: PuntoSerie[] = [
    {
      timestamp_utc: "2026-10-15T00:00:00Z",
      precio_regular: 10000,
      precio_promocional: null,
      precio_usd: 10.0,
      cotizacion_aplicada: 1000,
      cotizacion_aproximada: false,
      estado_dato: "DATO_VALIDO",
      motivo: null,
    },
    {
      timestamp_utc: "2026-10-16T00:00:00Z",
      precio_regular: 10500,
      precio_promocional: 9800,
      precio_usd: 10.5,
      cotizacion_aplicada: 1000,
      cotizacion_aproximada: false,
      estado_dato: "DATO_VALIDO",
      motivo: null,
    },
    {
      timestamp_utc: "2026-10-17T00:00:00Z",
      precio_regular: null,
      precio_promocional: null,
      precio_usd: null,
      cotizacion_aplicada: 1000,
      cotizacion_aproximada: false,
      estado_dato: "AGOTADO",
      motivo: "Quiebre de stock",
    },
  ];

  it("debe contener exactamente la misma cantidad de filas que la serie original", () => {
    const chartData = buildEvolutionChartData(mockSeries, "ARS");
    expect(chartData).toHaveLength(mockSeries.length);
  });

  it("no debe contener etiquetas con sufijos ':start', ':end' ni flags de isBoundary", () => {
    const chartData = buildEvolutionChartData(mockSeries, "ARS");
    const syntheticPoints = chartData.filter(
      (row) =>
        row.fechaLabel.endsWith(":start") ||
        row.fechaLabel.endsWith(":end") ||
        Boolean(row.isBoundary)
    );
    expect(syntheticPoints).toHaveLength(0);
  });

  it("debe devolver un array vacío cuando la serie no contiene registros (estado sin datos)", () => {
    const chartData = buildEvolutionChartData([], "ARS");
    expect(chartData).toEqual([]);
  });
});

describe("buildChartReferenceAreas - Coordenadas exactas y áreas de anomalía", () => {
  const seriesWithAnomalies: PuntoSerie[] = [
    {
      timestamp_utc: "2026-10-13T00:00:00Z",
      precio_regular: 10000,
      precio_promocional: null,
      precio_usd: 10.0,
      cotizacion_aplicada: 1000,
      cotizacion_aproximada: false,
      estado_dato: "DATO_VALIDO",
      motivo: null,
    },
    {
      timestamp_utc: "2026-10-14T00:00:00Z",
      precio_regular: null,
      precio_promocional: null,
      precio_usd: null,
      cotizacion_aplicada: 1000,
      cotizacion_aproximada: false,
      estado_dato: "AGOTADO",
      motivo: "Agotado temporal",
    },
    {
      timestamp_utc: "2026-10-15T00:00:00Z",
      precio_regular: 10200,
      precio_promocional: null,
      precio_usd: 10.2,
      cotizacion_aplicada: 1000,
      cotizacion_aproximada: false,
      estado_dato: "DATO_VALIDO",
      motivo: null,
    },
  ];

  it("debe usar etiquetas cortas de fecha reales como x1 y x2 sin sufijos :start ni :end", () => {
    const areas = buildChartReferenceAreas(seriesWithAnomalies, []);
    expect(areas).toHaveLength(1);
    expect(areas[0].x1).toBe("14/10");
    expect(areas[0].x2).toBe("14/10");
    expect(areas[0].x1).not.toContain(":start");
    expect(areas[0].x2).not.toContain(":end");
  });

  it("debe asignar startIndex, endIndex y totalPoints correspondientes a los bloques de la serie", () => {
    const areas = buildChartReferenceAreas(seriesWithAnomalies, []);
    expect(areas).toHaveLength(1);
    expect(areas[0].startIndex).toBe(1);
    expect(areas[0].endIndex).toBe(1);
    expect(areas[0].totalPoints).toBe(3);
    expect(areas[0].strokeColor).toBe(STATUS_COLORS.AGOTADO.stroke);
  });

  it("debe representar recuadro amarillo/ámbar de advertencia cambiaria para fallback TTL (<72h)", () => {
    const seriesWithTtl: PuntoSerie[] = [
      {
        timestamp_utc: "2026-10-17T00:00:00Z",
        precio_regular: 10000,
        precio_promocional: null,
        precio_usd: 10.0,
        cotizacion_aplicada: 1000,
        cotizacion_aproximada: true,
        estado_dato: "DATO_VALIDO",
        motivo: "Fallback cambiario fin de semana (TTL < 48h)",
      },
      {
        timestamp_utc: "2026-10-18T00:00:00Z",
        precio_regular: 10000,
        precio_promocional: null,
        precio_usd: 10.0,
        cotizacion_aplicada: 1000,
        cotizacion_aproximada: true,
        estado_dato: "DATO_VALIDO",
        motivo: "Fallback cambiario fin de semana (TTL < 48h)",
      },
    ];

    const areas = buildChartReferenceAreas(seriesWithTtl, []);
    expect(areas).toHaveLength(1);
    expect(areas[0].label).toBe(STATUS_COLORS.TTL.label);
    expect(areas[0].strokeColor).toBe("#f59e0b");
    expect(areas[0].fillColor).toBe("#fef3c7");
    expect(areas[0].startIndex).toBe(0);
    expect(areas[0].endIndex).toBe(1);
  });

  it("debe representar áreas de referencia incluso cuando se muestre solo 1 día en la gráfica", () => {
    const singleDaySeries: PuntoSerie[] = [
      {
        timestamp_utc: "2026-10-27T00:00:00Z",
        precio_regular: null,
        precio_promocional: null,
        precio_usd: null,
        cotizacion_aplicada: 1200,
        cotizacion_aproximada: false,
        estado_dato: "ERROR_CAPTURA",
        motivo: "Falla de conectividad en origen",
      },
    ];

    const areas = buildChartReferenceAreas(singleDaySeries, []);
    expect(areas).toHaveLength(1);
    expect(areas[0].x1).toBe("27/10");
    expect(areas[0].x2).toBe("27/10");
    expect(areas[0].startIndex).toBe(0);
    expect(areas[0].endIndex).toBe(0);
    expect(areas[0].totalPoints).toBe(1);
    expect(areas[0].label).toBe("Falla");
  });

  it("debe representar recuadro gris punteado - - - para cortes sin cotización (SIN_DATO)", () => {
    const seriesSinDato: PuntoSerie[] = [
      {
        timestamp_utc: "2026-09-29T00:00:00Z",
        precio_regular: null,
        precio_promocional: null,
        precio_usd: null,
        cotizacion_aplicada: null,
        cotizacion_aproximada: false,
        estado_dato: "SIN_DATO",
        motivo: "Sin cotización (>72h límite TTL superado)",
      },
    ];

    const areas = buildChartReferenceAreas(seriesSinDato, []);
    expect(areas).toHaveLength(1);
    expect(areas[0].label).toBe("Sin cotización");
    expect(areas[0].strokeColor).toBe(STATUS_COLORS.SIN_DATO.stroke);
    expect(areas[0].fillColor).toBe(STATUS_COLORS.SIN_DATO.fill);
  });

  it("debe retornar array vacío cuando la serie no contiene registros", () => {
    const areas = buildChartReferenceAreas([], []);
    expect(areas).toEqual([]);
  });

  it("debe asignar colores diferenciados en la barra semafórica (Gris para SIN_DATO, Naranja para AGOTADO, Ámbar para TTL)", () => {
    const testSeries: PuntoSerie[] = [
      {
        timestamp_utc: "2026-09-29T00:00:00Z",
        precio_regular: null,
        precio_promocional: null,
        precio_usd: null,
        cotizacion_aplicada: null,
        cotizacion_aproximada: false,
        estado_dato: "SIN_DATO",
        motivo: "Sin cotización (>72h límite TTL superado)",
      },
      {
        timestamp_utc: "2026-10-03T00:00:00Z",
        precio_regular: 10000,
        precio_promocional: null,
        precio_usd: 10.0,
        cotizacion_aplicada: 1000,
        cotizacion_aproximada: true,
        estado_dato: "DATO_VALIDO",
        motivo: "Fallback cambiario fin de semana (TTL < 48h)",
      },
      {
        timestamp_utc: "2026-10-07T00:00:00Z",
        precio_regular: null,
        precio_promocional: null,
        precio_usd: null,
        cotizacion_aplicada: 1000,
        cotizacion_aproximada: false,
        estado_dato: "AGOTADO",
        motivo: "Quiebre de stock en tienda",
      },
    ];

    const trackerBlocks = buildDailyQualityTrackerData(
      [
        { fecha: "2026-09-29", estado: "AMARILLO" },
        { fecha: "2026-10-03", estado: "AMARILLO" },
        { fecha: "2026-10-07", estado: "AMARILLO" },
      ],
      testSeries
    );

    expect(trackerBlocks[0].color).toBe(STATUS_COLORS.SIN_DATO.tailwindBg); // bg-slate-400 (Gris)
    expect(trackerBlocks[1].color).toBe(STATUS_COLORS.TTL.tailwindBg); // bg-amber-400 (Amarillo/Ámbar)
    expect(trackerBlocks[2].color).toBe(STATUS_COLORS.AGOTADO.tailwindBg); // bg-orange-600 (Naranja)
  });
});

describe("getDashboardData - Downsampling RN-07 y respuesta sin datos", () => {
  it("mantiene resolución diaria fina cuando el rango es menor o igual a 90 días (30D)", async () => {
    const response = await getDashboardData({
      fecha_desde: "2026-09-28",
      fecha_hasta: "2026-10-27",
    });
    expect(response.grafico_evolucion.metadata.downsampling_aplicado).toBe(false);
    expect(response.grafico_evolucion.metadata.intervalo_agrupacion).toBe("1d");
    expect(response.grafico_evolucion.series).toHaveLength(30);
  });

  it("aplica downsampling semanal consolidado por mediana para consultas superiores a 90 días (1A / 365 días)", async () => {
    const response = await getDashboardData({
      fecha_desde: "2025-10-28",
      fecha_hasta: "2026-10-27",
    });
    expect(response.grafico_evolucion.metadata.downsampling_aplicado).toBe(true);
    expect(response.grafico_evolucion.metadata.intervalo_agrupacion).toBe("1w");
    // 365 días agrupados por semanas lunes-domingo consolidan 53 puntos semanales (~52 anuales)
    expect(response.grafico_evolucion.series.length).toBeLessThanOrEqual(53);
    expect(response.grafico_evolucion.series.length).toBeGreaterThanOrEqual(51);
  });

  it("retorna series vacías y KPIs neutralizados cuando la fecha consultada no tiene datos en DB", async () => {
    const response = await getDashboardData({
      fecha_desde: "2026-10-28",
      fecha_hasta: "2026-10-29",
    });
    expect(response.grafico_evolucion.series).toHaveLength(0);
    expect(response.grafico_evolucion.banda_calidad_diaria).toHaveLength(0);
    expect(response.kpis.variacion_pesos.porcentaje).toBe(0);
    expect(response.kpis.variacion_pesos.estado).toBe("SIN_DATOS_SUFICIENTES");
    expect(response.kpis.variacion_pesos.cobertura_pct).toBe(0);
  });
});
