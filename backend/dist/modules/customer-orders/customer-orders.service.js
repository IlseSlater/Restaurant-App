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
exports.CustomerOrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const websocket_gateway_1 = require("../websocket/websocket.gateway");
const customer_sessions_service_1 = require("../customer-sessions/customer-sessions.service");
let CustomerOrdersService = class CustomerOrdersService {
    constructor(prisma, webSocketGateway, customerSessionsService) {
        this.prisma = prisma;
        this.webSocketGateway = webSocketGateway;
        this.customerSessionsService = customerSessionsService;
    }
    async createOrder(data) {
        const subtotal = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const serviceFee = (subtotal * data.serviceFeePercentage) / 100;
        const total = subtotal + serviceFee;
        const customerSession = await this.prisma.customerSession.findUnique({
            where: { id: data.customerSessionId },
            include: { participants: { where: { isCreator: true }, take: 1 } },
        });
        if (!customerSession) {
            throw new Error('Customer session not found');
        }
        const participantId = data.participantId ?? customerSession.participants?.[0]?.id ?? null;
        const regularItems = data.items.filter((i) => !i.isSpecial && !i.specialId);
        const specialItems = data.items.filter((i) => i.isSpecial && i.specialId && i.specialName);
        const menuItemIds = [...new Set(regularItems.map((i) => i.menuItemId))];
        const menuItems = await this.prisma.menuItem.findMany({
            where: { id: { in: menuItemIds } },
            select: { id: true, isShareable: true, maxClaimants: true },
        });
        const menuById = new Map(menuItems.map((m) => [m.id, m]));
        const order = (await this.prisma.customerOrder.create({
            data: {
                customerSessionId: data.customerSessionId,
                tableId: data.tableId,
                participantId,
                companyId: customerSession.companyId,
                subtotal,
                serviceFee,
                serviceFeePercentage: data.serviceFeePercentage,
                total,
                status: 'PENDING',
                items: {
                    create: regularItems.map((item) => {
                        const menu = menuById.get(item.menuItemId);
                        return {
                            menuItemId: item.menuItemId,
                            quantity: item.quantity,
                            specialInstructions: item.specialInstructions,
                            price: item.price,
                            status: 'PENDING',
                            isShareable: menu?.isShareable ?? false,
                            maxClaimants: menu?.maxClaimants ?? 4,
                        };
                    }),
                },
                ...(specialItems.length
                    ? {
                        appliedSpecials: {
                            create: specialItems.map((item) => ({
                                specialId: item.specialId,
                                name: item.specialName,
                                price: item.price,
                                quantity: item.quantity,
                            })),
                        },
                    }
                    : {}),
            },
            include: {
                items: {
                    include: {
                        menuItem: true,
                        claims: { include: { participant: { select: { displayName: true } } } },
                    },
                },
                appliedSpecials: true,
                customerSession: true,
                participant: { select: { displayName: true } },
                table: true,
            },
        }));
        for (let i = 0; i < order.items.length; i++) {
            const createdItem = order.items[i];
            const inputItem = data.items[i];
            if (inputItem.selectedModifiers?.length) {
                for (const mod of inputItem.selectedModifiers) {
                    await this.prisma.orderItemModifier.create({
                        data: {
                            customerOrderItemId: createdItem.id,
                            modifierOptionId: mod.modifierOptionId,
                            modifierGroupName: mod.modifierGroupName,
                            optionName: mod.optionName,
                            priceAdjustment: mod.priceAdjustment,
                        },
                    });
                }
            }
            if (inputItem.bundleChoices?.length) {
                for (const choice of inputItem.bundleChoices) {
                    const bundleChoice = await this.prisma.orderItemBundleChoice.create({
                        data: {
                            customerOrderItemId: createdItem.id,
                            bundleSlotId: choice.bundleSlotId,
                            chosenMenuItemId: choice.chosenMenuItemId,
                            chosenItemName: choice.chosenItemName,
                        },
                    });
                    if (choice.modifiers?.length) {
                        for (const mod of choice.modifiers) {
                            await this.prisma.orderItemModifier.create({
                                data: {
                                    customerOrderItemId: createdItem.id,
                                    modifierOptionId: mod.modifierOptionId,
                                    modifierGroupName: mod.modifierGroupName,
                                    optionName: mod.optionName,
                                    priceAdjustment: mod.priceAdjustment,
                                    bundleChoiceId: bundleChoice.id,
                                },
                            });
                        }
                    }
                }
            }
        }
        const orderToEmit = (await this.prisma.customerOrder.findUnique({
            where: { id: order.id },
            include: {
                items: {
                    include: {
                        menuItem: true,
                        claims: { include: { participant: { select: { displayName: true } } } },
                        modifiers: true,
                        bundleChoices: { include: { bundleSlot: true } },
                    },
                },
                appliedSpecials: true,
                customerSession: true,
                participant: { select: { displayName: true } },
                table: true,
            },
        })) ?? order;
        const orderForSockets = {
            ...orderToEmit,
            items: (orderToEmit.items || []).map((i) => ({
                ...i,
                notes: i.specialInstructions ?? i.notes ?? null,
            })),
        };
        if (participantId) {
            for (const item of order.items) {
                if (item.isShareable) {
                    await this.prisma.itemClaim.create({
                        data: {
                            participantId,
                            orderItemId: item.id,
                            percentage: 10000,
                        },
                    });
                }
            }
        }
        await this.customerSessionsService.updateActivity(data.customerSessionId);
        if (!order.customerSession) {
            console.warn(`Warning: CustomerSession not found for order ${order.id}, sessionId: ${data.customerSessionId}`);
        }
        if (!order.table) {
            console.warn(`Warning: Table not found for order ${order.id}, tableId: ${data.tableId}`);
        }
        const { barItems, kitchenItems } = this.categorizeOrderItems(orderForSockets.items);
        const companyId = order.customerSession?.companyId;
        console.log('📢 Customer order notifications sent:', {
            orderId: order.id,
            tableNumber: order.table?.number,
            customerName: order.customerSession?.customerName,
            barItems: barItems.length,
            kitchenItems: kitchenItems.length,
            companyId: companyId
        });
        console.log('🔍 Order Company Debug Info:', {
            orderId: order.id,
            orderCompanyId: order.companyId,
            sessionCompanyId: order.customerSession?.companyId,
            tableCompanyId: order.table?.companyId,
            customerName: order.customerSession?.customerName,
            tableNumber: order.table?.number
        });
        if (barItems.length > 0) {
            if (companyId) {
                this.webSocketGateway.emitToCompany(companyId, 'bar', 'order_created_bar', {
                    order: orderForSockets,
                    drinkItems: barItems,
                    tableNumber: orderForSockets.table?.number,
                    customerName: orderForSockets.customerSession?.customerName,
                    timestamp: new Date().toISOString(),
                });
            }
            else {
                this.webSocketGateway.server.to('bar').emit('order_created_bar', {
                    order: orderForSockets,
                    drinkItems: barItems,
                });
            }
        }
        if (kitchenItems.length > 0) {
            if (companyId) {
                this.webSocketGateway.emitToCompany(companyId, 'kitchen', 'order_created_kitchen', {
                    order: orderForSockets,
                    foodItems: kitchenItems,
                    tableNumber: orderForSockets.table?.number,
                    customerName: orderForSockets.customerSession?.customerName,
                    timestamp: new Date().toISOString(),
                });
            }
            else {
                this.webSocketGateway.server.to('kitchen').emit('order_created_kitchen', {
                    order: orderForSockets,
                    foodItems: kitchenItems,
                });
            }
        }
        if (companyId) {
            this.webSocketGateway.emitToCompany(companyId, 'waiters', 'customer_order_created', {
                order: orderForSockets,
                customerName: orderForSockets.customerSession?.customerName || 'Unknown Customer',
                tableNumber: orderForSockets.table?.number || 'Unknown Table',
                timestamp: new Date().toISOString(),
            });
        }
        else {
            this.webSocketGateway.server.to('waiters').emit('customer_order_created', {
                order: orderForSockets,
                customerName: orderForSockets.customerSession?.customerName || 'Unknown Customer',
                tableNumber: orderForSockets.table?.number || 'Unknown Table',
            });
        }
        const displayName = orderToEmit.participant?.displayName ?? orderToEmit.customerSession?.customerName ?? 'Someone';
        const itemsPayload = orderToEmit.items.map((i) => ({
            name: i.menuItem?.name ?? 'Item',
            qty: i.quantity ?? 1,
            orderItemId: i.id,
            price: Number(i.price),
            isShareable: !!i.isShareable,
            maxClaimants: i.maxClaimants ?? 4,
        }));
        const summary = orderToEmit.items
            .map((i) => (i.quantity > 1 ? `${i.quantity}x ${i.menuItem?.name ?? 'Item'}` : i.menuItem?.name ?? 'Item'))
            .join(', ') || 'items';
        const ts = new Date().toISOString();
        this.webSocketGateway.server.to(`customer-${orderToEmit.customerSessionId}`).emit('order_added', {
            type: 'ORDER_ADDED',
            participantId: orderToEmit.participantId ?? null,
            displayName,
            orderId: orderToEmit.id,
            items: itemsPayload,
            summary,
            timestamp: ts,
        });
        this.webSocketGateway.server.to(`customer-${orderToEmit.customerSessionId}`).emit('table_feed_item', {
            type: 'TABLE_FEED_ITEM',
            participantDisplayName: displayName,
            participantId: orderToEmit.participantId ?? null,
            orderId: orderToEmit.id,
            summary,
            timestamp: ts,
        });
        const tableId = orderToEmit.tableId ?? data.tableId;
        const activityItems = (orderToEmit.items || []).map((i) => ({
            itemName: i.menuItem?.name ?? 'Item',
            quantity: i.quantity ?? 1,
            modifiers: (i.modifiers ?? []).map((m) => m.optionName),
        }));
        this.webSocketGateway.emitToTable(tableId, 'table-activity', {
            type: 'item_added',
            participantName: displayName,
            items: activityItems,
            orderId: orderToEmit.id,
            timestamp: ts,
        });
        if (orderToEmit.customerSession?.companyId) {
            this.webSocketGateway.emitToCompany(orderToEmit.customerSession.companyId, 'admin', 'analytics_update', {
                type: 'order_created',
                orderId: orderToEmit.id,
                amount: orderToEmit.total,
                timestamp: new Date()
            });
        }
        console.log('📢 Customer order notifications sent:', {
            orderId: orderToEmit.id,
            tableNumber: orderToEmit.table?.number,
            customerName: orderToEmit.customerSession?.customerName,
            barItems: barItems.length,
            kitchenItems: kitchenItems.length
        });
        return orderToEmit;
    }
    categorizeOrderItems(items) {
        const drinkCategories = [
            'drinks',
            'beverage',
            'beverages',
            'soft drinks',
            'beer',
            'cocktails',
            'cocktail',
            'wine',
            'wines',
            'beers',
            'whiskeys',
            'vodkas',
            'spirits',
            'tequilas',
            'shots',
            'neat',
            'brandies',
        ];
        const barItems = [];
        const kitchenItems = [];
        items.forEach((item) => {
            const category = (item.menuItem?.category || '').toLowerCase();
            const isDrink = drinkCategories.some((drinkCat) => category.includes(drinkCat.toLowerCase()));
            if (isDrink) {
                barItems.push(item);
            }
            else {
                kitchenItems.push(item);
            }
        });
        return { barItems, kitchenItems };
    }
    async getOrdersBySession(sessionId) {
        const orders = await this.prisma.customerOrder.findMany({
            where: { customerSessionId: sessionId },
            include: {
                items: {
                    include: {
                        menuItem: true,
                        modifiers: true,
                        bundleChoices: { include: { bundleSlot: true } },
                    },
                },
                participant: { select: { id: true, displayName: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        const withStatus = orders.map((order) => ({
            ...order,
            status: this.deriveOrderStatusFromItems(order),
        }));
        return withStatus.filter((order) => order.status !== 'CANCELLED');
    }
    async getOrder(orderId) {
        const order = await this.prisma.customerOrder.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        menuItem: true,
                        modifiers: true,
                        bundleChoices: { include: { bundleSlot: true } },
                    },
                },
                customerSession: true,
                table: true,
            },
        });
        if (!order) {
            return null;
        }
        return {
            ...order,
            status: this.deriveOrderStatusFromItems(order),
        };
    }
    async updateOrderStatus(orderId, status) {
        const order = await this.prisma.customerOrder.update({
            where: { id: orderId },
            data: { status },
            include: {
                items: {
                    include: {
                        menuItem: true,
                    },
                },
                customerSession: true,
            },
        });
        this.webSocketGateway.server
            .to(`customer-${order.customerSessionId}`)
            .emit('order_status_updated', {
            orderId: order.id,
            status: order.status,
            timestamp: new Date(),
        });
        if (order.customerSession?.companyId) {
            this.webSocketGateway.emitToCompany(order.customerSession.companyId, 'admin', 'analytics_update', {
                type: 'order_status_changed',
                orderId: order.id,
                status: order.status,
                timestamp: new Date()
            });
        }
        return order;
    }
    async updateItemStatus(orderId, itemId, status) {
        const order = await this.prisma.customerOrder.findUnique({
            where: { id: orderId },
            include: { items: { include: { menuItem: true } }, customerSession: true },
        });
        if (!order) {
            throw new Error('Order not found');
        }
        await this.prisma.customerOrderItem.update({
            where: { id: itemId },
            data: { status },
        });
        const updatedOrder = await this.prisma.customerOrder.findUnique({
            where: { id: orderId },
            include: {
                items: { include: { menuItem: true } },
                customerSession: true,
            },
        });
        if (!updatedOrder) {
            throw new Error('Order not found');
        }
        const derivedStatus = this.deriveOrderStatusFromItems(updatedOrder);
        if (derivedStatus && derivedStatus !== updatedOrder.status) {
            await this.prisma.customerOrder.update({
                where: { id: orderId },
                data: { status: derivedStatus },
            });
            updatedOrder.status = derivedStatus;
        }
        this.webSocketGateway.server
            .to(`customer-${updatedOrder.customerSessionId}`)
            .emit('order_status_updated', {
            orderId: updatedOrder.id,
            itemId,
            status: updatedOrder.status,
            timestamp: new Date(),
        });
        return updatedOrder;
    }
    deriveOrderStatusFromItems(order) {
        const current = (order.status ?? '').toString().toUpperCase();
        const itemStatuses = (order.items ?? [])
            .map((i) => (i.status ?? '').toString().toUpperCase())
            .filter((s) => !!s);
        if (current === 'CANCELLED') {
            return 'CANCELLED';
        }
        if (itemStatuses.length === 0) {
            return current || 'PENDING';
        }
        if (itemStatuses.every((s) => s === 'CANCELLED')) {
            return 'CANCELLED';
        }
        const activeStatuses = itemStatuses.filter((s) => s !== 'CANCELLED');
        if (activeStatuses.length === 0) {
            return 'CANCELLED';
        }
        if (activeStatuses.some((s) => s === 'COLLECTED')) {
            return 'COLLECTED';
        }
        if (activeStatuses.some((s) => s === 'READY')) {
            return 'READY';
        }
        if (activeStatuses.some((s) => s === 'PREPARING' || s === 'CONFIRMED')) {
            return 'PREPARING';
        }
        if (activeStatuses.every((s) => s === 'SERVED' || s === 'DELIVERED')) {
            return 'SERVED';
        }
        return current || 'PENDING';
    }
};
exports.CustomerOrdersService = CustomerOrdersService;
exports.CustomerOrdersService = CustomerOrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        websocket_gateway_1.RestaurantWebSocketGateway,
        customer_sessions_service_1.CustomerSessionsService])
], CustomerOrdersService);
//# sourceMappingURL=customer-orders.service.js.map