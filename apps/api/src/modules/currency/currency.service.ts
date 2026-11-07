import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateCotizacionDto } from './dto/create-cotizacion.dto';

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);

  constructor(private readonly db: DatabaseService) { }

  async registrarCotizacion(dto: CreateCotizacionDto) {
    if (!dto.monedaBase || !dto.monedaCotizada || !dto.tipo || !dto.fuente || !dto.condicion) {
      throw new BadRequestException('Cotización rechazada: Faltan metadatos de procedencia obligatorios.');
    }

    const query = `
            INSERT INTO cotizaciones_divisas (
                timestamp_utc,
                moneda_base,
                moneda_cotizada,
                tipo,
                condicion,
                valor,
                fuente,
                url_fuente,
                created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT DO NOTHING
            RETURNING *;
            `;

    const values = [
      dto.timestamp,
      dto.monedaBase,
      dto.monedaCotizada,
      dto.tipo,
      dto.condicion,
      dto.valor,
      dto.fuente,
      dto.urlFuente || null,
      new Date(),
    ];

    try {
      const result = await this.db.query(query, values);
      if (result.rows.length === 0) {
        this.logger.debug('Cotización ya existente: se omite.');
        return {
          message: 'Cotización ya registrada previamente, no se duplicó',
          data: null,
        };
      }
      this.logger.log(`Cotización guardada exitosamente ID: ${result.rows[0].id || 'N/A'}`);
      return {
        message: 'Cotización almacenada con éxito bajo los criterios de HU-21',
        data: result.rows[0],
      };
    } catch (error) {
      this.logger.error('Error al insertar cotización en TimescaleDB', error);
      throw new BadRequestException(`Error de base de datos: ${(error as Error).message}`);
    }
  }

  async obtenerCotizacionConFallback(
    monedaBase: string,
    monedaCotizada: string,
    tipo: string,
    condicion: string,
    fuente: string,
    fechaConsulta: Date = new Date(),
  ) {
    const fechaIso = fechaConsulta instanceof Date
      ? fechaConsulta.toISOString()
      : new Date(fechaConsulta).toISOString();

    const query = `
      SELECT * 
      FROM fn_obtener_cotizacion_cierre(
        $1::TIMESTAMPTZ, 
        $2::enum_tipo_cambio, 
        $3::enum_condicion_cambio, 
        $4::VARCHAR
      );
    `;

    const fuenteParam = fuente && fuente.trim() !== '' ? fuente : null;

    const values = [
      fechaIso,
      tipo,
      condicion,
      fuenteParam,
    ];

    try {
      const result = await this.db.query(query, values);
      return result.rows[0] || null;
    } catch (error) {
      this.logger.error('Error detallado en fn_obtener_cotizacion_cierre:', error);
      throw new BadRequestException(`Error al consultar cotización con fallback: ${(error as Error).message}`);
    }
  }

  async convertirConFallback(
    monedaBase: string,
    monedaCotizada: string,
    tipo: string,
    condicion: string,
    fuente: string,
    monto: number,
    fechaConsulta: Date = new Date(),
  ) {
    const cotizacion = await this.obtenerCotizacionConFallback(
      monedaBase,
      monedaCotizada,
      tipo,
      condicion,
      fuente,
      fechaConsulta,
    );

    if (!cotizacion || cotizacion.estado_sincronizacion === 'SIN_DATO' || !cotizacion.cotizacion_aplicada) {
      return {
        estado: 'SIN_DATO',
        mensaje: 'No se encontró un valor de cotización válido dentro del rango permitido.',
        cotizacion_aproximada: false,
        resultado: null,
      };
    }

    // Mapeo corregido usando cotizacion_aplicada devuelta por la función SQL
    const valorCotizacion = Number(cotizacion.cotizacion_aplicada);

    if (isNaN(valorCotizacion) || valorCotizacion === 0) {
      return {
        estado: 'SIN_DATO',
        mensaje: 'No se encontró un valor de cotización válido.',
        cotizacion_aproximada: false,
        resultado: null,
      };
    }

    const montoConvertido = monto * valorCotizacion;

    return {
      estado: 'OK',
      cotizacion_aproximada: Boolean(cotizacion.cotizacion_aproximada ?? false),
      montoOriginal: monto,
      montoConvertido: montoConvertido,
      cotizacionUsada: {
        valor: valorCotizacion,
        fuente: cotizacion.fuente_cotizacion ?? fuente,
      },
    };
  }
}