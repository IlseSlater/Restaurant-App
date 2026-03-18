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
exports.ItemClaimsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const websocket_gateway_1 = require("../websocket/websocket.gateway");
const BASIS_POINTS = 10000;
let ItemClaimsService = class ItemClaimsService {
    constructor(prisma, webSocketGateway) {
        this.prisma = prisma;
        this.webSocketGateway = webSocketGateway;
    }
    async getClaimsByOrderItem(orderItemId) {
        const item = await this.prisma.customerOrderItem.findUnique({
            where: { id: orderItemId },
            include: {
                claims: { include: { participant: { select: { id: true, displayName: true } } } },
                menuItem: true,
                customerOrder: { select: { customerSessionId: true } },
            },
        });
        if (!item)
            return null;
        const claimantCount = item.claims.length;
        const totalPrice = Number(item.price) * item.quantity;
        const priceEach = claimantCount > 0 ? totalPrice / claimantCount : totalPrice;
        return {
            orderItemId: item.id,
            itemName: item.menuItem?.name ?? 'Item',
            price: Number(item.price),
            quantity: item.quantity,
            totalPrice,
            isShareable: item.isShareable,
            maxClaimants: item.maxClaimants,
            claims: item.claims.map((c) => ({
                participantId: c.participantId,
                displayName: c.participant?.displayName ?? 'Guest',
                percentage: c.percentage,
                isPaid: c.isPaid,
            })),
            claimantCount,
            priceEach,
            sessionId: item.customerOrder?.customerSessionId ?? null,
        };
    }
    async claim(orderItemId, participantId) {
        const item = await this.prisma.customerOrderItem.findUnique({
            where: { id: orderItemId },
            include: {
                claims: true,
                customerOrder: { select: { customerSessionId: true } },
            },
        });
        if (!item)
            throw new Error('Order item not found');
        if (!item.isShareable)
            throw new Error('Item is not shareable');
        if (item.claims.some((c) => c.participantId === participantId)) {
            return this.getClaimsByOrderItem(orderItemId);
        }
        const maxClaimants = item.maxClaimants ?? 4;
        if (item.claims.length >= maxClaimants)
            throw new Error('Fully claimed');
        const sessionId = item.customerOrder?.customerSessionId;
        const participant = await this.prisma.participant.findFirst({
            where: { id: participantId, customerSessionId: sessionId },
        });
        if (!participant)
            throw new Error('Participant not in this session');
        const newCount = item.claims.length + 1;
        const pctEach = Math.floor(BASIS_POINTS / newCount);
        let remainder = BASIS_POINTS - pctEach * newCount;
        await this.prisma.$transaction(async (tx) => {
            for (let i = 0; i < item.claims.length; i++) {
                const extra = remainder > 0 ? 1 : 0;
                if (extra)
                    remainder--;
                await tx.itemClaim.update({
                    where: { id: item.claims[i].id },
                    data: { percentage: pctEach + extra },
                });
            }
            await tx.itemClaim.create({
                data: {
                    participantId,
                    orderItemId,
                    percentage: pctEach + (remainder > 0 ? 1 : 0),
                },
            });
        });
        const updated = await this.getClaimsByOrderItem(orderItemId);
        if (sessionId) {
            this.webSocketGateway.server.to(`customer-${sessionId}`).emit('claim_updated', {
                orderItemId,
                ...updated,
                timestamp: new Date().toISOString(),
            });
        }
        return updated;
    }
    async leave(orderItemId, participantId) {
        const item = await this.prisma.customerOrderItem.findUnique({
            where: { id: orderItemId },
            include: {
                claims: true,
                customerOrder: { select: { customerSessionId: true } },
            },
        });
        if (!item)
            throw new Error('Order item not found');
        const myClaim = item.claims.find((c) => c.participantId === participantId);
        if (!myClaim)
            return this.getClaimsByOrderItem(orderItemId);
        const remaining = item.claims.filter((c) => c.participantId !== participantId);
        await this.prisma.itemClaim.delete({ where: { id: myClaim.id } });
        if (remaining.length > 0) {
            const pctEach = Math.floor(BASIS_POINTS / remaining.length);
            let remainder = BASIS_POINTS - pctEach * remaining.length;
            for (let i = 0; i < remaining.length; i++) {
                const extra = remainder > 0 ? 1 : 0;
                if (extra)
                    remainder--;
                await this.prisma.itemClaim.update({
                    where: { id: remaining[i].id },
                    data: { percentage: pctEach + extra },
                });
            }
        }
        const sessionId = item.customerOrder?.customerSessionId;
        const updated = await this.getClaimsByOrderItem(orderItemId);
        if (sessionId) {
            this.webSocketGateway.server.to(`customer-${sessionId}`).emit('claim_updated', {
                orderItemId,
                ...updated,
                timestamp: new Date().toISOString(),
            });
        }
        return updated;
    }
};
exports.ItemClaimsService = ItemClaimsService;
exports.ItemClaimsService = ItemClaimsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        websocket_gateway_1.RestaurantWebSocketGateway])
], ItemClaimsService);
//# sourceMappingURL=item-claims.service.js.map