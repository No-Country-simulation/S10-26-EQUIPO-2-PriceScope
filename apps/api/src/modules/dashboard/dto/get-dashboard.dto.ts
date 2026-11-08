import { IsOptional, IsString, Matches, IsEnum } from 'class-validator';

export enum MonedaEnum {
    ARS = 'ARS',
    USD = 'USD',
}

export class GetDashboardDto {
    @IsOptional()
    @Matches(/^\d{4}-\d{2}-\d{2}$/, {
        message: 'fecha_desde debe tener formato YYYY-MM-DD',
    })
    fecha_desde?: string;

    @IsOptional()
    @Matches(/^\d{4}-\d{2}-\d{2}$/, {
        message: 'fecha_hasta debe tener formato YYYY-MM-DD',
    })
    fecha_hasta?: string;

    @IsOptional()
    @IsEnum(MonedaEnum)
    moneda?: MonedaEnum = MonedaEnum.ARS;

    @IsOptional()
    @IsString()
    tienda_id?: string;

    @IsOptional()
    @IsString()
    categoria_id?: string;
}