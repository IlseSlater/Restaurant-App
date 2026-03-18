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
exports.ModifiersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const modifiers_service_1 = require("./modifiers.service");
let ModifiersController = class ModifiersController {
    constructor(modifiersService) {
        this.modifiersService = modifiersService;
    }
    getModifiers() {
        return { ok: true, module: 'modifiers' };
    }
    async createGroup(dto) {
        return this.modifiersService.createGroup(dto);
    }
    async findAllGroups(companyId) {
        return this.modifiersService.findAllGroups(companyId);
    }
    async findGroupById(id) {
        return this.modifiersService.findGroupById(id);
    }
    async updateGroup(id, dto) {
        return this.modifiersService.updateGroup(id, dto);
    }
    async deleteGroup(id) {
        return this.modifiersService.deleteGroup(id);
    }
    async addOption(groupId, dto) {
        return this.modifiersService.addOption(groupId, dto);
    }
    async updateOption(id, dto) {
        return this.modifiersService.updateOption(id, dto);
    }
    async deleteOption(id) {
        return this.modifiersService.deleteOption(id);
    }
    async linkModifierGroup(menuItemId, dto) {
        return this.modifiersService.linkModifierGroupToMenuItem(menuItemId, dto);
    }
    async unlinkModifierGroup(menuItemId, groupId) {
        return this.modifiersService.unlinkModifierGroupFromMenuItem(menuItemId, groupId);
    }
    async getConfiguration(menuItemId) {
        return this.modifiersService.getConfiguration(menuItemId);
    }
    async createBundleSlot(menuItemId, dto) {
        return this.modifiersService.createBundleSlot(menuItemId, dto);
    }
    async updateBundleSlot(slotId, dto) {
        return this.modifiersService.updateBundleSlot(slotId, dto);
    }
    async deleteBundleSlot(slotId) {
        return this.modifiersService.deleteBundleSlot(slotId);
    }
};
exports.ModifiersController = ModifiersController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Modifiers API health' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ModifiersController.prototype, "getModifiers", null);
__decorate([
    (0, common_1.Post)('groups'),
    (0, swagger_1.ApiOperation)({ summary: 'Create modifier group (with optional inline options)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ModifiersController.prototype, "createGroup", null);
__decorate([
    (0, common_1.Get)('groups'),
    (0, swagger_1.ApiOperation)({ summary: 'List modifier groups for company' }),
    (0, swagger_1.ApiQuery)({ name: 'companyId', required: true }),
    __param(0, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ModifiersController.prototype, "findAllGroups", null);
__decorate([
    (0, common_1.Get)('groups/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get modifier group with options' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ModifiersController.prototype, "findGroupById", null);
__decorate([
    (0, common_1.Put)('groups/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update modifier group' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ModifiersController.prototype, "updateGroup", null);
__decorate([
    (0, common_1.Delete)('groups/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete modifier group' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ModifiersController.prototype, "deleteGroup", null);
__decorate([
    (0, common_1.Post)('groups/:groupId/options'),
    (0, swagger_1.ApiOperation)({ summary: 'Add option to modifier group' }),
    __param(0, (0, common_1.Param)('groupId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ModifiersController.prototype, "addOption", null);
__decorate([
    (0, common_1.Put)('options/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update modifier option' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ModifiersController.prototype, "updateOption", null);
__decorate([
    (0, common_1.Delete)('options/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete modifier option' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ModifiersController.prototype, "deleteOption", null);
__decorate([
    (0, common_1.Post)('menu/:menuItemId/modifier-groups'),
    (0, swagger_1.ApiOperation)({ summary: 'Link modifier group to menu item' }),
    __param(0, (0, common_1.Param)('menuItemId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ModifiersController.prototype, "linkModifierGroup", null);
__decorate([
    (0, common_1.Delete)('menu/:menuItemId/modifier-groups/:groupId'),
    (0, swagger_1.ApiOperation)({ summary: 'Unlink modifier group from menu item' }),
    __param(0, (0, common_1.Param)('menuItemId')),
    __param(1, (0, common_1.Param)('groupId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ModifiersController.prototype, "unlinkModifierGroup", null);
__decorate([
    (0, common_1.Get)('menu/:menuItemId/configuration'),
    (0, swagger_1.ApiOperation)({ summary: 'Get full configuration for customer drawer (modifier groups + bundle slots)' }),
    __param(0, (0, common_1.Param)('menuItemId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ModifiersController.prototype, "getConfiguration", null);
__decorate([
    (0, common_1.Post)('menu/:menuItemId/bundle-slots'),
    (0, swagger_1.ApiOperation)({ summary: 'Create bundle slot with allowed items' }),
    __param(0, (0, common_1.Param)('menuItemId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ModifiersController.prototype, "createBundleSlot", null);
__decorate([
    (0, common_1.Put)('bundles/slots/:slotId'),
    (0, swagger_1.ApiOperation)({ summary: 'Update bundle slot' }),
    __param(0, (0, common_1.Param)('slotId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ModifiersController.prototype, "updateBundleSlot", null);
__decorate([
    (0, common_1.Delete)('bundles/slots/:slotId'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete bundle slot' }),
    __param(0, (0, common_1.Param)('slotId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ModifiersController.prototype, "deleteBundleSlot", null);
exports.ModifiersController = ModifiersController = __decorate([
    (0, swagger_1.ApiTags)('Modifiers'),
    (0, common_1.Controller)('modifiers'),
    __metadata("design:paramtypes", [modifiers_service_1.ModifiersService])
], ModifiersController);
//# sourceMappingURL=modifiers.controller.js.map