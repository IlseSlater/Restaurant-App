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
exports.CustomerOrdersController = void 0;
const common_1 = require("@nestjs/common");
const customer_orders_service_1 = require("./customer-orders.service");
let CustomerOrdersController = class CustomerOrdersController {
    constructor(orderService) {
        this.orderService = orderService;
    }
    createOrder(data) {
        return this.orderService.createOrder(data);
    }
    getOrdersBySession(sessionId) {
        return this.orderService.getOrdersBySession(sessionId);
    }
    getOrder(id) {
        return this.orderService.getOrder(id);
    }
    updateOrderStatus(id, data) {
        return this.orderService.updateOrderStatus(id, data.status);
    }
    updateBarOrderStatus(id, data) {
        return this.orderService.updateOrderStatus(id, data.status);
    }
    updateKitchenOrderStatus(id, data) {
        return this.orderService.updateOrderStatus(id, data.status);
    }
    updateItemStatus(orderId, itemId, data) {
        return this.orderService.updateItemStatus(orderId, itemId, data.status);
    }
};
exports.CustomerOrdersController = CustomerOrdersController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CustomerOrdersController.prototype, "createOrder", null);
__decorate([
    (0, common_1.Get)('session/:sessionId'),
    __param(0, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CustomerOrdersController.prototype, "getOrdersBySession", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CustomerOrdersController.prototype, "getOrder", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CustomerOrdersController.prototype, "updateOrderStatus", null);
__decorate([
    (0, common_1.Put)(':id/status/bar'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CustomerOrdersController.prototype, "updateBarOrderStatus", null);
__decorate([
    (0, common_1.Put)(':id/status/kitchen'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CustomerOrdersController.prototype, "updateKitchenOrderStatus", null);
__decorate([
    (0, common_1.Put)(':id/items/:itemId/status'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('itemId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], CustomerOrdersController.prototype, "updateItemStatus", null);
exports.CustomerOrdersController = CustomerOrdersController = __decorate([
    (0, common_1.Controller)('customer-orders'),
    __metadata("design:paramtypes", [customer_orders_service_1.CustomerOrdersService])
], CustomerOrdersController);
//# sourceMappingURL=customer-orders.controller.js.map