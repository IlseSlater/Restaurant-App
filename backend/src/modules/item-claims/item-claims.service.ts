import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RestaurantWebSocketGateway } from '../websocket/websocket.gateway';

const BASIS_POINTS = 10000;

@Injectable()
export class ItemClaimsService {
  constructor(
    private prisma: PrismaService,
    private webSocketGateway: RestaurantWebSocketGateway,
  ) {}

  /**
   * Get claims for an order item (for feed toggle and cost-per-person).
   */
  async getClaimsByOrderItem(orderItemId: string) {
    const item = await this.prisma.customerOrderItem.findUnique({
      where: { id: orderItemId },
      include: {
        claims: { include: { participant: { select: { id: true, displayName: true } } } },
        menuItem: true,
        customerOrder: { select: { customerSessionId: true } },
      },
    });
    if (!item) return null;
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

  /**
   * Join a shareable item: add participant and redistribute percentages (basis points).
   */
  async claim(orderItemId: string, participantId: string) {
    const item = await this.prisma.customerOrderItem.findUnique({
      where: { id: orderItemId },
      include: {
        claims: true,
        customerOrder: { select: { customerSessionId: true } },
      },
    });
    if (!item) throw new Error('Order item not found');
    if (!item.isShareable) throw new Error('Item is not shareable');
    if (item.claims.some((c) => c.participantId === participantId)) {
      return this.getClaimsByOrderItem(orderItemId);
    }
    const maxClaimants = item.maxClaimants ?? 4;
    if (item.claims.length >= maxClaimants) throw new Error('Fully claimed');

    const sessionId = item.customerOrder?.customerSessionId;
    const participant = await this.prisma.participant.findFirst({
      where: { id: participantId, customerSessionId: sessionId! },
    });
    if (!participant) throw new Error('Participant not in this session');

    const newCount = item.claims.length + 1;
    const pctEach = Math.floor(BASIS_POINTS / newCount);
    let remainder = BASIS_POINTS - pctEach * newCount;

    await this.prisma.$transaction(async (tx: any) => {
      for (let i = 0; i < item.claims.length; i++) {
        const extra = remainder > 0 ? 1 : 0;
        if (extra) remainder--;
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

  /**
   * Leave a shareable item: remove participant's claim and redistribute to others.
   */
  async leave(orderItemId: string, participantId: string) {
    const item = await this.prisma.customerOrderItem.findUnique({
      where: { id: orderItemId },
      include: {
        claims: true,
        customerOrder: { select: { customerSessionId: true } },
      },
    });
    if (!item) throw new Error('Order item not found');

    const myClaim = item.claims.find((c) => c.participantId === participantId);
    if (!myClaim) return this.getClaimsByOrderItem(orderItemId);

    const remaining = item.claims.filter((c) => c.participantId !== participantId);
    await this.prisma.itemClaim.delete({ where: { id: myClaim.id } });

    if (remaining.length > 0) {
      const pctEach = Math.floor(BASIS_POINTS / remaining.length);
      let remainder = BASIS_POINTS - pctEach * remaining.length;
      for (let i = 0; i < remaining.length; i++) {
        const extra = remainder > 0 ? 1 : 0;
        if (extra) remainder--;
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
}
