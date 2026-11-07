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

export interface CanonicalProductDbRow {
  id: string;
  slug: string;
  nombre_normalizado: string;
  marca: string;
  modelo: string | null;
  categoria_nombre: string;
  contenido_neto_valor: string | number;
  contenido_neto_unidad: string;
  pack: string;
}

export interface ContentHistoryDbRow {
  id: string | number;
  fecha_desde_utc: string | Date;
  contenido_neto_valor: string | number;
  contenido_neto_unidad: string;
  pack: string;
  motivo_evento?: string | null;
}

export interface ObservationDbRow {
  timestamp_utc: string | Date;
  tienda_id: string;
  tienda_nombre: string;
  url_origen: string;
  sku_tienda: string | null;
  alias_producto: string;
  precio_regular: string | number | null;
  precio_promocional: string | number | null;
  precio_por_unidad: string | number | null;
  unidad_medida: string;
  estado_dato: string;
  cotizacion_aplicada: string | number | null;
  cotizacion_aproximada: boolean;
  fuente_cotizacion: string | null;
  motivo_faltante: string | null;
}
