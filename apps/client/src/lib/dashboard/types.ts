import type { PuntoSerie } from "@/types/api";

export interface DashboardChartRow {
  [key: string]: unknown;
  fechaLabel: string;
  fechaIso: string;
  "Canasta Retail": number | null;
  "Dólar Blue (Ref. Cambiaria)": number | null;
  precioRegularArs: number | null;
  precioPromocionalArs: number | null;
  precioUsd: number | null;
  cotizacionAplicada: number | null;
  cotizacionAproximada: boolean;
  estadoDato: PuntoSerie["estado_dato"];
  motivo: string | null;
  isBoundary?: boolean;
}

export interface PilotStoreAuditRow {
  id: string;
  name: string;
  tag: string;
  basketCost: string;
  monthlyVariation: string;
  skusCount: string;
  coveragePct: number;
  healthLabel: string;
  statusVariant: "success" | "warning" | "error";
  syncTimeArt: string;
  fallbackActive: boolean;
}
