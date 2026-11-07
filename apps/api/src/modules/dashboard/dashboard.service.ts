import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { GetDashboardDto } from './dto/get-dashboard.dto';

@Injectable()
export class DashboardService {
    constructor(private readonly db: DatabaseService) { }

    async getDashboardData(dto: GetDashboardDto) {
        const hoy = new Date();

        // 1. Resolver fechas con valores por defecto (últimos 30 días)
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

        const diffTime = Math.abs(fechaHasta.getTime() - fechaDesde.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

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

        // 3. Evaluar Downsampling (HU-47): > 90 días usa intervalo semanal ('1w'), sino diario ('1d')
        const downsamplingAplicado = diffDays > 90;
        const intervaloAgrupacion = downsamplingAplicado ? '1w' : '1d';

        // 4. Consulta SQL para la mediana por categoría (filtrada por fechas)
        const queryCategorias = `
            SELECT 
                c.id AS categoria_id,
                c.slug AS categoria_slug,
                c.nombre AS categoria_nombre,
                COUNT(DISTINCT pc.id) AS cantidad_productos,
                COALESCE(
                    percentile_cont(0.5) WITHIN GROUP (
                        ORDER BY op.precio_regular
                    ), 
                    0
                )::NUMERIC(10, 2) AS variacion_mediana_pct
            FROM categorias c
            LEFT JOIN productos_canonicos pc ON pc.categoria_id = c.id
            LEFT JOIN observaciones_precios op ON op.producto_canonico_id = pc.id 
                AND op.estado_dato = 'DATO_VALIDO'
                AND op.precio_regular IS NOT NULL
                AND op.timestamp_utc >= $1
                AND op.timestamp_utc <= $2
            GROUP BY c.id, c.slug, c.nombre;
        `;

        // 5. Consulta SQL para el gráfico de evolución adaptada a las columnas reales del init.sql
        let querySeries = '';
        if (downsamplingAplicado) {
            querySeries = `
                SELECT 
                    asemanal.semana_utc AS timestamp_utc,
                    asemanal.precio_regular_mediana AS precio_regular,
                    NULL AS precio_promocional,
                    asemanal.precio_usd_mediana AS precio_usd,
                    'DATO_VALIDO' AS estado_dato,
                    NULL::NUMERIC(12,4) AS cotizacion_aplicada,
                    false AS cotizacion_aproximada,
                    NULL AS motivo
                FROM agg_precios_semanales asemanal
                WHERE asemanal.semana_utc >= $1 
                  AND asemanal.semana_utc <= $2
                ORDER BY asemanal.semana_utc ASC;
            `;
        } else {
            querySeries = `
                SELECT 
                    op.timestamp_utc,
                    op.precio_regular,
                    op.precio_promocional,
                    (op.precio_regular / NULLIF(op.cotizacion_aplicada, 0)) AS precio_usd,
                    op.estado_dato,
                    op.cotizacion_aplicada,
                    op.cotizacion_aproximada,
                    op.motivo_faltante AS motivo
                FROM observaciones_precios op
                WHERE op.timestamp_utc >= $1 
                  AND op.timestamp_utc <= $2
                ORDER BY op.timestamp_utc ASC;
            `;
        }

        try {
            const params = [fechaDesde.toISOString(), fechaHasta.toISOString()];

            const [resultCategorias, resultSeries] = await Promise.all([
                this.db.query(queryCategorias, params),
                this.db.query(querySeries, params),
            ]);

            return {
                contexto: {
                    frescura_datos_utc: new Date().toISOString(),
                    filtros_activos: {
                        moneda: dto.moneda || 'ARS',
                        fecha_desde: fechaDesde.toISOString().split('T')[0],
                        fecha_hasta: fechaHasta.toISOString().split('T')[0],
                        tienda_id: dto.tienda_id || null,
                        categoria_id: dto.categoria_id || null,
                    },
                },
                variacion_por_categoria: resultCategorias.rows.map((row) => ({
                    categoria_id: row.categoria_id,
                    categoria_slug: row.categoria_slug,
                    categoria_nombre: row.categoria_nombre,
                    cantidad_productos: Number(row.cantidad_productos),
                    variacion_mediana_pct: Number(row.variacion_mediana_pct),
                })),
                grafico_evolucion: {
                    metadata: {
                        downsampling_aplicado: downsamplingAplicado,
                        intervalo_agrupacion: intervaloAgrupacion,
                    },
                    hitos: [],
                    banda_calidad_diaria: [],
                    series: resultSeries.rows.map((row) => ({
                        timestamp_utc: row.timestamp_utc,
                        precio_regular: row.precio_regular !== null ? Number(row.precio_regular) : null,
                        precio_promocional: row.precio_promocional !== null ? Number(row.precio_promocional) : null,
                        precio_usd: row.precio_usd !== null ? Number(row.precio_usd) : null,
                        estado_dato: row.estado_dato,
                        cotizacion_aplicada: row.cotizacion_aplicada !== null ? Number(row.cotizacion_aplicada) : null,
                        cotizacion_aproximada: Boolean(row.cotizacion_aproximada),
                        motivo: row.motivo,
                    })),
                },
            };
        } catch (error) {
            console.error('Error detallado en DashboardService:', error);
            throw error;
        }
    }
}