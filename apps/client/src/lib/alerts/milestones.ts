import type { AlertMilestoneItem } from "./types";

export const DEFAULT_ALERT_MILESTONES: AlertMilestoneItem[] = [
  {
    id: "milestone-1",
    tag: "Reduflación Detectada",
    date: "15/10 11:30 ART",
    title: "Café Tostado: 500g ➔ 450g (-10%)",
    description:
      "Precio nominal sin cambio ($12.000), pero el precio unitario saltó a $26.666,67/kg. Detectado en Jumbo y Carrefour.",
    impactScope: "Impacto: Canasta Básica",
    affectedSkus: "3 SKUs afectados",
    variant: "purple",
  },
  {
    id: "milestone-2",
    tag: "Evento Comercial",
    date: "12/10 00:00 ART",
    title: "ElectroFest en Frávega y Musimundo",
    description:
      "Descuentos del 15% al 25% en tecnología y línea blanca con vencimiento programado. Compresión temporal de precios.",
    impactScope: "Impacto: Electrodomésticos",
    affectedSkus: "28 SKUs en promo",
    variant: "teal",
  },
  {
    id: "milestone-3",
    tag: "Fallback Cotización",
    date: "08/10 23:59 ART",
    title: "Fijación Cambiaria de Emergencia",
    description:
      "Feriado bancario; USD Blue fijado en base al último cierre oficial ($1.190) para mantener continuidad en la serie (TTL 48h).",
    impactScope: "Impacto: Divisa Benchmark",
    affectedSkus: "Cálculo aproximado",
    variant: "warning",
  },
  {
    id: "milestone-4",
    tag: "Regulación Oficial",
    date: "01/10 14:00 ART",
    title: "Ajuste de Precios Cuidados",
    description:
      "Renovación trimestral de acuerdos en cadenas minoristas. Pautas de incremento máximo del 4% mensual.",
    impactScope: "Impacto: Canasta Regulada",
    affectedSkus: "Acuerdo Nacional",
    variant: "default",
  },
  {
    id: "milestone-5",
    tag: "Shock Cambiario",
    date: "25/09 09:30 ART",
    title: "Salto Cambiario Blue +5.2%",
    description:
      "Aceleración brusca de la divisa de $1.140 a $1.200 por unidad. Presión inmediata en reposición de stock.",
    impactScope: "Impacto: Divisa Benchmark",
    affectedSkus: "+60 ARS / USD",
    variant: "error",
  },
  {
    id: "milestone-6",
    tag: "Cobertura Scraping",
    date: "18/09 10:00 ART",
    title: "Incorporación Tienda Musimundo",
    description:
      "Inicio formal del scraping diario forense con catálogo completo de electrodomésticos y tecnología.",
    impactScope: "Impacto: Catálogo Piloto",
    affectedSkus: "Tienda 4/4 Activa",
    variant: "success",
  },
];

export const ALERT_MILESTONES: AlertMilestoneItem[] = DEFAULT_ALERT_MILESTONES;

/**
 * Returns a slice of recent milestones (default: 3 items).
 */
export function getRecentMilestones(
  milestones: AlertMilestoneItem[] = ALERT_MILESTONES,
  count: number = 3
): AlertMilestoneItem[] {
  return milestones.slice(0, count);
}
