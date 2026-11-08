import { PipelineStatusResponse } from '../../pipeline/pipeline.service';

export type Moneda = 'ARS' | 'USD' | 'USD_BLUE' | 'USD_OFICIAL';
export type EstadoDato = 'DATO_VALIDO' | 'AGOTADO' | 'ERROR_CAPTURA' | 'SIN_DATO';
export type EstadoSemaforo = 'VERDE' | 'AMARILLO' | 'ROJO';

export interface KpiVariacion {
  porcentaje: number;
  fecha_inicial: string;
  fecha_final?: string;
  cobertura_pct?: number;
  estado?: string;
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

export interface BandaCalidad {
  fecha: string;
  estado: EstadoSemaforo;
  porcentaje_completitud: number;
}

export interface HitoGrafico {
  id: string;
  fecha: string;
  titulo: string;
  descripcion: string;
  tipo: 'DEVALUACION' | 'REGULATORIO' | 'CRISIS';
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
      intervalo_agrupacion: '1d' | '1w';
    };
    hitos: HitoGrafico[];
    banda_calidad_diaria: BandaCalidad[];
    series: PuntoSerie[];
  };
  pipeline_status: PipelineStatusResponse;
}

export interface CategoriaDbRow {
  categoria_id: string;
  nombre: string;
  cantidad_productos: string | number;
  mediana_precio: string | number | null;
  cobertura_pct: string | number | null;
}

export interface SeriesDbRow {
  timestamp_utc: string | Date;
  precio_regular: string | number | null;
  precio_promocional: string | number | null;
  precio_usd: string | number | null;
  estado_dato: string;
  cotizacion_aplicada: string | number | null;
  cotizacion_aproximada: boolean;
  motivo?: string | null;
}

export interface CotizacionDbRow {
  cotizacion: string | number;
  timestamp_utc: string | Date;
}
