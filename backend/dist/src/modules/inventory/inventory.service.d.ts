import { PrismaService } from '../prisma/prisma.service';
import { RestaurantWebSocketGateway } from '../websocket/websocket.gateway';
import { CreateInventoryItemDto, UpdateInventoryItemDto, CreateInventoryMovementDto, CreateSupplierDto, UpdateSupplierDto, InventoryItemType, InventoryStatus, MovementType } from './dto/inventory.dto';
export declare class InventoryService {
    private prisma;
    private webSocketGateway;
    private readonly logger;
    constructor(prisma: PrismaService, webSocketGateway: RestaurantWebSocketGateway);
    createInventoryItem(createDto: CreateInventoryItemDto): Promise<$Result.GetResult<import(".prisma/client").Prisma.$InventoryItemPayload<ExtArgs>, T, "create">>;
    getInventoryItems(companyId: string, filters?: {
        type?: InventoryItemType;
        status?: InventoryStatus;
        category?: string;
        lowStock?: boolean;
    }): Promise<$Public.PrismaPromise<T>>;
    getInventoryItem(id: string): Promise<any>;
    updateInventoryItem(id: string, updateDto: UpdateInventoryItemDto): Promise<$Result.GetResult<import(".prisma/client").Prisma.$InventoryItemPayload<ExtArgs>, T, "update">>;
    deleteInventoryItem(id: string): Promise<{
        success: boolean;
    }>;
    private mapMovementTypeToPrisma;
    createInventoryMovement(createDto: CreateInventoryMovementDto): Promise<{
        movement: $Result.GetResult<import(".prisma/client").Prisma.$InventoryMovementPayload<ExtArgs>, T, "create">;
        updatedItem: $Result.GetResult<import(".prisma/client").Prisma.$InventoryItemPayload<ExtArgs_1>, T_1, "update">;
    }>;
    getInventoryMovements(companyId: string, filters?: {
        inventoryItemId?: string;
        type?: MovementType;
        startDate?: Date;
        endDate?: Date;
    }): Promise<$Public.PrismaPromise<T>>;
    createSupplier(createDto: CreateSupplierDto): Promise<$Result.GetResult<import(".prisma/client").Prisma.$SupplierPayload<ExtArgs>, T, "create">>;
    getSuppliers(companyId: string): Promise<$Public.PrismaPromise<T>>;
    updateSupplier(id: string, updateDto: UpdateSupplierDto): Promise<$Result.GetResult<import(".prisma/client").Prisma.$SupplierPayload<ExtArgs>, T, "update">>;
    deleteSupplier(id: string): Promise<{
        success: boolean;
    }>;
    getInventoryAlerts(companyId: string, unreadOnly?: boolean): Promise<$Public.PrismaPromise<T>>;
    markAlertAsRead(alertId: string): Promise<$Result.GetResult<import(".prisma/client").Prisma.$InventoryAlertPayload<ExtArgs>, T, "update">>;
    getInventoryReport(companyId: string, startDate: Date, endDate: Date): Promise<{
        companyId: string;
        startDate: Date;
        endDate: Date;
        items: any;
        totalValue: any;
        totalMovements: any;
        lowStockItems: any;
        outOfStockItems: any;
    }>;
    private calculateInventoryStatus;
    private checkLowStockAlert;
    private emitInventoryUpdate;
}
