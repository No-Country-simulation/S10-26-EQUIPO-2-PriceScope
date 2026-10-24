import type { AlertaItem } from "@/types/api";
import { downloadFile, escapeCsvField } from "@/lib/csvUtils";

export { escapeCsvField };

/**
 * Builds RFC 4180 compliant CSV string from alerts list.
 */
export function buildAlertsCsv(alerts: AlertaItem[]): string {
  const headers = [
    "alerta_id",
    "producto_canonico_id",
    "producto_nombre",
    "tienda_nombre",
    "periodo_inicio_utc",
    "periodo_fin_utc",
    "variacion_precio_pct",
    "variacion_cotizacion_pct",
    "diferencial_puntos",
    "cotizacion_usada_cierre",
    "cobertura_pct",
    "regla_faltantes",
    "tipo_alerta",
  ];

  const rows = alerts.map((alert) =>
    [
      escapeCsvField(alert.alerta_id),
      escapeCsvField(alert.producto_canonico_id),
      escapeCsvField(alert.producto_nombre),
      escapeCsvField(alert.tienda_nombre),
      escapeCsvField(alert.periodo.inicio_utc),
      escapeCsvField(alert.periodo.fin_utc),
      escapeCsvField(alert.variacion_precio_pct),
      escapeCsvField(alert.variacion_cotizacion_pct),
      escapeCsvField(alert.diferencial_puntos),
      escapeCsvField(alert.cotizacion_usada_cierre),
      escapeCsvField(alert.cobertura_pct),
      escapeCsvField(alert.regla_faltantes),
      escapeCsvField(alert.tipo_alerta),
    ].join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}

/**
 * Triggers CSV file download in the browser for given alerts list.
 */
export function exportAlertsCsv(
  alerts: AlertaItem[],
  filename: string = "alertas-divergencia-pricescope.csv"
): void {
  const csvContent = buildAlertsCsv(alerts);
  downloadFile(csvContent, filename);
}

/**
 * Triggers JSON file download in the browser for given alerts list.
 */
export function exportAlertsJson(
  alerts: AlertaItem[],
  filename: string = "alertas-divergencia-pricescope.json"
): void {
  const jsonContent = JSON.stringify(alerts, null, 2);
  downloadFile(jsonContent, filename, "application/json;charset=utf-8;");
}
