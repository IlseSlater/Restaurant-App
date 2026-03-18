export interface AnalyticsOverview {
  revenueToday?: number;
  totalOrders?: number;
  activeOrders?: number;
  completedToday?: number;
  averageOrderValue?: number;
}

export interface RealtimeMetrics {
  revenueToday?: number;
  activeOrders?: number;
  completedToday?: number;
  activeTables?: number;
  activeSessions?: number;
}

export interface TopItem {
  menuItemId: string;
  name: string;
  quantity: number;
  revenue: number;
}

export interface RevenueByPeriod {
  period: string;
  revenue: number;
  orderCount: number;
}
