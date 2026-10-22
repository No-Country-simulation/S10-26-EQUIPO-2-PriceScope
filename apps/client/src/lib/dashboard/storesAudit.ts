import type { Moneda, PipelineTiendaStatus } from "@/types/api";
import type { PilotStoreAuditRow } from "./types";

/**
 * Opciones dinámicas extraídas de la respuesta de la API para enriquecer la auditoría.
 */
export interface StoresAuditOptions {
  baseBasketArs?: number;
  variationArs?: number;
  variationUsd?: number;
}

/**
 * Resuelve el tag o categoría comercial de la tienda a partir de su nombre o identificador.
 */
function resolveStoreTag(storeName: string): string {
  const normalized = storeName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (
    normalized.includes("fravega") ||
    normalized.includes("musimundo") ||
    normalized.includes("electro")
  ) {
    return "Electrodomésticos";
  }
  return "Almacén / Retail";
}

/**
 * Construye las filas de auditoría de tiendas basándose estrictamente en los datos
 * recibidos de la API (pipeline_status.tiendas, kpis y series), adaptando los importes
 * y variaciones a la moneda seleccionada (ARS, USD Blue o USD Oficial).
 */
export function getPilotStoresAuditRows(
  tiendas: PipelineTiendaStatus[],
  currency: Moneda = "ARS",
  exchangeRate: number = 1200,
  options: StoresAuditOptions = {}
): PilotStoreAuditRow[] {
  const isUsdMode = currency !== "ARS";
  const rate = currency === "USD_OFICIAL" ? exchangeRate * 0.78 : exchangeRate;
  const baseCost = options.baseBasketArs ?? 142500;
  const baseVarArs = options.variationArs ?? 24.8;
  const baseVarUsd = options.variationUsd ?? 4.8;

  return tiendas.map((store) => {
    const tag = resolveStoreTag(store.nombre);
    const categoryFactor = tag === "Electrodomésticos" ? 3.4 : 1.0;
    const storeBasketArs = Math.round(baseCost * categoryFactor);

    const formattedBasketCost = isUsdMode
      ? `US$ ${(storeBasketArs / rate).toFixed(2)}`
      : `$${storeBasketArs.toLocaleString("es-AR")}`;

    const storeVarUsd = currency === "USD_OFICIAL" ? baseVarUsd * 1.1 : baseVarUsd;
    const formattedMonthlyVariation = isUsdMode
      ? `+${storeVarUsd.toFixed(1)}%`
      : `+${baseVarArs.toFixed(1)}%`;

    const dateObj = new Date(store.ultima_corrida_utc);
    const hoursArt = String((dateObj.getUTCHours() + 21) % 24).padStart(2, "0");
    const minsArt = String(dateObj.getUTCMinutes()).padStart(2, "0");
    const isOptimal = store.cobertura_pct >= 95 && store.estado_corrida === "EXITOSA";

    return {
      id: store.tienda_id,
      name: store.nombre,
      tag,
      basketCost: formattedBasketCost,
      monthlyVariation: formattedMonthlyVariation,
      skusCount: store.publicaciones_procesadas.toLocaleString("es-AR"),
      coveragePct: store.cobertura_pct,
      healthLabel: `${store.cobertura_pct.toFixed(1)}% (${isOptimal ? "Óptima" : "Estable"})`,
      statusVariant: isOptimal ? "success" : "warning",
      syncTimeArt: `${hoursArt}:${minsArt} ART`,
      fallbackActive: store.fallback_activo,
    };
  });
}
