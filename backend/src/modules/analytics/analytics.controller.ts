import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsOverviewDto, RealtimeMetricsDto, TopSellingItemDto } from './dto/analytics-overview.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('overview')
  async getAnalyticsOverview(
    @Query('companyId') companyId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<AnalyticsOverviewDto> {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    return this.analyticsService.getAnalyticsOverview(companyId, start, end);
  }

  @Get('realtime')
  async getRealtimeMetrics(
    @Query('companyId') companyId: string
  ): Promise<RealtimeMetricsDto> {
    return this.analyticsService.getRealtimeMetrics(companyId);
  }

  @Get('top-items')
  async getTopItems(
    @Query('companyId') companyId: string,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<TopSellingItemDto[]> {
    const limitNumber = limit ? parseInt(limit, 10) : 5;
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    
    return this.analyticsService.getTopSellingItems(companyId, limitNumber, start, end);
  }

  // Legacy endpoints for backward compatibility
  @Get()
  async getGeneralAnalytics(@Query('companyId') companyId?: string) {
    if (companyId) {
      return this.analyticsService.getAnalyticsOverview(companyId);
    }
    // Fallback to old method if no companyId provided
    return this.analyticsService.getTodayRevenue();
  }

  @Get('revenue')
  async getRevenue() {
    return this.analyticsService.getTodayRevenue();
  }
}


