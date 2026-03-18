import { IsString, IsNumber, IsOptional, IsEnum, IsArray, ValidateNested, IsBoolean, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export enum InventoryItemType {
  INGREDIENT = 'INGREDIENT',
  BEVERAGE = 'BEVERAGE',
  SUPPLY = 'SUPPLY',
  EQUIPMENT = 'EQUIPMENT'
}

export enum InventoryStatus {
  IN_STOCK = 'IN_STOCK',
  LOW_STOCK = 'LOW_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  DISCONTINUED = 'DISCONTINUED'
}

export enum MovementType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUSTMENT = 'ADJUSTMENT',
  WASTE = 'WASTE',
  TRANSFER = 'TRANSFER'
}

export class CreateInventoryItemDto {
  @IsString()
  companyId: string;

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsEnum(InventoryItemType)
  type: InventoryItemType;

  @IsString()
  unit: string; // kg, liters, pieces, etc.

  @IsNumber()
  currentStock: number;

  @IsNumber()
  minimumStock: number;

  @IsNumber()
  maximumStock: number;

  @IsNumber()
  unitCost: number;

  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsDate()
  expiryDate?: Date;

  @IsOptional()
  @IsBoolean()
  trackExpiry?: boolean;

  @IsOptional()
  @IsNumber()
  reorderPoint?: number;

  @IsOptional()
  @IsNumber()
  reorderQuantity?: number;
}

export class UpdateInventoryItemDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(InventoryItemType)
  type?: InventoryItemType;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  currentStock?: number;

  @IsOptional()
  @IsNumber()
  minimumStock?: number;

  @IsOptional()
  @IsNumber()
  maximumStock?: number;

  @IsOptional()
  @IsNumber()
  unitCost?: number;

  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsDate()
  expiryDate?: Date;

  @IsOptional()
  @IsBoolean()
  trackExpiry?: boolean;

  @IsOptional()
  @IsNumber()
  reorderPoint?: number;

  @IsOptional()
  @IsNumber()
  reorderQuantity?: number;
}

export class CreateInventoryMovementDto {
  @IsString()
  companyId: string;

  @IsString()
  inventoryItemId: string;

  @IsEnum(MovementType)
  type: MovementType;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  reference?: string; // Order ID, Supplier Invoice, etc.

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  unitCost?: number;

  @IsOptional()
  @IsString()
  performedBy?: string;
}

export class CreateSupplierDto {
  @IsString()
  companyId: string;

  @IsString()
  name: string;

  @IsString()
  contactPerson: string;

  @IsString()
  email: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];
}

export class UpdateSupplierDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  contactPerson?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];
}

export class InventoryAlertDto {
  @IsString()
  id: string;

  @IsString()
  companyId: string;

  @IsString()
  inventoryItemId: string;

  @IsString()
  type: string; // LOW_STOCK, EXPIRED, EXPIRING_SOON

  @IsString()
  message: string;

  @IsString()
  severity: string; // LOW, MEDIUM, HIGH, CRITICAL

  @IsBoolean()
  isRead: boolean;

  @IsDate()
  createdAt: Date;

  @IsOptional()
  @IsDate()
  readAt?: Date;
}

export class InventoryReportDto {
  @IsString()
  companyId: string;

  @IsDate()
  startDate: Date;

  @IsDate()
  endDate: Date;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InventoryItemReportDto)
  items: InventoryItemReportDto[];

  @IsNumber()
  totalValue: number;

  @IsNumber()
  totalMovements: number;

  @IsNumber()
  lowStockItems: number;

  @IsNumber()
  outOfStockItems: number;
}

export class InventoryItemReportDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsNumber()
  currentStock: number;

  @IsNumber()
  minimumStock: number;

  @IsNumber()
  unitCost: number;

  @IsNumber()
  totalValue: number;

  @IsString()
  status: string;

  @IsNumber()
  movementsIn: number;

  @IsNumber()
  movementsOut: number;

  @IsNumber()
  netMovement: number;
}
