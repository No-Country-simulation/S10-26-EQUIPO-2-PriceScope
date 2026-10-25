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

  /**
   * Busca la cotización más reciente aplicando una ventana de tolerancia de hasta 72 horas (Fallback HU-22).
   */
  async obtenerCotizacionConFallback(
    monedaBase: string,
    monedaCotizada: string,
    tipo: string,
    condicion: string,
    fuente: string,
    fechaConsulta: Date = new Date(),
  ) {
    const query = `
      SELECT timestamp_utc, moneda_base, moneda_cotizada, tipo, condicion, valor, fuente, url_fuente
      FROM cotizaciones_divisas
      WHERE moneda_base = $1
        AND moneda_cotizada = $2
        AND tipo = $3
        AND condicion = $4
        AND fuente = $5
        AND timestamp_utc <= $6
        AND timestamp_utc >= $6 - INTERVAL '72 hours'
      ORDER BY timestamp_utc DESC
      LIMIT 1;
    `;

    const values = [monedaBase, monedaCotizada, tipo, condicion, fuente, fechaConsulta];
    const result = await this.db.query(query, values);

    return result.rows[0] || null;
  }

  /**
   * Procesa la conversión de divisas aplicando la ventana de tolerancia (HU-22).
   */
  async convertirConFallback(
    monedaBase: string,
    monedaCotizada: string,
    tipo: string,
    condicion: string,
    fuente: string,
    monto: number,
    fechaConsulta: Date = new Date(),
  ) {
    // 1. Buscar la cotización más cercana en la ventana de 72h
    const cotizacion = await this.obtenerCotizacionConFallback(
      monedaBase,
      monedaCotizada,
      tipo,
      condicion,
      fuente,
      fechaConsulta,
    );

    // 2. Si no hay registro dentro de las 72h, abortar con SIN_DATO
    if (!cotizacion) {
      return {
        estado: 'SIN_DATO',
        mensaje: 'Se superó el límite de 72 horas continuas sin cotización disponible.',
        cotizacion_aproximada: false,
        resultado: null,
      };
    }

    // 3. Evaluar si la cotización devuelta es exacta o aproximada (fallback)
    const timestampCotizacion = new Date(cotizacion.timestamp_utc).getTime();
    const timestampBuscado = new Date(fechaConsulta).getTime();

    // Si hay diferencia significativa de tiempo respecto al momento consultado, se considera aproximada
    const esAproximada = timestampCotizacion < timestampBuscado;
    const valorCotizacion = Number(cotizacion.valor);
    const montoConvertido = monto * valorCotizacion;

    return {
      estado: 'OK',
      cotizacion_aproximada: esAproximada,
      montoOriginal: monto,
      montoConvertido: montoConvertido,
      cotizacionUsada: {
        valor: valorCotizacion,
        timestamp_utc: cotizacion.timestamp_utc,
        fuente: cotizacion.fuente,
      },
    };
  }
}