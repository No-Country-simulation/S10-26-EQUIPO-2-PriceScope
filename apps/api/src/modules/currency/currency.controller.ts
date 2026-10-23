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
}