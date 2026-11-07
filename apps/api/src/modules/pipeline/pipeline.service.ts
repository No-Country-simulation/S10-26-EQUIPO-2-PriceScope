import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class PipelineService {
    constructor(private readonly db: DatabaseService) { }

    async getStatus() {
        // Consultamos la última ejecución o estado de las tiendas en la base de datos
        // Ajusta la consulta según los nombres de tus tablas de ejecuciones/scrapers
        const query = `
      SELECT 
        COUNT(DISTINCT tienda_id) as total_tiendas,
        MAX(timestamp_utc) as ultima_extraccion
      FROM observaciones_precios
    `;

        const result = await this.db.query(query);
        const row = result.rows[0];
        const ultimaExtraccion = row?.ultima_extraccion ? new Date(row.ultima_extraccion) : new Date();

        // Calcular diferencia en horas para el semáforo
        const horasDiferencia = (new Date().getTime() - ultimaExtraccion.getTime()) / (1000 * 60 * 60);

        let semaforo = 'VERDE';
        if (horasDiferencia > 24) {
            semaforo = 'ROJO';
        } else if (horasDiferencia > 12) {
            semaforo = 'AMARILLO';
        }

        return {
            estado_general: semaforo,
            ultima_actualizacion_utc: ultimaExtraccion.toISOString(),
            etl_activo: true,
            detalles: {
                total_tiendas_monitoreadas: Number(row?.total_tiendas || 0),
                horas_desde_ultima_sync: Number(horasDiferencia.toFixed(1)),
            },
            mensaje: `Pipeline operando bajo estatus ${semaforo}`
        };
    }
}