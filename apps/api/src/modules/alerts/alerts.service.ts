import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CierreCambiarioService } from '../currency/cierre-cambiario.service';
import { GetAlertsDto } from './dto/get-alerts.dto';
import { AlertaDbRow, AlertaItem, AlertsResponse } from './types/alerts.types';

export * from './types/alerts.types';

@Injectable()
export class AlertsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly cierreCambiario: CierreCambiarioService,
  ) { }

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
    const fechaHasta = queryDto.fecha_hasta ? new Date(queryDto.fecha_hasta) : hoy;
    const fechaDesde = queryDto.fecha_desde
      ? new Date(queryDto.fecha_desde)
      : new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);

    const devaluacion = await this.fetchPeriodDevaluation(fechaDesde, fechaHasta);
    if (devaluacion === null) {
      // Sin cotización de cierre no se puede comparar contra el dólar: no se inventan valores.
      return {
        paginacion: { pagina_actual: page, limite_por_pagina: limit, total_registros: 0, total_paginas: 1 },
        alertas: [],
      };
    }
    const { cotFinal, variacionCotizacionPct } = devaluacion;

    const { totalRegistros, totalPaginas, rows } = await this.queryAlertsData(
      queryDto,
      fechaDesde,
      fechaHasta,
      cotFinal,
      limit,
      offset,
    );

    const alertas: AlertaItem[] = rows.map((row, idx) => {
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

  /** Primera y última captura válida dentro del período pedido (la ventana real de los precios). */
  private async fetchVentanaObservaciones(desde: Date, hasta: Date) {
    const res = await this.db.query<{ inicio: Date | null; fin: Date | null }>(
      `SELECT MIN(timestamp_utc) AS inicio, MAX(timestamp_utc) AS fin
       FROM observaciones_precios
       WHERE estado_dato = 'DATO_VALIDO' AND timestamp_utc >= $1 AND timestamp_utc <= $2;`,
      [desde.toISOString(), hasta.toISOString()],
    );
    const fila = res.rows[0];
    return fila?.inicio && fila?.fin
      ? { inicio: new Date(fila.inicio), fin: new Date(fila.fin) }
      : null;
  }

  /** Variación del dólar (cierre) en la misma ventana en que se midieron los precios. */
  private async fetchPeriodDevaluation(desde: Date, hasta: Date) {
    const query = `
      SELECT valor::numeric AS cotizacion
      FROM cotizaciones_divisas
      WHERE tipo = 'parallel' AND condicion = 'venta'
        AND timestamp_utc >= $1 AND timestamp_utc <= $2
      ORDER BY timestamp_utc ASC;
    `;
    const res = await this.db.query(query, [desde.toISOString(), hasta.toISOString()]);
    const rows = res.rows as CotizacionSimpleRow[];

    let cotInicial = 1000;
    let cotFinal = 1200;
    if (rows.length > 0) {
      cotInicial = Number(rows[0].cotizacion);
      cotFinal = Number(rows[rows.length - 1].cotizacion);
    }

    const { inicial, final, variacionPct } = await this.cierreCambiario.obtenerVariacionPeriodo(
      ventana.inicio,
      ventana.fin,
    );
    if (
      inicial.cotizacionAplicada === null ||
      final.cotizacionAplicada === null ||
      variacionPct === null
    ) {
      return null;
    }

    return { cotFinal: final.cotizacionAplicada, variacionCotizacionPct: variacionPct };
  }

  private async queryAlertsData(
    dto: GetAlertsDto,
    desde: Date,
    hasta: Date,
    cotFinal: number,
    limit: number,
    offset: number,
  ) {
    const conditions: string[] = ['op.timestamp_utc >= $1', 'op.timestamp_utc <= $2'];
    const params: (string | number)[] = [desde.toISOString(), hasta.toISOString()];
    let pIdx = 3;

    if (dto.tienda_id) {
      conditions.push(`(t.id::text = $${pIdx} OR t.slug = $${pIdx})`);
      params.push(dto.tienda_id);
      pIdx++;
    }
    if (dto.categoria_id) {
      conditions.push(`(pc.categoria_id::text = $${pIdx} OR c.slug = $${pIdx})`);
      params.push(dto.categoria_id);
      pIdx++;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const baseQuery = `
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
        COALESCE(cotizacion_promedio, $${pIdx++})::numeric(12,2) AS cotizacion_usada_cierre
      FROM precios_agrupados
      WHERE precio_inicial > 0 AND precio_final > precio_inicial
    `;
    params.push(cotFinal);

    const countQuery = `SELECT COUNT(*) AS total FROM (${baseQuery}) sub`;
    const dataQuery = `${baseQuery} ORDER BY variacion_precio_pct DESC LIMIT $${pIdx++} OFFSET $${pIdx++}`;

    const [countResult, dataResult] = await Promise.all([
      this.db.query(countQuery, [...params]),
      this.db.query(dataQuery, [...params, limit, offset]),
    ]);

    const totalRegistros = Number(countResult.rows[0]?.total || 0);
    const totalPaginas = Math.ceil(totalRegistros / limit) || 1;

    return {
      totalRegistros,
      totalPaginas,
      rows: dataResult.rows as AlertaDbRow[],
    };
  }
}