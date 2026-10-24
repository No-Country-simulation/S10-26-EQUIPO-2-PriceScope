import type { ObservacionTrazabilidadItem } from "@/types/api";

/**
 * Enriquecedor puro de observaciones forenses:
 * - Calcula la variación diaria porcentual (`variacion_diaria_pct`) comparando con el día anterior de la misma tienda.
 * - Para el registro base (el primer registro histórico de la serie sin día previo), muestra 0.0% indicando punto de partida estable.
 */
export function enrichTraceabilityObservations(
  observations: ObservacionTrazabilidadItem[]
): ObservacionTrazabilidadItem[] {
  // Las observaciones vienen en orden descendente por timestamp_utc
  return observations.map((obs, index) => {
    let variacion_diaria_pct: number | null = obs.variacion_diaria_pct ?? null;

    if (variacion_diaria_pct === null && obs.precio_regular !== null) {
      // Buscar la observación anterior (cronológicamente previa, por ende siguiente en el arreglo) de la misma tienda
      const previousObs = observations
        .slice(index + 1)
        .find(
          (o) =>
            o.tienda_id === obs.tienda_id &&
            o.precio_regular !== null &&
            o.precio_regular !== undefined
        );

      if (previousObs && previousObs.precio_regular && previousObs.precio_regular > 0) {
        const delta =
          ((obs.precio_regular - previousObs.precio_regular) / previousObs.precio_regular) * 100;
        variacion_diaria_pct = Math.round(delta * 10) / 10;
      } else {
        // Es la primera observación registrada de la serie histórica (registro base)
        variacion_diaria_pct = 0.0;
      }
    }

    return {
      ...obs,
      variacion_diaria_pct,
    };
  });
}
