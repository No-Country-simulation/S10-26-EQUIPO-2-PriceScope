import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CierreCambiarioService, CotizacionCierre } from '../currency/cierre-cambiario.service';
import { GetTraceabilityDto } from './dto/get-traceability.dto';
import {
  CanonicalProductDbRow,
  ContentHistoryDbRow,
  EstadoDato,
  HitoReduflacionItem,
  ObservationDbRow,
  ObservacionTrazabilidadItem,
  TraceabilityResponse,
  UnidadMedida,
} from './types/products.types';

export * from './types/products.types';

@Injectable()
export class ProductsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly cierreCambiario: CierreCambiarioService,
  ) { }

  async getProductTraceability(
    idOrSlug: string,
    dto: GetTraceabilityDto,
  ): Promise<TraceabilityResponse> {
    const prod = await this.fetchCanonicalProduct(idOrSlug);
    const hitos = await this.fetchReduflacionHistory(prod.id);
    const observaciones = await this.fetchObservations(prod.id, dto);

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
      hitos_reduflacion: hitos.length > 0 ? hitos : undefined,
      historico_observaciones: observaciones,
    };
  }

  private async fetchCanonicalProduct(idOrSlug: string): Promise<CanonicalProductDbRow> {
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        idOrSlug,
      );

    const query = `
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

    const res = await this.db.query(query, [idOrSlug]);
    if (res.rows.length === 0) {
      throw new NotFoundException({
        type: 'https://pricescope.internal/errors/product-not-found',
        title: 'Producto Canónico No Encontrado',
        status: 404,
        detail: `No se encontró ningún producto canónico con identificador o slug '${idOrSlug}'.`,
        instance: `/api/v1/products/${idOrSlug}/traceability`,
        timestamp_utc: new Date().toISOString(),
      });
    }

    return res.rows[0] as CanonicalProductDbRow;
  }

  private async fetchReduflacionHistory(canonicalId: string): Promise<HitoReduflacionItem[]> {
    const query = `
      SELECT id, fecha_desde_utc, contenido_neto_valor, contenido_neto_unidad, pack, motivo_evento
      FROM historial_contenido
      WHERE producto_canonico_id = $1
      ORDER BY fecha_desde_utc ASC;
    `;
    const res = await this.db.query(query, [canonicalId]);
    const rows = res.rows as ContentHistoryDbRow[];
    const hitos: HitoReduflacionItem[] = [];

    for (let i = 1; i < rows.length; i++) {
      const prev = rows[i - 1];
      const curr = rows[i];
      const valAnt = Number(prev.contenido_neto_valor);
      const valNuevo = Number(curr.contenido_neto_valor);
      const varPct = valAnt > 0 ? Number((((valNuevo - valAnt) / valAnt) * 100).toFixed(1)) : 0;

      hitos.push({
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

    return hitos;
  }

  private async fetchObservations(
    canonicalId: string,
    dto: GetTraceabilityDto,
  ): Promise<ObservacionTrazabilidadItem[]> {
    const conditions = ['op.producto_canonico_id = $1'];
    const params: (string | number)[] = [canonicalId];
    let pIdx = 2;

    if (dto.fecha_desde) {
      conditions.push(`op.timestamp_utc >= $${pIdx++}`);
      params.push(dto.fecha_desde);
    }
    if (dto.fecha_hasta) {
      conditions.push(`op.timestamp_utc <= $${pIdx++}`);
      params.push(dto.fecha_hasta);
    }
    if (dto.tienda_id) {
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          dto.tienda_id,
        );
      conditions.push(isUUID ? `t.id = $${pIdx++}` : `t.slug = $${pIdx++}`);
      params.push(dto.tienda_id);
    }

    const query = `
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

    const res = await this.db.query(query, params);
    const rows = res.rows as ObservationDbRow[];

    // La tasa guardada por el cron manda. Las filas que aún no la tienen (p. ej. las de hoy)
    // se resuelven con el servicio de cierre.
    const sinTasa = rows.filter(
      (r) => r.cotizacion_aplicada === null && r.estado_dato === 'DATO_VALIDO',
    );
    const cierres = new Map<ObservationDbRow, CotizacionCierre>();
    if (sinTasa.length > 0) {
      const emparejadas = await this.cierreCambiario.emparejarConCierre(
        sinTasa.map((row) => ({ fechaCaptura: row.timestamp_utc, row })),
      );
      for (const e of emparejadas) cierres.set(e.row, e.cierre);
    }

    return rows.map((row, idx, arr) => {
      let regular = row.precio_regular !== null ? Number(row.precio_regular) : null;
      let promocional = row.precio_promocional !== null ? Number(row.precio_promocional) : null;
      let porUnidad = row.precio_por_unidad !== null ? Number(row.precio_por_unidad) : null;

      // Anti-cero (RN-04)
      if (regular === 0) regular = null;
      if (promocional === 0) promocional = null;
      if (porUnidad === 0) porUnidad = null;

      const cierre = cierres.get(row);
      const persistida = row.cotizacion_aplicada !== null;
      const cotizacion = persistida
        ? Number(row.cotizacion_aplicada)
        : (cierre?.cotizacionAplicada ?? null);
      const cotizacionAproximada = persistida
        ? Boolean(row.cotizacion_aproximada)
        : (cierre?.esAproximada ?? false);
      const fuenteCotizacion = row.fuente_cotizacion || cierre?.fuente || null;

      const precioUsd =
        regular !== null && cotizacion !== null && cotizacion > 0
          ? Number((regular / cotizacion).toFixed(2))
          : null;

      let variacion_diaria_pct: number | null = null;
      const obsAnt = arr.slice(idx + 1).find((o) => o.tienda_id === row.tienda_id);
      if (obsAnt && obsAnt.precio_regular && regular) {
        const precioAnt = Number(obsAnt.precio_regular);
        if (precioAnt > 0) {
          variacion_diaria_pct = Number((((regular - precioAnt) / precioAnt) * 100).toFixed(2));
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
        cotizacion_aproximada: cotizacionAproximada,
        fuente_cotizacion: fuenteCotizacion,
        motivo_faltante: row.motivo_faltante || null,
        variacion_diaria_pct,
      };
    });
  }
}
