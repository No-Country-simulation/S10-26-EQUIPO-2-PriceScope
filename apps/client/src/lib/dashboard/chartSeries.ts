import type { BandaCalidad, Moneda, PuntoSerie } from "@/types/api";
import { formatShortDateLabel } from "./formatters";
import type { DashboardChartRow } from "./types";

export interface AlignedDashboardData {
  alignedSeries: PuntoSerie[];
  alignedBanda: BandaCalidad[];
}

function formatYmd(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseYmdToUtcDate(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

function getMonday(d: Date): Date {
  const date = new Date(d);
  date.setUTCHours(0, 0, 0, 0);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diff);
  return date;
}

/**
 * Alinea el calendario visual del frontend con el rango de fechas solicitado por el usuario.
 * Soporta modo diario continuo (1d) y modo downsampling semanal (1w, RN-07 / HU-47).
 * La API solo procesa y entrega sus 4 estados canónicos de datos y 3 de semáforo (VERDE, AMARILLO, ROJO).
 * Es el frontend el que identifica los días/semanas faltantes en la ventana de análisis para proyectar
 * el recuadro gris (SIN_DATO) y la franja gris en el tracker sin alterar los contratos del backend.
 */
export function alignDashboardCalendar(
  series: PuntoSerie[],
  bandaCalidad: BandaCalidad[] = [],
  dateRange?: { from?: Date; to?: Date },
  isWeekly: boolean = false
): AlignedDashboardData {
  const seriesByDate = new Map<string, PuntoSerie>();
  for (const pt of series) {
    seriesByDate.set(pt.timestamp_utc.slice(0, 10), pt);
  }

  const bandaByDate = new Map<string, BandaCalidad>();
  for (const b of bandaCalidad) {
    bandaByDate.set(b.fecha, b);
  }

  const dateList: string[] = [];
  if (dateRange?.from && dateRange?.to) {
    const fromStr = formatYmd(dateRange.from);
    const toStr = formatYmd(dateRange.to);

    if (isWeekly) {
      const cur = getMonday(parseYmdToUtcDate(fromStr));
      const end = parseYmdToUtcDate(toStr);

      while (cur <= end) {
        dateList.push(cur.toISOString().slice(0, 10));
        cur.setUTCDate(cur.getUTCDate() + 7);
      }
    } else {
      const cur = parseYmdToUtcDate(fromStr);
      const end = parseYmdToUtcDate(toStr);

      while (cur <= end) {
        dateList.push(cur.toISOString().slice(0, 10));
        cur.setUTCDate(cur.getUTCDate() + 1);
      }
    }
  } else if (bandaCalidad.length > 0) {
    for (const b of bandaCalidad) {
      dateList.push(b.fecha);
    }
  } else {
    for (const s of series) {
      dateList.push(s.timestamp_utc.slice(0, 10));
    }
  }

  const alignedSeries: PuntoSerie[] = [];
  const alignedBanda: BandaCalidad[] = [];

  for (const fecha of dateList) {
    const existingSeries = seriesByDate.get(fecha);
    const existingBanda = bandaByDate.get(fecha);

    if (existingSeries) {
      alignedSeries.push(existingSeries);
    } else {
      alignedSeries.push({
        timestamp_utc: `${fecha}T00:00:00.000Z`,
        precio_regular: null,
        precio_promocional: null,
        precio_usd: null,
        cotizacion_aplicada: null,
        cotizacion_aproximada: false,
        estado_dato: "SIN_DATO",
        motivo: "Sin cotización",
      });
    }

    if (existingBanda) {
      alignedBanda.push(existingBanda);
    } else {
      alignedBanda.push({
        fecha,
        estado: "GRIS",
        porcentaje_completitud: 0,
      });
    }
  }

  return { alignedSeries, alignedBanda };
}

/**
 * Wrapper de compatibilidad que alinea la serie temporal.
 */
export function alignSeriesWithQualityBand(
  series: PuntoSerie[],
  bandaCalidad: BandaCalidad[] = [],
  dateRange?: { from?: Date; to?: Date },
  isWeekly: boolean = false
): PuntoSerie[] {
  return alignDashboardCalendar(series, bandaCalidad, dateRange, isWeekly).alignedSeries;
}

/**
 * Transforma la serie temporal del Dashboard al formato consumido por LineChart de Tremor,
 * preservando valores nulos para soportar Modo Estricto y Modo Continuo (LOCF).
 * Garantiza correspondencia 1:1 entre los datos del backend y las filas del gráfico.
 */
export function buildEvolutionChartData(
  series: PuntoSerie[],
  currency: Moneda
): DashboardChartRow[] {
  const firstValid = series.find(
    (pt) => pt.precio_regular !== null && pt.cotizacion_aplicada !== null
  );
  const basePriceArs = firstValid?.precio_regular ?? 9600;
  const baseRate = firstValid?.cotizacion_aplicada ?? 1000;
  let lastKnownRate = baseRate;

  return series.map((pt) => {
    if (pt.cotizacion_aplicada !== null) {
      lastKnownRate = pt.cotizacion_aplicada;
    }

    const isUsdMode = currency !== "ARS";
    const officialAdjust = currency === "USD_OFICIAL" ? 0.78 : 1;

    const isMissingData =
      pt.precio_regular === null ||
      pt.estado_dato === "SIN_DATO" ||
      pt.estado_dato === "AGOTADO" ||
      pt.estado_dato === "ERROR_CAPTURA";

    const mainValue =
      isMissingData
        ? null
        : isUsdMode
          ? Number(((pt.precio_usd ?? 0) / officialAdjust).toFixed(2))
          : pt.precio_regular;

    const benchmarkValue = isUsdMode
      ? Number((basePriceArs / baseRate / officialAdjust).toFixed(2))
      : Math.round(basePriceArs * (lastKnownRate / baseRate));

    return {
      fechaLabel: formatShortDateLabel(pt.timestamp_utc),
      fechaIso: pt.timestamp_utc.slice(0, 10),
      "Canasta Retail": mainValue,
      "Dólar Blue (Ref. Cambiaria)": benchmarkValue,
      precioRegularArs: pt.precio_regular,
      precioPromocionalArs: pt.precio_promocional,
      precioUsd: pt.precio_usd,
      cotizacionAplicada: pt.cotizacion_aplicada,
      cotizacionAproximada: pt.cotizacion_aproximada,
      estadoDato: pt.estado_dato,
      motivo: pt.motivo ?? null,
    };
  });
}
