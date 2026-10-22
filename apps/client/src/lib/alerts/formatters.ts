import type { AlertaItem } from "@/types/api";
import { classifySeverity, getSeverityBadgeVariant } from "./severity";
import type { AlertTableRowView } from "./types";

/**
 * Formats a signed percentage string, e.g. +25.0% or -3.2%.
 */
export function formatSignedPercentage(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * Formats signed differential points, e.g. +5.0 pts or -2.1 pts.
 */
export function formatSignedPoints(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)} pts`;
}

/**
 * Formats a currency value in Argentine Pesos (ARS), e.g. $1.200.
 */
export function formatCurrencyARS(value: number): string {
  return `$${Math.round(value).toLocaleString("es-AR")}`;
}

/**
 * Infers product category name from canonical product name.
 */
export function inferAlertCategory(productName: string): string {
  const lower = productName.toLowerCase();
  if (lower.includes("leche") || lower.includes("queso") || lower.includes("yogur")) {
    return "Lácteos";
  }
  if (
    lower.includes("detergente") ||
    lower.includes("jabón") ||
    lower.includes("jabon") ||
    lower.includes("limpiador")
  ) {
    return "Limpieza";
  }
  if (
    lower.includes("tv") ||
    lower.includes("smart") ||
    lower.includes("heladera") ||
    lower.includes("lavarropas")
  ) {
    return "Electrodomésticos";
  }
  return "Almacén";
}

/**
 * Infers currency benchmark rate type and approximation status.
 */
export function inferAlertRateType(alert: AlertaItem): {
  rateType: string;
  isApprox: boolean;
} {
  const rate = alert.cotizacion_usada_cierre;
  const isApprox = alert.cobertura_pct < 95 && alert.regla_faltantes === "LOCF" && rate === 1190;

  if (rate <= 950) {
    return { rateType: "Oficial", isApprox };
  }
  if (rate >= 1150 && rate <= 1190 && !isApprox) {
    return { rateType: "MEP", isApprox };
  }
  return { rateType: "Blue", isApprox };
}

/**
 * Maps a raw backend AlertaItem into a view-ready AlertTableRowView.
 */
export function mapAlertToTableRow(alert: AlertaItem): AlertTableRowView {
  const { rateType, isApprox } = inferAlertRateType(alert);
  const severity = classifySeverity(alert.diferencial_puntos);

  return {
    id: alert.alerta_id,
    canonicalProductId: alert.producto_canonico_id,
    name: alert.producto_nombre,
    store: alert.tienda_nombre,
    varPrice: formatSignedPercentage(alert.variacion_precio_pct),
    varUsd: formatSignedPercentage(alert.variacion_cotizacion_pct),
    delta: formatSignedPoints(alert.diferencial_puntos),
    deltaType: getSeverityBadgeVariant(severity),
    rateValue: formatCurrencyARS(alert.cotizacion_usada_cierre),
    rateType,
    isApprox,
    category: inferAlertCategory(alert.producto_nombre),
    rawAlert: alert,
  };
}
