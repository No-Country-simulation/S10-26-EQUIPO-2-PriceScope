import type { DeltaBadgeVariant } from "./types";

/**
 * Classifies numeric differential points into domain severity levels.
 * - Danger (Critical): > 10.0 points
 * - Warning (Moderate): 5.0 to 10.0 points
 * - Info (Mild): < 5.0 points
 */
export function classifySeverity(differentialPoints: number): "danger" | "warning" | "info" {
  if (differentialPoints > 10.0) return "danger";
  if (differentialPoints >= 5.0) return "warning";
  return "info";
}

/**
 * Maps numeric differential points or severity strings into UI badge variants.
 */
export function getSeverityBadgeVariant(value: number | string): DeltaBadgeVariant {
  if (typeof value === "number") {
    if (value > 10.0) return "error";
    if (value >= 5.0) return "warning";
    return "default";
  }

  if (value === "danger") return "error";
  if (value === "warning") return "warning";
  return "default";
}

export interface RateBadgeInfo {
  label: string;
  tooltip: string;
  variant: "approx" | "oficial" | "mep" | "blue";
}

/**
 * Resolves metadata, tooltip and style variant for exchange rate benchmarks.
 */
export function getRateBadgeInfo(rateType: string, isApprox: boolean): RateBadgeInfo {
  if (isApprox) {
    return {
      label: `Aprox. (${rateType})`,
      tooltip: "Cotización estimada por contingencia de feriado cambiario o fallback (TTL 48h)",
      variant: "approx",
    };
  }

  if (rateType === "Oficial") {
    return {
      label: "Oficial",
      tooltip: "Benchmark: Dólar Oficial BCRA (Mayorista/Minorista)",
      variant: "oficial",
    };
  }

  if (rateType === "MEP") {
    return {
      label: "MEP",
      tooltip: "Benchmark: Dólar Mercado Electrónico de Pagos",
      variant: "mep",
    };
  }

  return {
    label: "Blue",
    tooltip: "Benchmark: Cotización Informal Libre (Dólar Blue)",
    variant: "blue",
  };
}
