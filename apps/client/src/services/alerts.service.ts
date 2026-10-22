import alertsMockData from "@/mocks/alerts.mock.json";
import { DEFAULT_ALERT_MILESTONES } from "@/lib/alerts/milestones";
import type { AlertMilestoneItem } from "@/lib/alerts/types";
import type { AlertaItem, AlertsQueryParams, AlertsResponse } from "@/types/api";

const MOCK_API_DELAY_MS = 600;

/**
 * Simulates asynchronous network latency.
 */
export function simulateNetworkDelay(ms: number = MOCK_API_DELAY_MS): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

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

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  almacen: ["café", "cafe", "aceite", "yerba", "galletitas", "arroz", "fideos", "harina"],
  almacén: ["café", "cafe", "aceite", "yerba", "galletitas", "arroz", "fideos", "harina"],
  lacteos: ["leche", "yogur", "queso", "manteca"],
  lácteos: ["leche", "yogur", "queso", "manteca"],
  limpieza: ["detergente", "jabón", "jabon", "lavandina", "limpiador"],
  electro: ["tv", "smart", "heladera", "lavarropas", "microondas"],
};

/**
 * Filters mock alerts in memory to emulate backend API behavior.
 */
export function filterMockAlerts(params: AlertsQueryParams): AlertsResponse {
  const rawMock = alertsMockData as AlertsResponse;
  let items: AlertaItem[] = [...rawMock.alertas];

  if (params.tienda_id && params.tienda_id !== "all") {
    const targetStore = params.tienda_id.trim().toLowerCase();
    items = items.filter((item) => item.tienda_nombre.toLowerCase().includes(targetStore));
  }

  if (params.categoria_id && params.categoria_id !== "all") {
    const cat = params.categoria_id.trim().toLowerCase();
    const keywords = CATEGORY_KEYWORDS[cat];
    if (keywords && keywords.length > 0) {
      items = items.filter((item) => {
        const name = item.producto_nombre.toLowerCase();
        return keywords.some((kw) => name.includes(kw));
      });
    } else {
      items = items.filter((item) => item.producto_nombre.toLowerCase().includes(cat));
    }
  }

  if (params.severidad && params.severidad !== "all") {
    if (params.severidad === "danger") {
      items = items.filter((item) => item.diferencial_puntos > 10.0);
    } else if (params.severidad === "warning") {
      items = items.filter(
        (item) => item.diferencial_puntos >= 5.0 && item.diferencial_puntos <= 10.0
      );
    } else if (params.severidad === "info") {
      items = items.filter((item) => item.diferencial_puntos < 5.0);
    }
  }

  if (params.fecha_desde) {
    items = items.filter((item) => item.periodo.fin_utc.slice(0, 10) >= params.fecha_desde!);
  }
  if (params.fecha_hasta) {
    items = items.filter((item) => item.periodo.inicio_utc.slice(0, 10) <= params.fecha_hasta!);
  }

  const page = Math.max(1, params.page ?? 1);
  const limit = Math.max(1, params.limit ?? 50);
  const totalRegistros = items.length;
  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / limit));

  const startIndex = (page - 1) * limit;
  const paginatedAlertas = items.slice(startIndex, startIndex + limit);

  return {
    paginacion: {
      pagina_actual: page,
      limite_por_pagina: limit,
      total_registros: totalRegistros,
      total_paginas: totalPaginas,
    },
    alertas: paginatedAlertas,
  };
}

export { DEFAULT_ALERT_MILESTONES };

/**
 * Queries divergence alerts data. If `NEXT_PUBLIC_API_URL` is set,
 * dispatches HTTP GET to `/api/v1/alerts`.
 * Otherwise simulates network latency and returns filtered in-memory mock data.
 */
export async function getAlertsData(params: AlertsQueryParams = {}): Promise<AlertsResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (apiUrl) {
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

  await simulateNetworkDelay();
  return filterMockAlerts(params);
}

/**
 * Retrieves macroeconomic milestones for the alerts view.
 */
export async function getAlertsMilestones(): Promise<AlertMilestoneItem[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    await simulateNetworkDelay(200);
  }
  return DEFAULT_ALERT_MILESTONES;
}
