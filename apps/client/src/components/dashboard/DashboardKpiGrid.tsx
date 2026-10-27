import { RiArrowRightUpLine, RiScales3Line } from "@remixicon/react";
import { Card } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/KpiCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { DashboardResponse, VariacionCategoria } from "@/types/api";

interface DashboardKpiGridProps {
  isLoading: boolean;
  kpis: DashboardResponse["kpis"] | null;
  activeCategory: VariacionCategoria | null;
  totalProducts?: number;
  hasData?: boolean;
}

/**
 * Grilla ejecutiva de 4 tarjetas KPI del Dashboard con soporte de carga Skeleton
 * y estado neutralizado cuando no hay datos en la base de datos o en la consulta.
 */
export function DashboardKpiGrid({
  isLoading,
  kpis,
  activeCategory,
  totalProducts = 0,
  hasData = true,
}: DashboardKpiGridProps) {
  if (isLoading) {
    return (
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="size-6 rounded-md" />
            </div>
            <div className="flex items-baseline gap-2 pt-1">
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-5 w-16 rounded-md" />
            </div>
            <Skeleton className="h-3.5 w-44" />
            <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          </Card>
        ))}
      </section>
    );
  }

  // Estado cuando no hay observaciones en la base de datos para la fecha o filtros seleccionados
  if (!hasData || !kpis || !activeCategory) {
    return (
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          className="h-full"
          title="Variación ARS"
          metric="--"
          subtitle="Sin cotizaciones para el período"
          icon="$"
          accent="blue"
          badgeVariant="neutral"
          badgeText="Sin datos"
          footerLabel="Muestra ponderada"
          footerValue="0 productos (0%)"
        />

        <KpiCard
          className="h-full"
          title="Variación USD"
          metric="--"
          subtitle="Sin cotización de referencia en DB"
          icon="US$"
          accent="emerald"
          badgeVariant="neutral"
          badgeText="Sin datos"
          footerLabel="Fijación cambiaria"
          footerValue="Sin registro"
        />

        <KpiCard
          className="h-full"
          title="vs. Devaluación"
          metric="--"
          subtitle="Diferencial neto no disponible"
          icon={<RiScales3Line className="size-3.5" />}
          accent="amber"
          badgeVariant="neutral"
          badgeText="Sin datos"
          footerLabel="Divergencia real"
          footerValue="Sin divergencia"
        />

        <KpiCard
          className="h-full"
          title="Mediana Categoría"
          metric="--"
          subtitle="Sin productos registrados en DB"
          icon="M"
          accent="purple"
          badgeVariant="neutral"
          badgeText="Sin datos"
          footerLabel="Cobertura muestral"
          footerValue="0%"
        />
      </section>
    );
  }

  const varPesos = kpis.variacion_pesos;
  const varUsd = kpis.variacion_usd;
  const compDev = kpis.comparacion_devaluacion;

  const formatPct = (val: number | null | undefined): string => {
    if (val === null || val === undefined || Number.isNaN(val)) return "--";
    const sign = val > 0 ? "+" : "";
    return `${sign}${val.toFixed(1)}%`;
  };

  const formatPts = (val: number | null | undefined): string => {
    if (val === null || val === undefined || Number.isNaN(val)) return "--";
    const sign = val > 0 ? "+" : "";
    return `${sign}${val.toFixed(1)} pts`;
  };

  const formatNumber = (val: number | null | undefined): string => {
    if (val === null || val === undefined || Number.isNaN(val)) return "--";
    return val.toLocaleString("es-AR");
  };

  const isOverIndexed = (compDev?.diferencial_puntos ?? 0) > 0;

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        className="h-full"
        title="Variación ARS"
        metric={formatPct(varPesos?.porcentaje)}
        subtitle="Precio Regular vs. Período Base"
        icon="$"
        accent="blue"
        badgeVariant={varPesos?.porcentaje && varPesos.porcentaje > 0 ? "error" : "success"}
        badgeText={
          <>
            <RiArrowRightUpLine className="size-3.5" />
            <span>MoM</span>
          </>
        }
        footerLabel="Muestra ponderada"
        footerValue={`${formatNumber(activeCategory.cantidad_productos || totalProducts)} productos (${formatNumber(varPesos?.cobertura_pct)}%)`}
      />

      <KpiCard
        className="h-full"
        title="Variación USD"
        metric={formatPct(varUsd?.porcentaje)}
        subtitle={`Cotiz. aplicada: $${formatNumber(varUsd?.cotizacion_usada)} (Venta ${varUsd?.tipo_cotizacion ?? "BLUE"})`}
        icon="US$"
        accent="emerald"
        badgeVariant="success"
        badgeText="Moneda Fuerte"
        footerLabel="Fijación cambiaria"
        footerValue="Cierre 23:59:59 ART"
      />

      <KpiCard
        className="h-full"
        title="vs. Devaluación"
        metric={formatPts(compDev?.diferencial_puntos)}
        subtitle="Diferencial neto frente a divisa (Δpts)"
        icon={
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex cursor-help items-center justify-center">
                <RiScales3Line className="size-3.5" />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              Diferencial neto en puntos porcentuales (Δpts = Var ARS - Devaluación USD)
            </TooltipContent>
          </Tooltip>
        }
        accent="amber"
        badgeVariant={isOverIndexed ? "error" : "success"}
        badgeText={isOverIndexed ? "Alerta" : "Alineado"}
        footerLabel="Divergencia real"
        footerValue={isOverIndexed ? "Sobre-indexación" : "Sub-indexación"}
        footerValueClassName={isOverIndexed ? "text-rose-600" : "text-emerald-600"}
      />

      <KpiCard
        className="h-full"
        title="Mediana Categoría"
        metric={formatPct(activeCategory?.variacion_mediana_pct)}
        subtitle={`Mediana representativa (${formatNumber(activeCategory?.cantidad_productos)} productos)`}
        icon="M"
        accent="purple"
        badgeVariant="neutral"
        badgeText={activeCategory?.nombre ?? "Categoría"}
        footerLabel="Cobertura muestral"
        footerValue={`${formatNumber(activeCategory?.cobertura_pct)}% (Óptima)`}
        footerValueClassName="text-emerald-600"
      />
    </section>
  );
}
