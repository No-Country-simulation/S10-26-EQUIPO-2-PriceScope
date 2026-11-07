import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { GetTraceabilityDto } from './dto/get-traceability.dto';

export type UnidadMedida = 'kg' | 'L' | 'unidad';
export type EstadoDato = 'DATO_VALIDO' | 'AGOTADO' | 'ERROR_CAPTURA' | 'SIN_DATO';

export interface ProductoCanonicoDetalle {
  id: string;
  slug: string;
  nombre_normalizado: string;
  marca: string;
  modelo: string | null;
  categoria: string;
  contenido_neto_valor: number;
  contenido_neto_unidad: UnidadMedida;
  pack: string;
}

export interface ObservacionTrazabilidadItem {
  timestamp_utc: string;
  tienda_id: string;
  tienda_nombre: string;
  url_origen: string;
  sku_tienda: string | null;
  alias_producto: string;
  precio_regular: number | null;
  precio_promocional: number | null;
  precio_por_unidad: number | null;
  unidad_medida: UnidadMedida;
  precio_usd: number | null;
  estado_dato: EstadoDato;
  cotizacion_aplicada: number | null;
  cotizacion_aproximada: boolean;
  fuente_cotizacion: string | null;
  motivo_faltante?: string | null;
  variacion_diaria_pct?: number | null;
}

export interface HitoReduflacionItem {
  id: string;
  timestamp_utc: string;
  tipo: 'REDUFLACION';
  titulo: string;
  descripcion: string;
  impacto: string;
  contenido_anterior_valor: number;
  contenido_nuevo_valor: number;
  unidad_medida: UnidadMedida;
  variacion_gramaje_pct: number;
  salto_precio_unitario_pct: number;
}

export interface TraceabilityResponse {
  producto: ProductoCanonicoDetalle;
  hitos_reduflacion?: HitoReduflacionItem[];
  historico_observaciones: ObservacionTrazabilidadItem[];
}

@Injectable()
export class ProductsService {
  constructor(private readonly db: DatabaseService) {}

  async getProductTraceability(
    idOrSlug: string,
    dto: GetTraceabilityDto,
  ): Promise<TraceabilityResponse> {
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        idOrSlug,
      );

    // 1. Consultar el producto canónico y su categoría
    const productQuery = `
      SELECT 
        pc.id,
        pc.slug,
        pc.nombre_normalizado,
        pc.marca,
        pc.modelo,
        c.nombre AS categoria_nombre,
        pc.contenido_neto_valor,
        pc.contenido_neto_unidad,
        pc.pack
      FROM productos_canonicos pc
      JOIN categorias c ON pc.categoria_id = c.id
      WHERE ${isUUID ? 'pc.id = $1' : 'pc.slug = $1'}
      LIMIT 1;
    `;

    const productResult = await this.db.query(productQuery, [idOrSlug]);
    if (productResult.rows.length === 0) {
      throw new NotFoundException({
        type: 'https://pricescope.internal/errors/product-not-found',
        title: 'Producto Canónico No Encontrado',
        status: 404,
        detail: `No se encontró ningún producto canónico con identificador o slug '${idOrSlug}'.`,
        instance: `/api/v1/products/${idOrSlug}/traceability`,
        timestamp_utc: new Date().toISOString(),
      });
    }

    const prod = productResult.rows[0];
    const canonicalId = prod.id;

    // 2. Consultar historial de contenido (reduflación)
    const reduflacionQuery = `
      SELECT 
        id,
        fecha_desde_utc,
        contenido_neto_valor,
        contenido_neto_unidad,
        pack,
        motivo_evento,
        created_at
      FROM historial_contenido
      WHERE producto_canonico_id = $1
      ORDER BY fecha_desde_utc ASC;
    `;

    const reduflacionResult = await this.db.query(reduflacionQuery, [canonicalId]);
    const hitos_reduflacion: HitoReduflacionItem[] = [];

    for (let i = 1; i < reduflacionResult.rows.length; i++) {
      const prev = reduflacionResult.rows[i - 1];
      const curr = reduflacionResult.rows[i];
      const valAnt = Number(prev.contenido_neto_valor);
      const valNuevo = Number(curr.contenido_neto_valor);
      const varPct = valAnt > 0 ? Number((((valNuevo - valAnt) / valAnt) * 100).toFixed(1)) : 0;

      hitos_reduflacion.push({
        id: String(curr.id),
        timestamp_utc: new Date(curr.fecha_desde_utc).toISOString(),
        tipo: 'REDUFLACION',
        titulo: `Cambio de gramaje (${curr.motivo_evento || 'Reduflación'})`,
        descripcion: `Contenido reducido de ${valAnt}${prev.contenido_neto_unidad} a ${valNuevo}${curr.contenido_neto_unidad}`,
        impacto: varPct < 0 ? `Reducción neta del ${Math.abs(varPct)}%` : `Aumento del ${varPct}%`,
        contenido_anterior_valor: valAnt,
        contenido_nuevo_valor: valNuevo,
        unidad_medida: curr.contenido_neto_unidad as UnidadMedida,
        variacion_gramaje_pct: varPct,
        salto_precio_unitario_pct: varPct !== 0 ? Number((Math.abs(varPct) * 1.1).toFixed(1)) : 0,
      });
    }

