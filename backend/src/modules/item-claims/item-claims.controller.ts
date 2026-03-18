import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ItemClaimsService } from './item-claims.service';

@Controller('item-claims')
export class ItemClaimsController {
  constructor(private readonly itemClaimsService: ItemClaimsService) {}

  @Get('order-item/:orderItemId')
  getClaimsByOrderItem(@Param('orderItemId') orderItemId: string) {
    return this.itemClaimsService.getClaimsByOrderItem(orderItemId);
  }

  @Post('claim')
  claim(@Body() body: { orderItemId: string; participantId: string }) {
    return this.itemClaimsService.claim(body.orderItemId, body.participantId);
  }

  @Post('leave')
  leave(@Body() body: { orderItemId: string; participantId: string }) {
    return this.itemClaimsService.leave(body.orderItemId, body.participantId);
  }
}
