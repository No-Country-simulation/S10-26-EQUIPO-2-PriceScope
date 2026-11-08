import { Module } from '@nestjs/common';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { CurrencyModule } from '../currency/currency.module';

@Module({
    imports: [CurrencyModule],
    controllers: [AlertsController],
    providers: [AlertsService],
    exports: [AlertsService],
})
export class AlertsModule { }