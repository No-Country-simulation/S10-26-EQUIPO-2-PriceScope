import type { Moneda, PipelineTiendaStatus } from "@/types/api";
import type { PilotStoreAuditRow } from "./types";

/**
 * Opciones dinámicas extraídas de la respuesta de la API para enriquecer la auditoría.
 */
export interface StoresAuditOptions {
  baseBasketArs?: number;
  variationArs?: number;
  variationUsd?: number;
  hasNoData?: boolean;
  isSingleDay?: boolean;
}

/**
 * Resuelve el tag o categoría comercial de la tienda a partir de su nombre o identificador.
 */
function resolveStoreTag(): string {
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

  const isNoData = Boolean(options.hasNoData || options.baseBasketArs === 0);
  const isOneDay = Boolean(options.isSingleDay || options.variationArs === 0);

  const baseCost = isNoData ? 0 : (options.baseBasketArs ?? 0);
  const baseVarArs = isNoData || isOneDay ? 0 : (options.variationArs ?? 0);
  const baseVarUsd = isNoData || isOneDay ? 0 : (options.variationUsd ?? 0);

  return tiendas.map((store) => {
    const tag = resolveStoreTag();
    const storeBasketArs = baseCost;

    const formattedBasketCost = isNoData
      ? (isUsdMode ? "US$ 0.00" : "$0")
      : isUsdMode
        ? `US$ ${(storeBasketArs / rate).toFixed(2)}`
        : `$${storeBasketArs.toLocaleString("es-AR")}`;

    const formattedMonthlyVariation =
      isNoData || isOneDay || baseVarArs === 0
        ? "0.0%"
        : isUsdMode
          ? `${baseVarUsd > 0 ? "+" : ""}${baseVarUsd.toFixed(1)}%`
          : `${baseVarArs > 0 ? "+" : ""}${baseVarArs.toFixed(1)}%`;

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
