import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { SidebarContext } from "@/components/layout/SidebarContext";
import {
  exportAlertsCsv,
  exportAlertsJson,
  getRecentMilestones,
  mapAlertToTableRow,
  type AlertMilestoneItem,
  type AlertTableRowView,
  type SeverityLevel,
} from "@/lib/alerts";
import { getAlertsData, getAlertsMilestones } from "@/services/alerts.service";
import type { AlertaItem, AlertsResponse } from "@/types/api";

export interface UseAlertsDataReturn {
  // State
  data: AlertsResponse | null;
  isLoading: boolean;
  severityFilter: SeverityLevel;
  categoryFilter: string;
  storeFilter: string;
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
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showAllMilestones, setShowAllMilestones] = useState<boolean>(false);

  const [data, setData] = useState<AlertsResponse | null>(null);
  const [milestones, setMilestones] = useState<AlertMilestoneItem[]>([]);
  const [resolvedQueryKey, setResolvedQueryKey] = useState<string | null>(null);

  const currentQueryKey = `${currentPage}|${storeFilter}|${categoryFilter}|${severityFilter}`;
  const isLoading = resolvedQueryKey !== currentQueryKey;

  const sidebar = useContext(SidebarContext);

  useEffect(() => {
    let isCancelled = false;

    Promise.all([
      getAlertsData({
        page: currentPage,
        limit: 50,
        tienda_id: storeFilter,
        categoria_id: categoryFilter,
        severidad: severityFilter,
      }),
      getAlertsMilestones(),
    ])
      .then(([alertsRes, milestonesRes]) => {
        if (!isCancelled) {
          setData(alertsRes);
          setMilestones(milestonesRes);
          setResolvedQueryKey(currentQueryKey);
          const criticals = alertsRes.alertas.filter((a) => a.diferencial_puntos > 10).length;
          sidebar?.setAlertCount(criticals);
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
  }, []);

  const setCategoryFilter = useCallback((category: string) => {
    setCategoryFilterState(category);
    setCurrentPage(1);
  }, []);

  const setStoreFilter = useCallback((store: string) => {
    setStoreFilterState(store);
    setCurrentPage(1);
  }, []);

  const handleResetFilters = useCallback(() => {
    setSeverityFilterState("all");
    setCategoryFilterState("all");
    setStoreFilterState("all");
    setCurrentPage(1);
  }, []);

  const alerts = useMemo(() => data?.alertas ?? [], [data]);

  const tableRows = useMemo(() => alerts.map(mapAlertToTableRow), [alerts]);

  const criticalAlertsCount = useMemo(() => {
    return alerts.filter((a) => a.diferencial_puntos > 10.0).length;
  }, [alerts]);

  const totalPages = data?.paginacion.total_paginas ?? 1;
  const totalAlerts = data?.paginacion.total_registros ?? 0;

  const visibleMilestones = useMemo(() => {
    return showAllMilestones ? milestones : getRecentMilestones(milestones, 3);
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
