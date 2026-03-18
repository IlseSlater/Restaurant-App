"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TablesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const websocket_gateway_1 = require("../websocket/websocket.gateway");
const customer_sessions_service_1 = require("../customer-sessions/customer-sessions.service");
let TablesService = class TablesService {
    constructor(prisma, webSocketGateway, customerSessionsService) {
        this.prisma = prisma;
        this.webSocketGateway = webSocketGateway;
        this.customerSessionsService = customerSessionsService;
    }
    async getAllTables(companyId) {
        const whereClause = companyId ? { companyId } : {};
        return this.prisma.table.findMany({
            where: whereClause,
            orderBy: { number: 'asc' }
        });
    }
    async getTable(id) {
        return this.prisma.table.findUnique({
            where: { id }
        });
    }
    async getTableByQRCode(qrCode) {
        const table = await this.prisma.table.findUnique({
            where: { qrCode }
        });
        if (!table) {
            throw new Error('Table not found');
        }
        return table;
    }
    async createTable(createDto) {
        const qrCode = createDto.qrCode || `QR-TABLE-${String(createDto.number).padStart(3, '0')}`;
        const companyId = createDto.companyId;
        if (!companyId) {
            throw new Error('companyId is required to create a table');
        }
        const table = await this.prisma.table.create({
            data: {
                number: createDto.number,
                qrCode,
                status: (createDto.status || 'AVAILABLE'),
                companyId,
            }
        });
        this.webSocketGateway.broadcastTableUpdate(table.id, table.status, table.waiterId ?? undefined, table.companyId);
        return table;
    }
    async updateTable(id, updateDto) {
        return this.prisma.table.update({
            where: { id },
            data: updateDto
        });
    }
    async updateTableStatus(id, status) {
        const table = await this.prisma.table.update({
            where: { id },
            data: { status: status }
        });
        this.webSocketGateway.broadcastTableUpdate(table.id, table.status, table.waiterId ?? undefined, table.companyId);
        return table;
    }
    async assignWaiter(tableId, waiterId) {
        const table = await this.prisma.table.update({
            where: { id: tableId },
            data: { waiterId: waiterId ?? undefined }
        });
        const waiter = waiterId
            ? await this.prisma.user.findUnique({ where: { id: waiterId } })
            : null;
        this.webSocketGateway.broadcastWaiterAssignment(tableId, waiterId ?? '', waiter?.name || 'Unknown Waiter', table.companyId);
        return table;
    }
    async deleteTable(id) {
        return this.prisma.table.delete({
            where: { id }
        });
    }
    async clearTable(tableId, force = false) {
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
                return sum + order.items.filter((item) => ['PENDING', 'PREPARING', 'NEW'].includes(item.status)).length;
            }, 0);
            if (activeItemCount > 0 && !force) {
                throw new common_1.ConflictException({
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
        this.webSocketGateway.broadcastTableUpdate(updatedTable.id, updatedTable.status, updatedTable.waiterId ?? undefined, updatedTable.companyId);
        return { table: updatedTable, sessionEnded: !!activeSession };
    }
    async generateQRData(companyId, tableId) {
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
            qrCodeData: scanUrl,
            timestamp: new Date().toISOString()
        };
        return qrData;
    }
    async generateAllQRDataForCompany(companyId) {
        const tables = await this.prisma.table.findMany({
            where: { companyId }
        });
        const qrDataArray = await Promise.all(tables.map(table => this.generateQRData(companyId, table.id)));
        return qrDataArray;
    }
};
exports.TablesService = TablesService;
exports.TablesService = TablesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        websocket_gateway_1.RestaurantWebSocketGateway,
        customer_sessions_service_1.CustomerSessionsService])
], TablesService);
//# sourceMappingURL=tables.service.js.map