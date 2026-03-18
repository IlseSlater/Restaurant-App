export class AnalyticsOverviewDto {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  activeOrders: number;
  completedToday: number;
  revenueToday: number;
  topSellingItems: TopSellingItemDto[];
  revenueByHour: RevenueByHourDto[];
  orderStatusDistribution: OrderStatusDto[];
}

export class TopSellingItemDto {
  menuItemId: string;
  name: string;
  quantity: number;
  revenue: number;
  category?: string;
}

export class RevenueByHourDto {
  hour: number;
  revenue: number;
  orderCount: number;
}

export class OrderStatusDto {
  status: string;
  count: number;
  percentage: number;
}

export class RealtimeMetricsDto {
  activeOrders: number;
  completedToday: number;
  revenueToday: number;
  pendingPayments: number;
  lastUpdated: Date;
}
