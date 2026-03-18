import { Controller, Post, Get, Put, Param, Body, Query } from '@nestjs/common';
import { WaiterCallsService } from './waiter-calls.service';

@Controller('waiter-calls')
export class WaiterCallsController {
  constructor(private readonly callService: WaiterCallsService) {}

  @Post()
  createCall(@Body() data: any) {
    return this.callService.createCall(data);
  }

  @Put(':id/acknowledge')
  acknowledgeCall(@Param('id') id: string, @Body() data: { acknowledgedBy: string }) {
    return this.callService.acknowledgeCall(id, data.acknowledgedBy);
  }

  @Put(':id/resolve')
  resolveCall(@Param('id') id: string) {
    return this.callService.resolveCall(id);
  }

  @Get('table/:tableId')
  getCallsByTable(@Param('tableId') tableId: string) {
    return this.callService.getCallsByTable(tableId);
  }

  @Get('pending')
  getPendingCalls(
    @Query('companyId') companyId?: string,
    @Query('type') type?: string,
  ) {
    return this.callService.getPendingCalls(companyId, type);
  }
}
