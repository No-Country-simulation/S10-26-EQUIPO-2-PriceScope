import { IsOptional, IsString, IsDateString, IsIn } from 'class-validator';

export class GetTraceabilityDto {
  @IsOptional()
  @IsString()
  tienda_id?: string;

  @IsOptional()
  @IsDateString()
  fecha_desde?: string;

  @IsOptional()
  @IsDateString()
  fecha_hasta?: string;

  @IsOptional()
  @IsIn(['ARS', 'USD', 'USD_BLUE', 'USD_OFICIAL'])
  moneda?: 'ARS' | 'USD' | 'USD_BLUE' | 'USD_OFICIAL';
}
