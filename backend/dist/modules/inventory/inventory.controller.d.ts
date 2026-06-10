import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto, UpdateInventoryItemDto, CreateInventoryMovementDto, CreateSupplierDto, UpdateSupplierDto, InventoryItemType, InventoryStatus, MovementType } from './dto/inventory.dto';
export declare class InventoryController {
    private readonly inventoryService;
    private readonly logger;
    constructor(inventoryService: InventoryService);
    createInventoryItem(createDto: CreateInventoryItemDto): Promise<{
        description: string | null;
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        category: string | null;
        unit: string;
        currentStock: import("@prisma/client/runtime/library").Decimal;
        supplierId: string | null;
        reorderQuantity: import("@prisma/client/runtime/library").Decimal | null;
        sku: string | null;
        costPrice: import("@prisma/client/runtime/library").Decimal | null;
        sellingPrice: import("@prisma/client/runtime/library").Decimal | null;
        minStockLevel: import("@prisma/client/runtime/library").Decimal;
        maxStockLevel: import("@prisma/client/runtime/library").Decimal | null;
        isTracked: boolean;
        lastStockedAt: Date | null;
    }>;
    getInventoryItems(companyId: string, type?: InventoryItemType, status?: InventoryStatus, category?: string, lowStock?: boolean): Promise<({
        supplier: {
            id: string;
            companyId: string;
            email: string | null;
            name: string;
            phone: string | null;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            contactName: string | null;
        } | null;
        movements: {
            id: string;
            companyId: string;
            createdAt: Date;
            notes: string | null;
            quantity: import("@prisma/client/runtime/library").Decimal;
            unitCost: import("@prisma/client/runtime/library").Decimal | null;
            inventoryItemId: string;
            reference: string | null;
            performedBy: string | null;
            movementType: import(".prisma/client").$Enums.InventoryMovementType;
        }[];
    } & {
        description: string | null;
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        category: string | null;
        unit: string;
        currentStock: import("@prisma/client/runtime/library").Decimal;
        supplierId: string | null;
        reorderQuantity: import("@prisma/client/runtime/library").Decimal | null;
        sku: string | null;
        costPrice: import("@prisma/client/runtime/library").Decimal | null;
        sellingPrice: import("@prisma/client/runtime/library").Decimal | null;
        minStockLevel: import("@prisma/client/runtime/library").Decimal;
        maxStockLevel: import("@prisma/client/runtime/library").Decimal | null;
        isTracked: boolean;
        lastStockedAt: Date | null;
    })[]>;
    getInventoryItem(id: string): Promise<({
        supplier: {
            id: string;
            companyId: string;
            email: string | null;
            name: string;
            phone: string | null;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            contactName: string | null;
        } | null;
        movements: {
            id: string;
            companyId: string;
            createdAt: Date;
            notes: string | null;
            quantity: import("@prisma/client/runtime/library").Decimal;
            unitCost: import("@prisma/client/runtime/library").Decimal | null;
            inventoryItemId: string;
            reference: string | null;
            performedBy: string | null;
            movementType: import(".prisma/client").$Enums.InventoryMovementType;
        }[];
    } & {
        description: string | null;
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        category: string | null;
        unit: string;
        currentStock: import("@prisma/client/runtime/library").Decimal;
        supplierId: string | null;
        reorderQuantity: import("@prisma/client/runtime/library").Decimal | null;
        sku: string | null;
        costPrice: import("@prisma/client/runtime/library").Decimal | null;
        sellingPrice: import("@prisma/client/runtime/library").Decimal | null;
        minStockLevel: import("@prisma/client/runtime/library").Decimal;
        maxStockLevel: import("@prisma/client/runtime/library").Decimal | null;
        isTracked: boolean;
        lastStockedAt: Date | null;
    }) | null>;
    updateInventoryItem(id: string, updateDto: UpdateInventoryItemDto): Promise<{
        description: string | null;
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        category: string | null;
        unit: string;
        currentStock: import("@prisma/client/runtime/library").Decimal;
        supplierId: string | null;
        reorderQuantity: import("@prisma/client/runtime/library").Decimal | null;
        sku: string | null;
        costPrice: import("@prisma/client/runtime/library").Decimal | null;
        sellingPrice: import("@prisma/client/runtime/library").Decimal | null;
        minStockLevel: import("@prisma/client/runtime/library").Decimal;
        maxStockLevel: import("@prisma/client/runtime/library").Decimal | null;
        isTracked: boolean;
        lastStockedAt: Date | null;
    }>;
    deleteInventoryItem(id: string): Promise<{
        success: boolean;
    }>;
    createInventoryMovement(createDto: CreateInventoryMovementDto): Promise<{
        movement: {
            id: string;
            companyId: string;
            createdAt: Date;
            notes: string | null;
            quantity: import("@prisma/client/runtime/library").Decimal;
            unitCost: import("@prisma/client/runtime/library").Decimal | null;
            inventoryItemId: string;
            reference: string | null;
            performedBy: string | null;
            movementType: import(".prisma/client").$Enums.InventoryMovementType;
        };
        updatedItem: {
            description: string | null;
            id: string;
            companyId: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            category: string | null;
            unit: string;
            currentStock: import("@prisma/client/runtime/library").Decimal;
            supplierId: string | null;
            reorderQuantity: import("@prisma/client/runtime/library").Decimal | null;
            sku: string | null;
            costPrice: import("@prisma/client/runtime/library").Decimal | null;
            sellingPrice: import("@prisma/client/runtime/library").Decimal | null;
            minStockLevel: import("@prisma/client/runtime/library").Decimal;
            maxStockLevel: import("@prisma/client/runtime/library").Decimal | null;
            isTracked: boolean;
            lastStockedAt: Date | null;
        };
    }>;
    getInventoryMovements(companyId: string, inventoryItemId?: string, type?: MovementType, startDate?: string, endDate?: string): Promise<({
        inventoryItem: {
            description: string | null;
            id: string;
            companyId: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            category: string | null;
            unit: string;
            currentStock: import("@prisma/client/runtime/library").Decimal;
            supplierId: string | null;
            reorderQuantity: import("@prisma/client/runtime/library").Decimal | null;
            sku: string | null;
            costPrice: import("@prisma/client/runtime/library").Decimal | null;
            sellingPrice: import("@prisma/client/runtime/library").Decimal | null;
            minStockLevel: import("@prisma/client/runtime/library").Decimal;
            maxStockLevel: import("@prisma/client/runtime/library").Decimal | null;
            isTracked: boolean;
            lastStockedAt: Date | null;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        notes: string | null;
        quantity: import("@prisma/client/runtime/library").Decimal;
        unitCost: import("@prisma/client/runtime/library").Decimal | null;
        inventoryItemId: string;
        reference: string | null;
        performedBy: string | null;
        movementType: import(".prisma/client").$Enums.InventoryMovementType;
    })[]>;
    createSupplier(createDto: CreateSupplierDto): Promise<{
        id: string;
        companyId: string;
        email: string | null;
        name: string;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        contactName: string | null;
    }>;
    getSuppliers(companyId: string): Promise<({
        items: {
            description: string | null;
            id: string;
            companyId: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            category: string | null;
            unit: string;
            currentStock: import("@prisma/client/runtime/library").Decimal;
            supplierId: string | null;
            reorderQuantity: import("@prisma/client/runtime/library").Decimal | null;
            sku: string | null;
            costPrice: import("@prisma/client/runtime/library").Decimal | null;
            sellingPrice: import("@prisma/client/runtime/library").Decimal | null;
            minStockLevel: import("@prisma/client/runtime/library").Decimal;
            maxStockLevel: import("@prisma/client/runtime/library").Decimal | null;
            isTracked: boolean;
            lastStockedAt: Date | null;
        }[];
    } & {
        id: string;
        companyId: string;
        email: string | null;
        name: string;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        contactName: string | null;
    })[]>;
    getSupplier(id: string): Promise<({
        items: {
            description: string | null;
            id: string;
            companyId: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            category: string | null;
            unit: string;
            currentStock: import("@prisma/client/runtime/library").Decimal;
            supplierId: string | null;
            reorderQuantity: import("@prisma/client/runtime/library").Decimal | null;
            sku: string | null;
            costPrice: import("@prisma/client/runtime/library").Decimal | null;
            sellingPrice: import("@prisma/client/runtime/library").Decimal | null;
            minStockLevel: import("@prisma/client/runtime/library").Decimal;
            maxStockLevel: import("@prisma/client/runtime/library").Decimal | null;
            isTracked: boolean;
            lastStockedAt: Date | null;
        }[];
    } & {
        id: string;
        companyId: string;
        email: string | null;
        name: string;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        contactName: string | null;
    })[]>;
    updateSupplier(id: string, updateDto: UpdateSupplierDto): Promise<{
        id: string;
        companyId: string;
        email: string | null;
        name: string;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        contactName: string | null;
    }>;
    deleteSupplier(id: string): Promise<{
        success: boolean;
    }>;
    getInventoryAlerts(companyId: string, unreadOnly?: boolean): Promise<({
        item: {
            description: string | null;
            id: string;
            companyId: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            category: string | null;
            unit: string;
            currentStock: import("@prisma/client/runtime/library").Decimal;
            supplierId: string | null;
            reorderQuantity: import("@prisma/client/runtime/library").Decimal | null;
            sku: string | null;
            costPrice: import("@prisma/client/runtime/library").Decimal | null;
            sellingPrice: import("@prisma/client/runtime/library").Decimal | null;
            minStockLevel: import("@prisma/client/runtime/library").Decimal;
            maxStockLevel: import("@prisma/client/runtime/library").Decimal | null;
            isTracked: boolean;
            lastStockedAt: Date | null;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        message: string;
        resolvedAt: Date | null;
        inventoryItemId: string;
        alertType: import(".prisma/client").$Enums.InventoryAlertType;
        resolved: boolean;
    })[]>;
    markAlertAsRead(id: string): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        message: string;
        resolvedAt: Date | null;
        inventoryItemId: string;
        alertType: import(".prisma/client").$Enums.InventoryAlertType;
        resolved: boolean;
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
            companyId: string;
            createdAt: Date;
            notes: string | null;
            quantity: import("@prisma/client/runtime/library").Decimal;
            unitCost: import("@prisma/client/runtime/library").Decimal | null;
            inventoryItemId: string;
            reference: string | null;
            performedBy: string | null;
            movementType: import(".prisma/client").$Enums.InventoryMovementType;
        };
        updatedItem: {
            description: string | null;
            id: string;
            companyId: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            category: string | null;
            unit: string;
            currentStock: import("@prisma/client/runtime/library").Decimal;
            supplierId: string | null;
            reorderQuantity: import("@prisma/client/runtime/library").Decimal | null;
            sku: string | null;
            costPrice: import("@prisma/client/runtime/library").Decimal | null;
            sellingPrice: import("@prisma/client/runtime/library").Decimal | null;
            minStockLevel: import("@prisma/client/runtime/library").Decimal;
            maxStockLevel: import("@prisma/client/runtime/library").Decimal | null;
            isTracked: boolean;
            lastStockedAt: Date | null;
        };
    }>;
    getLowStockItems(companyId: string): Promise<({
        supplier: {
            id: string;
            companyId: string;
            email: string | null;
            name: string;
            phone: string | null;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            contactName: string | null;
        } | null;
        movements: {
            id: string;
            companyId: string;
            createdAt: Date;
            notes: string | null;
            quantity: import("@prisma/client/runtime/library").Decimal;
            unitCost: import("@prisma/client/runtime/library").Decimal | null;
            inventoryItemId: string;
            reference: string | null;
            performedBy: string | null;
            movementType: import(".prisma/client").$Enums.InventoryMovementType;
        }[];
    } & {
        description: string | null;
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        category: string | null;
        unit: string;
        currentStock: import("@prisma/client/runtime/library").Decimal;
        supplierId: string | null;
        reorderQuantity: import("@prisma/client/runtime/library").Decimal | null;
        sku: string | null;
        costPrice: import("@prisma/client/runtime/library").Decimal | null;
        sellingPrice: import("@prisma/client/runtime/library").Decimal | null;
        minStockLevel: import("@prisma/client/runtime/library").Decimal;
        maxStockLevel: import("@prisma/client/runtime/library").Decimal | null;
        isTracked: boolean;
        lastStockedAt: Date | null;
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
