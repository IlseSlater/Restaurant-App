import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsOverviewDto, TopSellingItemDto, RevenueByHourDto, OrderStatusDto, RealtimeMetricsDto } from './dto/analytics-overview.dto';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getTodayRevenue(): Promise<{ today: string; total: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all orders from today
    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
        },
        status: {
          in: ['SERVED']
        }
      }
    });

    const total = orders.reduce((sum, order) => sum + Number(order.total), 0);
    
    return {
      today: total.toFixed(2),
      total: total
    };
  }

  async getTopMenuItems(limit: number = 5): Promise<any[]> {
    // Get all completed orders
    const orders = await this.prisma.order.findMany({
      where: {
        status: {
          in: ['SERVED']
        }
      },
      include: {
        items: {
          include: {
            menuItem: true
          }
        }
      }
    });

    // Count menu item occurrences
    const itemCounts = new Map<string, { name: string; count: number; revenue: number }>();
    
    orders.forEach(order => {
      order.items.forEach((item: any) => {
        const menuItemId = item.menuItemId;
        const menuItemName = item.menuItem?.name || 'Unknown Item';
        const itemRevenue = Number(item.menuItem?.price ?? 0) * item.quantity || 0;
        
        if (itemCounts.has(menuItemId)) {
          const existing = itemCounts.get(menuItemId)!;
          existing.count += item.quantity;
          existing.revenue += itemRevenue;
        } else {
          itemCounts.set(menuItemId, {
            name: menuItemName,
            count: item.quantity,
            revenue: itemRevenue
          });
        }
      });
    });

    // Convert to array and sort by count
    const topItems = Array.from(itemCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return topItems;
  }

  async getAnalyticsOverview(
    companyId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AnalyticsOverviewDto> {
    const dateFilter = this.buildDateFilter(startDate, endDate);
    const whereClause = { companyId, ...dateFilter };

    // Get aggregated data from both order types
    const [regularOrderStats, customerOrderStats] = await Promise.all([
      this.getRegularOrderStats(whereClause),
      this.getCustomerOrderStats(whereClause)
    ]);

    // Combine stats
    const totalRevenue = regularOrderStats.revenue + customerOrderStats.revenue;
    const totalOrders = regularOrderStats.count + customerOrderStats.count;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Get real-time metrics
    const realtimeMetrics = await this.getRealtimeMetrics(companyId);

    // Get top selling items
    const topSellingItems = await this.getTopSellingItems(companyId, 5, startDate, endDate);

    // Get revenue by hour
    const revenueByHour = await this.getRevenueByHour(companyId, startDate, endDate);

    // Get order status distribution
    const orderStatusDistribution = await this.getOrderStatusDistribution(companyId, startDate, endDate);

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      activeOrders: realtimeMetrics.activeOrders,
      completedToday: realtimeMetrics.completedToday,
      revenueToday: realtimeMetrics.revenueToday,
      topSellingItems,
      revenueByHour,
      orderStatusDistribution
    };
  }

  async getRealtimeMetrics(companyId: string): Promise<RealtimeMetricsDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const whereClause = { companyId };
    const todayWhereClause = { 
      companyId, 
      createdAt: { gte: today, lt: tomorrow } 
    };

    // Get active orders (pending/preparing)
    const [activeRegularOrders, activeCustomerOrders] = await Promise.all([
      this.prisma.order.count({
        where: { 
          ...whereClause, 
          status: { in: ['PENDING', 'PREPARING'] } 
        }
      }),
      this.prisma.customerOrder.count({
        where: { 
          ...whereClause, 
          status: { in: ['PENDING', 'PREPARING'] } 
        }
      })
    ]);

    // Get completed today
    const [completedRegularToday, completedCustomerToday] = await Promise.all([
      this.prisma.order.count({
        where: { 
          ...todayWhereClause, 
          status: { in: ['SERVED'] } 
        }
      }),
      this.prisma.customerOrder.count({
        where: { 
          ...todayWhereClause, 
          status: { in: ['SERVED'] } 
        }
      })
    ]);

    // Get revenue today
    const [regularRevenueToday, customerRevenueToday] = await Promise.all([
      this.prisma.order.aggregate({
        where: { 
          ...todayWhereClause, 
          status: { in: ['SERVED'] } 
        },
        _sum: { total: true }
      }),
      this.prisma.customerOrder.aggregate({
        where: { 
          ...todayWhereClause, 
          status: { in: ['SERVED'] } 
        },
        _sum: { total: true }
      })
    ]);

    // Get pending payments
    const pendingPayments = await this.prisma.payment?.count({
      where: { 
        companyId, 
        status: { in: ['PENDING', 'AUTHORIZED'] } 
      }
    }) || 0;

    return {
      activeOrders: activeRegularOrders + activeCustomerOrders,
      completedToday: completedRegularToday + completedCustomerToday,
      revenueToday: Number(regularRevenueToday._sum?.total ?? 0) + Number(customerRevenueToday._sum?.total ?? 0),
      pendingPayments,
      lastUpdated: new Date()
    };
  }

  async getTopSellingItems(
    companyId: string, 
    limit: number = 5,
    startDate?: Date,
    endDate?: Date
  ): Promise<TopSellingItemDto[]> {
    const dateFilter = this.buildDateFilter(startDate, endDate);
    
    // Get items from regular orders
    const regularOrderItems = await this.prisma.orderItem.findMany({
      where: {
        order: { companyId, ...dateFilter }
      },
      include: {
        menuItem: true,
        order: true
      }
    });

    // Get items from customer orders
    const customerOrderItems = await this.prisma.customerOrderItem.findMany({
      where: {
        customerOrder: { companyId, ...dateFilter }
      },
      include: {
        menuItem: true,
        customerOrder: true
      }
    });

    // Combine and aggregate items
    const itemMap = new Map<string, { name: string; quantity: number; revenue: number; category?: string }>();

    // Process regular order items
    regularOrderItems.forEach(item => {
      const key = item.menuItemId;
      const existing = itemMap.get(key) || { 
        name: item.menuItem?.name || 'Unknown', 
        quantity: 0, 
        revenue: 0,
        category: item.menuItem?.category
      };
      existing.quantity += item.quantity;
      existing.revenue += Number(item.price) * item.quantity;
      itemMap.set(key, existing);
    });

    // Process customer order items
    customerOrderItems.forEach(item => {
      const key = item.menuItemId;
      const existing = itemMap.get(key) || { 
        name: item.menuItem?.name || 'Unknown', 
        quantity: 0, 
        revenue: 0,
        category: item.menuItem?.category
      };
      existing.quantity += item.quantity;
      existing.revenue += Number(item.price) * item.quantity;
      itemMap.set(key, existing);
    });

    // Convert to array and sort by quantity
    return Array.from(itemMap.entries())
      .map(([menuItemId, data]) => ({
        menuItemId,
        name: data.name,
        quantity: data.quantity,
        revenue: data.revenue,
        category: data.category
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit);
  }

  async getRevenueByHour(
    companyId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<RevenueByHourDto[]> {
    const dateFilter = this.buildDateFilter(startDate, endDate);
    
    // Get orders with hour extraction
    const [regularOrders, customerOrders] = await Promise.all([
      this.prisma.order.findMany({
        where: { companyId, ...dateFilter },
        select: { total: true, createdAt: true }
      }),
      this.prisma.customerOrder.findMany({
        where: { companyId, ...dateFilter },
        select: { total: true, createdAt: true }
      })
    ]);

    // Group by hour
    const hourlyData = new Map<number, { revenue: number; orderCount: number }>();

    // Initialize hours 0-23
    for (let i = 0; i < 24; i++) {
      hourlyData.set(i, { revenue: 0, orderCount: 0 });
    }

    // Process regular orders
    regularOrders.forEach(order => {
      const hour = order.createdAt.getHours();
      const existing = hourlyData.get(hour)!;
      existing.revenue += Number(order.total);
      existing.orderCount += 1;
    });

    // Process customer orders
    customerOrders.forEach(order => {
      const hour = order.createdAt.getHours();
      const existing = hourlyData.get(hour)!;
      existing.revenue += Number(order.total);
      existing.orderCount += 1;
    });

    return Array.from(hourlyData.entries()).map(([hour, data]) => ({
      hour,
      revenue: data.revenue,
      orderCount: data.orderCount
    }));
  }

  async getOrderStatusDistribution(
    companyId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<OrderStatusDto[]> {
    const dateFilter = this.buildDateFilter(startDate, endDate);
    
    // Get status counts from both order types
    const [regularStatusCounts, customerStatusCounts] = await Promise.all([
      this.prisma.order.groupBy({
        by: ['status'],
        where: { companyId, ...dateFilter },
        _count: { status: true }
      }),
      this.prisma.customerOrder.groupBy({
        by: ['status'],
        where: { companyId, ...dateFilter },
        _count: { status: true }
      })
    ]);

    // Combine status counts
    const statusMap = new Map<string, number>();
    
    regularStatusCounts.forEach(item => {
      statusMap.set(item.status, (statusMap.get(item.status) || 0) + item._count.status);
    });

    customerStatusCounts.forEach(item => {
      statusMap.set(item.status, (statusMap.get(item.status) || 0) + item._count.status);
    });

    const totalOrders = Array.from(statusMap.values()).reduce((sum, count) => sum + count, 0);

    return Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
      percentage: totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0
    }));
  }

  private buildDateFilter(startDate?: Date, endDate?: Date) {
    if (!startDate && !endDate) return {};
    
    const filter: any = {};
    if (startDate) filter.gte = startDate;
    if (endDate) filter.lte = endDate;
    
    return { createdAt: filter };
  }

  private async getRegularOrderStats(whereClause: any) {
    const result = await this.prisma.order.aggregate({
      where: whereClause,
      _count: { id: true },
      _sum: { total: true }
    });

    return {
      count: result._count.id,
      revenue: Number(result._sum.total || 0)
    };
  }

  private async getCustomerOrderStats(whereClause: any) {
    const result = await this.prisma.customerOrder.aggregate({
      where: whereClause,
      _count: { id: true },
      _sum: { total: true }
    });

    return {
      count: result._count.id,
      revenue: Number(result._sum.total || 0)
    };
  }
}


