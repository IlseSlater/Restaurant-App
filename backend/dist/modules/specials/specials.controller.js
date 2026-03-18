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
exports.SpecialsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const specials_service_1 = require("./specials.service");
let SpecialsController = class SpecialsController {
    constructor(specialsService) {
        this.specialsService = specialsService;
    }
    async create(dto) {
        return this.specialsService.create(dto);
    }
    async findAll(companyId, activeOnly) {
        return this.specialsService.findAll(companyId, activeOnly === 'true');
    }
    async findOne(id) {
        return this.specialsService.findOne(id);
    }
    async update(id, dto) {
        return this.specialsService.update(id, dto);
    }
    async remove(id) {
        return this.specialsService.remove(id);
    }
    async addItem(specialId, body) {
        return this.specialsService.addItem(specialId, body.menuItemId, body.isRequired ?? false, body.sortOrder ?? 0);
    }
    async removeItem(specialId, menuItemId) {
        return this.specialsService.removeItem(specialId, menuItemId);
    }
    async evaluate(dto) {
        return this.specialsService.evaluateSpecials(dto);
    }
};
exports.SpecialsController = SpecialsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a special' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SpecialsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List specials for company' }),
    (0, swagger_1.ApiQuery)({ name: 'companyId', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'activeOnly', required: false, type: Boolean }),
    __param(0, (0, common_1.Query)('companyId')),
    __param(1, (0, common_1.Query)('activeOnly')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SpecialsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get special by id' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SpecialsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update special' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SpecialsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete special' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SpecialsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':specialId/items'),
    (0, swagger_1.ApiOperation)({ summary: 'Add menu item to special' }),
    __param(0, (0, common_1.Param)('specialId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SpecialsController.prototype, "addItem", null);
__decorate([
    (0, common_1.Delete)(':specialId/items/:menuItemId'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove menu item from special' }),
    __param(0, (0, common_1.Param)('specialId')),
    __param(1, (0, common_1.Param)('menuItemId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SpecialsController.prototype, "removeItem", null);
__decorate([
    (0, common_1.Post)('evaluate'),
    (0, swagger_1.ApiOperation)({ summary: 'Evaluate cart against active specials' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SpecialsController.prototype, "evaluate", null);
exports.SpecialsController = SpecialsController = __decorate([
    (0, swagger_1.ApiTags)('Specials'),
    (0, common_1.Controller)('specials'),
    __metadata("design:paramtypes", [specials_service_1.SpecialsService])
], SpecialsController);
//# sourceMappingURL=specials.controller.js.map