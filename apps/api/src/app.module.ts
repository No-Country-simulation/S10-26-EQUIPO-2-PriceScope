import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CurrencyModule } from './modules/currency/currency.module';
import { DatabaseModule } from './database/database.module';
import { ScheduleModule } from '@nestjs/schedule';
import { DashboardModule } from './modules/dashboard/dashboard.module'
import { AlertsModule } from './modules/alerts/alerts.module'

@Module({
    imports: [ScheduleModule.forRoot(), DatabaseModule, CurrencyModule, DashboardModule, AlertsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
