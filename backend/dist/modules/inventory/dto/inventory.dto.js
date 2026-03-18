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
exports.InventoryItemReportDto = exports.InventoryReportDto = exports.InventoryAlertDto = exports.UpdateSupplierDto = exports.CreateSupplierDto = exports.CreateInventoryMovementDto = exports.UpdateInventoryItemDto = exports.CreateInventoryItemDto = exports.MovementType = exports.InventoryStatus = exports.InventoryItemType = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var InventoryItemType;
(function (InventoryItemType) {
    InventoryItemType["INGREDIENT"] = "INGREDIENT";
    InventoryItemType["BEVERAGE"] = "BEVERAGE";
    InventoryItemType["SUPPLY"] = "SUPPLY";
    InventoryItemType["EQUIPMENT"] = "EQUIPMENT";
})(InventoryItemType || (exports.InventoryItemType = InventoryItemType = {}));
var InventoryStatus;
(function (InventoryStatus) {
    InventoryStatus["IN_STOCK"] = "IN_STOCK";
    InventoryStatus["LOW_STOCK"] = "LOW_STOCK";
    InventoryStatus["OUT_OF_STOCK"] = "OUT_OF_STOCK";
    InventoryStatus["DISCONTINUED"] = "DISCONTINUED";
})(InventoryStatus || (exports.InventoryStatus = InventoryStatus = {}));
var MovementType;
(function (MovementType) {
    MovementType["IN"] = "IN";
    MovementType["OUT"] = "OUT";
    MovementType["ADJUSTMENT"] = "ADJUSTMENT";
    MovementType["WASTE"] = "WASTE";
    MovementType["TRANSFER"] = "TRANSFER";
})(MovementType || (exports.MovementType = MovementType = {}));
class CreateInventoryItemDto {
}
exports.CreateInventoryItemDto = CreateInventoryItemDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInventoryItemDto.prototype, "companyId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInventoryItemDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInventoryItemDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(InventoryItemType),
    __metadata("design:type", String)
], CreateInventoryItemDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInventoryItemDto.prototype, "unit", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateInventoryItemDto.prototype, "currentStock", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateInventoryItemDto.prototype, "minimumStock", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateInventoryItemDto.prototype, "maximumStock", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateInventoryItemDto.prototype, "unitCost", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInventoryItemDto.prototype, "supplierId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInventoryItemDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInventoryItemDto.prototype, "barcode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInventoryItemDto.prototype, "location", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], CreateInventoryItemDto.prototype, "expiryDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateInventoryItemDto.prototype, "trackExpiry", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateInventoryItemDto.prototype, "reorderPoint", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateInventoryItemDto.prototype, "reorderQuantity", void 0);
class UpdateInventoryItemDto {
}
exports.UpdateInventoryItemDto = UpdateInventoryItemDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateInventoryItemDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateInventoryItemDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(InventoryItemType),
    __metadata("design:type", String)
], UpdateInventoryItemDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateInventoryItemDto.prototype, "unit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateInventoryItemDto.prototype, "currentStock", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateInventoryItemDto.prototype, "minimumStock", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateInventoryItemDto.prototype, "maximumStock", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateInventoryItemDto.prototype, "unitCost", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateInventoryItemDto.prototype, "supplierId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateInventoryItemDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateInventoryItemDto.prototype, "barcode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateInventoryItemDto.prototype, "location", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], UpdateInventoryItemDto.prototype, "expiryDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateInventoryItemDto.prototype, "trackExpiry", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateInventoryItemDto.prototype, "reorderPoint", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateInventoryItemDto.prototype, "reorderQuantity", void 0);
class CreateInventoryMovementDto {
}
exports.CreateInventoryMovementDto = CreateInventoryMovementDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInventoryMovementDto.prototype, "companyId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInventoryMovementDto.prototype, "inventoryItemId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(MovementType),
    __metadata("design:type", String)
], CreateInventoryMovementDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateInventoryMovementDto.prototype, "quantity", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInventoryMovementDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInventoryMovementDto.prototype, "reference", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInventoryMovementDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateInventoryMovementDto.prototype, "unitCost", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInventoryMovementDto.prototype, "performedBy", void 0);
class CreateSupplierDto {
}
exports.CreateSupplierDto = CreateSupplierDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSupplierDto.prototype, "companyId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSupplierDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSupplierDto.prototype, "contactPerson", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSupplierDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSupplierDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSupplierDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSupplierDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSupplierDto.prototype, "postalCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSupplierDto.prototype, "country", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSupplierDto.prototype, "website", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSupplierDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateSupplierDto.prototype, "categories", void 0);
class UpdateSupplierDto {
}
exports.UpdateSupplierDto = UpdateSupplierDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSupplierDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSupplierDto.prototype, "contactPerson", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSupplierDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSupplierDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSupplierDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSupplierDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSupplierDto.prototype, "postalCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSupplierDto.prototype, "country", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSupplierDto.prototype, "website", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSupplierDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateSupplierDto.prototype, "categories", void 0);
class InventoryAlertDto {
}
exports.InventoryAlertDto = InventoryAlertDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InventoryAlertDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InventoryAlertDto.prototype, "companyId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InventoryAlertDto.prototype, "inventoryItemId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InventoryAlertDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InventoryAlertDto.prototype, "message", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InventoryAlertDto.prototype, "severity", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], InventoryAlertDto.prototype, "isRead", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], InventoryAlertDto.prototype, "createdAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], InventoryAlertDto.prototype, "readAt", void 0);
class InventoryReportDto {
}
exports.InventoryReportDto = InventoryReportDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InventoryReportDto.prototype, "companyId", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], InventoryReportDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], InventoryReportDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => InventoryItemReportDto),
    __metadata("design:type", Array)
], InventoryReportDto.prototype, "items", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], InventoryReportDto.prototype, "totalValue", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], InventoryReportDto.prototype, "totalMovements", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], InventoryReportDto.prototype, "lowStockItems", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], InventoryReportDto.prototype, "outOfStockItems", void 0);
class InventoryItemReportDto {
}
exports.InventoryItemReportDto = InventoryItemReportDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InventoryItemReportDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InventoryItemReportDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InventoryItemReportDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], InventoryItemReportDto.prototype, "currentStock", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], InventoryItemReportDto.prototype, "minimumStock", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], InventoryItemReportDto.prototype, "unitCost", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], InventoryItemReportDto.prototype, "totalValue", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InventoryItemReportDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], InventoryItemReportDto.prototype, "movementsIn", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], InventoryItemReportDto.prototype, "movementsOut", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], InventoryItemReportDto.prototype, "netMovement", void 0);
//# sourceMappingURL=inventory.dto.js.map