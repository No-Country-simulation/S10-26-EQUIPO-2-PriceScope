export interface PipelineTiendaStatus {
  tienda_id: string;
  nombre: string;
  ultima_corrida_utc: string;
  estado_corrida: 'EXITOSA' | 'ADVERTENCIA' | 'FALLIDA';
  circuit_breaker_open: boolean;
  fallback_activo: boolean;
  publicaciones_procesadas: number;
  publicaciones_fallidas: number;
  cobertura_pct: number;
}

export interface PipelineStatusResponse {
  estado_global: 'OPERATIVO' | 'DEGRADADO' | 'CRITICO';
  frescura_general_utc: string;
  alerta_atraso_24h: boolean;
  tiendas: PipelineTiendaStatus[];
}

export interface PipelineStoreDbRow {
  tienda_uuid: string;
  tienda_id: string;
  nombre: string;
  ultima_corrida_utc: string | Date | null;
  estado_corrida: string;
  circuit_breaker_open: boolean;
  fallback_activo: boolean;
  publicaciones_procesadas: string | number;
  publicaciones_fallidas: string | number;
}
