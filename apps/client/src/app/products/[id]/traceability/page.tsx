"use client";

import { use } from "react";
import { RiAlertLine, RiRefreshLine } from "@remixicon/react";
import {
  TraceabilityHeader,
  TraceabilityKpis,
  TraceabilityObservationsTable,
  TraceabilityPagination,
  TraceabilityProductCard,
} from "@/components/traceability";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { useTraceabilityData } from "@/hooks";

interface TraceabilityPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Página coordinadora de trazabilidad forense y auditoría matemática de producto canónico.
 */
export default function TraceabilityPage({ params }: TraceabilityPageProps) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const {
    product,
    hitosReduflacion,
    observations,
    paginatedObservations,
    totalObservationsCount,
    currentPage,
    totalPages,
    limitPerPage,
    setCurrentPage,
    availableStores,
    selectedStore,
    setStoreFilter,
    isLoading,
    error,
    refetch,
    exportObservationsCsv,
    exportObservationsJson,
    externalStoreUrl,
  } = useTraceabilityData(productId, 10);

  const latestObservation = observations[0] ?? null;

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <TraceabilityHeader productId={productId} />

      {error && (
        <Callout
          variant="error"
          title="Error al consultar datos de trazabilidad"
          icon={RiAlertLine}
        >
          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-rose-800">{error}</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={refetch}
              className="gap-1.5 self-start text-xs font-medium sm:self-auto"
            >
              <RiRefreshLine className="size-3.5" aria-hidden="true" />
              <span>Reintentar</span>
            </Button>
          </div>
        </Callout>
      )}

      {product && (
        <>
          <TraceabilityProductCard
            product={product}
            hitosReduflacion={hitosReduflacion}
            externalStoreUrl={externalStoreUrl}
          />

          <TraceabilityKpis product={product} latestObservation={latestObservation} />
        </>
      )}

      <TraceabilityObservationsTable
        observations={paginatedObservations}
        isLoading={isLoading}
        availableStores={availableStores}
        selectedStore={selectedStore}
        onStoreChange={setStoreFilter}
        onExportCsv={exportObservationsCsv}
        onExportJson={exportObservationsJson}
      >
        <TraceabilityPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={totalObservationsCount}
          limitPerPage={limitPerPage}
          onPageChange={setCurrentPage}
          isLoading={isLoading}
        />
      </TraceabilityObservationsTable>
    </main>
  );
}
