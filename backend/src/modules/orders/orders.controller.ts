import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  @ApiQuery({ name: 'companyId', required: false, description: 'Filter by company ID' })
  async getAllOrders(@Query('companyId') companyId?: string) {
    return this.ordersService.getAllOrders(companyId);
  }

  @Get('table/:tableId')
  @ApiOperation({ summary: 'Get orders for table' })
  async getOrdersByTable(@Param('tableId') tableId: string) {
    return this.ordersService.getOrdersByTable(tableId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  async getOrder(@Param('id') id: string) {
    return this.ordersService.getOrder(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new order' })
  async createOrder(@Body() createDto: any) {
    return this.ordersService.createOrder(createDto);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  async updateOrderStatus(@Param('id') id: string, @Body() statusDto: { status: string }) {
    return this.ordersService.updateOrderStatus(id, statusDto.status);
  }

  @Put(':id/status/kitchen')
  @ApiOperation({ summary: 'Update kitchen order status (food items only)' })
  async updateKitchenOrderStatus(@Param('id') id: string, @Body() statusDto: { status: string }) {
    return this.ordersService.updateKitchenOrderStatus(id, statusDto.status);
  }

  @Put(':id/status/bar')
  @ApiOperation({ summary: 'Update bar order status (drink items only)' })
  async updateBarOrderStatus(@Param('id') id: string, @Body() statusDto: { status: string }) {
    return this.ordersService.updateBarOrderStatus(id, statusDto.status);
  }

  @Put(':id/total')
  @ApiOperation({ summary: 'Update order total' })
  async updateOrderTotal(@Param('id') id: string, @Body() totalDto: { total: number }) {
    return this.ordersService.updateOrderTotal(id, totalDto.total);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update entire order' })
  async updateOrder(@Param('id') id: string, @Body() orderUpdate: any) {
    return this.ordersService.updateOrder(id, orderUpdate);
  }

  @Post(':id/items')
  @ApiOperation({ summary: 'Add items to existing order' })
  async addItemsToOrder(@Param('id') id: string, @Body() itemsDto: { items: Array<{ menuItemId: string; quantity: number; notes?: string }> }) {
    return this.ordersService.addItemsToOrder(id, itemsDto.items);
  }

  @Put(':id/items/:itemId/status')
  @ApiOperation({ summary: 'Update item status' })
  async updateItemStatus(@Param('id') orderId: string, @Param('itemId') itemId: string, @Body() statusDto: { status: string }) {
    return this.ordersService.updateItemStatus(orderId, itemId, statusDto.status);
  }
}
