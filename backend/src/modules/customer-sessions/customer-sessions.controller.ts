import { Controller, Post, Get, Put, Param, Body, Query } from '@nestjs/common';
import { CustomerSessionsService } from './customer-sessions.service';

@Controller('customer-sessions')
export class CustomerSessionsController {
  constructor(private readonly sessionService: CustomerSessionsService) {}

  @Post()
  createSession(@Body() data: any) {
    return this.sessionService.createSession(data);
  }

  @Get('table/:tableId/scan-status')
  getScanStatus(
    @Param('tableId') tableId: string,
    @Query('companyId') companyId?: string,
  ) {
    return this.sessionService.getScanStatus(tableId, companyId);
  }

  @Post(':id/join')
  joinSession(
    @Param('id') sessionId: string,
    @Body() body: {
      displayName?: string;
      participantId?: string;
      phoneNumber?: string;
      deviceId?: string;
    },
  ) {
    return this.sessionService.joinSession(
      sessionId,
      body?.displayName,
      body?.participantId,
      body?.phoneNumber,
      body?.deviceId,
    );
  }

  @Get(':id')
  getSession(@Param('id') id: string) {
    return this.sessionService.getSession(id);
  }

  @Get(':id/payment-status')
  getPaymentStatus(@Param('id') id: string) {
    return this.sessionService.getPaymentStatus(id);
  }

  @Put(':id/activity')
  updateActivity(@Param('id') id: string) {
    return this.sessionService.updateActivity(id);
  }

  @Put(':id/end')
  endSession(@Param('id') id: string) {
    return this.sessionService.endSession(id);
  }

  @Put(':id/move-table')
  moveSessionToTable(
    @Param('id') sessionId: string,
    @Body() body: { tableId: string; currentTableId?: string; companyId?: string },
  ) {
    return this.sessionService.moveSessionToTable(
      sessionId,
      body?.tableId,
      body?.currentTableId,
      body?.companyId,
    );
  }

  @Get('table/:tableId')
  getSessionsByTable(@Param('tableId') tableId: string) {
    return this.sessionService.getActiveSessionsByTable(tableId);
  }

  @Get('phone/:phoneNumber')
  getSessionByPhone(@Param('phoneNumber') phoneNumber: string) {
    return this.sessionService.getActiveSessionByPhone(phoneNumber);
  }

  @Post(':id/end-with-payment')
  endSessionWithPayment(
    @Param('id') id: string,
    @Body() data: { paidBy: string }
  ) {
    return this.sessionService.endSessionOnBillPayment(id, data.paidBy);
  }

  @Post('end-previous')
  endPreviousSessions(@Body() data: { phoneNumber: string; newCompanyId: string }) {
    return this.sessionService.endPreviousSessionsOnNewScan(data.phoneNumber, data.newCompanyId);
  }

  @Post('expire-inactive')
  expireInactiveSessions() {
    return this.sessionService.checkAndExpireInactiveSessions();
  }

  @Post(':id/validate-location')
  validateLocation(
    @Param('id') id: string,
    @Body() data: { lat: number; lng: number }
  ) {
    return this.sessionService.validateSessionLocation(id, data.lat, data.lng);
  }
}
