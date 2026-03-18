import { ModifiersService, CreateModifierGroupDto, UpdateModifierGroupDto, CreateModifierOptionDto, LinkModifierGroupDto, CreateBundleSlotDto } from './modifiers.service';
export declare class ModifiersController {
    private readonly modifiersService;
    constructor(modifiersService: ModifiersService);
    getModifiers(): {
        ok: boolean;
        module: string;
    };
    createGroup(dto: CreateModifierGroupDto): Promise<{
        options: {
            id: string;
            name: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            imageUrl: string | null;
            isAvailable: boolean;
            priceAdjustment: import("@prisma/client/runtime/library").Decimal;
            sortOrder: number;
            isDefault: boolean;
            visualType: string | null;
            modifierGroupId: string;
        }[];
    } & {
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        isRequired: boolean;
        sortOrder: number;
        selectionType: import(".prisma/client").$Enums.SelectionType;
        minSelections: number;
        maxSelections: number | null;
    }>;
    findAllGroups(companyId: string): Promise<({
        options: {
            id: string;
            name: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            imageUrl: string | null;
            isAvailable: boolean;
            priceAdjustment: import("@prisma/client/runtime/library").Decimal;
            sortOrder: number;
            isDefault: boolean;
            visualType: string | null;
            modifierGroupId: string;
        }[];
    } & {
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        isRequired: boolean;
        sortOrder: number;
        selectionType: import(".prisma/client").$Enums.SelectionType;
        minSelections: number;
        maxSelections: number | null;
    })[]>;
    findGroupById(id: string): Promise<{
        options: {
            id: string;
            name: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            imageUrl: string | null;
            isAvailable: boolean;
            priceAdjustment: import("@prisma/client/runtime/library").Decimal;
            sortOrder: number;
            isDefault: boolean;
            visualType: string | null;
            modifierGroupId: string;
        }[];
    } & {
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        isRequired: boolean;
        sortOrder: number;
        selectionType: import(".prisma/client").$Enums.SelectionType;
        minSelections: number;
        maxSelections: number | null;
    }>;
    updateGroup(id: string, dto: UpdateModifierGroupDto): Promise<{
        options: {
            id: string;
            name: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            imageUrl: string | null;
            isAvailable: boolean;
            priceAdjustment: import("@prisma/client/runtime/library").Decimal;
            sortOrder: number;
            isDefault: boolean;
            visualType: string | null;
            modifierGroupId: string;
        }[];
    } & {
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        isRequired: boolean;
        sortOrder: number;
        selectionType: import(".prisma/client").$Enums.SelectionType;
        minSelections: number;
        maxSelections: number | null;
    }>;
    deleteGroup(id: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        isRequired: boolean;
        sortOrder: number;
        selectionType: import(".prisma/client").$Enums.SelectionType;
        minSelections: number;
        maxSelections: number | null;
    }>;
    addOption(groupId: string, dto: CreateModifierOptionDto): Promise<{
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        imageUrl: string | null;
        isAvailable: boolean;
        priceAdjustment: import("@prisma/client/runtime/library").Decimal;
        sortOrder: number;
        isDefault: boolean;
        visualType: string | null;
        modifierGroupId: string;
    }>;
    updateOption(id: string, dto: Partial<CreateModifierOptionDto>): Promise<{
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        imageUrl: string | null;
        isAvailable: boolean;
        priceAdjustment: import("@prisma/client/runtime/library").Decimal;
        sortOrder: number;
        isDefault: boolean;
        visualType: string | null;
        modifierGroupId: string;
    }>;
    deleteOption(id: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        imageUrl: string | null;
        isAvailable: boolean;
        priceAdjustment: import("@prisma/client/runtime/library").Decimal;
        sortOrder: number;
        isDefault: boolean;
        visualType: string | null;
        modifierGroupId: string;
    }>;
    linkModifierGroup(menuItemId: string, dto: LinkModifierGroupDto): Promise<{
        modifierGroup: {
            options: {
                id: string;
                name: string;
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
                imageUrl: string | null;
                isAvailable: boolean;
                priceAdjustment: import("@prisma/client/runtime/library").Decimal;
                sortOrder: number;
                isDefault: boolean;
                visualType: string | null;
                modifierGroupId: string;
            }[];
        } & {
            id: string;
            name: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            isRequired: boolean;
            sortOrder: number;
            selectionType: import(".prisma/client").$Enums.SelectionType;
            minSelections: number;
            maxSelections: number | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        menuItemId: string;
        sortOrder: number;
        modifierGroupId: string;
        overrideRequired: boolean | null;
        overrideMin: number | null;
        overrideMax: number | null;
    }>;
    unlinkModifierGroup(menuItemId: string, groupId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        menuItemId: string;
        sortOrder: number;
        modifierGroupId: string;
        overrideRequired: boolean | null;
        overrideMin: number | null;
        overrideMax: number | null;
    }>;
    getConfiguration(menuItemId: string): Promise<{
        modifierGroups: {
            overrideRequired: boolean | undefined;
            overrideMin: number | undefined;
            overrideMax: number | undefined;
            options: {
                id: string;
                name: string;
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
                imageUrl: string | null;
                isAvailable: boolean;
                priceAdjustment: import("@prisma/client/runtime/library").Decimal;
                sortOrder: number;
                isDefault: boolean;
                visualType: string | null;
                modifierGroupId: string;
            }[];
            id: string;
            name: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            isRequired: boolean;
            sortOrder: number;
            selectionType: import(".prisma/client").$Enums.SelectionType;
            minSelections: number;
            maxSelections: number | null;
        }[];
        bundleSlots: {
            id: string;
            name: string;
            description: string | undefined;
            isRequired: boolean;
            sortOrder: number;
            allowedItems: any[];
        }[];
    }>;
    createBundleSlot(menuItemId: string, dto: CreateBundleSlotDto): Promise<({
        allowedItems: ({
            menuItem: {
                id: string;
                name: string;
                category: string;
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
                companyId: string;
                price: import("@prisma/client/runtime/library").Decimal;
                imageUrl: string | null;
                isAvailable: boolean;
                preparationTime: number | null;
                isShareable: boolean;
                maxClaimants: number | null;
                isBundle: boolean;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            menuItemId: string;
            bundleSlotId: string;
        })[];
    } & {
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        menuItemId: string;
        isRequired: boolean;
        sortOrder: number;
    }) | null>;
    updateBundleSlot(slotId: string, dto: Partial<CreateBundleSlotDto>): Promise<{
        allowedItems: ({
            menuItem: {
                id: string;
                name: string;
                category: string;
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
                companyId: string;
                price: import("@prisma/client/runtime/library").Decimal;
                imageUrl: string | null;
                isAvailable: boolean;
                preparationTime: number | null;
                isShareable: boolean;
                maxClaimants: number | null;
                isBundle: boolean;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            menuItemId: string;
            bundleSlotId: string;
        })[];
    } & {
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        menuItemId: string;
        isRequired: boolean;
        sortOrder: number;
    }>;
    deleteBundleSlot(slotId: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        menuItemId: string;
        isRequired: boolean;
        sortOrder: number;
    }>;
}
