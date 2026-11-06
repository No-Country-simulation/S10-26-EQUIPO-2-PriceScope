import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { GetDashboardDto } from './dto/get-dashboard.dto';

@Controller('dashboard') // O @Controller('api/v1/dashboard') según tu configuración global en main.ts
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getDashboard(@Query() query: GetDashboardDto) {
    return await this.dashboardService.getDashboardData(query);
  }
}