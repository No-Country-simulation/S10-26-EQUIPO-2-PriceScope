export interface PaginacionMeta {
  pagina_actual: number;
  limite_por_pagina: number;
  total_registros: number;
  total_paginas: number;
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

export interface AlertaDbRow {
  producto_canonico_id: string;
  producto_nombre: string;
  tienda_nombre: string;
  inicio_utc: string | Date;
  fin_utc: string | Date;
  precio_inicial: string | number;
  precio_final: string | number;
  variacion_precio_pct: string | number;
  cobertura_pct: string | number;
  cotizacion_usada_cierre: string | number;
}

export interface CotizacionSimpleRow {
  cotizacion: string | number;
}
