import { describe, expect, it } from "vitest";
import { buildChartReferenceAreas } from "../../src/lib/dashboard/chartReferenceAreas";
import { buildEvolutionChartData } from "../../src/lib/dashboard/chartSeries";
import type { PuntoSerie } from "../../src/types/api";

describe("buildEvolutionChartData - Series limpias 1:1 sin puntos sintéticos", () => {
  const sampleSeries: PuntoSerie[] = [
    {
      timestamp_utc: "2026-10-13T00:00:00Z",
      precio_regular: 10000,
      precio_promocional: 9500,
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
      motivo: "Sin stock reportado",
    },
    {
      timestamp_utc: "2026-10-15T00:00:00Z",
      precio_regular: 10500,
      precio_promocional: 9900,
      precio_usd: 10.5,
      cotizacion_aplicada: 1000,
      cotizacion_aproximada: false,
      estado_dato: "DATO_VALIDO",
      motivo: null,
    },
  ];

  it("debe preservar la correspondencia 1:1 donde chartData.length === series.length", () => {
    const chartData = buildEvolutionChartData(sampleSeries, "ARS");
    expect(chartData).toHaveLength(sampleSeries.length);
  });

  it("no debe generar puntos sintéticos de frontera con sufijos :start o :end ni isBoundary", () => {
    const chartData = buildEvolutionChartData(sampleSeries, "ARS");
    const syntheticPoints = chartData.filter(
      (row) =>
        row.fechaLabel.endsWith(":start") ||
        row.fechaLabel.endsWith(":end") ||
        Boolean(row.isBoundary)
    );
    expect(syntheticPoints).toHaveLength(0);
  });
});

describe("buildChartReferenceAreas - Coordenadas exactas en fechas reales", () => {
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
  });
});
