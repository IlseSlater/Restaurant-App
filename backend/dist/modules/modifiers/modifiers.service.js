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
exports.ModifiersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const websocket_gateway_1 = require("../websocket/websocket.gateway");
let ModifiersService = class ModifiersService {
    constructor(prisma, webSocketGateway) {
        this.prisma = prisma;
        this.webSocketGateway = webSocketGateway;
    }
    async createGroup(dto) {
        const { options = [], ...groupData } = dto;
        return this.prisma.modifierGroup.create({
            data: {
                ...groupData,
                options: options.length
                    ? {
                        create: options.map((opt) => ({
                            name: opt.name,
                            description: opt.description,
                            priceAdjustment: opt.priceAdjustment ?? 0,
                            isDefault: opt.isDefault ?? false,
                            isAvailable: opt.isAvailable ?? true,
                            sortOrder: opt.sortOrder ?? 0,
                        })),
                    }
                    : undefined,
            },
            include: { options: { orderBy: { sortOrder: 'asc' } } },
        });
    }
    async findAllGroups(companyId) {
        return this.prisma.modifierGroup.findMany({
            where: { companyId },
            include: { options: { orderBy: { sortOrder: 'asc' } } },
            orderBy: { sortOrder: 'asc' },
        });
    }
    async findGroupById(id) {
        const group = await this.prisma.modifierGroup.findUnique({
            where: { id },
            include: { options: { orderBy: { sortOrder: 'asc' } } },
        });
        if (!group)
            throw new common_1.NotFoundException('Modifier group not found');
        return group;
    }
    async updateGroup(id, dto) {
        await this.findGroupById(id);
        return this.prisma.modifierGroup.update({
            where: { id },
            data: dto,
            include: { options: { orderBy: { sortOrder: 'asc' } } },
        });
    }
    async deleteGroup(id) {
        await this.findGroupById(id);
        return this.prisma.modifierGroup.delete({ where: { id } });
    }
    async addOption(groupId, dto) {
        await this.findGroupById(groupId);
        return this.prisma.modifierOption.create({
            data: {
                modifierGroupId: groupId,
                name: dto.name,
                description: dto.description,
                priceAdjustment: dto.priceAdjustment ?? 0,
                isDefault: dto.isDefault ?? false,
                isAvailable: dto.isAvailable ?? true,
                sortOrder: dto.sortOrder ?? 0,
            },
        });
    }
    async updateOption(id, dto) {
        const option = await this.prisma.modifierOption.findUnique({
            where: { id },
            include: { group: { select: { companyId: true } } },
        });
        if (!option)
            throw new common_1.NotFoundException('Modifier option not found');
        const updated = await this.prisma.modifierOption.update({
            where: { id },
            data: dto,
        });
        if (dto.isAvailable !== undefined && option.group?.companyId) {
            this.webSocketGateway.emitToCompany(option.group.companyId, 'customer', 'modifier-availability-changed', {
                modifierOptionId: id,
                modifierGroupId: option.modifierGroupId,
                isAvailable: updated.isAvailable,
            });
        }
        return updated;
    }
    async deleteOption(id) {
        const option = await this.prisma.modifierOption.findUnique({ where: { id } });
        if (!option)
            throw new common_1.NotFoundException('Modifier option not found');
        return this.prisma.modifierOption.delete({ where: { id } });
    }
    async linkModifierGroupToMenuItem(menuItemId, dto) {
        const item = await this.prisma.menuItem.findUnique({ where: { id: menuItemId } });
        if (!item)
            throw new common_1.NotFoundException('Menu item not found');
        await this.findGroupById(dto.modifierGroupId);
        return this.prisma.menuItemModifierGroup.create({
            data: {
                menuItemId,
                modifierGroupId: dto.modifierGroupId,
                sortOrder: dto.sortOrder ?? 0,
                overrideRequired: dto.overrideRequired,
                overrideMin: dto.overrideMin,
                overrideMax: dto.overrideMax,
            },
            include: {
                modifierGroup: { include: { options: { orderBy: { sortOrder: 'asc' } } } },
            },
        });
    }
    async unlinkModifierGroupFromMenuItem(menuItemId, modifierGroupId) {
        const link = await this.prisma.menuItemModifierGroup.findUnique({
            where: {
                menuItemId_modifierGroupId: { menuItemId, modifierGroupId },
            },
        });
        if (!link)
            throw new common_1.NotFoundException('Link not found');
        return this.prisma.menuItemModifierGroup.delete({
            where: { id: link.id },
        });
    }
    async getConfiguration(menuItemId) {
        const item = await this.prisma.menuItem.findUnique({
            where: { id: menuItemId },
            include: {
                modifierGroups: {
                    orderBy: { sortOrder: 'asc' },
                    include: {
                        modifierGroup: {
                            include: { options: { orderBy: { sortOrder: 'asc' } } },
                        },
                    },
                },
                bundleSlots: {
                    orderBy: { sortOrder: 'asc' },
                    include: {
                        allowedItems: { include: { menuItem: true } },
                    },
                },
            },
        });
        if (!item)
            throw new common_1.NotFoundException('Menu item not found');
        const modifierGroups = item.modifierGroups.map((mg) => ({
            ...mg.modifierGroup,
            overrideRequired: mg.overrideRequired ?? undefined,
            overrideMin: mg.overrideMin ?? undefined,
            overrideMax: mg.overrideMax ?? undefined,
        }));
        const bundleSlots = item.bundleSlots.map((slot) => ({
            id: slot.id,
            name: slot.name,
            description: slot.description ?? undefined,
            isRequired: slot.isRequired,
            sortOrder: slot.sortOrder,
            allowedItems: slot.allowedItems.map((opt) => opt.menuItem),
        }));
        return {
            modifierGroups,
            bundleSlots,
        };
    }
    async createBundleSlot(menuItemId, dto) {
        const item = await this.prisma.menuItem.findUnique({ where: { id: menuItemId } });
        if (!item)
            throw new common_1.NotFoundException('Menu item not found');
        const slot = await this.prisma.bundleSlot.create({
            data: {
                menuItemId,
                name: dto.name,
                description: dto.description,
                isRequired: dto.isRequired ?? true,
                sortOrder: dto.sortOrder ?? 0,
            },
        });
        if (dto.allowedMenuItemIds?.length) {
            await this.prisma.bundleSlotOption.createMany({
                data: dto.allowedMenuItemIds.map((menuItemId) => ({
                    bundleSlotId: slot.id,
                    menuItemId,
                })),
                skipDuplicates: true,
            });
        }
        return this.prisma.bundleSlot.findUnique({
            where: { id: slot.id },
            include: { allowedItems: { include: { menuItem: true } } },
        });
    }
    async updateBundleSlot(slotId, dto) {
        const slot = await this.prisma.bundleSlot.findUnique({ where: { id: slotId } });
        if (!slot)
            throw new common_1.NotFoundException('Bundle slot not found');
        const { allowedMenuItemIds, ...rest } = dto;
        const data = { ...rest };
        if (allowedMenuItemIds !== undefined) {
            await this.prisma.bundleSlotOption.deleteMany({ where: { bundleSlotId: slotId } });
            if (allowedMenuItemIds.length > 0) {
                await this.prisma.bundleSlotOption.createMany({
                    data: allowedMenuItemIds.map((menuItemId) => ({
                        bundleSlotId: slotId,
                        menuItemId,
                    })),
                    skipDuplicates: true,
                });
            }
        }
        return this.prisma.bundleSlot.update({
            where: { id: slotId },
            data,
            include: { allowedItems: { include: { menuItem: true } } },
        });
    }
    async deleteBundleSlot(slotId) {
        const slot = await this.prisma.bundleSlot.findUnique({ where: { id: slotId } });
        if (!slot)
            throw new common_1.NotFoundException('Bundle slot not found');
        return this.prisma.bundleSlot.delete({ where: { id: slotId } });
    }
};
exports.ModifiersService = ModifiersService;
exports.ModifiersService = ModifiersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        websocket_gateway_1.RestaurantWebSocketGateway])
], ModifiersService);
//# sourceMappingURL=modifiers.service.js.map