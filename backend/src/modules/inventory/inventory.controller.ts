import { Controller, Get, Post, Put, Delete, Param, Body, Query, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { InventoryService } from './inventory.service';
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

@Controller('inventory')
export class InventoryController {
  private readonly logger = new Logger(InventoryController.name);

  constructor(private readonly inventoryService: InventoryService) {}

  // Inventory Items
  @Post('items')
  async createInventoryItem(@Body() createDto: CreateInventoryItemDto) {
    return this.inventoryService.createInventoryItem(createDto);
  }

  @Get('items/company/:companyId')
  async getInventoryItems(
    @Param('companyId') companyId: string,
    @Query('type') type?: InventoryItemType,
    @Query('status') status?: InventoryStatus,
    @Query('category') category?: string,
    @Query('lowStock') lowStock?: boolean
  ) {
    return this.inventoryService.getInventoryItems(companyId, {
      type,
      status,
      category,
      lowStock: lowStock === true
    });
  }

  @Get('items/:id')
  async getInventoryItem(@Param('id') id: string) {
    return this.inventoryService.getInventoryItem(id);
  }

  @Put('items/:id')
  async updateInventoryItem(
    @Param('id') id: string,
    @Body() updateDto: UpdateInventoryItemDto
  ) {
    return this.inventoryService.updateInventoryItem(id, updateDto);
  }

  @Delete('items/:id')
  async deleteInventoryItem(@Param('id') id: string) {
    return this.inventoryService.deleteInventoryItem(id);
  }

  // Inventory Movements
  @Post('movements')
  async createInventoryMovement(@Body() createDto: CreateInventoryMovementDto) {
    return this.inventoryService.createInventoryMovement(createDto);
  }

  @Get('movements/company/:companyId')
  async getInventoryMovements(
    @Param('companyId') companyId: string,
    @Query('inventoryItemId') inventoryItemId?: string,
    @Query('type') type?: MovementType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const filters: any = {};
    
    if (inventoryItemId) filters.inventoryItemId = inventoryItemId;
    if (type) filters.type = type;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    return this.inventoryService.getInventoryMovements(companyId, filters);
  }

  // Suppliers
  @Post('suppliers')
  async createSupplier(@Body() createDto: CreateSupplierDto) {
    return this.inventoryService.createSupplier(createDto);
  }

  @Get('suppliers/company/:companyId')
  async getSuppliers(@Param('companyId') companyId: string) {
    return this.inventoryService.getSuppliers(companyId);
  }

  @Get('suppliers/:id')
  async getSupplier(@Param('id') id: string) {
    return this.inventoryService.getSuppliers(id);
  }

  @Put('suppliers/:id')
  async updateSupplier(
    @Param('id') id: string,
    @Body() updateDto: UpdateSupplierDto
  ) {
    return this.inventoryService.updateSupplier(id, updateDto);
  }

  @Delete('suppliers/:id')
  async deleteSupplier(@Param('id') id: string) {
    return this.inventoryService.deleteSupplier(id);
  }

  // Alerts
  @Get('alerts/company/:companyId')
  async getInventoryAlerts(
    @Param('companyId') companyId: string,
    @Query('unreadOnly') unreadOnly?: boolean
  ) {
    return this.inventoryService.getInventoryAlerts(companyId, unreadOnly === true);
  }

  @Put('alerts/:id/read')
  async markAlertAsRead(@Param('id') id: string) {
    return this.inventoryService.markAlertAsRead(id);
  }

  // Reports
  @Get('reports/company/:companyId')
  async getInventoryReport(
    @Param('companyId') companyId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.inventoryService.getInventoryReport(
      companyId,
      new Date(startDate),
      new Date(endDate)
    );
  }

  // Bulk Operations
  @Post('items/bulk-update')
  async bulkUpdateInventoryItems(@Body() updates: Array<{
    id: string;
    currentStock: number;
    reason?: string;
  }>) {
    const results: Array<{ id: string; success: boolean; data?: any; error?: string }> = [];

    for (const update of updates) {
      try {
        const result = await this.inventoryService.updateInventoryItem(update.id, {
          currentStock: update.currentStock
        });

        // Create movement record for bulk update
        if (update.reason) {
          const prev = Number(result.currentStock ?? 0);
          await this.inventoryService.createInventoryMovement({
            companyId: result.companyId,
            inventoryItemId: update.id,
            type: MovementType.ADJUSTMENT,
            quantity: Math.abs(update.currentStock - prev),
            reason: update.reason,
            reference: 'BULK_UPDATE'
          });
        }

        results.push({ id: update.id, success: true, data: result });
      } catch (error) {
        results.push({ id: update.id, success: false, error: error.message });
      }
    }

    return results;
  }

  // Stock Adjustment
  @Post('items/:id/adjust')
  async adjustStock(
    @Param('id') id: string,
    @Body() body: {
      newStock: number;
      reason: string;
      notes?: string;
    }
  ) {
    const item = await this.inventoryService.getInventoryItem(id);
    if (!item) {
      throw new Error('Inventory item not found');
    }

    const current = Number(item.currentStock);
    const difference = body.newStock - current;
    const movementType = difference > 0 ? MovementType.IN : MovementType.OUT;

    return this.inventoryService.createInventoryMovement({
      companyId: item.companyId,
      inventoryItemId: id,
      type: movementType,
      quantity: Math.abs(difference),
      reason: body.reason,
      notes: body.notes,
      reference: 'STOCK_ADJUSTMENT'
    });
  }

  // Low Stock Items
  @Get('items/company/:companyId/low-stock')
  async getLowStockItems(@Param('companyId') companyId: string) {
    return this.inventoryService.getInventoryItems(companyId, { lowStock: true });
  }

  // Expiring Items (schema has no trackExpiry/expiryDate; return empty until schema extended)
  @Get('items/company/:companyId/expiring')
  async getExpiringItems(
    @Param('companyId') companyId: string,
    @Query('days') days: number = 7
  ) {
    return [];
  }

  // Inventory Summary (schema: costPrice, minStockLevel; status computed)
  @Get('summary/company/:companyId')
  async getInventorySummary(@Param('companyId') companyId: string) {
    const items = await this.inventoryService.getInventoryItems(companyId);

    const inStock = items.filter(
      (i) => Number(i.currentStock) > Number(i.minStockLevel)
    ).length;
    const lowStock = items.filter(
      (i) => {
        const c = Number(i.currentStock);
        const m = Number(i.minStockLevel);
        return c > 0 && c <= m;
      }
    ).length;
    const outOfStock = items.filter(
      (i) => Number(i.currentStock) <= 0
    ).length;
    const totalValue = items.reduce(
      (sum, item) => sum + Number(item.currentStock) * Number(item.costPrice ?? 0),
      0
    );

    return {
      totalItems: items.length,
      totalValue,
      inStock,
      lowStock,
      outOfStock,
      categories: [...new Set(items.map((item) => item.category).filter(Boolean))],
      types: [] as string[]
    };
  }
}
