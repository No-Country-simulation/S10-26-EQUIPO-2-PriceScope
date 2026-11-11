import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DatabaseService } from '../../database/database.service';
import { CierreCambiarioService, ZONA_MERCADO } from './cierre-cambiario.service';

const DIAS_RETROACTIVOS = 7;

@Injectable()
export class CierreCambiarioCron {
  private readonly logger = new Logger(CierreCambiarioCron.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly cierreCambiario: CierreCambiarioService,
  ) {}

  @Cron('1 0 * * *', { name: 'captura-cierre-cambiario', timeZone: ZONA_MERCADO })
  async capturarCierreDelDia() {
    const pendientes = await this.db.query<{ dia: string }>(
      `SELECT DISTINCT to_char(timestamp_utc AT TIME ZONE $1, 'YYYY-MM-DD') AS dia
       FROM observaciones_precios
       WHERE estado_dato = 'DATO_VALIDO'
         AND cotizacion_aplicada IS NULL
         AND timestamp_utc >= NOW() - ($2::int * INTERVAL '1 day')
         AND (timestamp_utc AT TIME ZONE $1)::date < (NOW() AT TIME ZONE $1)::date
       ORDER BY dia;`,
      [ZONA_MERCADO, DIAS_RETROACTIVOS],
    );

    for (const { dia } of pendientes.rows) {
      try {
        const cierre = await this.cierreCambiario.obtenerCotizacionCierre(`${dia}T12:00:00-03:00`);

        if (cierre.estado === 'SIN_DATO' || cierre.cotizacionAplicada === null) {
          this.logger.warn(`Sin cotización de cierre para ${dia}: se deja SIN_DATO.`);
          continue;
        }

        await this.db.query(
          `UPDATE observaciones_precios
           SET cotizacion_aplicada = $1, cotizacion_aproximada = $2, fuente_cotizacion = $3
           WHERE estado_dato = 'DATO_VALIDO'
             AND cotizacion_aplicada IS NULL
             AND timestamp_utc >= ($5::date::timestamp AT TIME ZONE $4)
             AND timestamp_utc <  (($5::date + 1)::timestamp AT TIME ZONE $4);`,
          [cierre.cotizacionAplicada, cierre.esAproximada, cierre.fuente, ZONA_MERCADO, dia],
        );
      } catch (error) {
        this.logger.error(`No se pudo capturar el cierre de ${dia}: ${(error as Error).message}`);
      }
    }
  }
}