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
var InventoryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const websocket_gateway_1 = require("../websocket/websocket.gateway");
const client_1 = require("@prisma/client");
const inventory_dto_1 = require("./dto/inventory.dto");
let InventoryService = InventoryService_1 = class InventoryService {
    constructor(prisma, webSocketGateway) {
        this.prisma = prisma;
        this.webSocketGateway = webSocketGateway;
        this.logger = new common_1.Logger(InventoryService_1.name);
    }
    async createInventoryItem(createDto) {
        const inventoryItem = await this.prisma.inventoryItem.create({
            data: {
                companyId: createDto.companyId,
                name: createDto.name,
                description: createDto.description ?? null,
                unit: createDto.unit,
                costPrice: createDto.unitCost,
                currentStock: createDto.currentStock,
                minStockLevel: createDto.minimumStock,
                maxStockLevel: createDto.maximumStock ?? null,
                reorderQuantity: createDto.reorderQuantity ?? null,
                supplierId: createDto.supplierId ?? null,
                category: createDto.category ?? null,
                sku: createDto.barcode ?? null,
            }
        });
        this.emitInventoryUpdate(createDto.companyId, 'item_created', inventoryItem);
        return inventoryItem;
    }
    async getInventoryItems(companyId, filters) {
        const where = { companyId };
        if (filters?.category) {
            where.category = filters.category;
        }
        let items = await this.prisma.inventoryItem.findMany({
            where,
            include: {
                supplier: true,
                movements: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                }
            },
            orderBy: { name: 'asc' }
        });
        if (filters?.lowStock) {
            items = items.filter((i) => Number(i.currentStock) <= Number(i.minStockLevel));
        }
        return items;
    }
    async getInventoryItem(id) {
        return this.prisma.inventoryItem.findUnique({
            where: { id },
            include: {
                supplier: true,
                movements: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
    }
    async updateInventoryItem(id, updateDto) {
        const existingItem = await this.prisma.inventoryItem.findUnique({
            where: { id }
        });
        if (!existingItem) {
            throw new common_1.BadRequestException('Inventory item not found');
        }
        const data = { ...updateDto };
        if (data.minimumStock !== undefined) {
            data.minStockLevel = data.minimumStock;
            delete data.minimumStock;
        }
        if (data.maximumStock !== undefined) {
            data.maxStockLevel = data.maximumStock;
            delete data.maximumStock;
        }
        if (data.unitCost !== undefined) {
            data.costPrice = data.unitCost;
            delete data.unitCost;
        }
        delete data.type;
        delete data.status;
        delete data.trackExpiry;
        delete data.expiryDate;
        const updatedItem = await this.prisma.inventoryItem.update({
            where: { id },
            data
        });
        this.emitInventoryUpdate(existingItem.companyId, 'item_updated', updatedItem);
        return updatedItem;
    }
    async deleteInventoryItem(id) {
        const item = await this.prisma.inventoryItem.findUnique({
            where: { id }
        });
        if (!item) {
            throw new common_1.BadRequestException('Inventory item not found');
        }
        await this.prisma.inventoryItem.delete({
            where: { id }
        });
        this.emitInventoryUpdate(item.companyId, 'item_deleted', { id });
        return { success: true };
    }
    mapMovementTypeToPrisma(type) {
        switch (type) {
            case inventory_dto_1.MovementType.IN: return client_1.InventoryMovementType.STOCK_IN;
            case inventory_dto_1.MovementType.OUT:
            case inventory_dto_1.MovementType.WASTE: return client_1.InventoryMovementType.STOCK_OUT;
            case inventory_dto_1.MovementType.ADJUSTMENT:
            case inventory_dto_1.MovementType.TRANSFER: return client_1.InventoryMovementType.ADJUSTMENT;
            default: return client_1.InventoryMovementType.ADJUSTMENT;
        }
    }
    async createInventoryMovement(createDto) {
        const inventoryItem = await this.prisma.inventoryItem.findUnique({
            where: { id: createDto.inventoryItemId }
        });
        if (!inventoryItem) {
            throw new common_1.BadRequestException('Inventory item not found');
        }
        const current = Number(inventoryItem.currentStock);
        const qty = createDto.quantity;
        let newStock;
        if (createDto.type === inventory_dto_1.MovementType.IN || createDto.type === inventory_dto_1.MovementType.ADJUSTMENT) {
            newStock = current + qty;
        }
        else if (createDto.type === inventory_dto_1.MovementType.OUT || createDto.type === inventory_dto_1.MovementType.WASTE) {
            newStock = current - qty;
        }
        else {
            newStock = current + qty;
        }
        if (newStock < 0) {
            throw new common_1.BadRequestException('Insufficient stock for this movement');
        }
        const movement = await this.prisma.inventoryMovement.create({
            data: {
                companyId: createDto.companyId,
                inventoryItemId: createDto.inventoryItemId,
                quantity: createDto.quantity,
                movementType: this.mapMovementTypeToPrisma(createDto.type),
                reference: createDto.reference ?? null,
                unitCost: createDto.unitCost ?? null,
                performedBy: createDto.performedBy ?? null,
                notes: createDto.notes ?? null,
            }
        });
        const updatedItem = await this.prisma.inventoryItem.update({
            where: { id: createDto.inventoryItemId },
            data: { currentStock: newStock }
        });
        await this.checkLowStockAlert(updatedItem);
        this.emitInventoryUpdate(createDto.companyId, 'movement_created', movement);
        this.emitInventoryUpdate(createDto.companyId, 'item_updated', updatedItem);
        return {
            movement,
            updatedItem
        };
    }
    async getInventoryMovements(companyId, filters) {
        const where = { companyId };
        if (filters?.inventoryItemId) {
            where.inventoryItemId = filters.inventoryItemId;
        }
        if (filters?.type) {
            where.movementType = this.mapMovementTypeToPrisma(filters.type);
        }
        if (filters?.startDate || filters?.endDate) {
            where.createdAt = {};
            if (filters.startDate) {
                where.createdAt.gte = filters.startDate;
            }
            if (filters.endDate) {
                where.createdAt.lte = filters.endDate;
            }
        }
        return this.prisma.inventoryMovement.findMany({
            where,
            include: {
                inventoryItem: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async createSupplier(createDto) {
        const { contactPerson, ...rest } = createDto;
        const supplier = await this.prisma.supplier.create({
            data: { ...rest, contactName: contactPerson ?? null }
        });
        this.emitInventoryUpdate(createDto.companyId, 'supplier_created', supplier);
        return supplier;
    }
    async getSuppliers(companyId) {
        return this.prisma.supplier.findMany({
            where: { companyId },
            include: {
                items: true
            },
            orderBy: { name: 'asc' }
        });
    }
    async updateSupplier(id, updateDto) {
        const supplier = await this.prisma.supplier.findUnique({
            where: { id }
        });
        if (!supplier) {
            throw new common_1.BadRequestException('Supplier not found');
        }
        const data = { ...updateDto };
        if (data.contactPerson !== undefined) {
            data.contactName = data.contactPerson;
            delete data.contactPerson;
        }
        const updatedSupplier = await this.prisma.supplier.update({
            where: { id },
            data
        });
        this.emitInventoryUpdate(supplier.companyId, 'supplier_updated', updatedSupplier);
        return updatedSupplier;
    }
    async deleteSupplier(id) {
        const supplier = await this.prisma.supplier.findUnique({
            where: { id }
        });
        if (!supplier) {
            throw new common_1.BadRequestException('Supplier not found');
        }
        await this.prisma.supplier.delete({
            where: { id }
        });
        this.emitInventoryUpdate(supplier.companyId, 'supplier_deleted', { id });
        return { success: true };
    }
    async getInventoryAlerts(companyId, unreadOnly = false) {
        const where = { companyId };
        if (unreadOnly) {
            where.resolved = false;
        }
        return this.prisma.inventoryAlert.findMany({
            where,
            include: {
                item: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async markAlertAsRead(alertId) {
        return this.prisma.inventoryAlert.update({
            where: { id: alertId },
            data: { resolved: true, resolvedAt: new Date() }
        });
    }
    async getInventoryReport(companyId, startDate, endDate) {
        const items = await this.getInventoryItems(companyId);
        const movements = await this.getInventoryMovements(companyId, { startDate, endDate });
        const report = items.map(item => {
            const itemMovements = movements.filter(m => m.inventoryItemId === item.id);
            const movementsIn = itemMovements
                .filter(m => m.movementType === client_1.InventoryMovementType.STOCK_IN)
                .reduce((sum, m) => sum + Number(m.quantity), 0);
            const movementsOut = itemMovements
                .filter(m => m.movementType === client_1.InventoryMovementType.STOCK_OUT)
                .reduce((sum, m) => sum + Number(m.quantity), 0);
            const currentStock = Number(item.currentStock);
            const costPrice = Number(item.costPrice ?? 0);
            const minLevel = Number(item.minStockLevel);
            const status = this.calculateInventoryStatus(currentStock, minLevel);
            return {
                id: item.id,
                name: item.name,
                type: item.category ?? 'OTHER',
                currentStock,
                minimumStock: minLevel,
                unitCost: costPrice,
                totalValue: currentStock * costPrice,
                status,
                movementsIn,
                movementsOut,
                netMovement: movementsIn - movementsOut
            };
        });
        const totalValue = report.reduce((sum, item) => sum + item.totalValue, 0);
        const lowStockItems = report.filter(item => item.status === inventory_dto_1.InventoryStatus.LOW_STOCK).length;
        const outOfStockItems = report.filter(item => item.status === inventory_dto_1.InventoryStatus.OUT_OF_STOCK).length;
        return {
            companyId,
            startDate,
            endDate,
            items: report,
            totalValue,
            totalMovements: movements.length,
            lowStockItems,
            outOfStockItems
        };
    }
    calculateInventoryStatus(currentStock, minimumStock) {
        if (currentStock <= 0) {
            return inventory_dto_1.InventoryStatus.OUT_OF_STOCK;
        }
        else if (currentStock <= minimumStock) {
            return inventory_dto_1.InventoryStatus.LOW_STOCK;
        }
        else {
            return inventory_dto_1.InventoryStatus.IN_STOCK;
        }
    }
    async checkLowStockAlert(inventoryItem) {
        const current = Number(inventoryItem.currentStock);
        const minLevel = Number(inventoryItem.minStockLevel);
        const status = this.calculateInventoryStatus(current, minLevel);
        if (status !== inventory_dto_1.InventoryStatus.LOW_STOCK && status !== inventory_dto_1.InventoryStatus.OUT_OF_STOCK)
            return;
        const alertType = status === inventory_dto_1.InventoryStatus.OUT_OF_STOCK ? client_1.InventoryAlertType.LOW_STOCK : client_1.InventoryAlertType.LOW_STOCK;
        const existingAlert = await this.prisma.inventoryAlert.findFirst({
            where: {
                inventoryItemId: inventoryItem.id,
                alertType,
                resolved: false
            }
        });
        if (!existingAlert) {
            const message = status === inventory_dto_1.InventoryStatus.OUT_OF_STOCK
                ? `${inventoryItem.name} is out of stock`
                : `${inventoryItem.name} is running low (${current} ${inventoryItem.unit} remaining)`;
            const alert = await this.prisma.inventoryAlert.create({
                data: {
                    companyId: inventoryItem.companyId,
                    inventoryItemId: inventoryItem.id,
                    alertType,
                    message
                }
            });
            this.emitInventoryUpdate(inventoryItem.companyId, 'alert_created', alert);
        }
    }
    emitInventoryUpdate(companyId, event, data) {
        this.webSocketGateway.emitToCompany(companyId, 'admin', 'inventory_update', {
            event,
            data,
            timestamp: new Date()
        });
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = InventoryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        websocket_gateway_1.RestaurantWebSocketGateway])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map