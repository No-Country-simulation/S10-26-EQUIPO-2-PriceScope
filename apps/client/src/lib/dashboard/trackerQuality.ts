import type { TrackerBlockProps } from "@/components/charts/tracker";
import type { BandaCalidad, PuntoSerie } from "@/types/api";
import { formatShortDateLabel } from "./formatters";

/**
 * Paleta canónica homologada de estados y semáforos.
 * Sincroniza clases de Tailwind para el Tracker con códigos hex para ReferenceArea de Recharts.
 */
export const STATUS_COLORS = {
  VALIDO: {
    tailwindBg: "bg-emerald-500",
    stroke: "#10b981",
    fill: "#ecfdf5",
    fillOpacity: 0.35,
    text: "#059669",
    label: "Válido",
  },
  AGOTADO: {
    tailwindBg: "bg-orange-600",
    stroke: "#ea580c",
    fill: "#ffedd5",
    fillOpacity: 0.4,
    text: "#c2410c",
    label: "Agotado",
  },
  FALLA: {
    tailwindBg: "bg-rose-500",
    stroke: "#ef4444",
    fill: "#fee2e2",
    fillOpacity: 0.4,
    text: "#dc2626",
    label: "Falla",
  },
  REDUFLACION: {
    tailwindBg: "bg-purple-500",
    stroke: "#8b5cf6",
    fill: "#f3e8ff",
    fillOpacity: 0.4,
    text: "#7c3aed",
    label: "Reduflación",
  },
  TTL: {
    tailwindBg: "bg-amber-400",
    stroke: "#f59e0b",
    fill: "#fef3c7",
    fillOpacity: 0.45,
    text: "#b45309",
    label: "Fallback TTL (<72h)",
  },
  SIN_DATO: {
    tailwindBg: "bg-slate-400",
    stroke: "#94a3b8",
    fill: "#f1f5f9",
    fillOpacity: 0.4,
    text: "#475569",
    label: "Sin cotización",
  },
} as const;

/**
 * Construye los bloques de la franja semafórica diaria (Tracker de Tremor)
 * combinando banda_calidad_diaria con los hitos y motivos de la serie.
 */
export function buildDailyQualityTrackerData(
  bandaCalidad: BandaCalidad[],
  series: PuntoSerie[]
): TrackerBlockProps[] {
  const seriesByDate = new Map(series.map((item) => [item.timestamp_utc.slice(0, 10), item]));

  return bandaCalidad.map((day) => {
    const point = seriesByDate.get(day.fecha);
    const shortDate = formatShortDateLabel(day.fecha);
    const hasReduflación = point?.motivo?.toLowerCase().includes("reduflación") ?? false;
    const isSinDato = point?.estado_dato === "SIN_DATO" || day.estado === "GRIS" || day.porcentaje_completitud === 0;
    const isError = point?.estado_dato === "ERROR_CAPTURA" || day.estado === "ROJO";
    const isAgotado = point?.estado_dato === "AGOTADO";
    const isTtlFallback =
      !isSinDato &&
      (Boolean(point?.cotizacion_aproximada) ||
        (point?.motivo
          ? point.motivo.toLowerCase().includes("fallback") ||
            (point.motivo.toLowerCase().includes("ttl") &&
              !point.motivo.toLowerCase().includes("superado"))
          : false));

    if (hasReduflación) {
      return {
        key: day.fecha,
        color: STATUS_COLORS.REDUFLACION.tailwindBg,
        tooltip: `${shortDate} — ${point?.motivo ?? "Hito de Reduflación"}`,
      };
    }

    if (isSinDato) {
      return {
        key: day.fecha,
        color: STATUS_COLORS.SIN_DATO.tailwindBg,
        tooltip: `${shortDate} — ${point?.motivo ? `${point.motivo} (Sin dato)` : "Sin datos registrados"}`,
      };
    }

    if (isError) {
      return {
        key: day.fecha,
        color: STATUS_COLORS.FALLA.tailwindBg,
        tooltip: `${shortDate} — ${point?.motivo ?? "Error de captura"}`,
      };
    }

    if (isAgotado) {
      return {
        key: day.fecha,
        color: STATUS_COLORS.AGOTADO.tailwindBg,
        tooltip: `${shortDate} — Agotado (${point?.motivo ?? "Quiebre de stock"})`,
      };
    }

    if (isTtlFallback || day.estado === "AMARILLO") {
      return {
        key: day.fecha,
        color: STATUS_COLORS.TTL.tailwindBg,
        tooltip: `${shortDate} — ⚠️ Fallback TTL (<72h): ${point?.motivo ?? "Cotización aproximada o completitud parcial"}`,
      };
    }

    return {
      key: day.fecha,
      color: STATUS_COLORS.VALIDO.tailwindBg,
      tooltip: `${shortDate} — Captura íntegra (${
        point?.precio_regular ? `$${point.precio_regular.toLocaleString("es-AR")}` : "Dato válido"
      })`,
    };
  });
}
