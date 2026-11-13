import { RiArrowRightUpLine, RiScales3Line } from "@remixicon/react";
import { Card } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/KpiCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { DashboardResponse, Moneda, VariacionCategoria } from "@/types/api";

interface DashboardKpiGridProps {
  isLoading: boolean;
  kpis: DashboardResponse["kpis"] | null;
  activeCategory: VariacionCategoria | null;
  totalProducts?: number;
  isAllCategories?: boolean;
  selectedCurrency?: Moneda;
  hasNoData?: boolean;
  isSingleDay?: boolean;
}

/**
 * Grilla ejecutiva de 4 tarjetas KPI del Dashboard con soporte de carga Skeleton.
 */
export function DashboardKpiGrid({
  isLoading,
  kpis,
  activeCategory,
  totalProducts = 0,
  isAllCategories = false,
  selectedCurrency = "ARS",
  hasNoData = false,
  isSingleDay = false,
}: DashboardKpiGridProps) {
  if (isLoading || !kpis || !activeCategory) {
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

  const formatCurrency = (val: number | null | undefined): string => {
    if (val === null || val === undefined || Number.isNaN(val) || val === 0) return "$0";
    if (selectedCurrency && selectedCurrency !== "ARS") {
      const rate = varUsd?.cotizacion_usada || 1200;
      const divisor = selectedCurrency === "USD_OFICIAL" ? rate * 0.78 : rate;
      const usdVal = val / divisor;
      return `US$ ${usdVal.toLocaleString("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
    }
    return `$${Math.round(val).toLocaleString("es-AR")}`;
  };

  const isNoData = Boolean(hasNoData);
  const isOneDay = Boolean(isSingleDay);

  const sampleProductsCount =
    isAllCategories && totalProducts > 0
      ? totalProducts
      : activeCategory.cantidad_productos || totalProducts;

  const rawDiff = compDev?.diferencial_puntos ?? 0;
  const isNeutralDiff = isNoData || isOneDay || rawDiff === 0 || varPesos?.porcentaje === 0;
  const isOverIndexed = !isNeutralDiff && rawDiff > 0;

  const devMetric = isNeutralDiff ? "0.0 pts" : formatPts(rawDiff);
  const devBadgeVariant = isNeutralDiff ? "neutral" : isOverIndexed ? "error" : "success";
  const devBadgeText = isNoData
    ? "Sin datos"
    : isNeutralDiff
      ? "Alineado"
      : isOverIndexed
        ? "Alerta"
        : "Alineado";
  const devFooterValue = isNeutralDiff
    ? "Sin divergencia"
    : isOverIndexed
      ? "Sobre-indexación"
      : "Sub-indexación";
  const devFooterClass = isNeutralDiff
    ? "text-slate-500 font-semibold"
    : isOverIndexed
      ? "text-rose-600"
      : "text-emerald-600";

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        className="h-full"
        title="Variación ARS"
        metric={isNoData || isOneDay ? "0.0%" : formatPct(varPesos?.porcentaje)}
        subtitle={
          isNoData
            ? "Sin cotizaciones en el período"
            : isOneDay
              ? "Precio Regular base (1 día)"
              : "Precio Regular vs. Período Base"
        }
        icon="$"
        accent="blue"
        badgeVariant={
          isNoData || isOneDay
            ? "neutral"
            : varPesos?.porcentaje && varPesos.porcentaje > 0
              ? "error"
              : "success"
        }
        badgeText={
          isNoData ? (
            "Sin datos"
          ) : isOneDay ? (
            "1D"
          ) : (
            <>
              <RiArrowRightUpLine className="size-3.5" />
              <span>MoM</span>
            </>
          )
        }
        footerLabel="Muestra ponderada"
        footerValue={
          isNoData
            ? "0 productos (0.0%)"
            : `${formatNumber(sampleProductsCount)} productos (${formatNumber(varPesos?.cobertura_pct)}%)`
        }
      />

      <KpiCard
        className="h-full"
        title="Variación USD"
        metric={isNoData || isOneDay ? "0.0%" : formatPct(varUsd?.porcentaje)}
        subtitle={
          isNoData
            ? "Sin cotización aplicable"
            : `Cotiz. aplicada: $${formatNumber(varUsd?.cotizacion_usada)} (Venta ${varUsd?.tipo_cotizacion ?? "BLUE"})`
        }
        icon="US$"
        accent="emerald"
        badgeVariant={isNoData || isOneDay ? "neutral" : "success"}
        badgeText={isNoData ? "Sin datos" : isOneDay ? "1D" : "Moneda Fuerte"}
        footerLabel="Fijación cambiaria"
        footerValue={isNoData ? "Sin registros" : "Cierre 23:59:59 ART"}
      />

      <KpiCard
        className="h-full"
        title="vs. Devaluación"
        metric={devMetric}
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
        badgeVariant={devBadgeVariant}
        badgeText={devBadgeText}
        footerLabel="Divergencia real"
        footerValue={devFooterValue}
        footerValueClassName={devFooterClass}
      />

      <KpiCard
        className="h-full"
        title="Mediana Categoría"
        metric={isNoData ? "$0" : formatCurrency(activeCategory?.variacion_mediana_pct)}
        subtitle={
          isNoData
            ? "Mediana representativa (0 productos)"
            : `Mediana representativa (${formatNumber(activeCategory?.cantidad_productos)} productos)`
        }
        icon="M"
        accent="purple"
        badgeVariant="neutral"
        badgeText={activeCategory?.nombre ?? "Categoría"}
        footerLabel="Cobertura muestral"
        footerValue={
          isNoData ? "0% (Sin datos)" : `${formatNumber(activeCategory?.cobertura_pct)}% (Óptima)`
        }
        footerValueClassName={isNoData ? "text-slate-500 font-semibold" : "text-emerald-600"}
      />
    </section>
  );
}
