import { useMemo } from "react";
import type { TrackerBlockProps } from "@/components/charts/tracker";
import { STATUS_COLORS } from "@/lib/dashboard";

const ALL_LEGEND_ITEMS = [
  { id: "valido", label: STATUS_COLORS.VALIDO.label, colorClass: STATUS_COLORS.VALIDO.tailwindBg },
  {
    id: "agotado",
    label: STATUS_COLORS.AGOTADO.label,
    colorClass: STATUS_COLORS.AGOTADO.tailwindBg,
  },
  {
    id: "reduflacion",
    label: STATUS_COLORS.REDUFLACION.label,
    colorClass: STATUS_COLORS.REDUFLACION.tailwindBg,
  },
  { id: "error", label: STATUS_COLORS.FALLA.label, colorClass: STATUS_COLORS.FALLA.tailwindBg },
  {
    id: "sin_dato",
    label: STATUS_COLORS.SIN_DATO.label,
    colorClass: STATUS_COLORS.SIN_DATO.tailwindBg,
  },
];

export interface DashboardEvolutionLegendProps {
  trackerData: TrackerBlockProps[];
}

/**
 * Leyenda de estados visibles en la sección de evolución del dashboard.
 */
export function DashboardEvolutionLegend({ trackerData }: DashboardEvolutionLegendProps) {
  const activeItems = useMemo(() => {
    const presentColors = new Set(trackerData.map((item) => item.color));
    return ALL_LEGEND_ITEMS.filter((item) => presentColors.has(item.colorClass));
  }, [trackerData]);

  return (
    <div className="flex flex-wrap items-center justify-end gap-3 pt-1 pr-3 text-[11px] font-medium text-slate-600">
      {activeItems.map((item) => (
        <span key={item.id} className="inline-flex items-center gap-1.5">
          <span className={`h-2.5 w-3 rounded-xs ${item.colorClass}`} />
          <span>{item.label}</span>
        </span>
      ))}
    </div>
  );
}
