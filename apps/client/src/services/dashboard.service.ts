import dashboardMockData from "@/mocks/dashboard.mock.json";
import type { DashboardQueryParams, DashboardResponse } from "@/types/api";

const MOCK_API_DELAY_MS = 2000;

/**
 * Simula una latencia de red asíncrona (por defecto 2000 ms).
 */
function simulateNetworkDelay(ms: number = MOCK_API_DELAY_MS): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Construye los parámetros de búsqueda URL a partir de DashboardQueryParams.
 */
function buildDashboardSearchParams(params: DashboardQueryParams): URLSearchParams {
  const searchParams = new URLSearchParams();
  if (params.fecha_desde) searchParams.set("fecha_desde", params.fecha_desde);
  if (params.fecha_hasta) searchParams.set("fecha_hasta", params.fecha_hasta);
  if (params.moneda) searchParams.set("moneda", params.moneda);
  if (params.tienda_id && params.tienda_id !== "all") {
    searchParams.set("tienda_id", params.tienda_id);
  }
  if (params.categoria_id && params.categoria_id !== "all") {
    searchParams.set("categoria_id", params.categoria_id);
  }
  return searchParams;
}

/**
 * Filtra los datos simulados en memoria para emular la respuesta del backend.
 */
function filterMockData(params: DashboardQueryParams): DashboardResponse {
  const rawMock = dashboardMockData as DashboardResponse;

  const moneda = params.moneda ?? rawMock.contexto.filtros_activos.moneda;
  const fechaDesde = params.fecha_desde ?? rawMock.contexto.filtros_activos.fecha_desde;
  const fechaHasta = params.fecha_hasta ?? rawMock.contexto.filtros_activos.fecha_hasta;
  const tiendaId = params.tienda_id && params.tienda_id !== "all" ? params.tienda_id : null;
  const categoryId =
    params.categoria_id && params.categoria_id !== "all"
      ? params.categoria_id
      : rawMock.contexto.filtros_activos.categoria_id;

  const filteredSeries = rawMock.grafico_evolucion.series.filter((point) => {
    const dayIso = point.timestamp_utc.slice(0, 10);
    return dayIso >= fechaDesde && dayIso <= fechaHasta;
  });

  const filteredBanda = rawMock.grafico_evolucion.banda_calidad_diaria.filter(
    (day) => day.fecha >= fechaDesde && day.fecha <= fechaHasta
  );

  return {
    ...rawMock,
    contexto: {
      ...rawMock.contexto,
      filtros_activos: {
        moneda,
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
        tienda_id: tiendaId,
        categoria_id: categoryId,
      },
    },
    grafico_evolucion: {
      ...rawMock.grafico_evolucion,
      series: filteredSeries.length > 0 ? filteredSeries : rawMock.grafico_evolucion.series,
      banda_calidad_diaria:
        filteredBanda.length > 0 ? filteredBanda : rawMock.grafico_evolucion.banda_calidad_diaria,
    },
    pipeline_status: rawMock.pipeline_status,
  };
}

/**
 * Consulta los datos del Dashboard Macro. Si `NEXT_PUBLIC_API_URL` está definida,
 * realiza la petición HTTP real hacia el endpoint `/api/v1/dashboard`.
 * En caso contrario, resuelve la respuesta simulada con latencia de red.
 */
export async function getDashboardData(
  params: DashboardQueryParams = {}
): Promise<DashboardResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (apiUrl) {
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

  await simulateNetworkDelay(MOCK_API_DELAY_MS);
  return filterMockData(params);
}
