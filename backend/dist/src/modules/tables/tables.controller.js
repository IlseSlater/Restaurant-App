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
exports.TablesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const tables_service_1 = require("./tables.service");
let TablesController = class TablesController {
    constructor(tablesService) {
        this.tablesService = tablesService;
    }
    async getAllTables(companyId) {
        return this.tablesService.getAllTables(companyId);
    }
    async getTable(id) {
        return this.tablesService.getTable(id);
    }
    async getTableByQRCode(qrCode) {
        return this.tablesService.getTableByQRCode(qrCode);
    }
    async createTable(createDto) {
        return this.tablesService.createTable(createDto);
    }
    async updateTable(id, updateDto) {
        return this.tablesService.updateTable(id, updateDto);
    }
    async updateTableStatus(id, statusDto) {
        return this.tablesService.updateTableStatus(id, statusDto.status);
    }
    async assignWaiter(id, assignDto) {
        return this.tablesService.assignWaiter(id, assignDto.waiterId);
    }
    async clearTable(id, force) {
        return this.tablesService.clearTable(id, force === 'true');
    }
    async deleteTable(id) {
        return this.tablesService.deleteTable(id);
    }
    async generateQRData(companyId, tableId) {
        return this.tablesService.generateQRData(companyId, tableId);
    }
    async generateAllQRData(companyId) {
        return this.tablesService.generateAllQRDataForCompany(companyId);
    }
};
exports.TablesController = TablesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all tables' }),
    (0, swagger_1.ApiQuery)({ name: 'companyId', required: false, description: 'Filter by company ID' }),
    __param(0, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TablesController.prototype, "getAllTables", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get table by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TablesController.prototype, "getTable", null);
__decorate([
    (0, common_1.Get)('qr/:qrCode'),
    (0, swagger_1.ApiOperation)({ summary: 'Get table by QR code' }),
    __param(0, (0, common_1.Param)('qrCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TablesController.prototype, "getTableByQRCode", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create new table' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TablesController.prototype, "createTable", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update table' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TablesController.prototype, "updateTable", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Update table status' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TablesController.prototype, "updateTableStatus", null);
__decorate([
    (0, common_1.Put)(':id/assign'),
    (0, swagger_1.ApiOperation)({ summary: 'Assign waiter to table' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TablesController.prototype, "assignWaiter", null);
__decorate([
    (0, common_1.Post)(':id/clear'),
    (0, swagger_1.ApiOperation)({ summary: 'Clear & close table: end active session and set table to AVAILABLE. Use ?force=true to clear even with pending/preparing items.' }),
    (0, swagger_1.ApiQuery)({ name: 'force', required: false, description: 'If true, clear table even when there are active items' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('force')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TablesController.prototype, "clearTable", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete table' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TablesController.prototype, "deleteTable", null);
__decorate([
    (0, common_1.Get)('qr-data/:companyId/:tableId'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate QR code data for a specific table' }),
    __param(0, (0, common_1.Param)('companyId')),
    __param(1, (0, common_1.Param)('tableId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TablesController.prototype, "generateQRData", null);
__decorate([
    (0, common_1.Get)('qr-data/:companyId'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate QR code data for all tables in a company' }),
    __param(0, (0, common_1.Param)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TablesController.prototype, "generateAllQRData", null);
exports.TablesController = TablesController = __decorate([
    (0, swagger_1.ApiTags)('Tables'),
    (0, common_1.Controller)('tables'),
    __metadata("design:paramtypes", [tables_service_1.TablesService])
], TablesController);
//# sourceMappingURL=tables.controller.js.map