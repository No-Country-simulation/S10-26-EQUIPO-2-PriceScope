import type { Moneda, PuntoSerie } from "@/types/api";
import { formatShortDateLabel } from "./formatters";
import type { DashboardChartRow } from "./types";

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

    const mainValue =
      pt.precio_regular === null
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
