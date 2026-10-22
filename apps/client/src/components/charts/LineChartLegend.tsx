import type { AvailableChartColorsKeys } from "@/lib/chartUtils";
import { getColorClassName } from "@/lib/chartUtils";
import { cx } from "@/lib/utils";

export interface LegendItemProps {
  name: string;
  color: AvailableChartColorsKeys;
  activeLegend?: string;
  onClick?: (name: string) => void;
}

/**
 * Ítem interactivo individual de la leyenda de categorías.
 */
export function LegendItem({ name, color, activeLegend, onClick }: LegendItemProps) {
  return (
    <li
      onClick={() => onClick?.(name)}
      className={cx(
        "group inline-flex items-center gap-1.5 rounded-md px-2 py-1 whitespace-nowrap transition",
        onClick ? "cursor-pointer hover:bg-slate-100" : "cursor-default"
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          "h-1 w-3.5 shrink-0 rounded-full",
          getColorClassName(color, "bg"),
          activeLegend && activeLegend !== name ? "opacity-40" : "opacity-100"
        )}
      />
      <span
        className={cx(
          "text-xs font-medium whitespace-nowrap text-slate-700",
          activeLegend && activeLegend !== name ? "opacity-40" : "opacity-100"
        )}
      >
        {name}
      </span>
    </li>
  );
}

export interface LineChartLegendProps {
  categories: string[];
  categoryColors: Map<string, AvailableChartColorsKeys>;
  activeLegend?: string;
  legendPosition: "left" | "center" | "right";
  onLegendClick: (category: string) => void;
}

/**
 * Contenedor de la leyenda superior para filtrar series en el gráfico.
 */
export function LineChartLegend({
  categories,
  categoryColors,
  activeLegend,
  legendPosition,
  onLegendClick,
}: LineChartLegendProps) {
  return (
    <div
      className={cx(
        "mb-2 flex items-center",
        legendPosition === "left" && "justify-start",
        legendPosition === "center" && "justify-center",
        legendPosition === "right" && "justify-end"
      )}
    >
      <ol className="flex flex-wrap items-center gap-2">
        {categories.map((category) => (
          <LegendItem
            key={category}
            name={category}
            color={categoryColors.get(category) ?? "blue"}
            activeLegend={activeLegend}
            onClick={onLegendClick}
          />
        ))}
      </ol>
    </div>
  );
}
