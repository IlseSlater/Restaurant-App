import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type SpecialType = 'TIME_BASED' | 'CONDITIONAL' | 'MULTI_SLOT' | 'AUTO_APPENDED';

export interface CreateSpecialDto {
  companyId: string;
  name: string;
  description?: string;
  specialType: SpecialType;
  isActive?: boolean;
  startTime?: string;
  endTime?: string;
  daysOfWeek?: number[];
  triggerCategory?: string;
  triggerItemIds?: string[];
  requiredSlots?: Record<string, number>;
  slotDefinitions?: unknown;
  chargePerUnit?: number;
  unitType?: string;
  discountPercent?: number;
  fixedPrice?: number;
  bundlePrice?: number;
  ruleDefinition?: unknown;
}

export interface UpdateSpecialDto {
  name?: string;
  description?: string;
  specialType?: SpecialType;
  isActive?: boolean;
  startTime?: string;
  endTime?: string;
  daysOfWeek?: number[];
  triggerCategory?: string;
  triggerItemIds?: string[];
  requiredSlots?: Record<string, number>;
  slotDefinitions?: unknown;
  chargePerUnit?: number;
  unitType?: string;
  discountPercent?: number;
  fixedPrice?: number;
  bundlePrice?: number;
  ruleDefinition?: unknown;
}

export interface CartItemForEvaluation {
  menuItemId: string;
  quantity: number;
  category?: string;
  price?: number;
}

export interface EvaluateSpecialsDto {
  companyId: string;
  tableId?: string;
  guestCount?: number;
  cartItems: CartItemForEvaluation[];
}

export interface ActiveSpecial {
  id: string;
  name: string;
  description: string | null;
  specialType: SpecialType;
  appliedPrice?: number;
  discountPercent?: number;
  fixedPrice?: number;
  bundlePrice?: number;
  chargePerUnit?: number;
  unitType?: string;
  totalCharge?: number;
  matchedItemIds?: string[];
  message?: string;
}

@Injectable()
export class SpecialsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSpecialDto) {
    const { daysOfWeek = [], triggerItemIds = [], ...rest } = dto;
    return (this.prisma as any).special.create({
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

  async findAll(companyId: string, activeOnly = false) {
    return (this.prisma as any).special.findMany({
      where: {
        companyId,
        ...(activeOnly ? { isActive: true } : {}),
      },
      include: { specialItems: { include: { menuItem: true }, orderBy: { sortOrder: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const special = await (this.prisma as any).special.findUnique({
      where: { id },
      include: { specialItems: { include: { menuItem: true }, orderBy: { sortOrder: 'asc' } } },
    });
    if (!special) throw new NotFoundException('Special not found');
    return special;
  }

  async update(id: string, dto: UpdateSpecialDto) {
    await this.findOne(id);
    const { daysOfWeek, triggerItemIds, ...rest } = dto;
    return (this.prisma as any).special.update({
      where: { id },
      data: {
        ...rest,
        ...(daysOfWeek !== undefined ? { daysOfWeek } : {}),
        ...(triggerItemIds !== undefined ? { triggerItemIds } : {}),
      },
      include: { specialItems: { include: { menuItem: true } } },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return (this.prisma as any).special.delete({ where: { id } });
  }

  async addItem(specialId: string, menuItemId: string, isRequired = false, sortOrder = 0) {
    await this.findOne(specialId);
    return (this.prisma as any).specialItem.create({
      data: { specialId, menuItemId, isRequired, sortOrder },
      include: { menuItem: true, special: true },
    });
  }

  async removeItem(specialId: string, menuItemId: string) {
    return (this.prisma as any).specialItem.deleteMany({
      where: { specialId, menuItemId },
    });
  }

  /**
   * Evaluate cart against active specials. Returns list of applicable specials with pricing.
   */
  async evaluateSpecials(dto: EvaluateSpecialsDto): Promise<ActiveSpecial[]> {
    const { companyId, guestCount = 1, cartItems } = dto;
    const specials = await (this.prisma as any).special.findMany({
      where: { companyId, isActive: true },
      include: { specialItems: { include: { menuItem: true } } },
    });

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const dayOfWeek = now.getDay(); // 0 = Sunday

    const result: ActiveSpecial[] = [];

    for (const special of specials) {
      if (special.specialType === 'TIME_BASED') {
        if (!special.startTime || !special.endTime) continue;
        const days = (special.daysOfWeek ?? []).length ? special.daysOfWeek : [0, 1, 2, 3, 4, 5, 6];
        if (!days.includes(dayOfWeek)) continue;
        if (currentTime < special.startTime || currentTime > special.endTime) continue;
        const matchedIds = cartItems.map((c) => c.menuItemId);
        const itemIds = special.specialItems.map((si) => si.menuItemId);
        const inSpecial = cartItems.filter((c) => itemIds.includes(c.menuItemId));
        if (inSpecial.length === 0) continue;
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
        const cartHasCategory =
          triggerCategory &&
          cartItems.some((c) => (c.category ?? '').toLowerCase().includes(triggerCategory));
        const cartHasTriggerItem = triggerIds.length && cartItems.some((c) => triggerIds.includes(c.menuItemId));
        if (!cartHasCategory && !cartHasTriggerItem) continue;
        const specialItemIds = special.specialItems.map((si) => si.menuItemId);
        const matched = cartItems.filter((c) => specialItemIds.includes(c.menuItemId));
        if (matched.length === 0) continue;
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
        const required = (special.requiredSlots as Record<string, number>) ?? {};
        const slots = Object.entries(required);
        if (slots.length === 0) continue;
        const slotDefs = (special.slotDefinitions as Array<{ slotName: string; menuItemIds: string[] }>) ?? [];
        const cartById = new Map(cartItems.map((c) => [c.menuItemId, c]));
        let totalRequired = 0;
        let matchedCount = 0;
        const matchedIds: string[] = [];
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
            if (n >= count) break;
          }
        }
        if (matchedCount < totalRequired) continue;
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
        if (unitType === 'guest') units = guestCount;
        else if (unitType === 'table') units = 1;
        else if (unitType === 'order') units = cartItems.length ? 1 : 0;
        if (units <= 0) continue;
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
}
