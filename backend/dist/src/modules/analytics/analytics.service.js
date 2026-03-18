"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AnalyticsService = class AnalyticsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getTodayRevenue() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
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
    async getTopMenuItems(limit = 5) {
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
        const itemCounts = new Map();
        orders.forEach(order => {
            order.items.forEach((item) => {
                const menuItemId = item.menuItemId;
                const menuItemName = item.menuItem?.name || 'Unknown Item';
                const itemRevenue = Number(item.menuItem?.price ?? 0) * item.quantity || 0;
                if (itemCounts.has(menuItemId)) {
                    const existing = itemCounts.get(menuItemId);
                    existing.count += item.quantity;
                    existing.revenue += itemRevenue;
                }
                else {
                    itemCounts.set(menuItemId, {
                        name: menuItemName,
                        count: item.quantity,
                        revenue: itemRevenue
                    });
                }
            });
        });
        const topItems = Array.from(itemCounts.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
        return topItems;
    }
    async getAnalyticsOverview(companyId, startDate, endDate) {
        const dateFilter = this.buildDateFilter(startDate, endDate);
        const whereClause = { companyId, ...dateFilter };
        const [regularOrderStats, customerOrderStats] = await Promise.all([
            this.getRegularOrderStats(whereClause),
            this.getCustomerOrderStats(whereClause)
        ]);
        const totalRevenue = regularOrderStats.revenue + customerOrderStats.revenue;
        const totalOrders = regularOrderStats.count + customerOrderStats.count;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const realtimeMetrics = await this.getRealtimeMetrics(companyId);
        const topSellingItems = await this.getTopSellingItems(companyId, 5, startDate, endDate);
        const revenueByHour = await this.getRevenueByHour(companyId, startDate, endDate);
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
    async getRealtimeMetrics(companyId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const whereClause = { companyId };
        const todayWhereClause = {
            companyId,
            createdAt: { gte: today, lt: tomorrow }
        };
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
    async getTopSellingItems(companyId, limit = 5, startDate, endDate) {
        const dateFilter = this.buildDateFilter(startDate, endDate);
        const regularOrderItems = await this.prisma.orderItem.findMany({
            where: {
                order: { companyId, ...dateFilter }
            },
            include: {
                menuItem: true,
                order: true
            }
        });
        const customerOrderItems = await this.prisma.customerOrderItem.findMany({
            where: {
                customerOrder: { companyId, ...dateFilter }
            },
            include: {
                menuItem: true,
                customerOrder: true
            }
        });
        const itemMap = new Map();
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
    async getRevenueByHour(companyId, startDate, endDate) {
        const dateFilter = this.buildDateFilter(startDate, endDate);
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
        const hourlyData = new Map();
        for (let i = 0; i < 24; i++) {
            hourlyData.set(i, { revenue: 0, orderCount: 0 });
        }
        regularOrders.forEach(order => {
            const hour = order.createdAt.getHours();
            const existing = hourlyData.get(hour);
            existing.revenue += Number(order.total);
            existing.orderCount += 1;
        });
        customerOrders.forEach(order => {
            const hour = order.createdAt.getHours();
            const existing = hourlyData.get(hour);
            existing.revenue += Number(order.total);
            existing.orderCount += 1;
        });
        return Array.from(hourlyData.entries()).map(([hour, data]) => ({
            hour,
            revenue: data.revenue,
            orderCount: data.orderCount
        }));
    }
    async getOrderStatusDistribution(companyId, startDate, endDate) {
        const dateFilter = this.buildDateFilter(startDate, endDate);
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
        const statusMap = new Map();
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
    buildDateFilter(startDate, endDate) {
        if (!startDate && !endDate)
            return {};
        const filter = {};
        if (startDate)
            filter.gte = startDate;
        if (endDate)
            filter.lte = endDate;
        return { createdAt: filter };
    }
    async getRegularOrderStats(whereClause) {
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
    async getCustomerOrderStats(whereClause) {
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
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map