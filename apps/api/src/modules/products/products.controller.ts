import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService, TraceabilityResponse } from './products.service';
import { GetTraceabilityDto } from './dto/get-traceability.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get(':id/traceability')
  async getTraceability(
    @Param('id') id: string,
    @Query() query: GetTraceabilityDto,
  ): Promise<TraceabilityResponse> {
    return this.productsService.getProductTraceability(id, query);
  }
}
