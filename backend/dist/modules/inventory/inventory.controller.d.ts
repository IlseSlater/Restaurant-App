import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto, UpdateInventoryItemDto, CreateInventoryMovementDto, CreateSupplierDto, UpdateSupplierDto, InventoryItemType, InventoryStatus, MovementType } from './dto/inventory.dto';
export declare class InventoryController {
    private readonly inventoryService;
    private readonly logger;
    constructor(inventoryService: InventoryService);
    createInventoryItem(createDto: CreateInventoryItemDto): Promise<{
        id: string;
        name: string;
        sku: string | null;
        category: string | null;
        unit: string;
        costPrice: import("@prisma/client/runtime/library").Decimal | null;
        sellingPrice: import("@prisma/client/runtime/library").Decimal | null;
        currentStock: import("@prisma/client/runtime/library").Decimal;
        reorderQuantity: import("@prisma/client/runtime/library").Decimal | null;
        minStockLevel: import("@prisma/client/runtime/library").Decimal;
        maxStockLevel: import("@prisma/client/runtime/library").Decimal | null;
        isTracked: boolean;
        lastStockedAt: Date | null;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        supplierId: string | null;
    }>;
    getInventoryItems(companyId: string, type?: InventoryItemType, status?: InventoryStatus, category?: string, lowStock?: boolean): Promise<({
        supplier: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            contactName: string | null;
            email: string | null;
            phone: string | null;
            notes: string | null;
        } | null;
        movements: {
            id: string;
            createdAt: Date;
            companyId: string;
            notes: string | null;
            inventoryItemId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            movementType: import(".prisma/client").$Enums.InventoryMovementType;
            reference: string | null;
            unitCost: import("@prisma/client/runtime/library").Decimal | null;
            performedBy: string | null;
        }[];
    } & {
        id: string;
        name: string;
        sku: string | null;
        category: string | null;
        unit: string;
        costPrice: import("@prisma/client/runtime/library").Decimal | null;
        sellingPrice: import("@prisma/client/runtime/library").Decimal | null;
        currentStock: import("@prisma/client/runtime/library").Decimal;
        reorderQuantity: import("@prisma/client/runtime/library").Decimal | null;
        minStockLevel: import("@prisma/client/runtime/library").Decimal;
        maxStockLevel: import("@prisma/client/runtime/library").Decimal | null;
        isTracked: boolean;
        lastStockedAt: Date | null;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        supplierId: string | null;
    })[]>;
    getInventoryItem(id: string): Promise<({
        supplier: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            contactName: string | null;
            email: string | null;
            phone: string | null;
            notes: string | null;
        } | null;
        movements: {
            id: string;
            createdAt: Date;
            companyId: string;
            notes: string | null;
            inventoryItemId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            movementType: import(".prisma/client").$Enums.InventoryMovementType;
            reference: string | null;
            unitCost: import("@prisma/client/runtime/library").Decimal | null;
            performedBy: string | null;
        }[];
    } & {
        id: string;
        name: string;
        sku: string | null;
        category: string | null;
        unit: string;
        costPrice: import("@prisma/client/runtime/library").Decimal | null;
        sellingPrice: import("@prisma/client/runtime/library").Decimal | null;
        currentStock: import("@prisma/client/runtime/library").Decimal;
        reorderQuantity: import("@prisma/client/runtime/library").Decimal | null;
        minStockLevel: import("@prisma/client/runtime/library").Decimal;
        maxStockLevel: import("@prisma/client/runtime/library").Decimal | null;
        isTracked: boolean;
        lastStockedAt: Date | null;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        supplierId: string | null;
    }) | null>;
    updateInventoryItem(id: string, updateDto: UpdateInventoryItemDto): Promise<{
        id: string;
        name: string;
        sku: string | null;
        category: string | null;
        unit: string;
        costPrice: import("@prisma/client/runtime/library").Decimal | null;
        sellingPrice: import("@prisma/client/runtime/library").Decimal | null;
        currentStock: import("@prisma/client/runtime/library").Decimal;
        reorderQuantity: import("@prisma/client/runtime/library").Decimal | null;
        minStockLevel: import("@prisma/client/runtime/library").Decimal;
        maxStockLevel: import("@prisma/client/runtime/library").Decimal | null;
        isTracked: boolean;
        lastStockedAt: Date | null;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        supplierId: string | null;
    }>;
    deleteInventoryItem(id: string): Promise<{
        success: boolean;
    }>;
    createInventoryMovement(createDto: CreateInventoryMovementDto): Promise<{
        movement: {
            id: string;
            createdAt: Date;
            companyId: string;
            notes: string | null;
            inventoryItemId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            movementType: import(".prisma/client").$Enums.InventoryMovementType;
            reference: string | null;
            unitCost: import("@prisma/client/runtime/library").Decimal | null;
            performedBy: string | null;
        };
        updatedItem: {
            id: string;
            name: string;
            sku: string | null;
            category: string | null;
            unit: string;
            costPrice: import("@prisma/client/runtime/library").Decimal | null;
            sellingPrice: import("@prisma/client/runtime/library").Decimal | null;
            currentStock: import("@prisma/client/runtime/library").Decimal;
            reorderQuantity: import("@prisma/client/runtime/library").Decimal | null;
            minStockLevel: import("@prisma/client/runtime/library").Decimal;
            maxStockLevel: import("@prisma/client/runtime/library").Decimal | null;
            isTracked: boolean;
            lastStockedAt: Date | null;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            supplierId: string | null;
        };
    }>;
    getInventoryMovements(companyId: string, inventoryItemId?: string, type?: MovementType, startDate?: string, endDate?: string): Promise<({
        inventoryItem: {
            id: string;
            name: string;
            sku: string | null;
            category: string | null;
            unit: string;
            costPrice: import("@prisma/client/runtime/library").Decimal | null;
            sellingPrice: import("@prisma/client/runtime/library").Decimal | null;
            currentStock: import("@prisma/client/runtime/library").Decimal;
            reorderQuantity: import("@prisma/client/runtime/library").Decimal | null;
            minStockLevel: import("@prisma/client/runtime/library").Decimal;
            maxStockLevel: import("@prisma/client/runtime/library").Decimal | null;
            isTracked: boolean;
            lastStockedAt: Date | null;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            supplierId: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        companyId: string;
        notes: string | null;
        inventoryItemId: string;
        quantity: import("@prisma/client/runtime/library").Decimal;
        movementType: import(".prisma/client").$Enums.InventoryMovementType;
        reference: string | null;
        unitCost: import("@prisma/client/runtime/library").Decimal | null;
        performedBy: string | null;
    })[]>;
    createSupplier(createDto: CreateSupplierDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        contactName: string | null;
        email: string | null;
        phone: string | null;
        notes: string | null;
    }>;
    getSuppliers(companyId: string): Promise<({
        items: {
            id: string;
            name: string;
            sku: string | null;
            category: string | null;
            unit: string;
            costPrice: import("@prisma/client/runtime/library").Decimal | null;
            sellingPrice: import("@prisma/client/runtime/library").Decimal | null;
            currentStock: import("@prisma/client/runtime/library").Decimal;
            reorderQuantity: import("@prisma/client/runtime/library").Decimal | null;
            minStockLevel: import("@prisma/client/runtime/library").Decimal;
            maxStockLevel: import("@prisma/client/runtime/library").Decimal | null;
            isTracked: boolean;
            lastStockedAt: Date | null;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            supplierId: string | null;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        contactName: string | null;
        email: string | null;
        phone: string | null;
        notes: string | null;
    })[]>;
    getSupplier(id: string): Promise<({
        items: {
            id: string;
            name: string;
            sku: string | null;
            category: string | null;
            unit: string;
            costPrice: import("@prisma/client/runtime/library").Decimal | null;
            sellingPrice: import("@prisma/client/runtime/library").Decimal | null;
            currentStock: import("@prisma/client/runtime/library").Decimal;
            reorderQuantity: import("@prisma/client/runtime/library").Decimal | null;
            minStockLevel: import("@prisma/client/runtime/library").Decimal;
            maxStockLevel: import("@prisma/client/runtime/library").Decimal | null;
            isTracked: boolean;
            lastStockedAt: Date | null;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            supplierId: string | null;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        contactName: string | null;
        email: string | null;
        phone: string | null;
        notes: string | null;
    })[]>;
    updateSupplier(id: string, updateDto: UpdateSupplierDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        contactName: string | null;
        email: string | null;
        phone: string | null;
        notes: string | null;
    }>;
    deleteSupplier(id: string): Promise<{
        success: boolean;
    }>;
    getInventoryAlerts(companyId: string, unreadOnly?: boolean): Promise<({
        item: {
            id: string;
            name: string;
            sku: string | null;
            category: string | null;
            unit: string;
            costPrice: import("@prisma/client/runtime/library").Decimal | null;
            sellingPrice: import("@prisma/client/runtime/library").Decimal | null;
            currentStock: import("@prisma/client/runtime/library").Decimal;
            reorderQuantity: import("@prisma/client/runtime/library").Decimal | null;
            minStockLevel: import("@prisma/client/runtime/library").Decimal;
            maxStockLevel: import("@prisma/client/runtime/library").Decimal | null;
            isTracked: boolean;
            lastStockedAt: Date | null;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            supplierId: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        companyId: string;
        inventoryItemId: string;
        alertType: import(".prisma/client").$Enums.InventoryAlertType;
        message: string;
        resolved: boolean;
        resolvedAt: Date | null;
    })[]>;
    markAlertAsRead(id: string): Promise<{
        id: string;
        createdAt: Date;
        companyId: string;
        inventoryItemId: string;
        alertType: import(".prisma/client").$Enums.InventoryAlertType;
        message: string;
        resolved: boolean;
        resolvedAt: Date | null;
    }>;
    getInventoryReport(companyId: string, startDate: string, endDate: string): Promise<{
        companyId: string;
        startDate: Date;
        endDate: Date;
        items: {
            id: string;
            name: string;
            type: string;
            currentStock: number;
            minimumStock: number;
            unitCost: number;
            totalValue: number;
            status: InventoryStatus;
            movementsIn: number;
            movementsOut: number;
            netMovement: number;
        }[];
        totalValue: number;
        totalMovements: number;
        lowStockItems: number;
        outOfStockItems: number;
    }>;
    bulkUpdateInventoryItems(updates: Array<{
        id: string;
        currentStock: number;
        reason?: string;
    }>): Promise<{
        id: string;
        success: boolean;
        data?: any;
        error?: string;
    }[]>;
    adjustStock(id: string, body: {
        newStock: number;
        reason: string;
        notes?: string;
    }): Promise<{
        movement: {
            id: string;
            createdAt: Date;
            companyId: string;
            notes: string | null;
            inventoryItemId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            movementType: import(".prisma/client").$Enums.InventoryMovementType;
            reference: string | null;
            unitCost: import("@prisma/client/runtime/library").Decimal | null;
            performedBy: string | null;
        };
        updatedItem: {
            id: string;
            name: string;
            sku: string | null;
            category: string | null;
            unit: string;
            costPrice: import("@prisma/client/runtime/library").Decimal | null;
            sellingPrice: import("@prisma/client/runtime/library").Decimal | null;
            currentStock: import("@prisma/client/runtime/library").Decimal;
            reorderQuantity: import("@prisma/client/runtime/library").Decimal | null;
            minStockLevel: import("@prisma/client/runtime/library").Decimal;
            maxStockLevel: import("@prisma/client/runtime/library").Decimal | null;
            isTracked: boolean;
            lastStockedAt: Date | null;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            supplierId: string | null;
        };
    }>;
    getLowStockItems(companyId: string): Promise<({
        supplier: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            contactName: string | null;
            email: string | null;
            phone: string | null;
            notes: string | null;
        } | null;
        movements: {
            id: string;
            createdAt: Date;
            companyId: string;
            notes: string | null;
            inventoryItemId: string;
            quantity: import("@prisma/client/runtime/library").Decimal;
            movementType: import(".prisma/client").$Enums.InventoryMovementType;
            reference: string | null;
            unitCost: import("@prisma/client/runtime/library").Decimal | null;
            performedBy: string | null;
        }[];
    } & {
        id: string;
        name: string;
        sku: string | null;
        category: string | null;
        unit: string;
        costPrice: import("@prisma/client/runtime/library").Decimal | null;
        sellingPrice: import("@prisma/client/runtime/library").Decimal | null;
        currentStock: import("@prisma/client/runtime/library").Decimal;
        reorderQuantity: import("@prisma/client/runtime/library").Decimal | null;
        minStockLevel: import("@prisma/client/runtime/library").Decimal;
        maxStockLevel: import("@prisma/client/runtime/library").Decimal | null;
        isTracked: boolean;
        lastStockedAt: Date | null;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        supplierId: string | null;
    })[]>;
    getExpiringItems(companyId: string, days?: number): Promise<never[]>;
    getInventorySummary(companyId: string): Promise<{
        totalItems: number;
        totalValue: number;
        inStock: number;
        lowStock: number;
        outOfStock: number;
        categories: (string | null)[];
        types: string[];
    }>;
}
