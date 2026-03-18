import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RestaurantWebSocketGateway } from '../websocket/websocket.gateway';
import { CustomerSessionsService } from '../customer-sessions/customer-sessions.service';

@Injectable()
export class TablesService {
  constructor(
    private prisma: PrismaService,
    private webSocketGateway: RestaurantWebSocketGateway,
    private customerSessionsService: CustomerSessionsService,
  ) {}

  async getAllTables(companyId?: string) {
    const whereClause: any = companyId ? { companyId } : {};
    
    return this.prisma.table.findMany({
      where: whereClause,
      orderBy: { number: 'asc' }
    });
  }

  async getTable(id: string) {
    return this.prisma.table.findUnique({
      where: { id }
    });
  }

  async getTableByQRCode(qrCode: string) {
    const table = await this.prisma.table.findUnique({
      where: { qrCode }
    });

    if (!table) {
      throw new Error('Table not found');
    }

    return table;
  }

  async createTable(createDto: { number: number; qrCode?: string; companyId?: string; status?: string }) {
    const qrCode = createDto.qrCode || `QR-TABLE-${String(createDto.number).padStart(3, '0')}`;
    
    const companyId = createDto.companyId;
    if (!companyId) {
      throw new Error('companyId is required to create a table');
    }
    const table = await this.prisma.table.create({
      data: {
        number: createDto.number,
        qrCode,
        status: (createDto.status || 'AVAILABLE') as import('@prisma/client').TableStatus,
        companyId,
      }
    });

    this.webSocketGateway.broadcastTableUpdate(table.id, table.status, table.waiterId ?? undefined, table.companyId);

    return table;
  }

  async updateTable(id: string, updateDto: any) {
    return this.prisma.table.update({
      where: { id },
      data: updateDto
    });
  }

  async updateTableStatus(id: string, status: string) {
    const table = await this.prisma.table.update({
      where: { id },
      data: { status: status as import('@prisma/client').TableStatus }
    });

    this.webSocketGateway.broadcastTableUpdate(table.id, table.status, table.waiterId ?? undefined, table.companyId);

    return table;
  }

  async assignWaiter(tableId: string, waiterId: string | null) {
    const table = await this.prisma.table.update({
      where: { id: tableId },
      data: { waiterId: waiterId ?? undefined }
    });

    const waiter = waiterId
      ? await this.prisma.user.findUnique({ where: { id: waiterId } })
      : null;

    this.webSocketGateway.broadcastWaiterAssignment(
      tableId,
      waiterId ?? '',
      waiter?.name || 'Unknown Waiter',
      table.companyId
    );

    return table;
  }

  async deleteTable(id: string) {
    return this.prisma.table.delete({
      where: { id }
    });
  }

  /**
   * Clear & close table: end the active CustomerSession (if any) and set table to AVAILABLE.
   * Triggers notifySessionEnded so the customer PWA is kicked off and Bar/Kitchen stop showing that table.
   * Safety: if there are Pending or Preparing items and force is false, returns 409 so the waiter can confirm "Clear anyway?"
   */
  async clearTable(tableId: string, force = false): Promise<{ table: any; sessionEnded: boolean }> {
    const table = await this.prisma.table.findUnique({ where: { id: tableId } });
    if (!table) {
      throw new Error('Table not found');
    }

    const activeSession = await this.prisma.customerSession.findFirst({
      where: { tableId: tableId, isActive: true },
      include: {
        orders: {
          include: {
            items: true,
          },
        },
      },
    });

    if (activeSession) {
      const activeItemCount = activeSession.orders.reduce((sum, order) => {
        return sum + (order.items as any[]).filter(
          (item: any) => ['PENDING', 'PREPARING', 'NEW'].includes(item.status),
        ).length;
      }, 0);

      if (activeItemCount > 0 && !force) {
        throw new ConflictException({
          code: 'ACTIVE_ITEMS',
          message: 'There are still active items (pending or preparing) for this table. Clear anyway?',
          activeItemCount,
        });
      }

      await this.customerSessionsService.endSession(activeSession.id);
    }

    const updatedTable = await this.prisma.table.update({
      where: { id: tableId },
      data: { status: 'AVAILABLE' },
    });

    this.webSocketGateway.broadcastTableUpdate(
      updatedTable.id,
      updatedTable.status,
      updatedTable.waiterId ?? undefined,
      updatedTable.companyId,
    );

    return { table: updatedTable, sessionEnded: !!activeSession };
  }

  async generateQRData(companyId: string, tableId: string) {
    // Get company and table info
    const [company, table] = await Promise.all([
      this.prisma.company.findUnique({ where: { id: companyId } }),
      this.prisma.table.findUnique({ where: { id: tableId } })
    ]);

    if (!company) {
      throw new Error('Company not found');
    }
    if (!table) {
      throw new Error('Table not found');
    }

    // Build QR data with company GUID, table info, and expected location
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    const scanUrl = `${frontendUrl}/customer/scan-table?company=${company.id}&restaurant=${company.slug}&table=${table.number}`;
    
    const qrData = {
      companyId: company.id,
      companyGuid: company.id,
      companyName: company.name,
      companySlug: company.slug,
      tableId: table.id,
      tableNumber: table.number,
      expectedLocation: company.latitude && company.longitude ? {
        lat: Number(company.latitude),
        lng: Number(company.longitude),
        radius: company.locationRadius || 100
      } : null,
      scanUrl: scanUrl,
      qrCodeData: scanUrl, // This is what gets encoded in the QR code
      timestamp: new Date().toISOString()
    };

    return qrData;
  }

  async generateAllQRDataForCompany(companyId: string) {
    // Get all tables for this company
    const tables = await this.prisma.table.findMany({
      where: { companyId }
    });

    const qrDataArray = await Promise.all(
      tables.map(table => this.generateQRData(companyId, table.id))
    );

    return qrDataArray;
  }
}
