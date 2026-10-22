import traceabilityMockData from "@/mocks/traceability.mock.json";
import type {
  ObservacionTrazabilidadItem,
  TraceabilityQueryParams,
  TraceabilityResponse,
} from "@/types/api";

const MOCK_API_DELAY_MS = 500;

/**
 * Simulates asynchronous network latency.
 */
export function simulateNetworkDelay(ms: number = MOCK_API_DELAY_MS): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Builds URLSearchParams from TraceabilityQueryParams.
 */
export function buildTraceabilitySearchParams(params?: TraceabilityQueryParams): URLSearchParams {
  const searchParams = new URLSearchParams();
  if (!params) {
    return searchParams;
  }

  if (params.tienda_id && params.tienda_id !== "all") {
    searchParams.set("tienda_id", params.tienda_id);
  }
  if (params.fecha_desde) {
    searchParams.set("fecha_desde", params.fecha_desde);
  }
  if (params.fecha_hasta) {
    searchParams.set("fecha_hasta", params.fecha_hasta);
  }

  return searchParams;
}

/**
 * Filters mock traceability observations in memory according to query params.
 */
export function filterMockTraceability(
  productIdOrSlug: string,
  params?: TraceabilityQueryParams
): TraceabilityResponse | null {
  const catalog = traceabilityMockData as Record<string, TraceabilityResponse>;

  // Resolve by ID key or find by product slug / ID
  let match: TraceabilityResponse | undefined = catalog[productIdOrSlug];

  if (!match) {
    match = Object.values(catalog).find(
      (entry) => entry.producto.id === productIdOrSlug || entry.producto.slug === productIdOrSlug
    );
  }

  if (!match) {
    return null;
  }

  let observations: ObservacionTrazabilidadItem[] = [...match.historico_observaciones];

  if (params?.tienda_id && params.tienda_id !== "all") {
    const targetStore = params.tienda_id.trim().toLowerCase();
    observations = observations.filter(
      (obs) =>
        obs.tienda_id.toLowerCase() === targetStore ||
        obs.tienda_nombre.toLowerCase().includes(targetStore)
    );
  }

  if (params?.fecha_desde) {
    observations = observations.filter(
      (obs) => obs.timestamp_utc.slice(0, 10) >= params.fecha_desde!
    );
  }

  if (params?.fecha_hasta) {
    observations = observations.filter(
      (obs) => obs.timestamp_utc.slice(0, 10) <= params.fecha_hasta!
    );
  }

  return {
    producto: match.producto,
    hitos_reduflacion: match.hitos_reduflacion ?? [],
    historico_observaciones: observations,
  };
}

/**
 * Retrieves traceability data for a canonical product.
 * - If `process.env.NEXT_PUBLIC_API_URL` is set and non-empty, calls `GET /api/v1/products/{id}/traceability`.
 * - Otherwise falls back to mock catalog with simulated network latency.
 */
export async function getTraceabilityData(
  id: string,
  params?: TraceabilityQueryParams
): Promise<TraceabilityResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (apiUrl) {
    const query = buildTraceabilitySearchParams(params).toString();
    const endpoint = `${apiUrl.replace(/\/$/, "")}/api/v1/products/${encodeURIComponent(id)}/traceability${query ? `?${query}` : ""}`;

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error en traceability API (${response.status} ${response.statusText})`);
    }

    return (await response.json()) as TraceabilityResponse;
  }

  await simulateNetworkDelay();
  const mockResult = filterMockTraceability(id, params);

  if (!mockResult) {
    throw new Error(`Producto con ID o slug "${id}" no encontrado en catálogo mock.`);
  }

  return mockResult;
}
