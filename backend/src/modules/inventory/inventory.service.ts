import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RestaurantWebSocketGateway } from '../websocket/websocket.gateway';
import { InventoryMovementType, InventoryAlertType } from '@prisma/client';
import { 
  CreateInventoryItemDto, 
  UpdateInventoryItemDto, 
  CreateInventoryMovementDto,
  CreateSupplierDto,
  UpdateSupplierDto,
  InventoryItemType,
  InventoryStatus,
  MovementType
} from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    private prisma: PrismaService,
    private webSocketGateway: RestaurantWebSocketGateway
  ) {}

  /**
   * Create inventory item (schema: minStockLevel, maxStockLevel, costPrice; no status/type)
   */
  async createInventoryItem(createDto: CreateInventoryItemDto) {
    const inventoryItem = await this.prisma.inventoryItem.create({
      data: {
        companyId: createDto.companyId,
        name: createDto.name,
        description: createDto.description ?? null,
        unit: createDto.unit,
        costPrice: createDto.unitCost,
        currentStock: createDto.currentStock,
        minStockLevel: createDto.minimumStock,
        maxStockLevel: createDto.maximumStock ?? null,
        reorderQuantity: createDto.reorderQuantity ?? null,
        supplierId: createDto.supplierId ?? null,
        category: createDto.category ?? null,
        sku: createDto.barcode ?? null,
      }
    });

    // Emit WebSocket event
    this.emitInventoryUpdate(createDto.companyId, 'item_created', inventoryItem);

    return inventoryItem;
  }

  /**
   * Get all inventory items for a company
   */
  async getInventoryItems(companyId: string, filters?: {
    type?: InventoryItemType;
    status?: InventoryStatus;
    category?: string;
    lowStock?: boolean;
  }) {
    const where: any = { companyId };

    if (filters?.category) {
      where.category = filters.category;
    }

    let items = await this.prisma.inventoryItem.findMany({
      where,
      include: {
        supplier: true,
        movements: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      },
      orderBy: { name: 'asc' }
    });

    if (filters?.lowStock) {
      items = items.filter(
        (i) => Number(i.currentStock) <= Number(i.minStockLevel)
      );
    }
    return items;
  }

  /**
   * Get inventory item by ID
   */
  async getInventoryItem(id: string) {
    return this.prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        supplier: true,
        movements: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  /**
   * Update inventory item
   */
  async updateInventoryItem(id: string, updateDto: UpdateInventoryItemDto) {
    const existingItem = await this.prisma.inventoryItem.findUnique({
      where: { id }
    });

    if (!existingItem) {
      throw new BadRequestException('Inventory item not found');
    }

    const data: any = { ...updateDto };
    if (data.minimumStock !== undefined) {
      data.minStockLevel = data.minimumStock;
      delete data.minimumStock;
    }
    if (data.maximumStock !== undefined) {
      data.maxStockLevel = data.maximumStock;
      delete data.maximumStock;
    }
    if (data.unitCost !== undefined) {
      data.costPrice = data.unitCost;
      delete data.unitCost;
    }
    delete data.type;
    delete data.status;
    delete data.trackExpiry;
    delete data.expiryDate;

    const updatedItem = await this.prisma.inventoryItem.update({
      where: { id },
      data
    });

    // Emit WebSocket event
    this.emitInventoryUpdate(existingItem.companyId, 'item_updated', updatedItem);

    return updatedItem;
  }

  /**
   * Delete inventory item
   */
  async deleteInventoryItem(id: string) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id }
    });

    if (!item) {
      throw new BadRequestException('Inventory item not found');
    }

    await this.prisma.inventoryItem.delete({
      where: { id }
    });

    // Emit WebSocket event
    this.emitInventoryUpdate(item.companyId, 'item_deleted', { id });

    return { success: true };
  }

  /**
   * Create inventory movement
   */
  private mapMovementTypeToPrisma(type: MovementType): InventoryMovementType {
    switch (type) {
      case MovementType.IN: return InventoryMovementType.STOCK_IN;
      case MovementType.OUT:
      case MovementType.WASTE: return InventoryMovementType.STOCK_OUT;
      case MovementType.ADJUSTMENT:
      case MovementType.TRANSFER: return InventoryMovementType.ADJUSTMENT;
      default: return InventoryMovementType.ADJUSTMENT;
    }
  }

  async createInventoryMovement(createDto: CreateInventoryMovementDto) {
    const inventoryItem = await this.prisma.inventoryItem.findUnique({
      where: { id: createDto.inventoryItemId }
    });

    if (!inventoryItem) {
      throw new BadRequestException('Inventory item not found');
    }

    const current = Number(inventoryItem.currentStock);
    const qty = createDto.quantity;
    let newStock: number;
    if (createDto.type === MovementType.IN || createDto.type === MovementType.ADJUSTMENT) {
      newStock = current + qty;
    } else if (createDto.type === MovementType.OUT || createDto.type === MovementType.WASTE) {
      newStock = current - qty;
    } else {
      newStock = current + qty;
    }

    if (newStock < 0) {
      throw new BadRequestException('Insufficient stock for this movement');
    }

    const movement = await this.prisma.inventoryMovement.create({
      data: {
        companyId: createDto.companyId,
        inventoryItemId: createDto.inventoryItemId,
        quantity: createDto.quantity,
        movementType: this.mapMovementTypeToPrisma(createDto.type),
        reference: createDto.reference ?? null,
        unitCost: createDto.unitCost ?? null,
        performedBy: createDto.performedBy ?? null,
        notes: createDto.notes ?? null,
      }
    });

    const updatedItem = await this.prisma.inventoryItem.update({
      where: { id: createDto.inventoryItemId },
      data: { currentStock: newStock }
    });

    // Check for low stock alerts
    await this.checkLowStockAlert(updatedItem);

    // Emit WebSocket events
    this.emitInventoryUpdate(createDto.companyId, 'movement_created', movement);
    this.emitInventoryUpdate(createDto.companyId, 'item_updated', updatedItem);

    return {
      movement,
      updatedItem
    };
  }

  /**
   * Get inventory movements
   */
  async getInventoryMovements(companyId: string, filters?: {
    inventoryItemId?: string;
    type?: MovementType;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = { companyId };

    if (filters?.inventoryItemId) {
      where.inventoryItemId = filters.inventoryItemId;
    }

    if (filters?.type) {
      where.movementType = this.mapMovementTypeToPrisma(filters.type);
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    return this.prisma.inventoryMovement.findMany({
      where,
      include: {
        inventoryItem: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Create supplier (schema: contactName not contactPerson)
   */
  async createSupplier(createDto: CreateSupplierDto) {
    const { contactPerson, ...rest } = createDto as CreateSupplierDto & { contactPerson?: string };
    const supplier = await this.prisma.supplier.create({
      data: { ...rest, contactName: contactPerson ?? null }
    });

    // Emit WebSocket event
    this.emitInventoryUpdate(createDto.companyId, 'supplier_created', supplier);

    return supplier;
  }

  /**
   * Get suppliers for a company
   */
  async getSuppliers(companyId: string) {
    return this.prisma.supplier.findMany({
      where: { companyId },
      include: {
        items: true
      },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Update supplier
   */
  async updateSupplier(id: string, updateDto: UpdateSupplierDto) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id }
    });

    if (!supplier) {
      throw new BadRequestException('Supplier not found');
    }

    const data: any = { ...updateDto };
    if (data.contactPerson !== undefined) {
      data.contactName = data.contactPerson;
      delete data.contactPerson;
    }
    const updatedSupplier = await this.prisma.supplier.update({
      where: { id },
      data
    });

    // Emit WebSocket event
    this.emitInventoryUpdate(supplier.companyId, 'supplier_updated', updatedSupplier);

    return updatedSupplier;
  }

  /**
   * Delete supplier
   */
  async deleteSupplier(id: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id }
    });

    if (!supplier) {
      throw new BadRequestException('Supplier not found');
    }

    await this.prisma.supplier.delete({
      where: { id }
    });

    // Emit WebSocket event
    this.emitInventoryUpdate(supplier.companyId, 'supplier_deleted', { id });

    return { success: true };
  }

  /**
   * Get inventory alerts
   */
  async getInventoryAlerts(companyId: string, unreadOnly: boolean = false) {
    const where: any = { companyId };

    if (unreadOnly) {
      where.resolved = false;
    }

    return this.prisma.inventoryAlert.findMany({
      where,
      include: {
        item: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Mark alert as read (schema: resolved, resolvedAt)
   */
  async markAlertAsRead(alertId: string) {
    return this.prisma.inventoryAlert.update({
      where: { id: alertId },
      data: { resolved: true, resolvedAt: new Date() }
    });
  }

  /**
   * Get inventory report
   */
  async getInventoryReport(companyId: string, startDate: Date, endDate: Date) {
    const items = await this.getInventoryItems(companyId);
    const movements = await this.getInventoryMovements(companyId, { startDate, endDate });

    const report = items.map(item => {
      const itemMovements = movements.filter(m => m.inventoryItemId === item.id);
      const movementsIn = itemMovements
        .filter(m => m.movementType === InventoryMovementType.STOCK_IN)
        .reduce((sum, m) => sum + Number(m.quantity), 0);
      const movementsOut = itemMovements
        .filter(m => m.movementType === InventoryMovementType.STOCK_OUT)
        .reduce((sum, m) => sum + Number(m.quantity), 0);
      const currentStock = Number(item.currentStock);
      const costPrice = Number(item.costPrice ?? 0);
      const minLevel = Number(item.minStockLevel);
      const status = this.calculateInventoryStatus(currentStock, minLevel);

      return {
        id: item.id,
        name: item.name,
        type: item.category ?? 'OTHER',
        currentStock,
        minimumStock: minLevel,
        unitCost: costPrice,
        totalValue: currentStock * costPrice,
        status,
        movementsIn,
        movementsOut,
        netMovement: movementsIn - movementsOut
      };
    });

    const totalValue = report.reduce((sum, item) => sum + item.totalValue, 0);
    const lowStockItems = report.filter(item => item.status === InventoryStatus.LOW_STOCK).length;
    const outOfStockItems = report.filter(item => item.status === InventoryStatus.OUT_OF_STOCK).length;

    return {
      companyId,
      startDate,
      endDate,
      items: report,
      totalValue,
      totalMovements: movements.length,
      lowStockItems,
      outOfStockItems
    };
  }

  /**
   * Calculate inventory status based on stock levels
   */
  private calculateInventoryStatus(currentStock: number, minimumStock: number): InventoryStatus {
    if (currentStock <= 0) {
      return InventoryStatus.OUT_OF_STOCK;
    } else if (currentStock <= minimumStock) {
      return InventoryStatus.LOW_STOCK;
    } else {
      return InventoryStatus.IN_STOCK;
    }
  }

  /**
   * Check for low stock alerts (schema: alertType, resolved; no severity)
   */
  private async checkLowStockAlert(inventoryItem: { id: string; companyId: string; name: string; unit: string; currentStock: unknown; minStockLevel: unknown }) {
    const current = Number(inventoryItem.currentStock);
    const minLevel = Number(inventoryItem.minStockLevel);
    const status = this.calculateInventoryStatus(current, minLevel);
    if (status !== InventoryStatus.LOW_STOCK && status !== InventoryStatus.OUT_OF_STOCK) return;

    const alertType = status === InventoryStatus.OUT_OF_STOCK ? InventoryAlertType.LOW_STOCK : InventoryAlertType.LOW_STOCK;

    const existingAlert = await this.prisma.inventoryAlert.findFirst({
      where: {
        inventoryItemId: inventoryItem.id,
        alertType,
        resolved: false
      }
    });

    if (!existingAlert) {
      const message = status === InventoryStatus.OUT_OF_STOCK
        ? `${inventoryItem.name} is out of stock`
        : `${inventoryItem.name} is running low (${current} ${inventoryItem.unit} remaining)`;
      const alert = await this.prisma.inventoryAlert.create({
        data: {
          companyId: inventoryItem.companyId,
          inventoryItemId: inventoryItem.id,
          alertType,
          message
        }
      });
      this.emitInventoryUpdate(inventoryItem.companyId, 'alert_created', alert);
    }
  }

  /**
   * Emit inventory update via WebSocket
   */
  private emitInventoryUpdate(companyId: string, event: string, data: any) {
    this.webSocketGateway.emitToCompany(companyId, 'admin', 'inventory_update', {
      event,
      data,
      timestamp: new Date()
    });
  }
}
