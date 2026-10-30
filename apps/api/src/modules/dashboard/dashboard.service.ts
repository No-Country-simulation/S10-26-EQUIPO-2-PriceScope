import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class DashboardService {
    constructor(private readonly db: DatabaseService) { }

    async getDashboardData() {
        const query = `
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
            GROUP BY c.id, c.slug, c.nombre;
        `;

        try {
            const result = await this.db.query(query);

            return {
                variacion_por_categoria: result.rows.map((row) => ({
                    categoria_id: row.categoria_id,
                    categoria_slug: row.categoria_slug,
                    categoria_nombre: row.categoria_nombre,
                    cantidad_productos: Number(row.cantidad_productos),
                    variacion_mediana_pct: Number(row.variacion_mediana_pct),
                })),
            };
        } catch (error) {
            console.error('Error detallado en DashboardService:', error);
            throw error; // Para que NestJS devuelva el 500 con el mensaje exacto de PostgreSQL
        }
    }
}