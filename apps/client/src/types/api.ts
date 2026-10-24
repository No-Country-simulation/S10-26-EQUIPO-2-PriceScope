export type EstadoDato = "DATO_VALIDO" | "AGOTADO" | "ERROR_CAPTURA" | "SIN_DATO";
export type EstadoSemaforo = "VERDE" | "AMARILLO" | "ROJO";
export type Moneda = "ARS" | "USD" | "USD_BLUE" | "USD_OFICIAL";

export interface PaginacionMeta {
  pagina_actual: number;
  limite_por_pagina: number;
  total_registros: number;
  total_paginas: number;
}

export interface KpiVariacion {
  porcentaje: number;
  fecha_inicial: string;
  fecha_final: string;
  cobertura_pct: number;
  estado: "SUFICIENTE" | "SIN_DATOS_SUFICIENTES";
  regla_faltantes?: string;
}

export interface VariacionCategoria {
  categoria_id: string;
  nombre: string;
  variacion_mediana_pct: number;
  cantidad_productos: number;
  cobertura_pct: number;
}

export interface PuntoSerie {
  timestamp_utc: string;
  precio_regular: number | null;
  precio_promocional: number | null;
  precio_usd: number | null;
  estado_dato: EstadoDato;
  cotizacion_aplicada: number | null;
  cotizacion_aproximada: boolean;
  motivo?: string | null;
}

export interface HitoGrafico {
  timestamp_utc: string;
  tipo: "AUTOMATICO" | "MANUAL";
  titulo: string;
  descripcion: string;
}

export interface BandaCalidad {
  fecha: string;
  estado: EstadoSemaforo;
}

export interface PipelineTiendaStatus {
  tienda_id: string;
  nombre: string;
  ultima_corrida_utc: string;
  estado_corrida: "EXITOSA" | "ADVERTENCIA" | "FALLIDA";
  circuit_breaker_open: boolean;
  fallback_activo: boolean;
  publicaciones_procesadas: number;
  publicaciones_fallidas: number;
  cobertura_pct: number;
}

export interface PipelineStatusResponse {
  estado_global: "OPERATIVO" | "DEGRADADO" | "CRITICO";
  frescura_general_utc: string;
  alerta_atraso_24h: boolean;
  tiendas: PipelineTiendaStatus[];
}

export interface DashboardQueryParams {
  fecha_desde?: string;
  fecha_hasta?: string;
  moneda?: Moneda;
  tienda_id?: string | null;
  categoria_id?: string | null;
}

export interface DashboardResponse {
  contexto: {
    frescura_datos_utc: string;
    filtros_activos: {
      moneda: Moneda;
      fecha_desde: string;
      fecha_hasta: string;
      tienda_id: string | null;
      categoria_id: string | null;
    };
  };
  kpis: {
    variacion_pesos: KpiVariacion;
    variacion_usd: {
      porcentaje: number;
      cotizacion_usada: number;
      fuente_cotizacion: string;
      tipo_cotizacion: string;
    };
    comparacion_devaluacion: {
      diferencial_puntos: number;
      variacion_precio_pct: number;
      variacion_cotizacion_pct: number;
    };
  };
  variacion_por_categoria: VariacionCategoria[];
  grafico_evolucion: {
    metadata: {
      downsampling_aplicado: boolean;
      intervalo_agrupacion: "1d" | "1w";
    };
    hitos: HitoGrafico[];
    banda_calidad_diaria: BandaCalidad[];
    series: PuntoSerie[];
  };
  pipeline_status: PipelineStatusResponse;
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

export interface AlertsQueryParams {
  page?: number;
  limit?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  tienda_id?: string | null;
  categoria_id?: string | null;
  severidad?: string;
}

export type UnidadMedida = "kg" | "L" | "unidad";

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
  /** Variación porcentual diaria opcional calculada o provista por el backend */
  variacion_diaria_pct?: number | null;
}

export interface HitoReduflacionItem {
  id: string;
  timestamp_utc: string;
  tipo: "REDUFLACION";
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

export interface TraceabilityQueryParams {
  tienda_id?: string | null;
  fecha_desde?: string | null;
  fecha_hasta?: string | null;
}
