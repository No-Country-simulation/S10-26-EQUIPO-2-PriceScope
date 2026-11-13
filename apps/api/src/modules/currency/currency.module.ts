import { Module } from '@nestjs/common';
import { CurrencyController } from './currency.controller';
import { CurrencyService } from './currency.service';
import { DolarApiService } from './dolar-api.service';
import { CurrencyIngestService } from './currency-ingest.service';
import { CierreCambiarioService } from './cierre-cambiario.service';
import { CierreCambiarioCron } from './cierre-cambiario.cron';


@Module({
    controllers: [CurrencyController],
    providers: [CurrencyService, DolarApiService, CurrencyIngestService, CierreCambiarioService, CierreCambiarioCron],
    exports: [CierreCambiarioService],
})

export class CurrencyModule {}