import { Controller, Get, Query } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { GetAlertsDto } from './dto/get-alerts.dto';

@Controller('alerts')
export class AlertsController {
    constructor(private readonly alertsService: AlertsService) { }

    @Get()
    findAll(@Query() queryDto: GetAlertsDto) {
        return this.alertsService.findAll(queryDto);
    }
}