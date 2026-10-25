import { Controller, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { CurrencyService } from './currency.service';
import { CreateCotizacionDto } from './dto/create-cotizacion.dto';

@Controller('api/v1/currency')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Post('cotizaciones')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async crearCotizacion(@Body() createCotizacionDto: CreateCotizacionDto) {
    return this.currencyService.registrarCotizacion(createCotizacionDto);
  }

  @Post('convertir')
  async convertirDivisa(
    @Body()
    body: {
      monedaBase: string;
      monedaCotizada: string;
      tipo: string;
      condicion: string;
      fuente: string;
      monto: number;
      fechaConsulta?: string; // Opcional para simular fechas en las pruebas
    },
  ) {
    const fecha = body.fechaConsulta ? new Date(body.fechaConsulta) : new Date();
    
    return await this.currencyService.convertirConFallback(
      body.monedaBase,
      body.monedaCotizada,
      body.tipo,
      body.condicion,
      body.fuente,
      body.monto,
      fecha,
    );
  }
}