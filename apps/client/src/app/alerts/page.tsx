"use client";

import * as React from "react";
import {
  AlertsFilters,
  AlertsHeader,
  AlertsMilestones,
  AlertsPagination,
  AlertsTable,
} from "@/components/alerts";
import { useAlertsData } from "@/hooks";

/**
 * Vista central de Alertas e Hitos Macroeconómicos con filtros de severidad y paginación.
 */
export default function AlertsPage() {
  const {
    isLoading,
    severityFilter,
    categoryFilter,
    storeFilter,
    currentPage,
    showAllMilestones,
    setSeverityFilter,
    setCategoryFilter,
    setStoreFilter,
    setCurrentPage,
    setShowAllMilestones,
    handleResetFilters,
    handleExportCsv,
    handleExportJson,
    tableRows,
    criticalAlertsCount,
    totalPages,
    totalAlerts,
    visibleMilestones,
    milestones,
  } = useAlertsData();

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <AlertsHeader criticalCount={criticalAlertsCount} isLoading={isLoading} />

      <AlertsFilters
        severityFilter={severityFilter}
        categoryFilter={categoryFilter}
        storeFilter={storeFilter}
        onSeverityChange={setSeverityFilter}
        onCategoryChange={setCategoryFilter}
        onStoreChange={setStoreFilter}
        onReset={handleResetFilters}
        disabled={isLoading}
      />

      <AlertsMilestones
        milestones={visibleMilestones}
        showAll={showAllMilestones}
        onToggleShowAll={() => setShowAllMilestones((prev) => !prev)}
        totalMilestonesCount={milestones.length}
        isLoading={isLoading}
      />

      <AlertsTable
        rows={tableRows}
        isLoading={isLoading}
        limitPerPage={50}
        onExportCsv={handleExportCsv}
        onExportJson={handleExportJson}
      >
        <AlertsPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalAlerts={totalAlerts}
          limitPerPage={50}
          onPageChange={setCurrentPage}
          isLoading={isLoading}
        />
      </AlertsTable>
    </main>
  );
}
