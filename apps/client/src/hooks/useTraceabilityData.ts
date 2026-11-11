import { useCallback, useEffect, useMemo, useState } from "react";
import {
  downloadCsvFile,
  enrichTraceabilityObservations,
  generateTraceabilityCsv,
} from "@/lib/traceability";
import { getTraceabilityData } from "@/services/traceability.service";
import type {
  HitoReduflacionItem,
  ObservacionTrazabilidadItem,
  ProductoCanonicoDetalle,
  TraceabilityResponse,
} from "@/types/api";

export interface DateRangeFilter {
  from?: string;
  to?: string;
}

export interface StoreOption {
  id: string;
  name: string;
}

export interface TraceabilityMetrics {
  totalObservations: number;
  latestPriceArs: number | null;
  latestPriceUsd: number | null;
  latestObservationDate: string | null;
}

export interface TraceabilityDivergenceMetrics {
  priceVariationPct: string;
  divergenceDelta: string;
  divergenceVariant: "error" | "warning" | "default";
}

export interface UseTraceabilityDataReturn {
  // State
  data: TraceabilityResponse | null;
  isLoading: boolean;
  error: string | null;
  selectedStore: string;
  dateRange: DateRangeFilter;
  currentPage: number;
  totalPages: number;
  limitPerPage: number;

  // Setters & Actions
  setStoreFilter: (storeId: string) => void;
  setDateRangeFilter: (range: DateRangeFilter) => void;
  setCurrentPage: (page: number) => void;
  refetch: () => void;
  exportObservationsCsv: () => void;
  exportObservationsJson: () => void;

  // Memoized / Derived
  product: ProductoCanonicoDetalle | null;
  hitosReduflacion: HitoReduflacionItem[];
  observations: ObservacionTrazabilidadItem[];
  paginatedObservations: ObservacionTrazabilidadItem[];
  totalObservationsCount: number;
  availableStores: StoreOption[];
  metrics: TraceabilityMetrics;
  divergenceMetrics: TraceabilityDivergenceMetrics;
  externalStoreUrl: string | null;
}

const DEFAULT_PAGE_SIZE = 10;

/**
 * Custom Hook coordinating traceability data fetching, store/date filtering,
 * client-side pagination, metrics calculation, and RFC 4180 CSV / JSON export.
 */
