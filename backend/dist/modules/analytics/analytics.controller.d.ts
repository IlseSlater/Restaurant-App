import { AnalyticsService } from './analytics.service';
import { AnalyticsOverviewDto, RealtimeMetricsDto, TopSellingItemDto } from './dto/analytics-overview.dto';
export declare class AnalyticsController {
    private analyticsService;
    constructor(analyticsService: AnalyticsService);
    getAnalyticsOverview(companyId: string, startDate?: string, endDate?: string): Promise<AnalyticsOverviewDto>;
    getRealtimeMetrics(companyId: string): Promise<RealtimeMetricsDto>;
    getTopItems(companyId: string, limit?: string, startDate?: string, endDate?: string): Promise<TopSellingItemDto[]>;
    getGeneralAnalytics(companyId?: string): Promise<{
        today: string;
        total: number;
    } | AnalyticsOverviewDto>;
    getRevenue(): Promise<{
        today: string;
        total: number;
    }>;
}
