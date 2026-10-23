import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CurrencyModule } from './modules/currency/currency.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [DatabaseModule, CurrencyModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
