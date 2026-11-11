import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DatabaseModule } from '../../database/database.module';
import { PipelineModule } from '../pipeline/pipeline.module';
import { CurrencyModule } from '../currency/currency.module';

@Module({
    imports: [DatabaseModule, PipelineModule, CurrencyModule],
    controllers: [DashboardController],
    providers: [DashboardService],
})
export class DashboardModule { }