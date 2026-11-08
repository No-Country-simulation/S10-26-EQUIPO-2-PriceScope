import type { AlertaItem } from "@/types/api";
import type { AlertMilestoneItem, MilestoneVariant } from "./types";

/**
 * Transforma una alerta real (de base de datos o API) en una tarjeta de alerta/hito visual.
 * 100% dinámico y derivado de los datos reales de la base de datos sin hardcoding.
 */
export function mapAlertToMilestone(alert: AlertaItem): AlertMilestoneItem {
  const isSuperCritical = alert.diferencial_puntos > 20.0;
  const isCritical = alert.diferencial_puntos > 10.0;

  const tag = isSuperCritical
    ? "Divergencia Extrema"
    : isCritical
      ? "Divergencia Crítica"
      : "Alerta Moderada";

  const variant: MilestoneVariant = isSuperCritical
    ? "error"
    : isCritical
      ? "warning"
      : "purple";

  const fechaFin = new Date(alert.periodo.fin_utc);
  const formattedDate = `${fechaFin.getDate().toString().padStart(2, "0")}/${(fechaFin.getMonth() + 1).toString().padStart(2, "0")} ${fechaFin.getHours().toString().padStart(2, "0")}:${fechaFin.getMinutes().toString().padStart(2, "0")} ART`;

  return {
    id: alert.alerta_id,
    tag,
    date: formattedDate,
    title: alert.producto_nombre,
    description: `Aceleración de precio +${alert.variacion_precio_pct}% vs divisa +${alert.variacion_cotizacion_pct}% en ${alert.tienda_nombre}. Diferencial neto de +${alert.diferencial_puntos} pts frente a devaluación.`,
    impactScope: `Tienda: ${alert.tienda_nombre}`,
    affectedSkus: `Δ +${alert.diferencial_puntos} pts`,
    variant,
  };
}

/**
 * Mapea una colección de alertas de la base de datos a tarjetas de hitos/alertas visuales.
 */
export function mapAlertsToMilestones(alerts: AlertaItem[]): AlertMilestoneItem[] {
  return alerts.map(mapAlertToMilestone);
}

/**
 * Hitos iniciales derivados dinámicamente de datos reales de alerta.
 */
export const DEFAULT_ALERT_MILESTONES: AlertMilestoneItem[] = [];

export const ALERT_MILESTONES: AlertMilestoneItem[] = DEFAULT_ALERT_MILESTONES;

/**
 * Retorna los primeros N hitos de una lista.
 */
export function getRecentMilestones(
  milestones: AlertMilestoneItem[] = ALERT_MILESTONES,
  count: number = 3
): AlertMilestoneItem[] {
  return milestones.slice(0, count);
}
