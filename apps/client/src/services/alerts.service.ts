import { DEFAULT_ALERT_MILESTONES, mapAlertsToMilestones } from "@/lib/alerts/milestones";
import type { AlertMilestoneItem } from "@/lib/alerts/types";
import type { AlertsQueryParams, AlertsResponse } from "@/types/api";

/**
 * Builds URLSearchParams from AlertsQueryParams.
 */
export function buildAlertsSearchParams(params: AlertsQueryParams): URLSearchParams {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined && params.page !== null) {
    searchParams.set("page", String(params.page));
  }
  if (params.limit !== undefined && params.limit !== null) {
    searchParams.set("limit", String(params.limit));
  }
  if (params.fecha_desde) {
    searchParams.set("fecha_desde", params.fecha_desde);
  }
  if (params.fecha_hasta) {
    searchParams.set("fecha_hasta", params.fecha_hasta);
  }
  if (params.tienda_id && params.tienda_id !== "all") {
    searchParams.set("tienda_id", params.tienda_id);
  }
  if (params.categoria_id && params.categoria_id !== "all") {
    searchParams.set("categoria_id", params.categoria_id);
  }
  if (params.severidad && params.severidad !== "all") {
    searchParams.set("severidad", params.severidad);
  }
  return searchParams;
}

export { DEFAULT_ALERT_MILESTONES };

/**
 * Queries divergence alerts data from the real API endpoint `/api/v1/alerts`.
 */
export async function getAlertsData(params: AlertsQueryParams = {}): Promise<AlertsResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL no está configurada en las variables de entorno.");
  }
  const query = buildAlertsSearchParams(params).toString();
  const endpoint = `${apiUrl.replace(/\/$/, "")}/api/v1/alerts${query ? `?${query}` : ""}`;
  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Error en alerts API (${response.status} ${response.statusText})`);
  }

  return (await response.json()) as AlertsResponse;
}

/**
 * Retrieves macroeconomic milestones derived dynamically from the API/Database alerts.
 */
export async function getAlertsMilestones(): Promise<AlertMilestoneItem[]> {
  const alertsResponse = await getAlertsData({ limit: 50 });
  return mapAlertsToMilestones(alertsResponse.alertas);
}
