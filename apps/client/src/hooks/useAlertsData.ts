import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { SidebarContext } from "@/components/layout/SidebarContext";
import {
  exportAlertsCsv,
  exportAlertsJson,
  mapAlertsToMilestones,
  mapAlertToTableRow,
  type AlertMilestoneItem,
  type AlertTableRowView,
  type SeverityLevel,
} from "@/lib/alerts";
import { getAlertsData } from "@/services/alerts.service";
import { getDashboardData } from "@/services/dashboard.service";
import type { AlertaItem, AlertsResponse } from "@/types/api";

export interface UseAlertsDataReturn {
  // State
  data: AlertsResponse | null;
  isLoading: boolean;
  severityFilter: SeverityLevel;
  categoryFilter: string;
  storeFilter: string;
  storeOptions: Array<{ value: string; label: string }>;
  categoryOptions: Array<{ value: string; label: string }>;
  currentPage: number;
  showAllMilestones: boolean;
  milestones: AlertMilestoneItem[];

  // Setters & Actions
  setSeverityFilter: (severity: SeverityLevel) => void;
  setCategoryFilter: (category: string) => void;
  setStoreFilter: (store: string) => void;
  setCurrentPage: (page: number) => void;
  setShowAllMilestones: (show: boolean | ((prev: boolean) => boolean)) => void;
  handleResetFilters: () => void;
  handleExportCsv: () => void;
  handleExportJson: () => void;

  // Computed Values
  alerts: AlertaItem[];
  tableRows: AlertTableRowView[];
  criticalAlertsCount: number;
  totalPages: number;
  totalAlerts: number;
  visibleMilestones: AlertMilestoneItem[];
}

/**
 * Custom Hook coordinating alerts state, asynchronous fetching, filtering,
 * pagination and export actions for the divergence alerts view.
 */
