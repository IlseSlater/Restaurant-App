import { InventoryService } from './inventory.service';
import { CreateInventoryItemDto, UpdateInventoryItemDto, CreateInventoryMovementDto, CreateSupplierDto, UpdateSupplierDto, InventoryItemType, InventoryStatus, MovementType } from './dto/inventory.dto';
export declare class InventoryController {
    private readonly inventoryService;
    private readonly logger;
    constructor(inventoryService: InventoryService);
    createInventoryItem(createDto: CreateInventoryItemDto): Promise<$Result.GetResult<import(".prisma/client").Prisma.$InventoryItemPayload<ExtArgs>, T, "create">>;
    getInventoryItems(companyId: string, type?: InventoryItemType, status?: InventoryStatus, category?: string, lowStock?: boolean): Promise<$Public.PrismaPromise<T>>;
    getInventoryItem(id: string): Promise<any>;
    updateInventoryItem(id: string, updateDto: UpdateInventoryItemDto): Promise<$Result.GetResult<import(".prisma/client").Prisma.$InventoryItemPayload<ExtArgs>, T, "update">>;
    deleteInventoryItem(id: string): Promise<{
        success: boolean;
    }>;
    createInventoryMovement(createDto: CreateInventoryMovementDto): Promise<{
        movement: $Result.GetResult<import(".prisma/client").Prisma.$InventoryMovementPayload<ExtArgs>, T, "create">;
        updatedItem: $Result.GetResult<import(".prisma/client").Prisma.$InventoryItemPayload<ExtArgs_1>, T_1, "update">;
    }>;
    getInventoryMovements(companyId: string, inventoryItemId?: string, type?: MovementType, startDate?: string, endDate?: string): Promise<$Public.PrismaPromise<T>>;
    createSupplier(createDto: CreateSupplierDto): Promise<$Result.GetResult<import(".prisma/client").Prisma.$SupplierPayload<ExtArgs>, T, "create">>;
    getSuppliers(companyId: string): Promise<$Public.PrismaPromise<T>>;
    getSupplier(id: string): Promise<$Public.PrismaPromise<T>>;
    updateSupplier(id: string, updateDto: UpdateSupplierDto): Promise<$Result.GetResult<import(".prisma/client").Prisma.$SupplierPayload<ExtArgs>, T, "update">>;
    deleteSupplier(id: string): Promise<{
        success: boolean;
    }>;
    getInventoryAlerts(companyId: string, unreadOnly?: boolean): Promise<$Public.PrismaPromise<T>>;
    markAlertAsRead(id: string): Promise<$Result.GetResult<import(".prisma/client").Prisma.$InventoryAlertPayload<ExtArgs>, T, "update">>;
    getInventoryReport(companyId: string, startDate: string, endDate: string): Promise<{
        companyId: string;
        startDate: Date;
        endDate: Date;
        items: any;
        totalValue: any;
        totalMovements: any;
        lowStockItems: any;
        outOfStockItems: any;
    }>;
    bulkUpdateInventoryItems(updates: Array<{
        id: string;
        currentStock: number;
        reason?: string;
    }>): Promise<({
        id: string;
        success: boolean;
        data: $Result.GetResult<import(".prisma/client").Prisma.$InventoryItemPayload<ExtArgs>, T, "update">;
        error?: undefined;
    } | {
        id: string;
        success: boolean;
        error: any;
        data?: undefined;
    })[]>;
    adjustStock(id: string, body: {
        newStock: number;
        reason: string;
        notes?: string;
    }): Promise<{
        movement: $Result.GetResult<import(".prisma/client").Prisma.$InventoryMovementPayload<ExtArgs>, T, "create">;
        updatedItem: $Result.GetResult<import(".prisma/client").Prisma.$InventoryItemPayload<ExtArgs_1>, T_1, "update">;
    }>;
    getLowStockItems(companyId: string): Promise<$Public.PrismaPromise<T>>;
    getExpiringItems(companyId: string, days?: number): Promise<never[]>;
    getInventorySummary(companyId: string): Promise<{
        totalItems: any;
        totalValue: any;
        inStock: any;
        lowStock: any;
        outOfStock: any;
        categories: unknown[];
        types: string[];
    }>;
}
