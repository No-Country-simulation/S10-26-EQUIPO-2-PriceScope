import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { PipelineService } from '../pipeline/pipeline.service';
import { CierreCambiarioService } from '../currency/cierre-cambiario.service';
import { GetDashboardDto } from './dto/get-dashboard.dto';
import {
  CategoriaDbRow,
  CotizacionDbRow,
  DashboardResponse,
  SeriesDbRow,
} from './types/dashboard.types';
import {
  calculateInflationKpis,
  calculateQualityBands,
  mapCategoryRows,
  mapSeriesRows,
} from './utils/dashboard-calculator.util';

@Injectable()
export class DashboardService {
  constructor(
    private readonly db: DatabaseService,
    private readonly pipelineService: PipelineService,
    private readonly cierreCambiario: CierreCambiarioService,
  ) { }

  async getDashboardData(dto: GetDashboardDto): Promise<DashboardResponse> {
    const { fechaDesde, fechaHasta, diffDays } = this.resolveAndValidateDates(dto);
    const downsamplingAplicado = diffDays > 90;
    const intervaloAgrupacion: '1d' | '1w' = downsamplingAplicado ? '1w' : '1d';

    const [resCategorias, resSeries, resCotiz, pipelineStatus] = await Promise.all([
      this.fetchCategoryMedians(dto, fechaDesde, fechaHasta),
      this.fetchSeriesData(dto, fechaDesde, fechaHasta, downsamplingAplicado),
      this.fetchCurrencyRates(fechaDesde, fechaHasta),
      this.pipelineService.getStatus(),
    ]);

    const kpis = calculateInflationKpis(resSeries, resCotiz, fechaDesde, fechaHasta);
    const bandaCalidad = calculateQualityBands(resSeries);

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
      kpis,
      variacion_por_categoria: mapCategoryRows(resCategorias),
      grafico_evolucion: {
        metadata: {
          downsampling_aplicado: downsamplingAplicado,
          intervalo_agrupacion: intervaloAgrupacion,
        },
        hitos: [],
        banda_calidad_diaria: bandaCalidad,
        series: mapSeriesRows(resSeries),
      },
      pipeline_status: pipelineStatus,
    };
  }

  private resolveAndValidateDates(dto: GetDashboardDto) {
    const hoy = new Date();
    const fechaHasta = dto.fecha_hasta ? new Date(dto.fecha_hasta) : hoy;
    const fechaDesde = dto.fecha_desde
      ? new Date(dto.fecha_desde)
      : new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);

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

    return { fechaDesde, fechaHasta, diffDays };
  }

  private async fetchCategoryMedians(
    dto: GetDashboardDto,
    desde: Date,
    hasta: Date,
  ): Promise<CategoriaDbRow[]> {
    const conditions = ['op.timestamp_utc >= $1', 'op.timestamp_utc <= $2'];
    const params: (string | number)[] = [desde.toISOString(), hasta.toISOString()];
    let pIdx = 3;

    if (dto.tienda_id) {
      conditions.push(`op.tienda_id = $${pIdx++}`);
      params.push(dto.tienda_id);
    }
    if (dto.categoria_id) {
      conditions.push(`pc.categoria_id = $${pIdx++}`);
      params.push(dto.categoria_id);
    }

    const query = `
      SELECT 
        c.id AS categoria_id,
        c.nombre AS nombre,
        COUNT(DISTINCT pc.id)::int AS cantidad_productos,
        COALESCE(
          percentile_cont(0.5) WITHIN GROUP (ORDER BY op.precio_regular), 0
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

    const res = await this.db.query(query, params);
    return res.rows as CategoriaDbRow[];
  }

  private async fetchSeriesData(
    dto: GetDashboardDto,
    desde: Date,
    hasta: Date,
    downsampling: boolean,
  ): Promise<SeriesDbRow[]> {
    const conditions = ['op.timestamp_utc >= $1', 'op.timestamp_utc <= $2'];
    const params: (string | number)[] = [desde.toISOString(), hasta.toISOString()];
    let pIdx = 3;

    if (dto.tienda_id) {
      conditions.push(`op.tienda_id = $${pIdx++}`);
      params.push(dto.tienda_id);
    }
    if (dto.categoria_id) {
      conditions.push(`pc.categoria_id = $${pIdx++}`);
      params.push(dto.categoria_id);
    }

    const query = downsampling
      ? `
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
        WHERE ${conditions.join(' AND ')} AND op.precio_regular IS NOT NULL
        GROUP BY date_trunc('week', op.timestamp_utc)
        ORDER BY timestamp_utc ASC;
      `
      : `
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

    const res = await this.db.query(query, params);
    return res.rows as SeriesDbRow[];
  }

  private async fetchCurrencyRates(desde: Date, hasta: Date): Promise<CotizacionDbRow[]> {
    const { inicial, final } = await this.cierreCambiario.obtenerVariacionPeriodo(desde, hasta);
    if (inicial.cotizacionAplicada === null || final.cotizacionAplicada === null) return [];

    return [
      { cotizacion: inicial.cotizacionAplicada, timestamp_utc: desde },
      { cotizacion: final.cotizacionAplicada, timestamp_utc: hasta },
    ];
  }
}
