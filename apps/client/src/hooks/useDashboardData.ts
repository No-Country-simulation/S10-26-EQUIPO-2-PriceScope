import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDateForApi, getPriceScopePresets, type DateRange } from "@/lib/dateRangeUtils";
import {
  buildChartReferenceAreas,
  buildDailyQualityTrackerData,
  buildEvolutionChartData,
  getPilotStoresAuditRows,
} from "@/lib/dashboard";
import { getDashboardData } from "@/services/dashboard.service";
import type { DashboardResponse, Moneda } from "@/types/api";

/**
 * Hook coordinador del estado, filtros y petición asíncrona (con Skeleton loading) del Dashboard.
 */
export function useDashboardData() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    () => getPriceScopePresets()[2]?.dateRange
  );
  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("canasta-basica");
  const [selectedCurrency, setSelectedCurrency] = useState<Moneda>("ARS");
  const [chartMode, setChartMode] = useState<"strict" | "continuous">("strict");
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [resolvedQueryKey, setResolvedQueryKey] = useState<string | null>(null);
  const [storeOptions, setStoreOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [categoryOptions, setCategoryOptions] = useState<Array<{ id: string; name: string }>>([]);

  const fechaDesde = dateRange?.from ? formatDateForApi(dateRange.from) : undefined;
  const fechaHasta = dateRange?.to ? formatDateForApi(dateRange.to) : undefined;
  const currentQueryKey = `${fechaDesde ?? ""}|${fechaHasta ?? ""}|${selectedStore}|${selectedCategory}|${selectedCurrency}`;
  const isLoading = resolvedQueryKey !== currentQueryKey;

  useEffect(() => {
    let isCancelled = false;

    getDashboardData({
      fecha_desde: fechaDesde,
      fecha_hasta: fechaHasta,
      moneda: selectedCurrency,
      tienda_id: selectedStore,
      categoria_id: selectedCategory,
    }).then((response) => {
      if (!isCancelled) {
        setData(response);
        setResolvedQueryKey(currentQueryKey);

        if (response.pipeline_status?.tiendas && response.pipeline_status.tiendas.length > 0) {
          setStoreOptions((prev) => {
            const map = new Map(prev.map((s) => [s.id, s.name]));
            for (const store of response.pipeline_status.tiendas) {
              map.set(store.tienda_id, store.nombre);
            }
            return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
          });
        }

        if (response.variacion_por_categoria && response.variacion_por_categoria.length > 0) {
          setCategoryOptions((prev) => {
            const map = new Map(prev.map((c) => [c.id, c.name]));
            for (const cat of response.variacion_por_categoria) {
              map.set(cat.categoria_id, cat.nombre);
            }
            return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
          });
        }
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [currentQueryKey, fechaDesde, fechaHasta, selectedCurrency, selectedStore, selectedCategory]);

  const handleResetFilters = useCallback(() => {
    setSelectedStore("all");
    setSelectedCategory("canasta-basica");
    setSelectedCurrency("ARS");
    setDateRange(getPriceScopePresets()[2]?.dateRange);
  }, []);

  const chartData = useMemo(
    () => (data ? buildEvolutionChartData(data.grafico_evolucion.series, selectedCurrency) : []),
    [data, selectedCurrency]
  );

  const trackerData = useMemo(
    () =>
      data
        ? buildDailyQualityTrackerData(
            data.grafico_evolucion.banda_calidad_diaria,
            data.grafico_evolucion.series
          )
        : [],
    [data]
  );

  const storeAuditRows = useMemo(() => {
    if (!data) return [];
    const validSeries = data.grafico_evolucion.series.filter((s) => s.precio_regular !== null);
    const latestPrice =
      validSeries.length > 0
        ? (validSeries[validSeries.length - 1].precio_regular ?? undefined)
        : undefined;

    const allRows = getPilotStoresAuditRows(
      data.pipeline_status.tiendas,
      selectedCurrency,
      data.kpis?.variacion_usd?.cotizacion_usada ?? 1200,
      {
        baseBasketArs: latestPrice,
        variationArs: data.kpis?.variacion_pesos?.porcentaje,
        variationUsd: data.kpis?.variacion_usd?.porcentaje,
      }
    );

    if (selectedStore !== "all") {
      return allRows.filter((row) => row.id === selectedStore);
    }
    return allRows;
  }, [data, selectedCurrency, selectedStore]);

  const totalProducts = useMemo(() => {
    if (!data) return 0;
    if (data.variacion_por_categoria && data.variacion_por_categoria.length > 0) {
      return data.variacion_por_categoria.reduce((acc, cat) => acc + cat.cantidad_productos, 0);
    }
    return data.pipeline_status.tiendas.reduce((acc, t) => acc + t.publicaciones_procesadas, 0);
  }, [data]);

  const activeCategoryMetric = useMemo(() => {
    if (!data) return null;
    return (
      data.variacion_por_categoria.find((cat) => cat.categoria_id === selectedCategory) ??
      data.variacion_por_categoria[0]
    );
  }, [data, selectedCategory]);

  const referenceAreas = useMemo(
    () =>
      data
        ? buildChartReferenceAreas(data.grafico_evolucion.series, data.grafico_evolucion.hitos)
        : [],
    [data]
  );

  return {
    data,
    isLoading,
    dateRange,
    setDateRange,
    selectedStore,
    setSelectedStore,
    selectedCategory,
    setSelectedCategory,
    selectedCurrency,
    setSelectedCurrency,
    chartMode,
    setChartMode,
    handleResetFilters,
    chartData,
    trackerData,
    referenceAreas,
    storeAuditRows,
    activeCategoryMetric,
    storeOptions,
    categoryOptions,
    totalProducts,
  };
}

export type UseDashboardDataReturn = ReturnType<typeof useDashboardData>;
