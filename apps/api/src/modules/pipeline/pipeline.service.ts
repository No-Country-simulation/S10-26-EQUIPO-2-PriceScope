import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  PipelineStatusResponse,
  PipelineStoreDbRow,
  PipelineTiendaStatus,
} from './types/pipeline.types';

export * from './types/pipeline.types';

@Injectable()
export class PipelineService {
  constructor(private readonly db: DatabaseService) {}

  async getStatus(): Promise<PipelineStatusResponse> {
    const query = `
      WITH ultimas_corridas AS (
        SELECT DISTINCT ON (store_slug)
          store_slug,
          status,
          circuit_breaker_open,
          fallback_activo,
          products_processed,
          products_succeeded,
          products_with_problems,
          COALESCE(finished_at, started_at, created_at) AS ultima_corrida_utc
        FROM scrape_runs
        ORDER BY store_slug, COALESCE(finished_at, started_at, created_at) DESC
      ),
      ultimas_observaciones AS (
        SELECT 
          tienda_id,
          MAX(timestamp_utc) as ultima_obs_utc,
          COUNT(*) as total_obs
        FROM observaciones_precios
        GROUP BY tienda_id
      )
      SELECT 
        t.id AS tienda_uuid,
        t.slug AS tienda_id,
        t.nombre AS nombre,
        COALESCE(uc.ultima_corrida_utc, uo.ultima_obs_utc) AS ultima_corrida_utc,
        CASE 
          WHEN uc.status = 'EXITOSA' THEN 'EXITOSA'
          WHEN uc.status = 'ADVERTENCIA' THEN 'ADVERTENCIA'
          WHEN uc.status IN ('FALLIDA', 'ABORTADA') THEN 'FALLIDA'
          WHEN uc.status IS NULL AND uo.ultima_obs_utc IS NOT NULL THEN 'EXITOSA'
          ELSE 'FALLIDA'
        END AS estado_corrida,
        COALESCE(uc.circuit_breaker_open, false) AS circuit_breaker_open,
        COALESCE(uc.fallback_activo, false) AS fallback_activo,
        COALESCE(uc.products_processed, uo.total_obs, 0)::int AS publicaciones_procesadas,
        COALESCE(uc.products_with_problems, 0)::int AS publicaciones_fallidas
      FROM tiendas t
      LEFT JOIN ultimas_corridas uc ON t.slug = uc.store_slug
      LEFT JOIN ultimas_observaciones uo ON t.id = uo.tienda_id
      WHERE t.activo = TRUE
      ORDER BY t.nombre ASC;
    `;

    const result = await this.db.query(query);
    const rows = result.rows as PipelineStoreDbRow[];
    const ahora = Date.now();
    let maxDiferenciaHoras = 0;
    let tieneAtraso24h = false;
    let fechaMasReciente: Date | null = null;

    const tiendas: PipelineTiendaStatus[] = rows.map((row) => {
      const fechaCorrida = row.ultima_corrida_utc ? new Date(row.ultima_corrida_utc) : null;
      let diffHoras = 999;

      if (fechaCorrida && !isNaN(fechaCorrida.getTime())) {
        diffHoras = (ahora - fechaCorrida.getTime()) / (1000 * 60 * 60);
        if (!fechaMasReciente || fechaCorrida > fechaMasReciente) {
          fechaMasReciente = fechaCorrida;
        }
      }

      if (diffHoras > maxDiferenciaHoras) {
        maxDiferenciaHoras = diffHoras;
      }
      if (diffHoras > 24) {
        tieneAtraso24h = true;
      }

      const procesadas = Number(row.publicaciones_procesadas) || 0;
      const fallidas = Number(row.publicaciones_fallidas) || 0;
      const total = procesadas + fallidas;
      const cobertura =
        total > 0 ? (procesadas / total) * 100 : row.estado_corrida === 'EXITOSA' ? 100 : 0;

      return {
        tienda_id: row.tienda_id,
        nombre: row.nombre,
        ultima_corrida_utc: fechaCorrida ? fechaCorrida.toISOString() : new Date(0).toISOString(),
        estado_corrida: (row.estado_corrida as 'EXITOSA' | 'ADVERTENCIA' | 'FALLIDA') || 'FALLIDA',
        circuit_breaker_open: Boolean(row.circuit_breaker_open),
        fallback_activo: Boolean(row.fallback_activo),
        publicaciones_procesadas: procesadas,
        publicaciones_fallidas: fallidas,
        cobertura_pct: Number(cobertura.toFixed(1)),
      };
    });

    let estado_global: 'OPERATIVO' | 'DEGRADADO' | 'CRITICO' = 'OPERATIVO';
    if (!fechaMasReciente || tiendas.length === 0 || maxDiferenciaHoras > 24) {
      estado_global = 'CRITICO';
    } else if (maxDiferenciaHoras > 12 || tiendas.some((t) => t.estado_corrida !== 'EXITOSA')) {
      estado_global = 'DEGRADADO';
    }

    return {
      estado_global,
      frescura_general_utc: fechaMasReciente
        ? fechaMasReciente.toISOString()
        : new Date(0).toISOString(),
      alerta_atraso_24h: tieneAtraso24h,
      tiendas,
    };
  }
}