/**
 * Utilidades oficiales de colores y dominio de ejes de Tremor (`chartUtils`).
 */

export type ColorUtility = "bg" | "stroke" | "fill" | "text";

export const chartColors = {
  blue: {
    bg: "bg-blue-600",
    stroke: "stroke-blue-600",
    fill: "fill-blue-600",
    text: "text-blue-600",
  },
  emerald: {
    bg: "bg-emerald-600",
    stroke: "stroke-emerald-600",
    fill: "fill-emerald-600",
    text: "text-emerald-600",
  },
  violet: {
    bg: "bg-violet-600",
    stroke: "stroke-violet-600",
    fill: "fill-violet-600",
    text: "text-violet-600",
  },
  amber: {
    bg: "bg-amber-500",
    stroke: "stroke-amber-500",
    fill: "fill-amber-500",
    text: "text-amber-500",
  },
  slate: {
    bg: "bg-slate-400",
    stroke: "stroke-slate-400",
    fill: "fill-slate-400",
    text: "text-slate-500",
  },
  cyan: {
    bg: "bg-cyan-500",
    stroke: "stroke-cyan-500",
    fill: "fill-cyan-500",
    text: "text-cyan-500",
  },
  rose: {
    bg: "bg-rose-600",
    stroke: "stroke-rose-600",
    fill: "fill-rose-600",
    text: "text-rose-600",
  },
} as const satisfies {
  [color: string]: {
    [key in ColorUtility]: string;
  };
};

export type AvailableChartColorsKeys = keyof typeof chartColors;

export const AvailableChartColors: AvailableChartColorsKeys[] = Object.keys(
  chartColors
) as Array<AvailableChartColorsKeys>;

/**
 * Asigna un color de la paleta de Tremor a cada categoría de datos del gráfico.
 */
export function constructCategoryColors(
  categories: string[],
  colors: AvailableChartColorsKeys[]
): Map<string, AvailableChartColorsKeys> {
  const categoryColors = new Map<string, AvailableChartColorsKeys>();
  categories.forEach((category, index) => {
    categoryColors.set(category, colors[index % colors.length]);
  });
  return categoryColors;
}

/**
 * Obtiene la clase utilitaria de Tailwind para un color y tipo dado (`bg`, `stroke`, `fill`, `text`).
 */
export function getColorClassName(color: AvailableChartColorsKeys, type: ColorUtility): string {
  const fallbackColor = {
    bg: "bg-slate-500",
    stroke: "stroke-slate-500",
    fill: "fill-slate-500",
    text: "text-slate-500",
  };
  return chartColors[color]?.[type] ?? fallbackColor[type];
}

/**
 * Calcula el dominio `[min, max]` del eje Y siguiendo la lógica oficial de Tremor.
 */
export function getYAxisDomain(
  autoMinValue: boolean,
  minValue: number | undefined,
  maxValue: number | undefined
): [number | "auto", number | "auto"] {
  const minDomain = autoMinValue ? "auto" : (minValue ?? 0);
  const maxDomain = maxValue ?? "auto";
  return [minDomain, maxDomain];
}

/**
 * Verifica si una serie de datos tiene a lo sumo un único valor válido para una clave dada.
 */
export function hasOnlyOneValueForKey(
  array: Record<string, unknown>[],
  keyToCheck: string
): boolean {
  let count = 0;

  for (const obj of array) {
    if (
      Object.prototype.hasOwnProperty.call(obj, keyToCheck) &&
      obj[keyToCheck] !== null &&
      obj[keyToCheck] !== undefined
    ) {
      count += 1;
      if (count > 1) {
        return false;
      }
    }
  }

  return true;
}
