import type { BadgeProps } from "@/components/ui/badge";
import type { EstadoDato } from "@/types/api";

export interface StatusBadgeConfig {
  variant: NonNullable<BadgeProps["variant"]>;
  label: string;
  description: string;
  tooltip: string;
}

const STATUS_CONFIG_MAP: Record<EstadoDato, StatusBadgeConfig> = {
  DATO_VALIDO: {
    variant: "success",
    label: "Dato Válido",
    description: "Captura exitosa y verificada con consistencia matemática.",
    tooltip: "Captura exitosa y verificada con consistencia matemática.",
  },
  AGOTADO: {
    variant: "warning",
    label: "Agotado",
    description: "Publicación activa pero producto sin stock disponible.",
    tooltip: "Publicación activa pero producto sin stock disponible.",
  },
  ERROR_CAPTURA: {
    variant: "error",
    label: "Error Captura",
    description: "Fallo durante la extracción HTTP / 5xx o timeout del scraper.",
    tooltip: "Fallo durante la extracción HTTP / 5xx o timeout del scraper.",
  },
  SIN_DATO: {
    variant: "neutral",
    label: "Sin Dato",
    description: "Ausencia de captura o discontinuidad temporal.",
    tooltip: "Ausencia de captura o discontinuidad temporal.",
  },
};

/**
 * Returns the badge variant and descriptive label for an EstadoDato.
 */
export function getStatusBadgeConfig(status: EstadoDato | string): StatusBadgeConfig {
  if (status in STATUS_CONFIG_MAP) {
    return STATUS_CONFIG_MAP[status as EstadoDato];
  }

  return {
    variant: "neutral",
    label: status || "Sin Dato",
    description: "Estado no clasificado.",
    tooltip: "Estado no clasificado.",
  };
}

/**
 * Returns human-readable label for the given EstadoDato.
 */
export function getStatusLabel(status: EstadoDato | string): string {
  return getStatusBadgeConfig(status).label;
}

/**
 * Returns Badge variant corresponding to the given EstadoDato.
 */
export function getStatusVariant(status: EstadoDato | string): NonNullable<BadgeProps["variant"]> {
  return getStatusBadgeConfig(status).variant;
}
