import * as React from "react";
import { RiArrowDownSLine, RiArrowUpSLine, RiHistoryLine } from "@remixicon/react";
import { Badge } from "@/components/ui/badge";
import { Callout } from "@/components/ui/callout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import type { AlertMilestoneItem } from "@/lib/alerts/types";

export interface AlertsMilestonesProps {
  milestones: AlertMilestoneItem[];
  showAll: boolean;
  onToggleShowAll: () => void;
  totalMilestonesCount: number;
  isLoading?: boolean;
}

/**
 * Historical macroeconomic milestones component rendered with the Callout primitive.
 */
export function AlertsMilestones({
  milestones,
  showAll,
  onToggleShowAll,
  totalMilestonesCount,
  isLoading = false,
}: AlertsMilestonesProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <CardTitle className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-900">
            <RiHistoryLine className="size-4 text-purple-600" />
            <span>Historial de Hitos de Mercado y Reduflación</span>
          </CardTitle>
          <CardDescription className="mt-1">
            Eventos observados que justifican las alertas de precios en los productos analizados
          </CardDescription>
        </div>

        <button
          type="button"
          onClick={onToggleShowAll}
          className="inline-flex cursor-pointer items-center gap-1.5 self-start rounded-lg border border-purple-200 bg-purple-50/80 px-3 py-1.5 text-xs font-semibold text-purple-700 transition-colors hover:bg-purple-100 hover:text-purple-900 sm:self-auto"
          aria-expanded={showAll}
        >
          <span>
            {showAll
              ? "Mostrar solo recientes (3)"
              : `Ver historial completo (${totalMilestonesCount} hitos)`}
          </span>
          {showAll ? (
            <RiArrowUpSLine className="size-4 text-purple-600" />
          ) : (
            <RiArrowDownSLine className="size-4 text-purple-600" />
          )}
        </button>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={`milestone-skeleton-${idx}`}
                className="flex flex-col justify-between space-y-3 rounded-lg border border-slate-200/80 bg-slate-50/80 p-3.5"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-28 rounded-sm" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-10 w-full" />
                <div className="flex items-center justify-between border-t border-slate-200/60 pt-2.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))
          ) : milestones.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                title="Sin hitos registrados"
                description="No se detectaron eventos macroeconómicos ni alertas de reduflación para los filtros activos."
                icon={RiHistoryLine}
                className="py-10"
              />
            </div>
          ) : (
            milestones.map((item) => (
              <Callout
                key={item.id}
                title={item.title}
                variant={item.variant}
                badge={
                  <Badge
                    variant={item.variant}
                    className="rounded-sm px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase"
                  >
                    {item.tag}
                  </Badge>
                }
                meta={
                  <span className="font-mono text-[10px] font-semibold text-slate-500">
                    {item.date}
                  </span>
                }
                className="flex flex-col justify-between"
              >
                <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                  {item.description}
                </p>
                <div className="mt-3 flex items-center justify-between border-t border-slate-200/60 pt-2.5 text-[10px] font-medium text-slate-700">
                  <span>{item.impactScope}</span>
                  <span className="font-semibold">{item.affectedSkus}</span>
                </div>
              </Callout>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
