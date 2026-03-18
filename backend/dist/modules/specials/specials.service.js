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
exports.SpecialsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SpecialsService = class SpecialsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const { daysOfWeek = [], triggerItemIds = [], ...rest } = dto;
        return this.prisma.special.create({
            data: {
                ...rest,
                daysOfWeek,
                triggerItemIds,
                startTime: rest.startTime ?? undefined,
                endTime: rest.endTime ?? undefined,
                requiredSlots: rest.requiredSlots ?? undefined,
                slotDefinitions: rest.slotDefinitions ?? undefined,
                ruleDefinition: rest.ruleDefinition ?? undefined,
            },
            include: { specialItems: { include: { menuItem: true } } },
        });
    }
    async findAll(companyId, activeOnly = false) {
        return this.prisma.special.findMany({
            where: {
                companyId,
                ...(activeOnly ? { isActive: true } : {}),
            },
            include: { specialItems: { include: { menuItem: true }, orderBy: { sortOrder: 'asc' } } },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        const special = await this.prisma.special.findUnique({
            where: { id },
            include: { specialItems: { include: { menuItem: true }, orderBy: { sortOrder: 'asc' } } },
        });
        if (!special)
            throw new common_1.NotFoundException('Special not found');
        return special;
    }
    async update(id, dto) {
        await this.findOne(id);
        const { daysOfWeek, triggerItemIds, ...rest } = dto;
        return this.prisma.special.update({
            where: { id },
            data: {
                ...rest,
                ...(daysOfWeek !== undefined ? { daysOfWeek } : {}),
                ...(triggerItemIds !== undefined ? { triggerItemIds } : {}),
            },
            include: { specialItems: { include: { menuItem: true } } },
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.special.delete({ where: { id } });
    }
    async addItem(specialId, menuItemId, isRequired = false, sortOrder = 0) {
        await this.findOne(specialId);
        return this.prisma.specialItem.create({
            data: { specialId, menuItemId, isRequired, sortOrder },
            include: { menuItem: true, special: true },
        });
    }
    async removeItem(specialId, menuItemId) {
        return this.prisma.specialItem.deleteMany({
            where: { specialId, menuItemId },
        });
    }
    async evaluateSpecials(dto) {
        const { companyId, guestCount = 1, cartItems } = dto;
        const specials = await this.prisma.special.findMany({
            where: { companyId, isActive: true },
            include: { specialItems: { include: { menuItem: true } } },
        });
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const dayOfWeek = now.getDay();
        const result = [];
        for (const special of specials) {
            if (special.specialType === 'TIME_BASED') {
                if (!special.startTime || !special.endTime)
                    continue;
                const days = (special.daysOfWeek ?? []).length ? special.daysOfWeek : [0, 1, 2, 3, 4, 5, 6];
                if (!days.includes(dayOfWeek))
                    continue;
                if (currentTime < special.startTime || currentTime > special.endTime)
                    continue;
                const matchedIds = cartItems.map((c) => c.menuItemId);
                const itemIds = special.specialItems.map((si) => si.menuItemId);
                const inSpecial = cartItems.filter((c) => itemIds.includes(c.menuItemId));
                if (inSpecial.length === 0)
                    continue;
                result.push({
                    id: special.id,
                    name: special.name,
                    description: special.description,
                    specialType: 'TIME_BASED',
                    discountPercent: special.discountPercent ? Number(special.discountPercent) : undefined,
                    fixedPrice: special.fixedPrice ? Number(special.fixedPrice) : undefined,
                    bundlePrice: special.bundlePrice ? Number(special.bundlePrice) : undefined,
                    matchedItemIds: inSpecial.map((c) => c.menuItemId),
                    message: special.description ?? `${special.name} applies`,
                });
            }
            if (special.specialType === 'CONDITIONAL') {
                const triggerCategory = (special.triggerCategory ?? '').toLowerCase();
                const triggerIds = special.triggerItemIds ?? [];
                const cartHasCategory = triggerCategory &&
                    cartItems.some((c) => (c.category ?? '').toLowerCase().includes(triggerCategory));
                const cartHasTriggerItem = triggerIds.length && cartItems.some((c) => triggerIds.includes(c.menuItemId));
                if (!cartHasCategory && !cartHasTriggerItem)
                    continue;
                const specialItemIds = special.specialItems.map((si) => si.menuItemId);
                const matched = cartItems.filter((c) => specialItemIds.includes(c.menuItemId));
                if (matched.length === 0)
                    continue;
                result.push({
                    id: special.id,
                    name: special.name,
                    description: special.description,
                    specialType: 'CONDITIONAL',
                    fixedPrice: special.fixedPrice ? Number(special.fixedPrice) : undefined,
                    bundlePrice: special.bundlePrice ? Number(special.bundlePrice) : undefined,
                    discountPercent: special.discountPercent ? Number(special.discountPercent) : undefined,
                    matchedItemIds: matched.map((c) => c.menuItemId),
                    message: special.description ?? `Add ${special.name} for this price`,
                });
            }
            if (special.specialType === 'MULTI_SLOT') {
                const required = special.requiredSlots ?? {};
                const slots = Object.entries(required);
                if (slots.length === 0)
                    continue;
                const slotDefs = special.slotDefinitions ?? [];
                const cartById = new Map(cartItems.map((c) => [c.menuItemId, c]));
                let totalRequired = 0;
                let matchedCount = 0;
                const matchedIds = [];
                for (const [slotName, count] of slots) {
                    totalRequired += count;
                    const def = slotDefs.find((d) => d.slotName === slotName);
                    const allowedIds = def?.menuItemIds ?? special.specialItems.map((si) => si.menuItemId);
                    let n = 0;
                    for (const item of cartItems) {
                        if (allowedIds.includes(item.menuItemId)) {
                            matchedCount += item.quantity;
                            matchedIds.push(item.menuItemId);
                            n += item.quantity;
                        }
                        if (n >= count)
                            break;
                    }
                }
                if (matchedCount < totalRequired)
                    continue;
                result.push({
                    id: special.id,
                    name: special.name,
                    description: special.description,
                    specialType: 'MULTI_SLOT',
                    bundlePrice: special.bundlePrice ? Number(special.bundlePrice) : undefined,
                    matchedItemIds: [...new Set(matchedIds)],
                    message: special.description ?? `Bundle: ${special.name}`,
                });
            }
            if (special.specialType === 'AUTO_APPENDED') {
                const chargePerUnit = special.chargePerUnit ? Number(special.chargePerUnit) : 0;
                const unitType = special.unitType ?? 'guest';
                let units = 0;
                if (unitType === 'guest')
                    units = guestCount;
                else if (unitType === 'table')
                    units = 1;
                else if (unitType === 'order')
                    units = cartItems.length ? 1 : 0;
                if (units <= 0)
                    continue;
                const totalCharge = chargePerUnit * units;
                result.push({
                    id: special.id,
                    name: special.name,
                    description: special.description,
                    specialType: 'AUTO_APPENDED',
                    chargePerUnit,
                    unitType,
                    totalCharge,
                    message: special.description ?? `${special.name}: ${units} × ${chargePerUnit}`,
                });
            }
        }
        return result;
    }
};
exports.SpecialsService = SpecialsService;
exports.SpecialsService = SpecialsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SpecialsService);
//# sourceMappingURL=specials.service.js.map