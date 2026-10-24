import type { PuntoSerie } from "@/types/api";
import { downloadFile } from "@/lib/csvUtils";

/**
 * Exporta la serie temporal activa del Dashboard a un archivo CSV para descarga.
 */
export function exportDashboardSeriesCsv(series: PuntoSerie[]): void {
  const headers = [
    "fecha_utc",
    "precio_regular_ars",
    "precio_promocional_ars",
    "precio_usd",
    "estado_dato",
    "cotizacion_aplicada",
    "cotizacion_aproximada",
    "motivo",
  ];
  const rows = series.map((pt) =>
    [
      pt.timestamp_utc,
      pt.precio_regular ?? "",
      pt.precio_promocional ?? "",
      pt.precio_usd ?? "",
      pt.estado_dato,
      pt.cotizacion_aplicada ?? "",
      pt.cotizacion_aproximada,
      pt.motivo ? `"${pt.motivo.replace(/"/g, '""')}"` : "",
    ].join(",")
  );
  const csvContent = [headers.join(","), ...rows].join("\n");
  downloadFile(csvContent, "pricescope-dashboard-series.csv");
}

/**
 * Alias de compatibilidad hacia atrás para exportDashboardCsv.
 */
export const exportDashboardCsv = exportDashboardSeriesCsv;

export interface StoreAuditExportData {
  name: string;
  tag: string;
  basketCost: string;
  monthlyVariation: string;
  usdDelta: string;
  availability: string;
  statusText: string;
}

/**
 * Exporta el reporte de auditoría de tiendas piloto a un archivo CSV.
 */
export function exportStoresAuditCsv(rows: StoreAuditExportData[], currency: string = "ARS"): void {
  const headers = [
    "tienda_nombre",
    "identificador",
    `costo_canasta_${currency.toLowerCase()}`,
    "variacion_mensual_pct",
    "diferencial_vs_divisa",
    "disponibilidad_pct",
    "estado_servicio",
  ];

  const csvRows = rows.map((r) =>
    [
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.tag.replace(/"/g, '""')}"`,
      `"${r.basketCost.replace(/"/g, '""')}"`,
      `"${r.monthlyVariation.replace(/"/g, '""')}"`,
      `"${r.usdDelta.replace(/"/g, '""')}"`,
      `"${r.availability.replace(/"/g, '""')}"`,
      `"${r.statusText.replace(/"/g, '""')}"`,
    ].join(",")
  );

  const csvContent = [headers.join(","), ...csvRows].join("\n");
  downloadFile(csvContent, `auditoria-tiendas-pricescope-${currency.toLowerCase()}.csv`);
}
