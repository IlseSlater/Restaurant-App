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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const orders_service_1 = require("./orders.service");
let OrdersController = class OrdersController {
    constructor(ordersService) {
        this.ordersService = ordersService;
    }
    async getAllOrders(companyId) {
        return this.ordersService.getAllOrders(companyId);
    }
    async getOrdersByTable(tableId) {
        return this.ordersService.getOrdersByTable(tableId);
    }
    async getOrder(id) {
        return this.ordersService.getOrder(id);
    }
    async createOrder(createDto) {
        return this.ordersService.createOrder(createDto);
    }
    async updateOrderStatus(id, statusDto) {
        return this.ordersService.updateOrderStatus(id, statusDto.status);
    }
    async updateKitchenOrderStatus(id, statusDto) {
        return this.ordersService.updateKitchenOrderStatus(id, statusDto.status);
    }
    async updateBarOrderStatus(id, statusDto) {
        return this.ordersService.updateBarOrderStatus(id, statusDto.status);
    }
    async updateOrderTotal(id, totalDto) {
        return this.ordersService.updateOrderTotal(id, totalDto.total);
    }
    async updateOrder(id, orderUpdate) {
        return this.ordersService.updateOrder(id, orderUpdate);
    }
    async addItemsToOrder(id, itemsDto) {
        return this.ordersService.addItemsToOrder(id, itemsDto.items);
    }
    async updateItemStatus(orderId, itemId, statusDto) {
        return this.ordersService.updateItemStatus(orderId, itemId, statusDto.status);
    }
};
exports.OrdersController = OrdersController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all orders' }),
    (0, swagger_1.ApiQuery)({ name: 'companyId', required: false, description: 'Filter by company ID' }),
    __param(0, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getAllOrders", null);
__decorate([
    (0, common_1.Get)('table/:tableId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get orders for table' }),
    __param(0, (0, common_1.Param)('tableId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getOrdersByTable", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get order by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getOrder", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create new order' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "createOrder", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Update order status' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "updateOrderStatus", null);
__decorate([
    (0, common_1.Put)(':id/status/kitchen'),
    (0, swagger_1.ApiOperation)({ summary: 'Update kitchen order status (food items only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "updateKitchenOrderStatus", null);
__decorate([
    (0, common_1.Put)(':id/status/bar'),
    (0, swagger_1.ApiOperation)({ summary: 'Update bar order status (drink items only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "updateBarOrderStatus", null);
__decorate([
    (0, common_1.Put)(':id/total'),
    (0, swagger_1.ApiOperation)({ summary: 'Update order total' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "updateOrderTotal", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update entire order' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "updateOrder", null);
__decorate([
    (0, common_1.Post)(':id/items'),
    (0, swagger_1.ApiOperation)({ summary: 'Add items to existing order' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "addItemsToOrder", null);
__decorate([
    (0, common_1.Put)(':id/items/:itemId/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Update item status' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('itemId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "updateItemStatus", null);
exports.OrdersController = OrdersController = __decorate([
    (0, swagger_1.ApiTags)('Orders'),
    (0, common_1.Controller)('orders'),
    __metadata("design:paramtypes", [orders_service_1.OrdersService])
], OrdersController);
//# sourceMappingURL=orders.controller.js.map