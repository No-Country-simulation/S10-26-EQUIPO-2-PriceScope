import { getColorClassName } from "@/lib/chartUtils";
import { cx } from "@/lib/utils";
import type { TooltipProps } from "./line-chart-types";

export interface ChartTooltipProps extends TooltipProps {
  valueFormatter: (value: number) => string;
}

/**
 * Tooltip personalizado para el gráfico de líneas con valores formateados.
 */
export function ChartTooltip({ active, payload, label, valueFormatter }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white text-xs shadow-lg">
      <div className="border-b border-slate-100 px-3.5 py-2">
        <p className="font-semibold text-slate-900">{label}</p>
      </div>
      <div className="space-y-1.5 px-3.5 py-2">
        {payload.map(({ value, category, color }, index) => (
          <div key={`tooltip-${index}`} className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={cx("h-1 w-3.5 shrink-0 rounded-full", getColorClassName(color, "bg"))}
              />
              <span className="whitespace-nowrap text-slate-600">{category}</span>
            </div>
            <span className="font-bold whitespace-nowrap text-slate-900 tabular-nums">
              {valueFormatter(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
