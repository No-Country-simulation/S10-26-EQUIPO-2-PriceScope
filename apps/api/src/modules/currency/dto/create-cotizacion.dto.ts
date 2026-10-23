import { IsString, IsNotEmpty, IsEnum, IsNumber, IsPositive, IsDateString, IsOptional } from 'class-validator';

export enum TipoCotizacion {
    OFICIAL = 'oficial',
    PARALLEL = 'parallel', // Corresponde al dólar blue
}

export enum CondicionCotizacion {
    COMPRA = 'compra',
    VENTA = 'venta',
}

export class CreateCotizacionDto {
    @IsString()
    @IsNotEmpty()
    monedaBase: string; // ej. 'USD'

    @IsString()
    @IsNotEmpty()
    monedaCotizada: string; // ej. 'ARS'

    @IsEnum(TipoCotizacion)
    tipo: TipoCotizacion; // 'oficial' | 'parallel'

    @IsString()
    @IsNotEmpty()
    fuente: string; // ej. 'DolarAPI_BCRA'

    @IsEnum(CondicionCotizacion)
    condicion: CondicionCotizacion; // 'compra' | 'venta'

    @IsNumber()
    @IsPositive()
    valor: number;

    @IsDateString()
    timestamp: string; // Timestamp UTC

    @IsString()
    @IsOptional()
    urlFuente?: string; // Opcional, enlace de origen de la cotización
}