import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

// Si deseas tipar los filtros, puedes extender PaginationQueryDto o manejarlos opcionales
export class GetAlertsDto extends PaginationQueryDto {
    fecha_desde?: string;
    fecha_hasta?: string;
    tienda_id?: string;
    categoria_id?: string;
}

@Injectable()
export class AlertsService {
    constructor(private readonly db: DatabaseService) { }

    async findAll(queryDto: GetAlertsDto) {
        const page = Number(queryDto.page) || 1;
        const limit = Math.min(Number(queryDto.limit) || 50, 50);
        const offset = (page - 1) * limit;

        const { fecha_desde, fecha_hasta, tienda_id, categoria_id } = queryDto;

        const conditions: string[] = ["op.estado_dato != 'DATO_VALIDO'"];
        const params: any[] = [];
        let paramIndex = 1;

        if (fecha_desde) {
            conditions.push(`op.timestamp_utc >= $${paramIndex++}`);
            params.push(fecha_desde);
        }

        if (fecha_hasta) {
            conditions.push(`op.timestamp_utc <= $${paramIndex++}`);
            params.push(fecha_hasta);
        }

        if (tienda_id) {
            conditions.push(`op.tienda_id = $${paramIndex++}`);
            params.push(tienda_id);
        }

        if (categoria_id) {
            conditions.push(`pc.categoria_id = $${paramIndex++}`);
            params.push(categoria_id);
        }

        const whereClause = `WHERE ${conditions.join(' AND ')}`;

        // Consulta para el conteo total con filtros
        const countQuery = `
            SELECT COUNT(*) AS total
            FROM observaciones_precios op
            JOIN productos_canonicos pc ON op.producto_canonico_id = pc.id
            ${whereClause}
        `;

        // Consulta principal paginada con datos reales
        const dataQuery = `
            SELECT 
                op.timestamp_utc,
                op.producto_canonico_id,
                pc.nombre_normalizado AS producto_nombre,
                op.tienda_id,
                t.nombre AS tienda_nombre,
                op.estado_dato,
                op.motivo_faltante
            FROM observaciones_precios op
            JOIN productos_canonicos pc ON op.producto_canonico_id = pc.id
            JOIN tiendas t ON op.tienda_id = t.id
            ${whereClause}
            ORDER BY op.timestamp_utc DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;

        const countParams = [...params];
        const dataParams = [...params, limit, offset];

        const [countResult, dataResult] = await Promise.all([
            this.db.query(countQuery, countParams),
            this.db.query(dataQuery, dataParams),
        ]);

        const total_registros = Number(countResult.rows[0]?.total || 0);
        const total_paginas = Math.ceil(total_registros / limit);

        return {
            alertas: dataResult.rows.map((row) => ({
                timestamp_utc: row.timestamp_utc,
                producto_canonico_id: row.producto_canonico_id,
                producto_nombre: row.producto_nombre,
                tienda_id: row.tienda_id,
                tienda_nombre: row.tienda_nombre,
                estado_dato: row.estado_dato,
                motivo_faltante: row.motivo_faltante,
            })),
            paginacion: {
                pagina_actual: page,
                limite_por_pagina: limit,
                total_registros,
                total_paginas,
            },
        };
    }
}