export function useTraceabilityData(
  productId: string,
  limitPerPage: number = DEFAULT_PAGE_SIZE
): UseTraceabilityDataReturn {
  const [data, setData] = useState<TraceabilityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRangeFilter>({});
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [resolvedQueryKey, setResolvedQueryKey] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState<number>(0);
  const [storeOptions, setStoreOptions] = useState<StoreOption[]>([]);

  const hasValidProduct = Boolean(productId && productId.trim().length > 0);
  const currentQueryKey = `${productId}|${selectedStore}|${dateRange.from ?? ""}|${dateRange.to ?? ""}|${refetchTrigger}`;
  const isLoading = hasValidProduct && resolvedQueryKey !== currentQueryKey;

  const [prevProductId, setPrevProductId] = useState<string>(productId);

  if (prevProductId !== productId) {
    setPrevProductId(productId);
    setStoreOptions([]);
    setSelectedStore("all");
    setCurrentPage(1);
  }

  useEffect(() => {
    let isCancelled = false;

    if (!hasValidProduct) {
      return;
    }

    getTraceabilityData(productId, {
      tienda_id: selectedStore === "all" ? undefined : selectedStore,
      fecha_desde: dateRange.from || undefined,
      fecha_hasta: dateRange.to || undefined,
    })
      .then((response) => {
        if (!isCancelled) {
          setData(response);
          setError(null);
          setResolvedQueryKey(currentQueryKey);

          if (response.historico_observaciones && response.historico_observaciones.length > 0) {
            setStoreOptions((prev) => {
              const map = new Map(prev.map((s) => [s.id, s.name]));
              for (const obs of response.historico_observaciones) {
                if (obs.tienda_id && !map.has(obs.tienda_id)) {
                  map.set(obs.tienda_id, obs.tienda_nombre);
                }
              }
              return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
            });
          }
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          const message =
            err instanceof Error ? err.message : "Error al cargar datos de trazabilidad";
          setError(message);
          setResolvedQueryKey(currentQueryKey);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [hasValidProduct, productId, selectedStore, dateRange.from, dateRange.to, currentQueryKey]);

  const setStoreFilter = useCallback((storeId: string) => {
    setSelectedStore(storeId);
    setCurrentPage(1);
  }, []);

  const setDateRangeFilter = useCallback((range: DateRangeFilter) => {
    setDateRange(range);
    setCurrentPage(1);
  }, []);

  const refetch = useCallback(() => {
    setRefetchTrigger((prev) => prev + 1);
  }, []);

  const product = useMemo<ProductoCanonicoDetalle | null>(() => {
    if (!hasValidProduct) return null;
    return data?.producto ?? null;
  }, [hasValidProduct, data]);

  const hitosReduflacion = useMemo<HitoReduflacionItem[]>(() => {
    if (!hasValidProduct) return [];
    return data?.hitos_reduflacion ?? [];
  }, [hasValidProduct, data]);

  const observations = useMemo<ObservacionTrazabilidadItem[]>(() => {
    if (!hasValidProduct) return [];
    const raw = data?.historico_observaciones ?? [];
    return enrichTraceabilityObservations(raw);
  }, [hasValidProduct, data]);

  const totalObservationsCount = observations.length;
  const totalPages = Math.max(1, Math.ceil(totalObservationsCount / limitPerPage));

  const paginatedObservations = useMemo<ObservacionTrazabilidadItem[]>(() => {
    const startIndex = (currentPage - 1) * limitPerPage;
    return observations.slice(startIndex, startIndex + limitPerPage);
  }, [observations, currentPage, limitPerPage]);

  const availableStores = storeOptions;

  const externalStoreUrl = useMemo<string | null>(() => {
    if (observations.length === 0) return null;
    const withUrl = observations.find((obs) => obs.url_origen && obs.url_origen.length > 0);
    return withUrl?.url_origen ?? null;
  }, [observations]);

  const metrics = useMemo<TraceabilityMetrics>(() => {
    const totalObservations = observations.length;
    if (totalObservations === 0) {
      return {
        totalObservations: 0,
        latestPriceArs: null,
        latestPriceUsd: null,
        latestObservationDate: null,
      };
    }

    const latest = observations[0];
    return {
      totalObservations,
      latestPriceArs: latest.precio_regular ?? latest.precio_promocional ?? null,
      latestPriceUsd: latest.precio_usd ?? null,
      latestObservationDate: latest.timestamp_utc ?? null,
    };
  }, [observations]);

  const divergenceMetrics = useMemo<TraceabilityDivergenceMetrics>(() => {
    if (observations.length === 0) {
      return {
        priceVariationPct: "0.0%",
        divergenceDelta: "+0.0 pts",
        divergenceVariant: "default",
      };
    }

    const latest = observations[0];
    const earliest = observations[observations.length - 1];

    const pFinal = latest.precio_regular ?? latest.precio_promocional ?? 0;
    const pInicial = earliest.precio_regular ?? earliest.precio_promocional ?? pFinal;
    const priceVar = pInicial > 0 ? ((pFinal - pInicial) / pInicial) * 100 : 0;

    const cFinal = latest.cotizacion_aplicada ?? 0;
    const cInicial = earliest.cotizacion_aplicada ?? cFinal;
    const cotizVar = cInicial > 0 ? ((cFinal - cInicial) / cInicial) * 100 : 0;

    const delta = Number((priceVar - cotizVar).toFixed(1));
    const variant: "error" | "warning" | "default" =
      delta > 10 ? "error" : delta >= 5 ? "warning" : "default";

    return {
      priceVariationPct: `${priceVar > 0 ? "+" : ""}${priceVar.toFixed(1)}%`,
      divergenceDelta: `${delta > 0 ? "+" : ""}${delta.toFixed(1)} pts`,
      divergenceVariant: variant,
    };
  }, [observations]);

  const exportObservationsCsv = useCallback(() => {
    if (observations.length === 0) return;
    const csvContent = generateTraceabilityCsv(observations);
    const slug = product?.slug || productId || "producto";
    const filename = `trazabilidad_${slug}_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCsvFile(csvContent, filename);
  }, [observations, product, productId]);

  const exportObservationsJson = useCallback(() => {
    if (!data) return;
    const jsonString = JSON.stringify(data, null, 2);
    const slug = product?.slug || productId || "producto";
    const filename = `certificado_${slug}_${new Date().toISOString().slice(0, 10)}.json`;
    if (typeof window === "undefined" || typeof document === "undefined") return;
    const blob = new Blob([jsonString], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.setAttribute("download", filename);
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, [data, product, productId]);

  return {
    data: hasValidProduct ? data : null,
    isLoading,
    error: hasValidProduct ? error : null,
    selectedStore,
    dateRange,
    currentPage,
    totalPages,
    limitPerPage,
    setStoreFilter,
    setDateRangeFilter,
    setCurrentPage,
    refetch,
    exportObservationsCsv,
    exportObservationsJson,
    product,
    hitosReduflacion,
    observations,
    paginatedObservations,
    totalObservationsCount,
    availableStores,
    metrics,
    divergenceMetrics,
    externalStoreUrl,
  };
}
