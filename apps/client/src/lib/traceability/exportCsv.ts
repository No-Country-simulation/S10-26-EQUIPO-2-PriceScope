import type { ObservacionTrazabilidadItem } from "@/types/api";
import { downloadFile, escapeCsvField } from "@/lib/csvUtils";
import { formatTimestampToART } from "./formatters";
import { getStatusLabel } from "./status";

export { escapeCsvField };

export const CSV_OBSERVATION_HEADERS = [
  "Fecha y Hora (ART)",
  "Tienda",
  "SKU",
  "Alias en Góndola",
  "Precio Regular (ARS)",
  "Precio Promo (ARS)",
  "Precio Unitario",
  "Unidad",
  "Precio (USD)",
  "Estado Dato",
  "Cotización Aplicada",
  "Cotización Aproximada",
  "Fuente Cotización",
  "Motivo Faltante",
  "URL Origen",
] as const;

/**
 * Generates an RFC 4180 compliant CSV string from an array of traceability observations.
 */
export function generateTraceabilityCsv(observations: ObservacionTrazabilidadItem[]): string {
  const headerRow = CSV_OBSERVATION_HEADERS.map((h) => escapeCsvField(h)).join(",");

  const rows = observations.map((obs) => {
    const isApprox = obs.cotizacion_aproximada ? "SÍ" : "NO";
    const statusLabel = getStatusLabel(obs.estado_dato);
    const alias = obs.alias_producto ?? "";

    return [
      escapeCsvField(formatTimestampToART(obs.timestamp_utc)),
      escapeCsvField(obs.tienda_nombre),
      escapeCsvField(obs.sku_tienda),
      escapeCsvField(alias),
      escapeCsvField(
        obs.precio_regular !== null && obs.precio_regular !== undefined
          ? obs.precio_regular.toFixed(2)
          : ""
      ),
      escapeCsvField(
        obs.precio_promocional !== null && obs.precio_promocional !== undefined
          ? obs.precio_promocional.toFixed(2)
          : ""
      ),
      escapeCsvField(
        obs.precio_por_unidad !== null && obs.precio_por_unidad !== undefined
          ? obs.precio_por_unidad.toFixed(2)
          : ""
      ),
      escapeCsvField(obs.unidad_medida ?? ""),
      escapeCsvField(
        obs.precio_usd !== null && obs.precio_usd !== undefined ? obs.precio_usd.toFixed(2) : ""
      ),
      escapeCsvField(statusLabel),
      escapeCsvField(
        obs.cotizacion_aplicada !== null && obs.cotizacion_aplicada !== undefined
          ? obs.cotizacion_aplicada.toFixed(2)
          : ""
      ),
      escapeCsvField(isApprox),
      escapeCsvField(obs.fuente_cotizacion ?? "Blue"),
      escapeCsvField(obs.motivo_faltante ?? ""),
      escapeCsvField(obs.url_origen ?? ""),
    ].join(",");
  });

  return [headerRow, ...rows].join("\r\n");
}

/**
 * Alias de compatibilidad hacia atrás para downloadFile.
 */
export function downloadCsvFile(content: string, filename: string): void {
  downloadFile(content, filename);
}
