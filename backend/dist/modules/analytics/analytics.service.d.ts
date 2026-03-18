import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsOverviewDto, TopSellingItemDto, RevenueByHourDto, OrderStatusDto, RealtimeMetricsDto } from './dto/analytics-overview.dto';
export declare class AnalyticsService {
    private prisma;
    constructor(prisma: PrismaService);
    getTodayRevenue(): Promise<{
        today: string;
        total: number;
    }>;
    getTopMenuItems(limit?: number): Promise<any[]>;
    getAnalyticsOverview(companyId: string, startDate?: Date, endDate?: Date): Promise<AnalyticsOverviewDto>;
    getRealtimeMetrics(companyId: string): Promise<RealtimeMetricsDto>;
    getTopSellingItems(companyId: string, limit?: number, startDate?: Date, endDate?: Date): Promise<TopSellingItemDto[]>;
    getRevenueByHour(companyId: string, startDate?: Date, endDate?: Date): Promise<RevenueByHourDto[]>;
    getOrderStatusDistribution(companyId: string, startDate?: Date, endDate?: Date): Promise<OrderStatusDto[]>;
    private buildDateFilter;
    private getRegularOrderStats;
    private getCustomerOrderStats;
}
