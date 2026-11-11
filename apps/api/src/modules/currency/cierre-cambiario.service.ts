import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { TipoCotizacion } from './dto/create-cotizacion.dto';

export type CotizacionCierre = {
  cotizacionAplicada: number | null;
  esAproximada: boolean;
  fuente: string | null;
  estado: 'OK' | 'SIN_DATO';
};

type FilaCierre = {
  cotizacion_aplicada: string | null;
  cotizacion_aproximada: boolean;
  fuente_cotizacion: string | null;
  estado_sincronizacion: 'OK' | 'SIN_DATO';
};

const SIN_DATO: CotizacionCierre = {
  cotizacionAplicada: null,
  esAproximada: false,
  fuente: null,
  estado: 'SIN_DATO',
};

export const ZONA_MERCADO = 'America/Argentina/Buenos_Aires';
export type VariacionCotizacion = {
  inicial: CotizacionCierre;
  final: CotizacionCierre;
  variacionPct: number | null;
};
@Injectable()
export class CierreCambiarioService {
  constructor(private readonly db: DatabaseService) {}

  /** Cotización de cierre (23:59:59 hora de Argentina) del día de la fecha dada. */
  async obtenerCotizacionCierre(
    fechaCaptura: Date | string,
    tipo: TipoCotizacion = TipoCotizacion.PARALLEL,
  ): Promise<CotizacionCierre> {
    const resultado = await this.db.query<FilaCierre>(
      'SELECT * FROM fn_obtener_cotizacion_cierre($1::timestamptz, $2::enum_tipo_cambio)',
      [fechaCaptura, tipo],
    );

    const fila = resultado.rows[0];
    if (!fila || fila.estado_sincronizacion === 'SIN_DATO' || fila.cotizacion_aplicada === null) {
      return { ...SIN_DATO };
    }

    return {
      cotizacionAplicada: Number(fila.cotizacion_aplicada),
      esAproximada: fila.cotizacion_aproximada,
      fuente: fila.fuente_cotizacion,
      estado: 'OK',
    };
  }

  /**
   * Empareja cada observación con la cotización de cierre del día local en que fue capturada.
   * Consulta la BD una sola vez por día local, sin importar cuántas observaciones haya.
   */
  async emparejarConCierre<T extends { fechaCaptura: Date | string }>(
    observaciones: T[],
    tipo: TipoCotizacion = TipoCotizacion.PARALLEL,
  ): Promise<Array<T & { cierre: CotizacionCierre }>> {
    const cierresPorDia = new Map<string, CotizacionCierre>();

    for (const obs of observaciones) {
      const dia = this.diaLocal(obs.fechaCaptura);
      if (!cierresPorDia.has(dia)) {
        cierresPorDia.set(dia, await this.obtenerCotizacionCierre(obs.fechaCaptura, tipo));
      }
    }

    return observaciones.map((obs) => ({
      ...obs,
      cierre: cierresPorDia.get(this.diaLocal(obs.fechaCaptura)) ?? { ...SIN_DATO },
    }));
  }


    /** Variación porcentual de la cotización entre el cierre del día `desde` y el del día `hasta`. */
  async obtenerVariacionPeriodo(
    desde: Date | string,
    hasta: Date | string,
    tipo: TipoCotizacion = TipoCotizacion.PARALLEL,
  ): Promise<VariacionCotizacion> {
    const [inicial, final] = await Promise.all([
      this.obtenerCotizacionCierre(desde, tipo),
      this.obtenerCotizacionCierre(hasta, tipo),
    ]);

    const ini = inicial.cotizacionAplicada;
    const fin = final.cotizacionAplicada;
    const variacionPct =
      ini !== null && fin !== null && ini > 0
        ? Number((((fin - ini) / ini) * 100).toFixed(1))
        : null;

    return { inicial, final, variacionPct };
  }

  
  /** Día calendario (AAAA-MM-DD) en hora de Argentina, no en UTC. */
  private diaLocal(fecha: Date | string): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: ZONA_MERCADO,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(fecha));
  }
}