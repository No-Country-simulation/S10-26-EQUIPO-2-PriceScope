import { Injectable, Logger } from '@nestjs/common';

type CotizacionApi = {
  casa: string;
  compra: number;
  venta: number;
  fechaActualizacion: string;
};

export type FilaCotizacion = {
  timestamp_utc: string;
  moneda_base: string;
  moneda_cotizada: string;
  tipo: 'oficial' | 'parallel';
  condicion: 'venta' | 'compra';
  valor: number;
  fuente: string;
};

const TIPO_POR_CASA: Record<string, 'oficial' | 'parallel'> = {
  oficial: 'oficial',
  blue: 'parallel',
};

@Injectable()
export class DolarApiService {
  private readonly logger = new Logger(DolarApiService.name);

  async obtenerCotizaciones(): Promise<CotizacionApi[]> {
    try {
      const respuesta = await fetch('https://dolarapi.com/v1/dolares', {
        signal: AbortSignal.timeout(10_000),
      });
      if (!respuesta.ok) {
        this.logger.error(
          `DolarAPI respondió con estado ${respuesta.status}. No se guardan cotizaciones.`,
        );
        return [];
      }
      const datos = await respuesta.json();
      if (!Array.isArray(datos)) {
        this.logger.error('DolarAPI devolvió un formato inesperado. No se guardan cotizaciones.');
        return [];
      }
      return datos;
    } catch (error) {
      this.logger.error(`No se pudo consultar DolarAPI: ${(error as Error).message}`);
      return [];
    }
  }

  convertirAFilas(cotizaciones: CotizacionApi[]): FilaCotizacion[] {
    const filas: FilaCotizacion[] = [];
    for (const cot of cotizaciones) {
      const tipo = TIPO_POR_CASA[cot.casa];
      if (!tipo) continue;
      for (const condicion of ['venta', 'compra'] as const) {
        const valor = cot[condicion];
        if (typeof valor !== 'number' || !Number.isFinite(valor) || valor <= 0) {
          this.logger.warn(`Valor inválido para ${cot.casa}/${condicion}: se omite.`);
          continue;
        }
        filas.push({
          timestamp_utc: cot.fechaActualizacion,
          moneda_base: 'USD',
          moneda_cotizada: 'ARS',
          tipo,
          condicion,
          valor,
          fuente: 'DolarAPI',
        });
      }
    }
    return filas;
  }

  async obtenerFilas(): Promise<FilaCotizacion[]> {
    const cotizaciones = await this.obtenerCotizaciones();
    return this.convertirAFilas(cotizaciones);
  }
}