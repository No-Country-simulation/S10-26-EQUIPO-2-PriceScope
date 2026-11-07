import { IsOptional, IsString, IsUUID, IsDateString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class GetAlertsDto extends PaginationQueryDto {
    @IsOptional()
    @IsDateString()
    fecha_desde?: string;

    @IsOptional()
    @IsDateString()
    fecha_hasta?: string;

    @IsOptional()
    @IsUUID()
    tienda_id?: string;

    @IsOptional()
    @IsUUID()
    categoria_id?: string;
}