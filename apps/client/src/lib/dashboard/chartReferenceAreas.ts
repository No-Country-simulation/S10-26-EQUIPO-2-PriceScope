import type { ChartReferenceArea } from "@/components/charts/line-chart";
import type { HitoGrafico, PuntoSerie } from "@/types/api";
import { formatShortDateLabel } from "./formatters";
import { STATUS_COLORS } from "./trackerQuality";

/**
 * Genera dinámicamente las áreas de referencia (cuadros sobre la gráfica)
 * detectando anomalías (Agotado, Error de Captura, Sin Dato) y eventos (Reduflación).
 * Utiliza directamente las etiquetas de fecha reales (startLabel y endLabel) sin sufijos sintéticos.
 */
export function buildChartReferenceAreas(
  series: PuntoSerie[],
  hitos: HitoGrafico[] = []
): ChartReferenceArea[] {
  if (!series || series.length < 2) {
    return [];
  }

  const areas: ChartReferenceArea[] = [];
  const hitosDateSet = new Set(
    hitos
      .filter(
        (h) =>
          h.titulo.toLowerCase().includes("reduflación") ||
          h.descripcion.toLowerCase().includes("reduflación")
      )
      .map((h) => h.timestamp_utc.slice(0, 10))
  );

  let i = 0;
  while (i < series.length) {
    const pt = series[i];
    const dateStr = pt.timestamp_utc.slice(0, 10);
    const isReduflación =
      hitosDateSet.has(dateStr) ||
      (pt.motivo ? pt.motivo.toLowerCase().includes("reduflación") : false);

    let anomalyType: "AGOTADO" | "ERROR_CAPTURA" | "SIN_DATO" | "REDUFLACIÓN" | null = null;

    if (pt.estado_dato === "AGOTADO") {
      anomalyType = "AGOTADO";
    } else if (pt.estado_dato === "ERROR_CAPTURA") {
      anomalyType = "ERROR_CAPTURA";
    } else if (pt.estado_dato === "SIN_DATO") {
      anomalyType = "SIN_DATO";
    } else if (isReduflación) {
      anomalyType = "REDUFLACIÓN";
    }

    if (!anomalyType) {
      i++;
      continue;
    }

    const startIndex = i;
    while (i < series.length) {
      const nextPt = series[i];
      const nextDateStr = nextPt.timestamp_utc.slice(0, 10);
      const nextIsReduflación =
        hitosDateSet.has(nextDateStr) ||
        (nextPt.motivo ? nextPt.motivo.toLowerCase().includes("reduflación") : false);

      let nextType: "AGOTADO" | "ERROR_CAPTURA" | "SIN_DATO" | "REDUFLACIÓN" | null = null;
      if (nextPt.estado_dato === "AGOTADO") {
        nextType = "AGOTADO";
      } else if (nextPt.estado_dato === "ERROR_CAPTURA") {
        nextType = "ERROR_CAPTURA";
      } else if (nextPt.estado_dato === "SIN_DATO") {
        nextType = "SIN_DATO";
      } else if (nextIsReduflación) {
        nextType = "REDUFLACIÓN";
      }

      if (nextType === anomalyType) {
        i++;
      } else {
        break;
      }
    }
    const endIndex = i - 1;

    const startLabel = formatShortDateLabel(series[startIndex].timestamp_utc);
    const endLabel = formatShortDateLabel(series[endIndex].timestamp_utc);

    const x1 = startLabel;
    const x2 = endLabel;

    switch (anomalyType) {
      case "AGOTADO":
        areas.push({
          id: `agotado-${x1}-${x2}`,
          x1,
          x2,
          startIndex,
          endIndex,
          totalPoints: series.length,
          label: STATUS_COLORS.AGOTADO.label,
          strokeColor: STATUS_COLORS.AGOTADO.stroke,
          fillColor: STATUS_COLORS.AGOTADO.fill,
          fillOpacity: STATUS_COLORS.AGOTADO.fillOpacity,
          labelColor: STATUS_COLORS.AGOTADO.text,
        });
        break;
      case "ERROR_CAPTURA":
        areas.push({
          id: `error-${x1}-${x2}`,
          x1,
          x2,
          startIndex,
          endIndex,
          totalPoints: series.length,
          label: STATUS_COLORS.FALLA.label,
          strokeColor: STATUS_COLORS.FALLA.stroke,
          fillColor: STATUS_COLORS.FALLA.fill,
          fillOpacity: STATUS_COLORS.FALLA.fillOpacity,
          labelColor: STATUS_COLORS.FALLA.text,
        });
        break;
      case "SIN_DATO":
        areas.push({
          id: `sin-dato-${x1}-${x2}`,
          x1,
          x2,
          startIndex,
          endIndex,
          totalPoints: series.length,
          label: STATUS_COLORS.SIN_DATO.label,
          strokeColor: STATUS_COLORS.SIN_DATO.stroke,
          fillColor: STATUS_COLORS.SIN_DATO.fill,
          fillOpacity: STATUS_COLORS.SIN_DATO.fillOpacity,
          labelColor: STATUS_COLORS.SIN_DATO.text,
        });
        break;
      case "REDUFLACIÓN":
        areas.push({
          id: `reduflación-${x1}-${x2}`,
          x1,
          x2,
          startIndex,
          endIndex,
          totalPoints: series.length,
          label: STATUS_COLORS.REDUFLACION.label,
          strokeColor: STATUS_COLORS.REDUFLACION.stroke,
          fillColor: STATUS_COLORS.REDUFLACION.fill,
          fillOpacity: STATUS_COLORS.REDUFLACION.fillOpacity,
          labelColor: STATUS_COLORS.REDUFLACION.text,
        });
        break;
    }
  }

  return areas;
}
