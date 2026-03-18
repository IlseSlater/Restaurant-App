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
export declare class SpecialsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateSpecialDto): Promise<any>;
    findAll(companyId: string, activeOnly?: boolean): Promise<any>;
    findOne(id: string): Promise<any>;
    update(id: string, dto: UpdateSpecialDto): Promise<any>;
    remove(id: string): Promise<any>;
    addItem(specialId: string, menuItemId: string, isRequired?: boolean, sortOrder?: number): Promise<any>;
    removeItem(specialId: string, menuItemId: string): Promise<any>;
    evaluateSpecials(dto: EvaluateSpecialsDto): Promise<ActiveSpecial[]>;
}
