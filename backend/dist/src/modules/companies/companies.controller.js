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
exports.CompaniesController = void 0;
const common_1 = require("@nestjs/common");
const companies_service_1 = require("./companies.service");
const create_company_dto_1 = require("./dto/create-company.dto");
const update_company_dto_1 = require("./dto/update-company.dto");
const company_guard_1 = require("../auth/company.guard");
let CompaniesController = class CompaniesController {
    constructor(companiesService) {
        this.companiesService = companiesService;
    }
    create(createCompanyDto) {
        return this.companiesService.create(createCompanyDto);
    }
    findAll() {
        return this.companiesService.findAll();
    }
    findOne(id) {
        return this.companiesService.findOne(id);
    }
    findBySlug(slug) {
        return this.companiesService.findBySlug(slug);
    }
    update(id, updateCompanyDto) {
        return this.companiesService.update(id, updateCompanyDto);
    }
    remove(id) {
        return this.companiesService.remove(id);
    }
    getCompanyTables(companyId) {
        return this.companiesService.getCompanyTables(companyId);
    }
    getCompanyMenu(companyId) {
        return this.companiesService.getCompanyMenu(companyId);
    }
    getCompanyOrders(companyId) {
        return this.companiesService.getCompanyOrders(companyId);
    }
    getCompanyUsers(companyId) {
        return this.companiesService.getCompanyUsers(companyId);
    }
    generateQRCodes(companyId, data) {
        return { message: 'QR code generation not implemented yet', companyId, data };
    }
};
exports.CompaniesController = CompaniesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_company_dto_1.CreateCompanyDto]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('slug/:slug'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "findBySlug", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_company_dto_1.UpdateCompanyDto]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':companyId/tables'),
    (0, common_1.UseGuards)(company_guard_1.CompanyGuard),
    __param(0, (0, common_1.Param)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "getCompanyTables", null);
__decorate([
    (0, common_1.Get)(':companyId/menu'),
    (0, common_1.UseGuards)(company_guard_1.CompanyGuard),
    __param(0, (0, common_1.Param)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "getCompanyMenu", null);
__decorate([
    (0, common_1.Get)(':companyId/orders'),
    (0, common_1.UseGuards)(company_guard_1.CompanyGuard),
    __param(0, (0, common_1.Param)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "getCompanyOrders", null);
__decorate([
    (0, common_1.Get)(':companyId/users'),
    (0, common_1.UseGuards)(company_guard_1.CompanyGuard),
    __param(0, (0, common_1.Param)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "getCompanyUsers", null);
__decorate([
    (0, common_1.Post)(':companyId/qr-codes/generate'),
    (0, common_1.UseGuards)(company_guard_1.CompanyGuard),
    __param(0, (0, common_1.Param)('companyId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CompaniesController.prototype, "generateQRCodes", null);
exports.CompaniesController = CompaniesController = __decorate([
    (0, common_1.Controller)('companies'),
    __metadata("design:paramtypes", [companies_service_1.CompaniesService])
], CompaniesController);
//# sourceMappingURL=companies.controller.js.map