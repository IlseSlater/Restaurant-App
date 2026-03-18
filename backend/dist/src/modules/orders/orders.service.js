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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const websocket_gateway_1 = require("../websocket/websocket.gateway");
let OrdersService = class OrdersService {
    constructor(prisma, webSocketGateway) {
        this.prisma = prisma;
        this.webSocketGateway = webSocketGateway;
    }
    async getAllOrders(companyId) {
        const whereClause = companyId ? { companyId } : {};
        const regularOrders = await this.prisma.order.findMany({
            where: whereClause,
            include: {
                table: true,
                items: {
                    include: {
                        menuItem: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        const customerOrderInclude = {
            table: true,
            customerSession: true,
            participant: { select: { id: true, displayName: true } },
            items: {
                include: {
                    menuItem: true,
                    claims: { include: { participant: { select: { id: true, displayName: true } } } },
                },
            },
        };
        const customerOrders = await this.prisma.customerOrder.findMany({
            where: whereClause,
            include: customerOrderInclude,
            orderBy: {
                createdAt: 'desc',
            },
        });
        const customerOrdersTyped = customerOrders;
        const transformedCustomerOrders = customerOrdersTyped.map((order) => ({
            id: order.id,
            tableId: order.tableId,
            customerId: order.customerSessionId,
            customerSessionId: order.customerSessionId,
            customerName: order.customerSession?.customerName || 'Customer',
            participantId: order.participantId ?? null,
            participantDisplayName: order.participant?.displayName ?? order.customerSession?.customerName ?? 'Guest',
            status: order.status,
            total: order.total,
            notes: `Customer Order - ${order.customerSession?.customerName || 'Guest'}`,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            table: order.table,
            items: order.items.map((item) => ({
                id: item.id,
                orderId: order.id,
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                price: item.price,
                notes: item.specialInstructions,
                status: item.status,
                createdAt: item.createdAt,
                menuItem: item.menuItem,
                isShareable: item.isShareable ?? false,
                claims: item.claims?.map((c) => ({
                    participantId: c.participantId,
                    percentage: c.percentage,
                    displayName: c.participant?.displayName ?? 'Guest',
                })) ?? [],
            })),
            isCustomerOrder: true,
        }));
        const allOrders = [...regularOrders, ...transformedCustomerOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return allOrders;
    }
    async getOrder(id) {
        return this.prisma.order.findUnique({
            where: { id },
            include: { items: { include: { menuItem: true } } },
        });
    }
    async createOrder(createDto) {
        let companyId = createDto.companyId;
        if (!companyId) {
            const table = await this.prisma.table.findUnique({
                where: { id: createDto.tableId },
                select: { companyId: true },
            });
            companyId = table?.companyId ?? undefined;
        }
        if (!companyId) {
            throw new Error('Order must have companyId (provide it or use a table that has companyId)');
        }
        const total = Math.round(createDto.items.reduce((sum, item) => sum + (item.quantity * 10), 0) * 100) / 100;
        const order = await this.prisma.order.create({
            data: {
                companyId,
                tableId: createDto.tableId,
                customerId: createDto.customerId,
                total,
                status: 'PENDING',
                notes: createDto.notes,
                items: {
                    create: createDto.items.map((item) => ({
                        menuItemId: item.menuItemId,
                        quantity: item.quantity,
                        notes: item.notes,
                        price: 10,
                    })),
                },
            },
            include: { items: { include: { menuItem: true } } },
        });
        this.webSocketGateway.broadcastOrderUpdate(order.id, order.status, order.tableId);
        const { barItems, kitchenItems } = this.categorizeOrderItems(order.items);
        console.log('🔍 Order Creation Debug:', {
            orderId: order.id,
            tableId: order.tableId,
            totalItems: order.items.length,
            barItems: barItems.length,
            kitchenItems: kitchenItems.length,
            barItemDetails: barItems.map(item => ({
                id: item.menuItemId,
                name: item.menuItem?.name || 'Unknown',
                category: item.menuItem?.category || 'No Category'
            })),
            kitchenItemDetails: kitchenItems.map(item => ({
                id: item.menuItemId,
                name: item.menuItem?.name || 'Unknown',
                category: item.menuItem?.category || 'No Category'
            }))
        });
        this.webSocketGateway.server.emit('order_created', {
            order,
            tableId: order.tableId,
            timestamp: new Date().toISOString(),
        });
        if (barItems.length > 0) {
            console.log('🍹 Routing drinks to bar:', {
                orderId: order.id,
                tableId: order.tableId,
                companyId: order.companyId,
                drinkCount: barItems.length,
                drinkNames: barItems.map(item => item.menuItem?.name || 'Unknown')
            });
            const barOrder = {
                ...order,
                items: barItems,
                hasDrinks: true,
                kitchenItems: !!kitchenItems.find(item => kitchenItems.length > 0)
            };
            this.webSocketGateway.emitToCompany(order.companyId, 'bar', 'order_created_bar', {
                order: barOrder,
                tableId: order.tableId,
                timestamp: new Date().toISOString(),
                drinkItems: barItems.length
            });
            console.log('✅ Bar event emitted to company bar room');
        }
        else {
            console.log('❌ No drinks found - not routing to bar');
        }
        if (kitchenItems.length > 0) {
            console.log('🍽️ Routing food to kitchen:', {
                orderId: order.id,
                tableId: order.tableId,
                companyId: order.companyId,
                foodCount: kitchenItems.length,
                foodNames: kitchenItems.map(item => item.menuItem?.name || 'Unknown')
            });
            const kitchenOrder = {
                ...order,
                items: kitchenItems,
                hasFood: true,
                barItems: !!barItems.find(item => barItems.length > 0)
            };
            this.webSocketGateway.emitToCompany(order.companyId, 'kitchen', 'order_created_kitchen', {
                order: kitchenOrder,
                tableId: order.tableId,
                timestamp: new Date().toISOString(),
                foodItems: kitchenItems.length
            });
            console.log('✅ Kitchen event emitted to company kitchen room');
        }
        else {
            console.log('❌ No food found - not routing to kitchen');
        }
        return order;
    }
    async updateOrderStatus(id, status) {
        const existingOrder = await this.prisma.order.findUnique({
            where: { id },
            include: { items: { include: { menuItem: true } } },
        });
        if (!existingOrder) {
            throw new Error('Order not found');
        }
        const order = await this.prisma.order.update({
            where: { id },
            data: { status: status },
        });
        this.webSocketGateway.broadcastOrderUpdate(order.id, order.status, order.tableId);
        return order;
    }
    async updateKitchenOrderStatus(id, status) {
        const existingOrder = await this.prisma.order.findUnique({
            where: { id },
            include: { items: { include: { menuItem: true } } },
        });
        if (!existingOrder) {
            const customerOrder = await this.prisma.customerOrder.findUnique({ where: { id } });
            if (customerOrder) {
                return this.updateCustomerOrderKitchenStatus(id, status);
            }
            throw new Error('Order not found');
        }
        const { kitchenItems } = this.categorizeOrderItems(existingOrder.items);
        const kitchenStatus = this.calculateCategoryStatus(kitchenItems.map((item) => item.status || 'NEW'));
        const order = await this.prisma.order.update({
            where: { id },
            data: {},
        });
        console.log('🔧 Emitting kitchen status change for company:', existingOrder.companyId);
        this.webSocketGateway.emitToCompany(existingOrder.companyId, 'kitchen', 'order_status_changed', {
            orderId: order.id,
            status: kitchenStatus,
            tableId: order.tableId,
            timestamp: new Date().toISOString(),
            department: 'kitchen'
        });
        this.webSocketGateway.emitToCompany(existingOrder.companyId, 'waiters', 'order_status_changed', {
            orderId: order.id,
            status: kitchenStatus,
            tableId: order.tableId,
            timestamp: new Date().toISOString(),
            department: 'kitchen',
        });
        this.webSocketGateway.emitToCompany(existingOrder.companyId, 'admin', 'order_status_changed', {
            orderId: order.id,
            status: order.status,
            tableId: order.tableId,
            timestamp: new Date().toISOString(),
            department: 'kitchen'
        });
        return order;
    }
    async updateBarOrderStatus(id, status) {
        const existingOrder = await this.prisma.order.findUnique({
            where: { id },
            include: { items: { include: { menuItem: true } } },
        });
        if (!existingOrder) {
            const customerOrder = await this.prisma.customerOrder.findUnique({ where: { id } });
            if (customerOrder) {
                return this.updateCustomerOrderBarStatus(id, status);
            }
            throw new Error('Order not found');
        }
        const { barItems } = this.categorizeOrderItems(existingOrder.items);
        console.log('🔧 Bar Update:', {
            orderId: id,
            newStatus: status,
            barItems: barItems.length,
            totalItems: existingOrder.items.length
        });
        const barStatus = this.calculateCategoryStatus(barItems.map((item) => item.status || 'NEW'));
        const order = await this.prisma.order.update({
            where: { id },
            data: {},
        });
        console.log('🔧 Emitting bar status change for company:', existingOrder.companyId);
        this.webSocketGateway.emitToCompany(existingOrder.companyId, 'bar', 'order_status_changed', {
            orderId: order.id,
            status: barStatus,
            tableId: order.tableId,
            timestamp: new Date().toISOString(),
            department: 'bar'
        });
        this.webSocketGateway.emitToCompany(existingOrder.companyId, 'waiters', 'order_status_changed', {
            orderId: order.id,
            status: barStatus,
            tableId: order.tableId,
            timestamp: new Date().toISOString(),
            department: 'bar',
        });
        this.webSocketGateway.emitToCompany(existingOrder.companyId, 'admin', 'order_status_changed', {
            orderId: order.id,
            status: order.status,
            tableId: order.tableId,
            timestamp: new Date().toISOString(),
            department: 'bar'
        });
        return order;
    }
    calculateOverallOrderStatus(items) {
        const { barItems, kitchenItems } = this.categorizeOrderItems(items);
        const drinkStatuses = barItems.map(item => item.status || 'NEW');
        const foodStatuses = kitchenItems.map(item => item.status || 'NEW');
        const drinkStatus = this.calculateCategoryStatus(drinkStatuses);
        const foodStatus = this.calculateCategoryStatus(foodStatuses);
        const statusPriority = {
            'CANCELLED': 1,
            'PENDING': 2,
            'PREPARING': 3,
            'READY': 4,
            'COMPLETED': 5
        };
        console.log('🔧 Status calculation:', { drinkStatus, foodStatus });
        const drinkPriority = statusPriority[drinkStatus] || 2;
        const foodPriority = statusPriority[foodStatus] || 2;
        const maxPriority = Math.max(drinkPriority, foodPriority);
        console.log('🔧 Priorities:', { drinkPriority, foodPriority, maxPriority });
        return Object.keys(statusPriority).find(key => statusPriority[key] === maxPriority) || 'PENDING';
    }
    calculateCategoryStatus(statuses) {
        if (statuses.length === 0)
            return 'CANCELLED';
        if (statuses.every(status => status === 'CANCELLED')) {
            return 'CANCELLED';
        }
        if (statuses.every(status => ['COLLECTED', 'SERVED'].includes(status))) {
            return 'COMPLETED';
        }
        if (statuses.every(status => status === 'READY')) {
            return 'READY';
        }
        if (statuses.some(status => status === 'PREPARING')) {
            return 'PREPARING';
        }
        return 'PENDING';
    }
    async updateOrderTotal(id, newTotal) {
        const order = await this.prisma.order.update({
            where: { id },
            data: { total: newTotal }
        });
        this.webSocketGateway.broadcastOrderUpdate(order.id, order.status, order.tableId);
        return order;
    }
    async updateOrder(id, orderUpdate) {
        if (id.startsWith('customer-order-')) {
            const order = await this.prisma.customerOrder.update({
                where: { id },
                data: {
                    status: orderUpdate.status,
                    items: orderUpdate.items
                }
            });
            this.webSocketGateway.server.emit('order_updated', {
                orderId: order.id,
                order
            });
            return order;
        }
        const order = await this.prisma.order.update({
            where: { id },
            data: {
                status: orderUpdate.status,
                items: orderUpdate.items
            }
        });
        this.webSocketGateway.server.emit('order_updated', {
            orderId: order.id,
            order
        });
        return order;
    }
    async addItemsToOrder(orderId, newItems) {
        const existingOrder = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { items: { include: { menuItem: true } } },
        });
        if (!existingOrder) {
            throw new Error('Order not found');
        }
        const newItemsTotal = newItems.reduce((sum, item) => sum + (item.quantity * 10), 0);
        const newTotal = Math.round((Number(existingOrder.total) + newItemsTotal) * 100) / 100;
        await this.prisma.order.update({
            where: { id: orderId },
            data: {
                total: newTotal,
                items: {
                    create: newItems.map((item) => ({
                        menuItemId: item.menuItemId,
                        quantity: item.quantity,
                        notes: item.notes,
                        price: 10,
                    })),
                },
            },
        });
        const updatedOrder = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { items: { include: { menuItem: true } } },
        });
        if (!updatedOrder) {
            throw new Error('Order not found');
        }
        const companyId = updatedOrder.companyId;
        this.webSocketGateway.emitToCompany(companyId, 'waiters', 'order_modified', {
            order: updatedOrder,
            tableId: updatedOrder.tableId,
            timestamp: new Date().toISOString(),
            action: 'items_added',
            newItems: newItems.length
        });
        this.webSocketGateway.emitToCompany(companyId, 'kitchen', 'order_modified', {
            order: updatedOrder,
            tableId: updatedOrder.tableId,
            timestamp: new Date().toISOString(),
            action: 'items_added',
            newItems: newItems.length
        });
        this.webSocketGateway.emitToCompany(companyId, 'admin', 'order_modified', {
            order: updatedOrder,
            tableId: updatedOrder.tableId,
            timestamp: new Date().toISOString(),
            action: 'items_added',
            newItems: newItems.length
        });
        return updatedOrder;
    }
    async updateItemStatus(orderId, itemId, status) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { items: { include: { menuItem: true } } },
        });
        if (!order) {
            const customerOrder = await this.prisma.customerOrder.findUnique({ where: { id: orderId } });
            if (customerOrder) {
                return this.updateCustomerOrderItemStatus(orderId, itemId, status);
            }
            throw new Error('Order not found');
        }
        await this.prisma.order.update({
            where: { id: orderId },
            data: { status: status },
        });
        const updatedOrder = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { items: { include: { menuItem: true } } },
        });
        if (!updatedOrder) {
            throw new Error('Order not found');
        }
        const companyId = order.companyId;
        this.webSocketGateway.emitToCompany(companyId, 'waiters', 'item_status_updated', {
            orderId,
            itemId,
            status,
            tableId: order.tableId,
            timestamp: new Date().toISOString()
        });
        this.webSocketGateway.emitToCompany(companyId, 'kitchen', 'item_status_updated', {
            orderId,
            itemId,
            status,
            tableId: order.tableId,
            timestamp: new Date().toISOString()
        });
        this.webSocketGateway.emitToCompany(companyId, 'bar', 'item_status_updated', {
            orderId,
            itemId,
            status,
            tableId: order.tableId,
            timestamp: new Date().toISOString()
        });
        this.webSocketGateway.emitToCompany(companyId, 'admin', 'item_status_updated', {
            orderId,
            itemId,
            status,
            tableId: order.tableId,
            timestamp: new Date().toISOString()
        });
        return updatedOrder;
    }
    categorizeOrderItems(items) {
        const barItems = [];
        const kitchenItems = [];
        console.log('🔍 Categorizing items:', items.map(item => ({
            id: item.menuItemId,
            name: item.menuItem?.name || 'Unknown',
            category: item.menuItem?.category || 'No Category'
        })));
        items.forEach(item => {
            const menuItem = item.menuItem || this.getMenuItemById(item.menuItemId);
            const category = (menuItem.category || '').toLowerCase();
            console.log(`🔍 Item ${item.menuItemId}: category="${category}", isDrink=${this.isDrinkCategory(category)}`);
            if (this.isDrinkCategory(category)) {
                barItems.push(item);
                console.log(`✅ Added ${item.menuItemId} to bar items`);
            }
            else {
                kitchenItems.push(item);
                console.log(`✅ Added ${item.menuItemId} to kitchen items`);
            }
        });
        console.log('🔍 Final categorization:', {
            barItems: barItems.length,
            kitchenItems: kitchenItems.length
        });
        return { barItems, kitchenItems };
    }
    isDrinkCategory(category) {
        const drinkCategories = [
            'beverage', 'beverages', 'soft drinks', 'beer', 'cocktails', 'cocktail',
            'wine', 'wines', 'beers', 'whiskeys', 'vodkas', 'spirits', 'tequilas',
            'wines', 'shots', 'neat', 'brandies', 'barbecue', 'cocktails'
        ];
        return drinkCategories.some(drinkCategory => category.includes(drinkCategory.toLowerCase()));
    }
    getMenuItemById(menuItemId) {
        const menuItems = [
            { id: 'menu-1', name: 'Caesar Salad', price: 12.99, description: 'Fresh romaine lettuce with caesar dressing', category: 'Appetizers', isAvailable: true },
            { id: 'menu-2', name: 'Grilled Salmon', price: 24.99, description: 'Atlantic salmon with herbs and lemon', category: 'Main Courses', isAvailable: true },
            { id: 'menu-3', name: 'Chicken Parmesan', price: 18.99, description: 'Breaded chicken with marinara sauce', category: 'Main Courses', isAvailable: true },
            { id: 'menu-4', name: 'Chocolate Cake', price: 8.99, description: 'Rich chocolate cake with vanilla ice cream', category: 'Desserts', isAvailable: true },
            { id: 'menu-5', name: 'Beef Burger', price: 16.99, description: 'Juicy beef patty with fries', category: 'Main Courses', isAvailable: true },
            { id: 'menu-6', name: 'Tiramisu', price: 7.99, description: 'Classic Italian dessert', category: 'Desserts', isAvailable: true },
            { id: 'menu-7', name: 'Chicken Wings', price: 11.99, description: 'Spicy buffalo wings with ranch dip', category: 'Appetizers', isAvailable: true },
            { id: 'menu-8', name: 'Fish & Chips', price: 14.99, description: 'Beer-battered fish with crispy fries', category: 'Main Courses', isAvailable: true },
            { id: 'menu-21', name: 'Mojito Classic', price: 15.00, description: 'The best cocktail in the land this week', category: 'COCKTAILS', isAvailable: true }
        ];
        return menuItems.find(item => item.id === menuItemId) || { id: menuItemId, name: 'Unknown Item', price: 0 };
    }
    async getOrdersByTable(tableId) {
        const [regularOrders, customerOrders] = await Promise.all([
            this.prisma.order.findMany({
                where: { tableId },
                include: {
                    table: true,
                    items: { include: { menuItem: true } },
                },
            }),
            this.prisma.customerOrder.findMany({
                where: { tableId },
                include: {
                    table: true,
                    customerSession: true,
                    participant: { select: { id: true, displayName: true } },
                    items: {
                        include: {
                            menuItem: true,
                            claims: { include: { participant: { select: { displayName: true } } } },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
        ]);
        const transformed = customerOrders.map((order) => ({
            id: order.id,
            tableId: order.tableId,
            customerSessionId: order.customerSessionId,
            status: order.status,
            total: order.total,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            table: order.table,
            items: order.items.map((item) => ({
                id: item.id,
                orderId: order.id,
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                price: item.price,
                notes: item.specialInstructions,
                status: item.status,
                createdAt: item.createdAt,
                menuItem: item.menuItem,
            })),
        }));
        return [...regularOrders, ...transformed].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    async updateCustomerOrderItemStatus(orderId, itemId, status) {
        const order = await this.prisma.customerOrder.findUnique({
            where: { id: orderId },
            include: { items: { include: { menuItem: true } } },
        });
        if (!order) {
            throw new Error('Customer order not found');
        }
        await this.prisma.customerOrderItem.update({
            where: { id: itemId },
            data: { status },
        });
        const updatedOrder = await this.prisma.customerOrder.findUnique({
            where: { id: orderId },
            include: { items: { include: { menuItem: true } } },
        });
        if (!updatedOrder) {
            throw new Error('Customer order not found');
        }
        console.log(`✅ Updated customer order item ${itemId} to ${status}`);
        const companyId = order.companyId;
        this.webSocketGateway.emitToCompany(companyId, 'waiters', 'item_status_updated', {
            orderId,
            itemId,
            status,
            tableId: order.tableId,
            timestamp: new Date().toISOString()
        });
        this.webSocketGateway.emitToCompany(companyId, 'kitchen', 'item_status_updated', {
            orderId,
            itemId,
            status,
            tableId: order.tableId,
            timestamp: new Date().toISOString()
        });
        this.webSocketGateway.emitToCompany(companyId, 'bar', 'item_status_updated', {
            orderId,
            itemId,
            status,
            tableId: order.tableId,
            timestamp: new Date().toISOString()
        });
        this.webSocketGateway.server
            .to(`customer-${order.customerSessionId}`)
            .emit('order_status_updated', {
            orderId,
            itemId,
            status,
            timestamp: new Date()
        });
        return updatedOrder;
    }
    async updateCustomerOrderBarStatus(id, status) {
        const existingOrder = await this.prisma.customerOrder.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        menuItem: true,
                    },
                },
                table: true,
                customerSession: true,
            },
        });
        if (!existingOrder) {
            throw new Error('Customer order not found');
        }
        const drinkItems = existingOrder.items.filter((item) => {
            const category = (item.menuItem?.category || '').toLowerCase();
            return this.isDrinkItem(category);
        });
        console.log('🔧 Bar Update (Customer Order):', {
            orderId: id,
            newStatus: status,
            drinkItems: drinkItems.length,
            totalItems: existingOrder.items.length,
        });
        for (const item of drinkItems) {
            await this.prisma.customerOrderItem.update({
                where: { id: item.id },
                data: { status },
            });
        }
        const updatedOrder = await this.prisma.customerOrder.findUnique({
            where: { id },
            include: {
                items: { include: { menuItem: true } },
                table: true,
                customerSession: true,
            },
        });
        if (!updatedOrder) {
            throw new Error('Customer order not found');
        }
        const barStatuses = drinkItems.map((item) => item.status || 'PENDING');
        const barStatus = this.calculateCategoryStatus(barStatuses);
        console.log('🔧 Emitting customer order bar status change for company:', existingOrder.companyId);
        this.webSocketGateway.emitToCompany(existingOrder.companyId, 'bar', 'order_status_changed', {
            orderId: id,
            status: barStatus,
            tableId: existingOrder.tableId,
            timestamp: new Date().toISOString(),
            department: 'bar',
        });
        this.webSocketGateway.emitToCompany(existingOrder.companyId, 'waiters', 'order_status_changed', {
            orderId: id,
            status: barStatus,
            tableId: existingOrder.tableId,
            timestamp: new Date().toISOString(),
            department: 'bar',
        });
        this.webSocketGateway.server
            .to(`customer-${existingOrder.customerSessionId}`)
            .emit('order_status_updated', {
            orderId: id,
            status: barStatus,
            department: 'bar',
            timestamp: new Date(),
            message: `Bar update: ${barStatus}`
        });
        return {
            id: updatedOrder.id,
            tableId: updatedOrder.tableId,
            status: updatedOrder.status,
            items: updatedOrder.items.map((item) => ({
                id: item.id,
                orderId: updatedOrder.id,
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                price: item.price,
                notes: item.specialInstructions,
                status: item.status,
                menuItem: item.menuItem,
            })),
            isCustomerOrder: true,
        };
    }
    async updateCustomerOrderKitchenStatus(id, status) {
        const existingOrder = await this.prisma.customerOrder.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        menuItem: true,
                    },
                },
                table: true,
                customerSession: true,
            },
        });
        if (!existingOrder) {
            throw new Error('Customer order not found');
        }
        const foodItems = existingOrder.items.filter((item) => {
            const category = (item.menuItem?.category || '').toLowerCase();
            return !this.isDrinkItem(category);
        });
        console.log('🔧 Kitchen Update (Customer Order):', {
            orderId: id,
            newStatus: status,
            foodItems: foodItems.length,
            totalItems: existingOrder.items.length,
        });
        for (const item of foodItems) {
            await this.prisma.customerOrderItem.update({
                where: { id: item.id },
                data: { status },
            });
        }
        const updatedOrder = await this.prisma.customerOrder.findUnique({
            where: { id },
            include: {
                items: { include: { menuItem: true } },
                table: true,
                customerSession: true,
            },
        });
        if (!updatedOrder) {
            throw new Error('Customer order not found');
        }
        const kitchenStatuses = foodItems.map((item) => item.status || 'PENDING');
        const kitchenStatus = this.calculateCategoryStatus(kitchenStatuses);
        console.log('🔧 Emitting customer order kitchen status change for company:', existingOrder.companyId);
        this.webSocketGateway.emitToCompany(existingOrder.companyId, 'kitchen', 'order_status_changed', {
            orderId: id,
            status: kitchenStatus,
            tableId: existingOrder.tableId,
            timestamp: new Date().toISOString(),
            department: 'kitchen',
        });
        this.webSocketGateway.emitToCompany(existingOrder.companyId, 'waiters', 'order_status_changed', {
            orderId: id,
            status: kitchenStatus,
            tableId: existingOrder.tableId,
            timestamp: new Date().toISOString(),
            department: 'kitchen',
        });
        this.webSocketGateway.server
            .to(`customer-${existingOrder.customerSessionId}`)
            .emit('order_status_updated', {
            orderId: id,
            status: kitchenStatus,
            department: 'kitchen',
            timestamp: new Date(),
            message: `Kitchen update: ${kitchenStatus}`
        });
        return {
            id: updatedOrder.id,
            tableId: updatedOrder.tableId,
            status: updatedOrder.status,
            items: updatedOrder.items.map((item) => ({
                id: item.id,
                orderId: updatedOrder.id,
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                price: item.price,
                notes: item.specialInstructions,
                status: item.status,
                menuItem: item.menuItem,
            })),
            isCustomerOrder: true,
        };
    }
    isDrinkItem(category) {
        const drinkCategories = [
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
        return drinkCategories.some((drinkCat) => category.includes(drinkCat.toLowerCase()));
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        websocket_gateway_1.RestaurantWebSocketGateway])
], OrdersService);
//# sourceMappingURL=orders.service.js.map