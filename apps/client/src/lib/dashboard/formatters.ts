import type { Moneda } from "@/types/api";

/**
 * Formatea una fecha ISO (YYYY-MM-DD...) a etiqueta corta DD/MM.
 */
export function formatShortDateLabel(isoString: string): string {
  const datePart = isoString.slice(0, 10);
  const [, month, day] = datePart.split("-");
  return `${day}/${month}`;
}

/**
 * Formatea valores numéricos en el eje Y y leyendas según la moneda activa.
 */
export function formatDashboardCurrencyValue(value: number, currency: Moneda): string {
  if (currency !== "ARS") {
    return `US$\u00A0${value.toFixed(2)}`;
  }
  return `$${Math.round(value).toLocaleString("es-AR")}`;
}
