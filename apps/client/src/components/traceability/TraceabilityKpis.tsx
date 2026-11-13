import React from "react";
import { RiBankCardLine, RiCoinLine, RiScales3Line } from "@remixicon/react";
import { KpiCard } from "@/components/ui/KpiCard";
import { formatCurrency, formatUnitPrice } from "@/lib/traceability/formatters";
import type { ObservacionTrazabilidadItem, ProductoCanonicoDetalle } from "@/types/api";

export interface TraceabilityKpisProps {
  product: ProductoCanonicoDetalle;
  latestObservation?: ObservacionTrazabilidadItem | null;
  divergencePricePct?: string;
  divergenceDelta?: string;
  divergenceVariant?: "error" | "warning" | "default";
  isLoading?: boolean;
}

/**
 * Cuadrícula de 4 tarjetas de indicadores ejecutivos del producto relevado,
 * unificadas con el primitivo KpiCard para total consistencia de diseño, CLS y accesibilidad.
 */
export function TraceabilityKpis({
  product,
  latestObservation,
  divergencePricePct = "+0.0%",
  divergenceDelta = "+0.0 pts",
  divergenceVariant = "default",
  isLoading = false,
}: TraceabilityKpisProps) {
  const regularPrice = latestObservation?.precio_regular ?? null;
  const unitPrice = latestObservation?.precio_por_unidad ?? null;
  const unitMeasure = latestObservation?.unidad_medida ?? product.contenido_neto_unidad;
  const benchmarkRate = latestObservation?.cotizacion_aplicada ?? null;
  const isApprox = latestObservation?.cotizacion_aproximada ?? false;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Precio Regular Actual */}
      <KpiCard
        className="h-full"
        title="Precio Regular Actual"
        metric={formatCurrency(regularPrice)}
        subtitle="Excluye ofertas efímeras"
        icon={<RiBankCardLine className="size-4" aria-hidden="true" />}
        accent="blue"
        footerLabel="Tipo"
        footerValue="Góndola"
        isLoading={isLoading}
      />

      {/* 2. Precio Unitario Normalizado */}
      <KpiCard
        className="h-full"
        title="Precio $/Unidad"
        metric={formatUnitPrice(unitPrice, unitMeasure)}
        subtitle="Cálculo de comparabilidad"
        icon={<RiScales3Line className="size-4" aria-hidden="true" />}
        accent="purple"
        footerLabel="Unidad"
        footerValue={unitMeasure}
        isLoading={isLoading}
      />

      {/* 3. Divergencia vs Divisa */}
      <KpiCard
        className="h-full"
        title="Divergencia vs Divisa"
        metric={divergencePricePct}
        subtitle="Precio supera a la divisa cambiaria"
        badgeText={divergenceDelta}
        badgeVariant={divergenceVariant}
        accent="amber"
        footerLabel="Base cambiaria"
        footerValue="ARS vs USD"
        isLoading={isLoading}
      />

      {/* 4. Cotización Benchmark */}
      <KpiCard
        className="h-full"
        title="Cotización Benchmark"
        metric={benchmarkRate ? formatCurrency(benchmarkRate) : "--"}
        subtitle={isApprox ? "Valor estimado por cercanía" : "Cierre oficial del mercado"}
        icon={<RiCoinLine className="size-4" aria-hidden="true" />}
        accent="emerald"
        footerLabel="Tipo de cambio"
        footerValue={isApprox ? "Aproximado" : "Blue"}
        isLoading={isLoading}
      />
    </div>
  );
}
