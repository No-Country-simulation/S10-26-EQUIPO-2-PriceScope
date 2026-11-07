import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { PipelineService, PipelineStatusResponse } from '../pipeline/pipeline.service';
import { GetDashboardDto } from './dto/get-dashboard.dto';

export type Moneda = 'ARS' | 'USD' | 'USD_BLUE' | 'USD_OFICIAL';
export type EstadoDato = 'DATO_VALIDO' | 'AGOTADO' | 'ERROR_CAPTURA' | 'SIN_DATO';
export type EstadoSemaforo = 'VERDE' | 'AMARILLO' | 'ROJO';

export interface KpiVariacion {
  porcentaje: number;
  fecha_inicial: string;
  fecha_final?: string;
  cobertura_pct?: number;
  estado?: string;
  regla_faltantes?: string;
}

export interface VariacionCategoria {
  categoria_id: string;
  nombre: string;
  variacion_mediana_pct: number;
  cantidad_productos: number;
  cobertura_pct: number;
}

export interface PuntoSerie {
  timestamp_utc: string;
  precio_regular: number | null;
  precio_promocional: number | null;
  precio_usd: number | null;
  estado_dato: EstadoDato;
  cotizacion_aplicada: number | null;
  cotizacion_aproximada: boolean;
  motivo?: string | null;
}

export interface BandaCalidad {
  fecha: string;
  estado: EstadoSemaforo;
  porcentaje_completitud: number;
}

export interface HitoGrafico {
  id: string;
  fecha: string;
  titulo: string;
  descripcion: string;
  tipo: 'DEVALUACION' | 'REGULATORIO' | 'CRISIS';
}

