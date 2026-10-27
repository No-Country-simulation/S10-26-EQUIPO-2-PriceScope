import dashboardMockData from "@/mocks/dashboard.mock.json";
import type {
  BandaCalidad,
  DashboardQueryParams,
  DashboardResponse,
  PuntoSerie,
} from "@/types/api";

const MOCK_API_DELAY_MS = 600;

/**
 * Simula una latencia de red asíncrona.
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
 * Obtiene el lunes (ISO) de la semana correspondiente a una fecha YYYY-MM-DD.
 */
function getMondayIso(dateStr: string): string {
  const d = new Date(dateStr.slice(0, 10) + "T00:00:00Z");
  const day = d.getUTCDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

/**
 * Calcula la mediana matemática continua (percentile_cont 0.5) de una muestra numérica.
 */
function calculateMedian(numbers: number[]): number | null {
  if (numbers.length === 0) return null;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) {
    return sorted[mid];
  }
  return Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2));
}

/**
 * Filtra los datos simulados en memoria para emular con fidelidad la respuesta del backend.
 * Aplica downsampling algorítmico semanal por mediana si el rango consultado supera los 90 días (RN-07 / HU-47).
 * Si no hay datos para el rango consultado, retorna arrays vacíos y KPIs neutralizados.
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

  const hasData = filteredSeries.length > 0;

  const kpis = hasData
    ? rawMock.kpis
    : {
        variacion_pesos: {
          porcentaje: 0,
          fecha_inicial: fechaDesde,
          fecha_final: fechaHasta,
          cobertura_pct: 0,
          estado: "SIN_DATOS_SUFICIENTES" as const,
          regla_faltantes: "LOCF",
        },
        variacion_usd: {
          porcentaje: 0,
          cotizacion_usada: 0,
          fuente_cotizacion: "DolarAPI_Cierre",
          tipo_cotizacion: "BLUE",
        },
        comparacion_devaluacion: {
          diferencial_puntos: 0,
          variacion_precio_pct: 0,
          variacion_cotizacion_pct: 0,
        },
      };

  // Regla RN-07 / HU-47: Downsampling semanal por mediana si el rango supera 90 días
  const fromMs = new Date(fechaDesde).getTime();
  const toMs = new Date(fechaHasta).getTime();
  const dayCount = Math.max(1, Math.round((toMs - fromMs) / (1000 * 60 * 60 * 24)) + 1);
  const shouldApplyDownsampling = dayCount > 90;

  let finalSeries: PuntoSerie[] = filteredSeries;
  let finalBanda: BandaCalidad[] = filteredBanda;
  let downsamplingAplicado = false;
  let intervaloAgrupacion: "1d" | "1w" = "1d";

  if (shouldApplyDownsampling && hasData) {
    downsamplingAplicado = true;
    intervaloAgrupacion = "1w";

    // 1. Agrupación semanal de la serie de precios por mediana (agg_precios_semanales)
    const weeklyBuckets = new Map<string, PuntoSerie[]>();
    for (const point of filteredSeries) {
      const weekKey = getMondayIso(point.timestamp_utc);
      if (!weeklyBuckets.has(weekKey)) {
        weeklyBuckets.set(weekKey, []);
      }
      weeklyBuckets.get(weekKey)!.push(point);
    }

    finalSeries = Array.from(weeklyBuckets.entries()).map(([weekKey, points]) => {
      const validPreciosReg = points
        .map((p) => p.precio_regular)
        .filter((v): v is number => v !== null);
      const validPreciosPromo = points
        .map((p) => p.precio_promocional)
        .filter((v): v is number => v !== null);
      const validPreciosUsd = points
        .map((p) => p.precio_usd)
        .filter((v): v is number => v !== null);
      const validCotiz = points
        .map((p) => p.cotizacion_aplicada)
        .filter((v): v is number => v !== null);

      const medianReg = calculateMedian(validPreciosReg);
      const medianPromo = calculateMedian(validPreciosPromo);
      const medianUsd = calculateMedian(validPreciosUsd);
      const medianCotiz = calculateMedian(validCotiz);

      const hasFalla = points.some((p) => p.estado_dato === "ERROR_CAPTURA");
      const hasAgotado = points.some((p) => p.estado_dato === "AGOTADO");
      const hasTtl = points.some((p) => p.cotizacion_aproximada);
      const hasValido = points.some((p) => p.estado_dato === "DATO_VALIDO");

      const estadoDato = hasFalla
        ? "ERROR_CAPTURA"
        : hasAgotado
          ? "AGOTADO"
          : hasValido
            ? "DATO_VALIDO"
            : "SIN_DATO";

      const cotizacionAprox = hasTtl;
      const motivo = hasAgotado
        ? "Quiebre de stock en semana"
        : hasTtl
          ? "Fallback cambiario en semana (<72h)"
          : hasFalla
            ? "Falla de captura en semana"
            : "Consolidado semanal (mediana 1w)";

      return {
        timestamp_utc: `${weekKey}T00:00:00Z`,
        precio_regular: medianReg,
        precio_promocional: medianPromo,
        precio_usd: medianUsd,
        estado_dato: estadoDato,
        cotizacion_aplicada: medianCotiz,
        cotizacion_aproximada: cotizacionAprox,
        motivo,
      };
    });

    // 2. Agrupación semanal de la banda semafórica de calidad
    const weeklyBandaBuckets = new Map<string, BandaCalidad[]>();
    for (const item of filteredBanda) {
      const weekKey = getMondayIso(item.fecha);
      if (!weeklyBandaBuckets.has(weekKey)) {
        weeklyBandaBuckets.set(weekKey, []);
      }
      weeklyBandaBuckets.get(weekKey)!.push(item);
    }

    finalBanda = Array.from(weeklyBandaBuckets.entries()).map(([weekKey, items]) => {
      const hasRojo = items.some((i) => i.estado === "ROJO");
      const hasAmarillo = items.some((i) => i.estado === "AMARILLO");
      const estado = hasRojo ? "ROJO" : hasAmarillo ? "AMARILLO" : "VERDE";
      return {
        fecha: weekKey,
        estado,
      };
    });
  }

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
    kpis,
    grafico_evolucion: {
      ...rawMock.grafico_evolucion,
      metadata: {
        downsampling_aplicado: downsamplingAplicado,
        intervalo_agrupacion: intervaloAgrupacion,
      },
      series: finalSeries,
      banda_calidad_diaria: finalBanda,
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