    // 3. Consultar observaciones de precios con filtros opcionales
    const conditions: string[] = ['op.producto_canonico_id = $1'];
    const params: any[] = [canonicalId];
    let paramIndex = 2;

    if (dto.fecha_desde) {
      conditions.push(`op.timestamp_utc >= $${paramIndex++}`);
      params.push(dto.fecha_desde);
    }
    if (dto.fecha_hasta) {
      conditions.push(`op.timestamp_utc <= $${paramIndex++}`);
      params.push(dto.fecha_hasta);
    }
    if (dto.tienda_id) {
      const isTiendaUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          dto.tienda_id,
        );
      if (isTiendaUUID) {
        conditions.push(`t.id = $${paramIndex++}`);
      } else {
        conditions.push(`t.slug = $${paramIndex++}`);
      }
      params.push(dto.tienda_id);
    }

    const obsQuery = `
      SELECT 
        op.timestamp_utc,
        t.slug AS tienda_id,
        t.nombre AS tienda_nombre,
        COALESCE(at.url_origen, t.url_base) AS url_origen,
        at.sku_tienda,
        COALESCE(at.alias_producto, pc.nombre_normalizado) AS alias_producto,
        op.precio_regular,
        op.precio_promocional,
        op.precio_por_unidad,
        pc.contenido_neto_unidad AS unidad_medida,
        op.estado_dato,
        op.cotizacion_aplicada,
        op.cotizacion_aproximada,
        op.fuente_cotizacion,
        op.motivo_faltante
      FROM observaciones_precios op
      JOIN tiendas t ON op.tienda_id = t.id
      JOIN productos_canonicos pc ON op.producto_canonico_id = pc.id
      LEFT JOIN alias_tienda at ON op.alias_tienda_id = at.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY op.timestamp_utc DESC;
    `;

    const obsResult = await this.db.query(obsQuery, params);

    const historico_observaciones: ObservacionTrazabilidadItem[] = obsResult.rows.map(
      (row: any, idx: number, arr: any[]) => {
        // Validación anti-cero (RN-04): nunca devolver 0 en precios de faltantes
        let regular = row.precio_regular !== null ? Number(row.precio_regular) : null;
        let promocional = row.precio_promocional !== null ? Number(row.precio_promocional) : null;
        let porUnidad = row.precio_por_unidad !== null ? Number(row.precio_por_unidad) : null;

        if (regular === 0) regular = null;
        if (promocional === 0) promocional = null;
        if (porUnidad === 0) porUnidad = null;

        const cotizacion =
          row.cotizacion_aplicada !== null ? Number(row.cotizacion_aplicada) : null;
        const precioUsd =
          regular !== null && cotizacion !== null && cotizacion > 0
            ? Number((regular / cotizacion).toFixed(2))
            : null;

        // Calcular variación con la observación anterior de la misma tienda (si existe)
        let variacion_diaria_pct: number | null = null;
        const obsAnterior = arr.slice(idx + 1).find((o) => o.tienda_id === row.tienda_id);
        if (obsAnterior && obsAnterior.precio_regular && regular) {
          const precioAnt = Number(obsAnterior.precio_regular);
          if (precioAnt > 0) {
            variacion_diaria_pct = Number(
              (((regular - precioAnt) / precioAnt) * 100).toFixed(2),
            );
          }
        }

        return {
          timestamp_utc: new Date(row.timestamp_utc).toISOString(),
          tienda_id: row.tienda_id,
          tienda_nombre: row.tienda_nombre,
          url_origen: row.url_origen,
          sku_tienda: row.sku_tienda || null,
          alias_producto: row.alias_producto,
          precio_regular: regular,
          precio_promocional: promocional,
          precio_por_unidad: porUnidad,
          unidad_medida: (row.unidad_medida as UnidadMedida) || 'unidad',
          precio_usd: precioUsd,
          estado_dato: (row.estado_dato as EstadoDato) || 'DATO_VALIDO',
          cotizacion_aplicada: cotizacion,
          cotizacion_aproximada: Boolean(row.cotizacion_aproximada),
          fuente_cotizacion: row.fuente_cotizacion || null,
          motivo_faltante: row.motivo_faltante || null,
          variacion_diaria_pct,
        };
      },
    );

    return {
      producto: {
        id: prod.id,
        slug: prod.slug,
        nombre_normalizado: prod.nombre_normalizado,
        marca: prod.marca,
        modelo: prod.modelo || null,
        categoria: prod.categoria_nombre,
        contenido_neto_valor: Number(prod.contenido_neto_valor),
        contenido_neto_unidad: prod.contenido_neto_unidad as UnidadMedida,
        pack: prod.pack || 'x1',
      },
      hitos_reduflacion: hitos_reduflacion.length > 0 ? hitos_reduflacion : undefined,
      historico_observaciones,
    };
  }
}
