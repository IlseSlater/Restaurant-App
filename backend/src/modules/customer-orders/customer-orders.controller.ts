import { Controller, Post, Get, Put, Param, Body } from '@nestjs/common';
import { CustomerOrdersService } from './customer-orders.service';

@Controller('customer-orders')
export class CustomerOrdersController {
  constructor(private readonly orderService: CustomerOrdersService) {}

  @Post()
  createOrder(@Body() data: any) {
    return this.orderService.createOrder(data);
  }

  @Get('session/:sessionId')
  getOrdersBySession(@Param('sessionId') sessionId: string) {
    return this.orderService.getOrdersBySession(sessionId);
  }

  @Get(':id')
  getOrder(@Param('id') id: string) {
    return this.orderService.getOrder(id);
  }

  @Put(':id/status')
  updateOrderStatus(@Param('id') id: string, @Body() data: { status: string }) {
    return this.orderService.updateOrderStatus(id, data.status);
  }

  @Put(':id/status/bar')
  updateBarOrderStatus(@Param('id') id: string, @Body() data: { status: string }) {
    return this.orderService.updateOrderStatus(id, data.status);
  }

  @Put(':id/status/kitchen')
  updateKitchenOrderStatus(@Param('id') id: string, @Body() data: { status: string }) {
    return this.orderService.updateOrderStatus(id, data.status);
  }

  @Put(':id/items/:itemId/status')
  updateItemStatus(
    @Param('id') orderId: string,
    @Param('itemId') itemId: string,
    @Body() data: { status: string }
  ) {
    return this.orderService.updateItemStatus(orderId, itemId, data.status);
  }
}
