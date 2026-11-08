import type { DashboardQueryParams, DashboardResponse } from "@/types/api";

/**
 * Construye los parámetros de búsqueda URL a partir de DashboardQueryParams.
 */
function buildDashboardSearchParams(params: DashboardQueryParams): URLSearchParams {
  const searchParams = new URLSearchParams();
  if (params.fecha_desde) searchParams.set("fecha_desde", params.fecha_desde);
  if (params.fecha_hasta) searchParams.set("fecha_hasta", params.fecha_hasta);
  if (params.moneda) {
    const apiMoneda = params.moneda === "ARS" ? "ARS" : "USD";
    searchParams.set("moneda", apiMoneda);
  }
  if (params.tienda_id && params.tienda_id !== "all") {
    searchParams.set("tienda_id", params.tienda_id);
  }
  if (params.categoria_id && params.categoria_id !== "all") {
    searchParams.set("categoria_id", params.categoria_id);
  }
  return searchParams;
}

/**
 * Consulta los datos del Dashboard Macro directamente desde el endpoint `/api/v1/dashboard`.
 */
export async function getDashboardData(
  params: DashboardQueryParams = {}
): Promise<DashboardResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL no está configurada en las variables de entorno.");
  }
  const query = buildDashboardSearchParams(params).toString();
  const endpoint = `${apiUrl.replace(/\/$/, "")}/api/v1/dashboard${query ? `?${query}` : ""}`;
  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Error en dashboard API (${response.status} ${response.statusText})`);
  }

  return (await response.json()) as DashboardResponse;
}
