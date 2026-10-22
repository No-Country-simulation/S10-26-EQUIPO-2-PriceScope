"use client";

import { useEffect } from "react";
import {
  DashboardEvolutionSection,
  DashboardFiltersCard,
  DashboardHeaderCard,
  DashboardKpiGrid,
  DashboardStoresTable,
} from "@/components/dashboard";
import { useDashboardData, useSidebar } from "@/hooks";
import { exportDashboardCsv } from "@/lib/dashboard";

/**
 * Vista principal del Tablero Macroeconómico de Inflación (Dashboard B2B).
 * Coordina el estado de filtros y la petición asíncrona simulada (con Skeleton loading).
 */
export default function DashboardPage() {
  const {
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
  } = useDashboardData();

  const { setPilotStores, setLastUpdatedLabel } = useSidebar();

  useEffect(() => {
    if (!data) return;
    if (data.pipeline_status?.tiendas) {
      setPilotStores(
        data.pipeline_status.tiendas.map((store) => {
          const date = new Date(store.ultima_corrida_utc);
          const hours = String((date.getUTCHours() + 21) % 24).padStart(2, "0");
          const mins = String(date.getUTCMinutes()).padStart(2, "0");
          return {
            id: store.tienda_id,
            name: store.nombre,
            lastRun: `${hours}:${mins} ART`,
          };
        })
      );
    }
    if (data.contexto?.frescura_datos_utc) {
      const date = new Date(data.contexto.frescura_datos_utc);
      const hours = String((date.getUTCHours() + 21) % 24).padStart(2, "0");
      const mins = String(date.getUTCMinutes()).padStart(2, "0");
      setLastUpdatedLabel(`Hoy ${hours}:${mins} ART`);
    }
  }, [data, setPilotStores, setLastUpdatedLabel]);

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <DashboardHeaderCard />

      <DashboardFiltersCard
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        selectedStore={selectedStore}
        onStoreChange={setSelectedStore}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedCurrency={selectedCurrency}
        onCurrencyChange={setSelectedCurrency}
        onResetFilters={handleResetFilters}
        onExportCsv={() => {
          if (data) {
            exportDashboardCsv(data.grafico_evolucion.series);
          }
        }}
        isExportDisabled={isLoading || !Boolean(data && data.grafico_evolucion.series.length > 0)}
        stores={storeOptions}
        categories={categoryOptions}
      />

      <DashboardKpiGrid
        isLoading={isLoading}
        kpis={data?.kpis ?? null}
        activeCategory={activeCategoryMetric}
        totalProducts={totalProducts}
      />

      <DashboardEvolutionSection
        isLoading={isLoading}
        chartData={chartData}
        trackerData={trackerData}
        milestones={data?.grafico_evolucion.hitos ?? []}
        selectedCurrency={selectedCurrency}
        chartMode={chartMode}
        onChartModeChange={setChartMode}
        downsamplingActive={data?.grafico_evolucion.metadata.downsampling_aplicado ?? false}
        referenceAreas={referenceAreas}
      />

      <DashboardStoresTable
        isLoading={isLoading}
        rows={storeAuditRows}
        currency={selectedCurrency}
      />
    </main>
  );
}
