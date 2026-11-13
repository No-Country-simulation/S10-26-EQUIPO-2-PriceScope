import { describe, expect, it } from "vitest";
import { buildChartReferenceAreas } from "../../src/lib/dashboard/chartReferenceAreas";
import { alignSeriesWithQualityBand, buildEvolutionChartData } from "../../src/lib/dashboard/chartSeries";
import type { BandaCalidad, PuntoSerie } from "../../src/types/api";

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

describe("alignSeriesWithQualityBand y recuadros de datos faltantes (SIN_DATO)", () => {
  const bandaCalidad: BandaCalidad[] = [
    { fecha: "2026-10-13", estado: "VERDE", porcentaje_completitud: 100 },
    { fecha: "2026-10-14", estado: "GRIS", porcentaje_completitud: 0 },
    { fecha: "2026-10-15", estado: "VERDE", porcentaje_completitud: 100 },
  ];

  const seriesIncompleta: PuntoSerie[] = [
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

  it("debe alinear la serie insertando puntos SIN_DATO para sincronizar 1:1 con la banda de calidad", () => {
    const alineada = alignSeriesWithQualityBand(seriesIncompleta, bandaCalidad);
    expect(alineada).toHaveLength(3);
    expect(alineada[1].timestamp_utc.slice(0, 10)).toBe("2026-10-14");
    expect(alineada[1].estado_dato).toBe("SIN_DATO");
    expect(alineada[1].precio_regular).toBeNull();
  });

  it("debe anular Canasta Retail (mainValue: null) en buildEvolutionChartData para días sin dato", () => {
    const alineada = alignSeriesWithQualityBand(seriesIncompleta, bandaCalidad);
    const chartData = buildEvolutionChartData(alineada, "ARS");
    expect(chartData).toHaveLength(3);
    expect(chartData[0]["Canasta Retail"]).toBe(10000);
    expect(chartData[1]["Canasta Retail"]).toBeNull();
    expect(chartData[2]["Canasta Retail"]).toBe(10200);
  });

  it("debe generar un recuadro de referencia gris (SIN_DATO) con etiqueta Sin cotización", () => {
    const alineada = alignSeriesWithQualityBand(seriesIncompleta, bandaCalidad);
    const areas = buildChartReferenceAreas(alineada, []);
    expect(areas).toHaveLength(1);
    expect(areas[0].label).toBe("Sin cotización");
    expect(areas[0].fillColor).toBe("#f1f5f9");
    expect(areas[0].strokeColor).toBe("#94a3b8");
    expect(areas[0].startIndex).toBe(1);
    expect(areas[0].endIndex).toBe(1);
  });

  it("debe generar puntos semanales (isWeekly=true) bajo downsampling en rangos mayores a 90 días (RN-07)", () => {
    const dateRange180d = {
      from: new Date("2026-05-11T00:00:00Z"),
      to: new Date("2026-11-07T00:00:00Z"),
    };
    const alineadaSemanal = alignSeriesWithQualityBand(
      seriesIncompleta,
      bandaCalidad,
      dateRange180d,
      true
    );
    // 180 días son aproximadamente 26 semanas (no 180 días diarios)
    expect(alineadaSemanal.length).toBeGreaterThanOrEqual(25);
    expect(alineadaSemanal.length).toBeLessThanOrEqual(27);
  });

  it("debe generar exactamente 1 día cuando el rango seleccionado es de un solo día (sin off-by-one por timezone)", () => {
    const singleDayRange = {
      from: new Date(2026, 10, 7, 0, 0, 0),
      to: new Date(2026, 10, 7, 23, 59, 59, 999),
    };
    const alineada = alignSeriesWithQualityBand(
      seriesIncompleta,
      bandaCalidad,
      singleDayRange,
      false
    );
    expect(alineada).toHaveLength(1);
    expect(alineada[0].timestamp_utc.slice(0, 10)).toBe("2026-11-07");
  });
});