export interface DashboardResponse {
  contexto: {
    frescura_datos_utc: string;
    filtros_activos: {
      moneda: Moneda;
      fecha_desde: string;
      fecha_hasta: string;
      tienda_id: string | null;
      categoria_id: string | null;
    };
  };
  kpis: {
    variacion_pesos: KpiVariacion;
    variacion_usd: {
      porcentaje: number;
      cotizacion_usada: number;
      fuente_cotizacion: string;
      tipo_cotizacion: string;
    };
    comparacion_devaluacion: {
      diferencial_puntos: number;
      variacion_precio_pct: number;
      variacion_cotizacion_pct: number;
    };
  };
  variacion_por_categoria: VariacionCategoria[];
  grafico_evolucion: {
    metadata: {
      downsampling_aplicado: boolean;
      intervalo_agrupacion: '1d' | '1w';
    };
    hitos: HitoGrafico[];
    banda_calidad_diaria: BandaCalidad[];
    series: PuntoSerie[];
  };
  pipeline_status: PipelineStatusResponse;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly db: DatabaseService,
    private readonly pipelineService: PipelineService,
  ) {}

  async getDashboardData(dto: GetDashboardDto): Promise<DashboardResponse> {
    const hoy = new Date();

    // 1. Fechas por defecto
    const fechaHasta = dto.fecha_hasta ? new Date(dto.fecha_hasta) : hoy;
    const fechaDesde = dto.fecha_desde
      ? new Date(dto.fecha_desde)
      : new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 2. Validar rango de fechas (RN-09)
    if (fechaDesde > fechaHasta) {
      throw new UnprocessableEntityException({
        type: 'https://pricescope.internal/errors/invalid-date-range',
        title: 'Rango de Fechas Inválido',
        status: 422,
        detail: 'La fecha_desde no puede ser posterior a la fecha_hasta.',
        instance: '/api/v1/dashboard',
        timestamp_utc: new Date().toISOString(),
      });
    }

    const diffDays = Math.ceil(
      Math.abs(fechaHasta.getTime() - fechaDesde.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays > 365) {
      throw new UnprocessableEntityException({
        type: 'https://pricescope.internal/errors/unprocessable-entity',
        title: 'Exceso de Rango Temporal',
        status: 422,
        detail: `El rango solicitado (${diffDays} días) excede el máximo permitido de 365 días (RN-09).`,
        instance: '/api/v1/dashboard',
        timestamp_utc: new Date().toISOString(),
      });
    }

    // 3. Downsampling (HU-47)
    const downsamplingAplicado = diffDays > 90;
    const intervaloAgrupacion: '1d' | '1w' = downsamplingAplicado ? '1w' : '1d';

    // 4. Filtros SQL
    const conditions: string[] = ['op.timestamp_utc >= $1', 'op.timestamp_utc <= $2'];
    const params: any[] = [fechaDesde.toISOString(), fechaHasta.toISOString()];
    let pIdx = 3;

    if (dto.tienda_id) {
      conditions.push(`op.tienda_id = $${pIdx++}`);
      params.push(dto.tienda_id);
    }
    if (dto.categoria_id) {
      conditions.push(`pc.categoria_id = $${pIdx++}`);
      params.push(dto.categoria_id);
    }

    // 5. Consultar variación por categoría mediante mediana
    const queryCategorias = `
      SELECT 
        c.id AS categoria_id,
        c.nombre AS nombre,
        COUNT(DISTINCT pc.id)::int AS cantidad_productos,
        COALESCE(
          percentile_cont(0.5) WITHIN GROUP (ORDER BY op.precio_regular), 
          0
        )::NUMERIC(10, 2) AS mediana_precio,
        ROUND(
          (COUNT(CASE WHEN op.estado_dato = 'DATO_VALIDO' THEN 1 END)::numeric / 
           NULLIF(COUNT(op.timestamp_utc), 0) * 100), 1
        ) AS cobertura_pct
      FROM categorias c
      LEFT JOIN productos_canonicos pc ON pc.categoria_id = c.id
      LEFT JOIN observaciones_precios op ON op.producto_canonico_id = pc.id 
        AND ${conditions.join(' AND ')}
      GROUP BY c.id, c.nombre
      ORDER BY c.nombre ASC;
    `;

    // 6. Consultar serie temporal (Downsampling semanal si > 90 días)
    let querySeries = '';
    if (downsamplingAplicado) {
      querySeries = `
        SELECT 
          date_trunc('week', op.timestamp_utc) AS timestamp_utc,
          percentile_cont(0.5) WITHIN GROUP (ORDER BY op.precio_regular)::numeric(14,2) AS precio_regular,
          NULL::numeric(14,2) AS precio_promocional,
          percentile_cont(0.5) WITHIN GROUP (ORDER BY (op.precio_regular / NULLIF(op.cotizacion_aplicada, 0)))::numeric(14,2) AS precio_usd,
          'DATO_VALIDO'::text AS estado_dato,
          AVG(op.cotizacion_aplicada)::numeric(12,4) AS cotizacion_aplicada,
          bool_or(op.cotizacion_aproximada) AS cotizacion_aproximada,
          NULL::text AS motivo
        FROM observaciones_precios op
        JOIN productos_canonicos pc ON op.producto_canonico_id = pc.id
        WHERE ${conditions.join(' AND ')}
          AND op.precio_regular IS NOT NULL
        GROUP BY date_trunc('week', op.timestamp_utc)
        ORDER BY timestamp_utc ASC;
      `;
    } else {
      querySeries = `
        SELECT 
          op.timestamp_utc,
          op.precio_regular,
          op.precio_promocional,
          (op.precio_regular / NULLIF(op.cotizacion_aplicada, 0))::numeric(14,2) AS precio_usd,
          op.estado_dato,
          op.cotizacion_aplicada,
          op.cotizacion_aproximada,
          op.motivo_faltante AS motivo
        FROM observaciones_precios op
        JOIN productos_canonicos pc ON op.producto_canonico_id = pc.id
        WHERE ${conditions.join(' AND ')}
        ORDER BY op.timestamp_utc ASC;
      `;
    }

    // 7. Consultar cotización de divisas (cierre actual y variación del período)
    const queryCotizaciones = `
      SELECT 
        venta::numeric AS cotizacion,
        timestamp_utc
      FROM cotizaciones_divisas
      WHERE tipo = 'parallel' AND condicion = 'venta'
        AND timestamp_utc >= $1 AND timestamp_utc <= $2
      ORDER BY timestamp_utc ASC;
    `;

    const [resCategorias, resSeries, resCotiz, pipelineStatus] = await Promise.all([
      this.db.query(queryCategorias, params),
      this.db.query(querySeries, params),
      this.db.query(queryCotizaciones, [fechaDesde.toISOString(), fechaHasta.toISOString()]),
      this.pipelineService.getStatus(),
    ]);

    // 8. Computar KPIs de inflación y devaluación
    const seriesRows = resSeries.rows;
    let varPesosPct = 0;
    let varUsdPct = 0;
    let cotInicial = 1000;
    let cotFinal = 1200;

    if (resCotiz.rows.length > 0) {
      cotInicial = Number(resCotiz.rows[0].cotizacion);
      cotFinal = Number(resCotiz.rows[resCotiz.rows.length - 1].cotizacion);
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

    // 9. Banda de calidad diaria
    const calidadMap = new Map<string, { total: number; validos: number }>();
    for (const row of seriesRows) {
      const fecha = new Date(row.timestamp_utc).toISOString().split('T')[0];
      const entry = calidadMap.get(fecha) || { total: 0, validos: 0 };
      entry.total++;
      if (row.estado_dato === 'DATO_VALIDO') entry.validos++;
      calidadMap.set(fecha, entry);
    }

    const banda_calidad_diaria: BandaCalidad[] = Array.from(calidadMap.entries()).map(
      ([fecha, counts]) => {
        const pct = counts.total > 0 ? (counts.validos / counts.total) * 100 : 100;
        let estado: EstadoSemaforo = 'VERDE';
        if (pct < 70) estado = 'ROJO';
        else if (pct < 90) estado = 'AMARILLO';
        return {
          fecha,
          estado,
          porcentaje_completitud: Number(pct.toFixed(1)),
        };
      },
    );

    return {
      contexto: {
        frescura_datos_utc: pipelineStatus.frescura_general_utc,
        filtros_activos: {
          moneda: dto.moneda || 'ARS',
          fecha_desde: fechaDesde.toISOString().split('T')[0],
          fecha_hasta: fechaHasta.toISOString().split('T')[0],
          tienda_id: dto.tienda_id || null,
          categoria_id: dto.categoria_id || null,
        },
      },
      kpis: {
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
      },
      variacion_por_categoria: resCategorias.rows.map((row: any) => ({
        categoria_id: row.categoria_id,
        nombre: row.nombre,
        variacion_mediana_pct: Number(row.mediana_precio || 0),
        cantidad_productos: Number(row.cantidad_productos || 0),
        cobertura_pct: Number(row.cobertura_pct || 100),
      })),
      grafico_evolucion: {
        metadata: {
          downsampling_aplicado: downsamplingAplicado,
          intervalo_agrupacion: intervaloAgrupacion,
        },
        hitos: [],
        banda_calidad_diaria,
        series: seriesRows.map((row: any) => ({
          timestamp_utc: new Date(row.timestamp_utc).toISOString(),
          precio_regular: row.precio_regular !== null ? Number(row.precio_regular) : null,
          precio_promocional:
            row.precio_promocional !== null ? Number(row.precio_promocional) : null,
          precio_usd: row.precio_usd !== null ? Number(row.precio_usd) : null,
          estado_dato: (row.estado_dato as EstadoDato) || 'DATO_VALIDO',
          cotizacion_aplicada:
            row.cotizacion_aplicada !== null ? Number(row.cotizacion_aplicada) : null,
          cotizacion_aproximada: Boolean(row.cotizacion_aproximada),
          motivo: row.motivo || null,
        })),
      },
      pipeline_status: pipelineStatus,
    };
  }
}
