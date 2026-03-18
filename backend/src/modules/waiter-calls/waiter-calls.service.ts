import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RestaurantWebSocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class WaiterCallsService {
  constructor(
    private prisma: PrismaService,
    private webSocketGateway: RestaurantWebSocketGateway,
  ) {}

  async createCall(data: {
    tableId: string;
    customerSessionId: string;
    callType: string; // e.g. 'WAITER' or 'MANAGER'
    message?: string;
    companyId?: string;
  }) {
    let companyId = data.companyId;
    if (!companyId) {
      const table = await this.prisma.table.findUnique({ where: { id: data.tableId }, select: { companyId: true } });
      companyId = table?.companyId;
    }
    if (!companyId) {
      throw new Error('companyId required for waiter call (provide or use a table with companyId)');
    }
    const normalizedType = (data.callType || 'WAITER').toUpperCase();

    const call = await this.prisma.waiterCall.create({
      data: {
        companyId,
        tableId: data.tableId,
        customerSessionId: data.customerSessionId,
        callType: normalizedType,
        message: data.message,
        status: 'PENDING',
      },
      include: {
        table: true,
        customerSession: true,
      },
    });

    const customerName = (call as any).customerSession?.customerName;
    const tableNumber = (call as any).table?.number;

    // Waiter requests go to waiter dashboard only; manager requests go to manager only
    if (normalizedType === 'WAITER') {
      this.webSocketGateway.server.to('waiter').emit('waiter_call_created', {
        call,
        customerName,
        tableNumber,
      });
      this.webSocketGateway.emitToCompany(companyId, 'waiters', 'waiter_call_created', {
        call,
        customerName,
        tableNumber,
      });
    } else if (normalizedType === 'MANAGER') {
      this.webSocketGateway.emitToCompany(companyId, 'manager', 'manager_call_created', {
        call,
        customerName,
        tableNumber,
      });
    }

    return call;
  }

  async acknowledgeCall(callId: string, acknowledgedBy: string) {
    const call = await this.prisma.waiterCall.update({
      where: { id: callId },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedBy,
        acknowledgedAt: new Date(),
      },
      include: {
        customerSession: true,
        table: true,
      },
    });

    // Notify customer
    this.webSocketGateway.server
      .to(`customer-${call.customerSessionId}`)
      .emit('waiter_call_acknowledged', {
        callId: call.id,
        acknowledgedBy: call.acknowledgedBy,
        timestamp: call.acknowledgedAt,
      });

    // If this is a manager-level escalation, also emit a dedicated manager event
    if ((call as any).callType?.toUpperCase() === 'MANAGER') {
      const companyId = (call as any).companyId;
      const tableNumber = (call as any).table?.number;

      this.webSocketGateway.emitToCompany(companyId, 'manager', 'manager_call_acknowledged', {
        callId: call.id,
        acknowledgedBy: call.acknowledgedBy,
        tableId: call.tableId,
        tableNumber,
        timestamp: call.acknowledgedAt,
      });

      // Let the customer know explicitly that the manager (not just any waiter) is on the way
      this.webSocketGateway.server
        .to(`customer-${call.customerSessionId}`)
        .emit('manager_call_acknowledged', {
          callId: call.id,
          acknowledgedBy: call.acknowledgedBy,
          timestamp: call.acknowledgedAt,
        });
    }

    return call;
  }

  async resolveCall(callId: string) {
    const call = await this.prisma.waiterCall.update({
      where: { id: callId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
      include: {
        customerSession: true,
        table: true,
      },
    });

    const companyId = (call as any).companyId;
    const callType = ((call as any).callType || 'WAITER').toUpperCase();

    // Notify customer so they clear the pending request from the help sheet
    this.webSocketGateway.server
      .to(`customer-${call.customerSessionId}`)
      .emit('waiter_call_resolved', {
        callId: call.id,
        customerSessionId: call.customerSessionId,
        timestamp: call.resolvedAt,
      });

    // Notify waiters so they remove the call from their list
    this.webSocketGateway.server.to('waiter').emit('waiter_call_resolved', {
      callId: call.id,
      timestamp: call.resolvedAt,
    });
    if (companyId) {
      this.webSocketGateway.emitToCompany(companyId, 'waiters', 'waiter_call_resolved', {
        callId: call.id,
        timestamp: call.resolvedAt,
      });
    }

    // Notify manager if this was a manager escalation so it is removed from their view
    if (callType === 'MANAGER' && companyId) {
      this.webSocketGateway.emitToCompany(companyId, 'manager', 'manager_call_resolved', {
        callId: call.id,
        timestamp: call.resolvedAt,
      });
    }

    return call;
  }

  async getCallsByTable(tableId: string) {
    return this.prisma.waiterCall.findMany({
      where: { tableId },
      include: {
        customerSession: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingCalls(companyId?: string, type?: string) {
    return this.prisma.waiterCall.findMany({
      where: {
        // Treat any non-resolved call as \"pending\" for dashboards
        status: {
          not: 'RESOLVED',
        },
        ...(companyId ? { companyId } : {}),
        ...(type ? { callType: type.toUpperCase() } : {}),
      },
      include: {
        table: true,
        customerSession: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
