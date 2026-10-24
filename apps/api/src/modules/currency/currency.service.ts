import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateCotizacionDto } from './dto/create-cotizacion.dto';

@Injectable()
export class CurrencyService {
  private readonly logger = new Logger(CurrencyService.name);

  constructor(private readonly db: DatabaseService) { }

  async registrarCotizacion(dto: CreateCotizacionDto) {
    // Validación estricta exigida por la HU-21
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
      dto.timestamp,          // $1 -> timestamp_utc
      dto.monedaBase,         // $2 -> moneda_base
      dto.monedaCotizada,     // $3 -> moneda_cotizada
      dto.tipo,               // $4 -> tipo
      dto.condicion,          // $5 -> condicion
      dto.valor,              // $6 -> valor
      dto.fuente,             // $7 -> fuente
      dto.urlFuente || null,  // $8 -> url_fuente (opcional, si viene en el DTO o se manda null)
      new Date(),             // $9 -> created_at (fecha y hora actual del servidor)
    ];

    try {
      const result = await this.db.query(query, values);
      if (result.rows.length === 0) {
        this.logger.debug('Cotización ya existente (mismo timestamp, tipo, condición y fuente): se omite.');
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
}