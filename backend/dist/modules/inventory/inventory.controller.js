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
var InventoryController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryController = void 0;
const common_1 = require("@nestjs/common");
const inventory_service_1 = require("./inventory.service");
const inventory_dto_1 = require("./dto/inventory.dto");
let InventoryController = InventoryController_1 = class InventoryController {
    constructor(inventoryService) {
        this.inventoryService = inventoryService;
        this.logger = new common_1.Logger(InventoryController_1.name);
    }
    async createInventoryItem(createDto) {
        return this.inventoryService.createInventoryItem(createDto);
    }
    async getInventoryItems(companyId, type, status, category, lowStock) {
        return this.inventoryService.getInventoryItems(companyId, {
            type,
            status,
            category,
            lowStock: lowStock === true
        });
    }
    async getInventoryItem(id) {
        return this.inventoryService.getInventoryItem(id);
    }
    async updateInventoryItem(id, updateDto) {
        return this.inventoryService.updateInventoryItem(id, updateDto);
    }
    async deleteInventoryItem(id) {
        return this.inventoryService.deleteInventoryItem(id);
    }
    async createInventoryMovement(createDto) {
        return this.inventoryService.createInventoryMovement(createDto);
    }
    async getInventoryMovements(companyId, inventoryItemId, type, startDate, endDate) {
        const filters = {};
        if (inventoryItemId)
            filters.inventoryItemId = inventoryItemId;
        if (type)
            filters.type = type;
        if (startDate)
            filters.startDate = new Date(startDate);
        if (endDate)
            filters.endDate = new Date(endDate);
        return this.inventoryService.getInventoryMovements(companyId, filters);
    }
    async createSupplier(createDto) {
        return this.inventoryService.createSupplier(createDto);
    }
    async getSuppliers(companyId) {
        return this.inventoryService.getSuppliers(companyId);
    }
    async getSupplier(id) {
        return this.inventoryService.getSuppliers(id);
    }
    async updateSupplier(id, updateDto) {
        return this.inventoryService.updateSupplier(id, updateDto);
    }
    async deleteSupplier(id) {
        return this.inventoryService.deleteSupplier(id);
    }
    async getInventoryAlerts(companyId, unreadOnly) {
        return this.inventoryService.getInventoryAlerts(companyId, unreadOnly === true);
    }
    async markAlertAsRead(id) {
        return this.inventoryService.markAlertAsRead(id);
    }
    async getInventoryReport(companyId, startDate, endDate) {
        return this.inventoryService.getInventoryReport(companyId, new Date(startDate), new Date(endDate));
    }
    async bulkUpdateInventoryItems(updates) {
        const results = [];
        for (const update of updates) {
            try {
                const result = await this.inventoryService.updateInventoryItem(update.id, {
                    currentStock: update.currentStock
                });
                if (update.reason) {
                    const prev = Number(result.currentStock ?? 0);
                    await this.inventoryService.createInventoryMovement({
                        companyId: result.companyId,
                        inventoryItemId: update.id,
                        type: inventory_dto_1.MovementType.ADJUSTMENT,
                        quantity: Math.abs(update.currentStock - prev),
                        reason: update.reason,
                        reference: 'BULK_UPDATE'
                    });
                }
                results.push({ id: update.id, success: true, data: result });
            }
            catch (error) {
                results.push({ id: update.id, success: false, error: error.message });
            }
        }
        return results;
    }
    async adjustStock(id, body) {
        const item = await this.inventoryService.getInventoryItem(id);
        if (!item) {
            throw new Error('Inventory item not found');
        }
        const current = Number(item.currentStock);
        const difference = body.newStock - current;
        const movementType = difference > 0 ? inventory_dto_1.MovementType.IN : inventory_dto_1.MovementType.OUT;
        return this.inventoryService.createInventoryMovement({
            companyId: item.companyId,
            inventoryItemId: id,
            type: movementType,
            quantity: Math.abs(difference),
            reason: body.reason,
            notes: body.notes,
            reference: 'STOCK_ADJUSTMENT'
        });
    }
    async getLowStockItems(companyId) {
        return this.inventoryService.getInventoryItems(companyId, { lowStock: true });
    }
    async getExpiringItems(companyId, days = 7) {
        return [];
    }
    async getInventorySummary(companyId) {
        const items = await this.inventoryService.getInventoryItems(companyId);
        const inStock = items.filter((i) => Number(i.currentStock) > Number(i.minStockLevel)).length;
        const lowStock = items.filter((i) => {
            const c = Number(i.currentStock);
            const m = Number(i.minStockLevel);
            return c > 0 && c <= m;
        }).length;
        const outOfStock = items.filter((i) => Number(i.currentStock) <= 0).length;
        const totalValue = items.reduce((sum, item) => sum + Number(item.currentStock) * Number(item.costPrice ?? 0), 0);
        return {
            totalItems: items.length,
            totalValue,
            inStock,
            lowStock,
            outOfStock,
            categories: [...new Set(items.map((item) => item.category).filter(Boolean))],
            types: []
        };
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, common_1.Post)('items'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.CreateInventoryItemDto]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "createInventoryItem", null);
__decorate([
    (0, common_1.Get)('items/company/:companyId'),
    __param(0, (0, common_1.Param)('companyId')),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('category')),
    __param(4, (0, common_1.Query)('lowStock')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Boolean]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getInventoryItems", null);
__decorate([
    (0, common_1.Get)('items/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getInventoryItem", null);
__decorate([
    (0, common_1.Put)('items/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, inventory_dto_1.UpdateInventoryItemDto]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "updateInventoryItem", null);
__decorate([
    (0, common_1.Delete)('items/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "deleteInventoryItem", null);
__decorate([
    (0, common_1.Post)('movements'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.CreateInventoryMovementDto]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "createInventoryMovement", null);
__decorate([
    (0, common_1.Get)('movements/company/:companyId'),
    __param(0, (0, common_1.Param)('companyId')),
    __param(1, (0, common_1.Query)('inventoryItemId')),
    __param(2, (0, common_1.Query)('type')),
    __param(3, (0, common_1.Query)('startDate')),
    __param(4, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getInventoryMovements", null);
__decorate([
    (0, common_1.Post)('suppliers'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.CreateSupplierDto]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "createSupplier", null);
__decorate([
    (0, common_1.Get)('suppliers/company/:companyId'),
    __param(0, (0, common_1.Param)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getSuppliers", null);
__decorate([
    (0, common_1.Get)('suppliers/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getSupplier", null);
__decorate([
    (0, common_1.Put)('suppliers/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, inventory_dto_1.UpdateSupplierDto]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "updateSupplier", null);
__decorate([
    (0, common_1.Delete)('suppliers/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "deleteSupplier", null);
__decorate([
    (0, common_1.Get)('alerts/company/:companyId'),
    __param(0, (0, common_1.Param)('companyId')),
    __param(1, (0, common_1.Query)('unreadOnly')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getInventoryAlerts", null);
__decorate([
    (0, common_1.Put)('alerts/:id/read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "markAlertAsRead", null);
__decorate([
    (0, common_1.Get)('reports/company/:companyId'),
    __param(0, (0, common_1.Param)('companyId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getInventoryReport", null);
__decorate([
    (0, common_1.Post)('items/bulk-update'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "bulkUpdateInventoryItems", null);
__decorate([
    (0, common_1.Post)('items/:id/adjust'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "adjustStock", null);
__decorate([
    (0, common_1.Get)('items/company/:companyId/low-stock'),
    __param(0, (0, common_1.Param)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getLowStockItems", null);
__decorate([
    (0, common_1.Get)('items/company/:companyId/expiring'),
    __param(0, (0, common_1.Param)('companyId')),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getExpiringItems", null);
__decorate([
    (0, common_1.Get)('summary/company/:companyId'),
    __param(0, (0, common_1.Param)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getInventorySummary", null);
exports.InventoryController = InventoryController = InventoryController_1 = __decorate([
    (0, common_1.Controller)('inventory'),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], InventoryController);
//# sourceMappingURL=inventory.controller.js.map