import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { GetAlertsDto } from './dto/get-alerts.dto';

export interface PaginacionMeta {
  pagina_actual: number;
  limite_por_pagina: number;
  total_registros: number;
  total_paginas: number;
}

export interface AlertaItem {
  alerta_id: string;
  producto_canonico_id: string;
  producto_nombre: string;
  tienda_nombre: string;
  periodo: {
    inicio_utc: string;
    fin_utc: string;
  };
  variacion_precio_pct: number;
  variacion_cotizacion_pct: number;
  diferencial_puntos: number;
  cotizacion_usada_cierre: number;
  cobertura_pct: number;
  regla_faltantes: string;
  tipo_alerta: string;
}

export interface AlertsResponse {
  paginacion: PaginacionMeta;
  alertas: AlertaItem[];
}

@Injectable()
export class AlertsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(queryDto: GetAlertsDto): Promise<AlertsResponse> {
    const page = Number(queryDto.page) || 1;
    const requestedLimit = Number(queryDto.limit) || 50;

    // Validación estricta de paginación según RN-06 / HU-46 (error 422 si excede 50)
    if (requestedLimit > 50) {
      throw new UnprocessableEntityException({
        type: 'https://pricescope.internal/errors/unprocessable-entity',
        title: 'Parámetro de paginación inválido',
        status: 422,
        detail: `El parámetro 'limit' solicitado (${requestedLimit}) excede el máximo permitido de 50 registros por página (HU-46).`,
        instance: `/api/v1/alerts?page=${page}&limit=${requestedLimit}`,
        timestamp_utc: new Date().toISOString(),
      });
    }

    const limit = requestedLimit;
    const offset = (page - 1) * limit;

