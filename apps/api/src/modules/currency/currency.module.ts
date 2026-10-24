import { Module } from '@nestjs/common';
import { CurrencyController } from './currency.controller';
import { CurrencyService } from './currency.service';
import { DolarApiService } from './dolar-api.service';
import { CurrencyIngestService } from './currency-ingest.service';

@Module({
    controllers: [CurrencyController],
    providers: [CurrencyService, DolarApiService, CurrencyIngestService],
})

export class CurrencyModule {}