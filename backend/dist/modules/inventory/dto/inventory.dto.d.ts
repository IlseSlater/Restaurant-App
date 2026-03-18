export declare enum InventoryItemType {
    INGREDIENT = "INGREDIENT",
    BEVERAGE = "BEVERAGE",
    SUPPLY = "SUPPLY",
    EQUIPMENT = "EQUIPMENT"
}
export declare enum InventoryStatus {
    IN_STOCK = "IN_STOCK",
    LOW_STOCK = "LOW_STOCK",
    OUT_OF_STOCK = "OUT_OF_STOCK",
    DISCONTINUED = "DISCONTINUED"
}
export declare enum MovementType {
    IN = "IN",
    OUT = "OUT",
    ADJUSTMENT = "ADJUSTMENT",
    WASTE = "WASTE",
    TRANSFER = "TRANSFER"
}
export declare class CreateInventoryItemDto {
    companyId: string;
    name: string;
    description: string;
    type: InventoryItemType;
    unit: string;
    currentStock: number;
    minimumStock: number;
    maximumStock: number;
    unitCost: number;
    supplierId?: string;
    category?: string;
    barcode?: string;
    location?: string;
    expiryDate?: Date;
    trackExpiry?: boolean;
    reorderPoint?: number;
    reorderQuantity?: number;
}
export declare class UpdateInventoryItemDto {
    name?: string;
    description?: string;
    type?: InventoryItemType;
    unit?: string;
    currentStock?: number;
    minimumStock?: number;
    maximumStock?: number;
    unitCost?: number;
    supplierId?: string;
    category?: string;
    barcode?: string;
    location?: string;
    expiryDate?: Date;
    trackExpiry?: boolean;
    reorderPoint?: number;
    reorderQuantity?: number;
}
export declare class CreateInventoryMovementDto {
    companyId: string;
    inventoryItemId: string;
    type: MovementType;
    quantity: number;
    reason?: string;
    reference?: string;
    notes?: string;
    unitCost?: number;
    performedBy?: string;
}
export declare class CreateSupplierDto {
    companyId: string;
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    website?: string;
    notes?: string;
    categories?: string[];
}
export declare class UpdateSupplierDto {
    name?: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    website?: string;
    notes?: string;
    categories?: string[];
}
export declare class InventoryAlertDto {
    id: string;
    companyId: string;
    inventoryItemId: string;
    type: string;
    message: string;
    severity: string;
    isRead: boolean;
    createdAt: Date;
    readAt?: Date;
}
export declare class InventoryReportDto {
    companyId: string;
    startDate: Date;
    endDate: Date;
    items: InventoryItemReportDto[];
    totalValue: number;
    totalMovements: number;
    lowStockItems: number;
    outOfStockItems: number;
}
export declare class InventoryItemReportDto {
    id: string;
    name: string;
    type: string;
    currentStock: number;
    minimumStock: number;
    unitCost: number;
    totalValue: number;
    status: string;
    movementsIn: number;
    movementsOut: number;
    netMovement: number;
}