export function useAlertsData(): UseAlertsDataReturn {
  const [severityFilter, setSeverityFilterState] = useState<SeverityLevel>("all");
  const [categoryFilter, setCategoryFilterState] = useState<string>("all");
  const [storeFilter, setStoreFilterState] = useState<string>("all");
  const [storeOptions, setStoreOptions] = useState<Array<{ value: string; label: string }>>([
    { value: "all", label: "Todas las Cadenas" },
  ]);
  const [categoryOptions, setCategoryOptions] = useState<Array<{ value: string; label: string }>>([
    { value: "all", label: "Todas las Categorías" },
  ]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showAllMilestones, setShowAllMilestones] = useState<boolean>(false);
  const [globalCriticalCount, setGlobalCriticalCount] = useState<number>(7);

  const [data, setData] = useState<AlertsResponse | null>(null);
  const [resolvedQueryKey, setResolvedQueryKey] = useState<string | null>(null);

  const currentQueryKey = `${currentPage}|${storeFilter}|${categoryFilter}|${severityFilter}`;
  const isLoading = resolvedQueryKey !== currentQueryKey;

  const sidebar = useContext(SidebarContext);

  useEffect(() => {
    let isCancelled = false;
    getDashboardData().then((dashRes) => {
      if (isCancelled) return;
      if (dashRes.pipeline_status?.tiendas && dashRes.pipeline_status.tiendas.length > 0) {
        setStoreOptions([
          { value: "all", label: "Todas las Cadenas" },
          ...dashRes.pipeline_status.tiendas.map((t) => ({
            value: t.tienda_id,
            label: t.nombre,
          })),
        ]);
      }
      if (dashRes.variacion_por_categoria && dashRes.variacion_por_categoria.length > 0) {
        setCategoryOptions([
          { value: "all", label: "Todas las Categorías" },
          ...dashRes.variacion_por_categoria.map((c) => ({
            value: c.categoria_id,
            label: c.nombre,
          })),
        ]);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    getAlertsData({
      page: currentPage,
      limit: 50,
      tienda_id: storeFilter,
      categoria_id: categoryFilter,
      severidad: severityFilter,
    })
      .then((alertsRes) => {
        if (!isCancelled) {
          setData(alertsRes);
          setResolvedQueryKey(currentQueryKey);
          if (storeFilter === "all" && categoryFilter === "all" && severityFilter === "all") {
            const criticals = alertsRes.alertas.filter((a) => a.diferencial_puntos > 10).length;
            setGlobalCriticalCount(criticals);
            sidebar?.setAlertCount(criticals);
          }
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          console.error("Error loading alerts data:", error);
          setResolvedQueryKey(currentQueryKey);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [currentQueryKey, currentPage, storeFilter, categoryFilter, severityFilter, sidebar]);

  const setSeverityFilter = useCallback((severity: SeverityLevel) => {
    setSeverityFilterState(severity);
    setCurrentPage(1);
    setShowAllMilestones(false);
  }, []);

  const setCategoryFilter = useCallback((category: string) => {
    setCategoryFilterState(category);
    setCurrentPage(1);
    setShowAllMilestones(false);
  }, []);

  const setStoreFilter = useCallback((store: string) => {
    setStoreFilterState(store);
    setCurrentPage(1);
    setShowAllMilestones(false);
  }, []);

  const handleResetFilters = useCallback(() => {
    setSeverityFilterState("all");
    setCategoryFilterState("all");
    setStoreFilterState("all");
    setCurrentPage(1);
    setShowAllMilestones(false);
  }, []);

  const alerts = useMemo(() => {
    let items = data?.alertas ?? [];
    if (storeFilter && storeFilter !== "all") {
      const targetStore = storeFilter.toLowerCase();
      items = items.filter(
        (a) =>
          a.tienda_nombre.toLowerCase().includes(targetStore) ||
          targetStore.includes(a.tienda_nombre.toLowerCase())
      );
    }
    if (severityFilter && severityFilter !== "all") {
      if (severityFilter === "danger") {
        items = items.filter((a) => a.diferencial_puntos > 10.0);
      } else if (severityFilter === "warning") {
        items = items.filter(
          (a) => a.diferencial_puntos >= 5.0 && a.diferencial_puntos <= 10.0
        );
      } else if (severityFilter === "info") {
        items = items.filter((a) => a.diferencial_puntos < 5.0);
      }
    }
    return items;
  }, [data, severityFilter, storeFilter]);

  const milestones = useMemo(() => {
    return mapAlertsToMilestones(alerts);
  }, [alerts]);

  const tableRows = useMemo(() => {
    const allRows = alerts.map(mapAlertToTableRow);
    const startIndex = (currentPage - 1) * 50;
    return allRows.slice(startIndex, startIndex + 50);
  }, [alerts, currentPage]);

  const criticalAlertsCount = globalCriticalCount;

  const totalAlerts = alerts.length;
  const totalPages = Math.max(1, Math.ceil(totalAlerts / 50));

  const visibleMilestones = useMemo(() => {
    if (showAllMilestones) {
      return milestones;
    }
    return milestones.slice(0, 3);
  }, [milestones, showAllMilestones]);

  const handleExportCsv = useCallback(() => {
    if (alerts.length > 0) {
      exportAlertsCsv(alerts);
    }
  }, [alerts]);

  const handleExportJson = useCallback(() => {
    if (alerts.length > 0) {
      exportAlertsJson(alerts);
    }
  }, [alerts]);

  return {
    data,
    isLoading,
    severityFilter,
    categoryFilter,
    storeFilter,
    storeOptions,
    categoryOptions,
    currentPage,
    showAllMilestones,
    milestones,
    setSeverityFilter,
    setCategoryFilter,
    setStoreFilter,
    setCurrentPage,
    setShowAllMilestones,
    handleResetFilters,
    handleExportCsv,
    handleExportJson,
    alerts,
    tableRows,
    criticalAlertsCount,
    totalPages,
    totalAlerts,
    visibleMilestones,
  };
}
