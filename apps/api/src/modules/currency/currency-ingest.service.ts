import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CurrencyService } from './currency.service';
import { DolarApiService } from './dolar-api.service';
import { CondicionCotizacion, CreateCotizacionDto, TipoCotizacion } from './dto/create-cotizacion.dto';

@Injectable()
export class CurrencyIngestService {
  private readonly logger = new Logger(CurrencyIngestService.name);

  constructor(
    private readonly dolarApi: DolarApiService,
    private readonly currencyService: CurrencyService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async ingestarCotizaciones() {
    this.logger.log('Iniciando ingesta horaria de cotizaciones (DolarAPI)...');

    const filas = await this.dolarApi.obtenerFilas();
    if (filas.length === 0) {
      this.logger.warn('Sin cotizaciones válidas en esta ejecución: no se guarda nada.');
      return { guardadas: 0, duplicadas: 0, fallidas: 0 };
    }

    let guardadas = 0;
    let duplicadas = 0;
    let fallidas = 0;

    for (const fila of filas) {
      const dto: CreateCotizacionDto = {
        monedaBase: fila.moneda_base,
        monedaCotizada: fila.moneda_cotizada,
        tipo: fila.tipo as TipoCotizacion,
        condicion: fila.condicion as CondicionCotizacion,
        valor: fila.valor,
        fuente: fila.fuente,
        timestamp: fila.timestamp_utc,
      };

      try {
        const resultado = await this.currencyService.registrarCotizacion(dto);
        if (resultado.data) {
          guardadas++;
        } else {
          duplicadas++;
        }
      } catch (error) {
        fallidas++;
        this.logger.error(
          `No se pudo guardar ${fila.tipo}/${fila.condicion}: ${(error as Error).message}`,
        );
      }
    }

    this.logger.log(
      `Ingesta terminada: ${guardadas} nuevas, ${duplicadas} ya existentes, ${fallidas} con error.`,
    );
    return { guardadas, duplicadas, fallidas };
  }
}