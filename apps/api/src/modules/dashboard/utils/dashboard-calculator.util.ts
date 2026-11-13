import {
  BandaCalidad,
  CategoriaDbRow,
  CotizacionDbRow,
  EstadoDato,
  EstadoSemaforo,
  PuntoSerie,
  SeriesDbRow,
  VariacionCategoria,
} from '../types/dashboard.types';

export function calculateInflationKpis(
  seriesRows: SeriesDbRow[],
  cotizRows: CotizacionDbRow[],
  fechaDesde: Date,
  fechaHasta: Date,
) {
  let varPesosPct = 0;
  let varUsdPct = 0;
  let cotInicial = 1000;
  let cotFinal = 1200;

  if (cotizRows.length > 0) {
    cotInicial = Number(cotizRows[0].cotizacion);
    cotFinal = Number(cotizRows[cotizRows.length - 1].cotizacion);
  }

  if (seriesRows.length > 1) {
    const pInicial = Number(seriesRows[0].precio_regular) || 0;
    const pFinal = Number(seriesRows[seriesRows.length - 1].precio_regular) || 0;
    if (pInicial > 0) {
      varPesosPct = Number((((pFinal - pInicial) / pInicial) * 100).toFixed(1));
    }

    const pUsdInicial = Number(seriesRows[0].precio_usd) || 0;
    const pUsdFinal = Number(seriesRows[seriesRows.length - 1].precio_usd) || 0;
    if (pUsdInicial > 0) {
      varUsdPct = Number((((pUsdFinal - pUsdInicial) / pUsdInicial) * 100).toFixed(1));
    }
  }

  const varCotizPct =
    cotInicial > 0 ? Number((((cotFinal - cotInicial) / cotInicial) * 100).toFixed(1)) : 0;
  const diferencialPuntos = Number((varPesosPct - varCotizPct).toFixed(1));

  return {
    variacion_pesos: {
      porcentaje: varPesosPct,
      fecha_inicial: fechaDesde.toISOString(),
      fecha_final: fechaHasta.toISOString(),
      cobertura_pct: 98.5,
      estado: 'SUFICIENTE',
      regla_faltantes: 'LOCF',
    },
    variacion_usd: {
      porcentaje: varUsdPct,
      cotizacion_usada: cotFinal,
      fuente_cotizacion: 'DolarAPI_Cierre',
      tipo_cotizacion: 'BLUE',
    },
    comparacion_devaluacion: {
      diferencial_puntos: diferencialPuntos,
      variacion_precio_pct: varPesosPct,
      variacion_cotizacion_pct: varCotizPct,
    },
  };
}

export function calculateQualityBands(seriesRows: SeriesDbRow[]): BandaCalidad[] {
  const calidadMap = new Map<string, { total: number; validos: number }>();

  for (const row of seriesRows) {
    const fecha = new Date(row.timestamp_utc).toISOString().split('T')[0];
    const entry = calidadMap.get(fecha) || { total: 0, validos: 0 };
    entry.total++;
    if (row.estado_dato === 'DATO_VALIDO') entry.validos++;
    calidadMap.set(fecha, entry);
  }

  return Array.from(calidadMap.entries()).map(([fecha, counts]) => {
    const pct = counts.total > 0 ? (counts.validos / counts.total) * 100 : 100;
    let estado: EstadoSemaforo = 'VERDE';
    if (pct < 70) estado = 'ROJO';
    else if (pct < 90) estado = 'AMARILLO';

    return {
      fecha,
      estado,
      porcentaje_completitud: Number(pct.toFixed(1)),
    };
  });
}

export function mapCategoryRows(rows: CategoriaDbRow[]): VariacionCategoria[] {
  return rows.map((row) => ({
    categoria_id: row.categoria_id,
    nombre: row.nombre,
    variacion_mediana_pct: Number(row.mediana_precio || 0),
    cantidad_productos: Number(row.cantidad_productos || 0),
    cobertura_pct: Number(row.cobertura_pct || 100),
  }));
}

export function mapSeriesRows(rows: SeriesDbRow[]): PuntoSerie[] {
  return rows.map((row) => ({
    timestamp_utc: new Date(row.timestamp_utc).toISOString(),
    precio_regular: row.precio_regular !== null ? Number(row.precio_regular) : null,
    precio_promocional: row.precio_promocional !== null ? Number(row.precio_promocional) : null,
    precio_usd: row.precio_usd !== null ? Number(row.precio_usd) : null,
    estado_dato: (row.estado_dato as EstadoDato) || 'DATO_VALIDO',
    cotizacion_aplicada: row.cotizacion_aplicada !== null ? Number(row.cotizacion_aplicada) : null,
    cotizacion_aproximada: Boolean(row.cotizacion_aproximada),
    motivo: row.motivo || null,
  }));
}
