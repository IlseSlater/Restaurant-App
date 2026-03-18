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
exports.WaiterCallsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const websocket_gateway_1 = require("../websocket/websocket.gateway");
let WaiterCallsService = class WaiterCallsService {
    constructor(prisma, webSocketGateway) {
        this.prisma = prisma;
        this.webSocketGateway = webSocketGateway;
    }
    async createCall(data) {
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
        const customerName = call.customerSession?.customerName;
        const tableNumber = call.table?.number;
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
        }
        else if (normalizedType === 'MANAGER') {
            this.webSocketGateway.emitToCompany(companyId, 'manager', 'manager_call_created', {
                call,
                customerName,
                tableNumber,
            });
        }
        return call;
    }
    async acknowledgeCall(callId, acknowledgedBy) {
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
        this.webSocketGateway.server
            .to(`customer-${call.customerSessionId}`)
            .emit('waiter_call_acknowledged', {
            callId: call.id,
            acknowledgedBy: call.acknowledgedBy,
            timestamp: call.acknowledgedAt,
        });
        if (call.callType?.toUpperCase() === 'MANAGER') {
            const companyId = call.companyId;
            const tableNumber = call.table?.number;
            this.webSocketGateway.emitToCompany(companyId, 'manager', 'manager_call_acknowledged', {
                callId: call.id,
                acknowledgedBy: call.acknowledgedBy,
                tableId: call.tableId,
                tableNumber,
                timestamp: call.acknowledgedAt,
            });
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
    async resolveCall(callId) {
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
        const companyId = call.companyId;
        const callType = (call.callType || 'WAITER').toUpperCase();
        this.webSocketGateway.server
            .to(`customer-${call.customerSessionId}`)
            .emit('waiter_call_resolved', {
            callId: call.id,
            customerSessionId: call.customerSessionId,
            timestamp: call.resolvedAt,
        });
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
        if (callType === 'MANAGER' && companyId) {
            this.webSocketGateway.emitToCompany(companyId, 'manager', 'manager_call_resolved', {
                callId: call.id,
                timestamp: call.resolvedAt,
            });
        }
        return call;
    }
    async getCallsByTable(tableId) {
        return this.prisma.waiterCall.findMany({
            where: { tableId },
            include: {
                customerSession: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getPendingCalls(companyId, type) {
        return this.prisma.waiterCall.findMany({
            where: {
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
};
exports.WaiterCallsService = WaiterCallsService;
exports.WaiterCallsService = WaiterCallsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        websocket_gateway_1.RestaurantWebSocketGateway])
], WaiterCallsService);
//# sourceMappingURL=waiter-calls.service.js.map