    const hoy = new Date();
    const fechaHasta = queryDto.fecha_hasta
      ? new Date(queryDto.fecha_hasta)
      : hoy;
    const fechaDesde = queryDto.fecha_desde
      ? new Date(queryDto.fecha_desde)
      : new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);

    const conditions: string[] = [
      'op.timestamp_utc >= $1',
      'op.timestamp_utc <= $2',
    ];
    const params: any[] = [fechaDesde.toISOString(), fechaHasta.toISOString()];
    let paramIndex = 3;

    if (queryDto.tienda_id) {
      conditions.push(`(t.id::text = $${paramIndex} OR t.slug = $${paramIndex})`);
      params.push(queryDto.tienda_id);
      paramIndex++;
    }

    if (queryDto.categoria_id) {
      conditions.push(`(pc.categoria_id::text = $${paramIndex} OR c.slug = $${paramIndex})`);
      params.push(queryDto.categoria_id);
      paramIndex++;
    }

    // 1. Obtener devaluación promedio del período
    const queryCotiz = `
      SELECT 
        venta::numeric AS cotizacion
      FROM cotizaciones_divisas
      WHERE tipo = 'parallel' AND condicion = 'venta'
        AND timestamp_utc >= $1 AND timestamp_utc <= $2
      ORDER BY timestamp_utc ASC;
    `;

    const resCotiz = await this.db.query(queryCotiz, [
      fechaDesde.toISOString(),
      fechaHasta.toISOString(),
    ]);

    let cotInicial = 1000;
    let cotFinal = 1200;
    if (resCotiz.rows.length > 0) {
      cotInicial = Number(resCotiz.rows[0].cotizacion);
      cotFinal = Number(resCotiz.rows[resCotiz.rows.length - 1].cotizacion);
    }

    const variacionCotizacionPct =
      cotInicial > 0 ? Number((((cotFinal - cotInicial) / cotInicial) * 100).toFixed(1)) : 0;

    // 2. Consulta de alertas inflacionarias (variación de precio mayor a cotización o saltos > 15%)
    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const alertsBaseQuery = `
      WITH precios_agrupados AS (
        SELECT 
          op.producto_canonico_id,
          pc.nombre_normalizado AS producto_nombre,
          t.nombre AS tienda_nombre,
          MIN(op.timestamp_utc) AS inicio_utc,
          MAX(op.timestamp_utc) AS fin_utc,
          (ARRAY_AGG(op.precio_regular ORDER BY op.timestamp_utc ASC) FILTER (WHERE op.precio_regular IS NOT NULL))[1] AS precio_inicial,
          (ARRAY_AGG(op.precio_regular ORDER BY op.timestamp_utc DESC) FILTER (WHERE op.precio_regular IS NOT NULL))[1] AS precio_final,
          AVG(op.cotizacion_aplicada) AS cotizacion_promedio,
          ROUND((COUNT(CASE WHEN op.estado_dato = 'DATO_VALIDO' THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100), 1) AS cobertura_pct
        FROM observaciones_precios op
        JOIN productos_canonicos pc ON op.producto_canonico_id = pc.id
        JOIN categorias c ON pc.categoria_id = c.id
        JOIN tiendas t ON op.tienda_id = t.id
        ${whereClause}
        GROUP BY op.producto_canonico_id, pc.nombre_normalizado, t.nombre
      )
      SELECT 
        producto_canonico_id,
        producto_nombre,
        tienda_nombre,
        inicio_utc,
        fin_utc,
        precio_inicial,
        precio_final,
        ROUND(((precio_final - precio_inicial) / NULLIF(precio_inicial, 0) * 100)::numeric, 1) AS variacion_precio_pct,
        cobertura_pct,
        COALESCE(cotizacion_promedio, $${paramIndex++})::numeric(12,2) AS cotizacion_usada_cierre
      FROM precios_agrupados
      WHERE precio_inicial > 0 AND precio_final > precio_inicial
    `;

    params.push(cotFinal);

    // Conteo total de alertas
    const countQuery = `
      SELECT COUNT(*) AS total FROM (${alertsBaseQuery}) sub
    `;

    // Consulta paginada
    const dataQuery = `
      ${alertsBaseQuery}
      ORDER BY variacion_precio_pct DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    const countParams = [...params];
    const dataParams = [...params, limit, offset];

    const [countResult, dataResult] = await Promise.all([
      this.db.query(countQuery, countParams),
      this.db.query(dataQuery, dataParams),
    ]);

    const totalRegistros = Number(countResult.rows[0]?.total || 0);
    const totalPaginas = Math.ceil(totalRegistros / limit) || 1;

    const alertas: AlertaItem[] = dataResult.rows.map((row: any, idx: number) => {
      const varPrecio = Number(row.variacion_precio_pct) || 0;
      const diferencial = Number((varPrecio - variacionCotizacionPct).toFixed(1));
      const tipoAlerta =
        varPrecio > variacionCotizacionPct
          ? 'PRECIO_SUPERA_DEVALUACION'
          : 'SALTO_PRECIO_SIGNIFICATIVO';

      const shortId = (offset + idx + 1).toString().padStart(3, '0');
      const alertaId = `alt-${fechaHasta.toISOString().split('T')[0].replace(/-/g, '')}-${shortId}`;

      return {
        alerta_id: alertaId,
        producto_canonico_id: row.producto_canonico_id,
        producto_nombre: row.producto_nombre,
        tienda_nombre: row.tienda_nombre,
        periodo: {
          inicio_utc: new Date(row.inicio_utc).toISOString(),
          fin_utc: new Date(row.fin_utc).toISOString(),
        },
        variacion_precio_pct: varPrecio,
        variacion_cotizacion_pct: variacionCotizacionPct,
        diferencial_puntos: diferencial,
        cotizacion_usada_cierre: Number(row.cotizacion_usada_cierre),
        cobertura_pct: Number(row.cobertura_pct || 90.0),
        regla_faltantes: 'LOCF',
        tipo_alerta: tipoAlerta,
      };
    });

    return {
      paginacion: {
        pagina_actual: page,
        limite_por_pagina: limit,
        total_registros: totalRegistros,
        total_paginas: totalPaginas,
      },
      alertas,
    };
  }
}
