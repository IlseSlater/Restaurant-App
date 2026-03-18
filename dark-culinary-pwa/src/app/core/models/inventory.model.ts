export type InventoryItemType = 'INGREDIENT' | 'BEVERAGE' | 'SUPPLY' | 'OTHER';
export type InventoryItemStatus = 'ACTIVE' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'INACTIVE';

export interface InventoryItem {
  id: string;
  companyId: string;
  name: string;
  sku?: string;
  type: InventoryItemType;
  status: InventoryItemStatus;
  currentStock: number;
  minStockLevel: number;
  unit?: string;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventorySummary {
  totalItems: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalValue?: number;
  categories?: { name: string; count: number }[];
}

export interface StockAdjustment {
  itemId: string;
  quantity: number;
  reason?: string;
}
