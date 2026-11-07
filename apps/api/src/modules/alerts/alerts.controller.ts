import { Controller, Get, Query } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Controller('api/v1/alerts')
export class AlertsController {
    constructor(private readonly alertsService: AlertsService) { }

    @Get()
    async getAlerts(@Query() paginationQuery: PaginationQueryDto) {
        return this.alertsService.findAll(paginationQuery);
    }
}