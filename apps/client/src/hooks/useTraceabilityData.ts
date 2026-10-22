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

  const hasValidProduct = Boolean(productId && productId.trim().length > 0);
  const currentQueryKey = `${productId}|${selectedStore}|${dateRange.from ?? ""}|${dateRange.to ?? ""}|${refetchTrigger}`;
  const isLoading = hasValidProduct && resolvedQueryKey !== currentQueryKey;

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

  const availableStores = useMemo<StoreOption[]>(() => {
    if (!hasValidProduct || !data?.historico_observaciones) return [];
    const storeMap = new Map<string, string>();
    for (const obs of data.historico_observaciones) {
      if (obs.tienda_id && !storeMap.has(obs.tienda_id)) {
        storeMap.set(obs.tienda_id, obs.tienda_nombre);
      }
    }
    return Array.from(storeMap.entries()).map(([id, name]) => ({ id, name }));
  }, [hasValidProduct, data]);

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
    externalStoreUrl,
  };
}
