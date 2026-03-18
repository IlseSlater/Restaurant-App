import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RestaurantWebSocketGateway } from '../websocket/websocket.gateway';

/** Color + Animal for joiners: distinct, short, and Waiter UI can use color-coded seat icons. */
const GUEST_DISPLAY_NAMES = [
  'Blue Bear', 'Green Goat', 'Red Fox', 'Yellow Bee', 'Purple Cat',
  'Orange Owl', 'Teal Duck', 'Pink Swan', 'Coral Crab', 'Navy Wolf',
];

@Injectable()
export class CustomerSessionsService {
  constructor(
    private prisma: PrismaService,
    private webSocketGateway: RestaurantWebSocketGateway,
  ) {}

  /**
   * Create a new session (first person at table). Uses a serializable transaction so that
   * if 4 people scan at once, only one becomes Creator; others get 409 and can use Join.
   */
  async createSession(data: {
    tableId: string;
    customerName: string;
    phoneNumber?: string;
    dietaryPreferences?: string[];
    allergies?: string[];
    companyId?: string;
    scanLocation?: { lat: number; lng: number };
  }) {
    const normalizedData = {
      ...data,
      phoneNumber: data.phoneNumber ? this.normalizePhoneNumber(data.phoneNumber) : undefined,
    };

    let expectedLocation: object | null = null;
    if (data.companyId) {
      const company = await this.prisma.company.findUnique({
        where: { id: data.companyId },
      });
      if (company && company.latitude && company.longitude) {
        expectedLocation = {
          lat: Number(company.latitude),
          lng: Number(company.longitude),
        };
      }
    }

    try {
      return await this.prisma.$transaction(
        async (tx: any) => {
          const existing = await tx.customerSession.findFirst({
            where: { tableId: data.tableId, isActive: true },
          });
          if (existing) {
            throw new ConflictException(
              'Table already has an active session. Join instead?',
            );
          }

          const companyId = normalizedData.companyId ?? data.companyId;
          if (!companyId) {
            throw new Error('companyId is required to create a customer session');
          }
          const session = await tx.customerSession.create({
            data: {
              tableId: normalizedData.tableId,
              customerName: normalizedData.customerName,
              phoneNumber: normalizedData.phoneNumber,
              companyId,
              dietaryPreferences: normalizedData.dietaryPreferences ?? [],
              allergies: normalizedData.allergies ?? [],
              isActive: true,
              sessionStart: new Date(),
              lastActivity: new Date(),
              scanLocation: data.scanLocation ?? undefined,
              expectedLocation: expectedLocation ?? undefined,
            },
            include: { table: true },
          });

          const participant = await tx.participant.create({
            data: {
              customerSessionId: session.id,
              displayName: data.customerName,
              isCreator: true,
            },
          });

          return tx.customerSession.findUnique({
            where: { id: session.id },
            include: { table: true, participants: true },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (err: unknown) {
      if (err instanceof ConflictException) throw err;
      if (err && typeof err === 'object' && 'code' in err && err.code === 'P2034') {
        throw new ConflictException(
          'Table already has an active session. Join instead?',
        );
      }
      throw err;
    }
  }

  async getSession(sessionId: string) {
    return this.prisma.customerSession.findUnique({
      where: { id: sessionId },
      include: {
        table: true,
        participants: { select: { id: true, displayName: true, isCreator: true } },
        orders: {
          include: {
            items: {
              include: {
                menuItem: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Payment status per participant for a session (for Waiter "paid" seat map).
   * Returns which participants have been paid and by whom.
   */
  async getPaymentStatus(sessionId: string): Promise<{ participants: { participantId: string; displayName: string; paid: boolean; paidBy?: string }[] }> {
    const session = await this.prisma.customerSession.findUnique({
      where: { id: sessionId },
      select: { participants: { select: { id: true, displayName: true } } },
    });
    if (!session) return { participants: [] };

    const paidPayments = await this.prisma.payment.findMany({
      where: {
        status: 'PAID',
        metadata: { path: ['customerSessionId'], equals: sessionId },
      },
      include: { splits: { where: { status: 'PAID' }, select: { participantId: true, payerName: true } } },
    });

    const paidByMap = new Map<string, string>();
    for (const payment of paidPayments) {
      for (const split of payment.splits) {
        if (split.participantId && split.payerName) {
          paidByMap.set(split.participantId, split.payerName);
        }
      }
    }

    const participants = session.participants.map((p) => ({
      participantId: p.id,
      displayName: p.displayName,
      paid: paidByMap.has(p.id),
      paidBy: paidByMap.get(p.id),
    }));

    return { participants };
  }

  /**
   * Scan-check: one active session per table. Used by PWA after QR scan to decide Start vs Join.
   */
  async getScanStatus(tableId: string, companyId?: string) {
    const table = await this.prisma.table.findUnique({
      where: { id: tableId },
      select: { id: true, number: true, companyId: true },
    });
    if (!table) {
      return { hasActiveSession: false, tableId, tableNumber: 0, companyId: companyId ?? null };
    }
    const active = await this.prisma.customerSession.findFirst({
      where: { tableId, isActive: true },
      include: {
        participants: { select: { id: true, displayName: true, isCreator: true } },
      },
    });
    if (!active) {
      return {
        hasActiveSession: false,
        tableId: table.id,
        tableNumber: table.number,
        companyId: companyId ?? table.companyId,
      };
    }
    return {
      hasActiveSession: true,
      sessionId: active.id,
      tableId: table.id,
      tableNumber: table.number,
      companyId: companyId ?? table.companyId,
      participants: active.participants,
    };
  }

  /**
   * Join an existing table session. Idempotent by participantId, phoneNumber, or deviceId:
   * if the client sends any of these and a participant in this session already has it, return
   * that participant (no "Hungry Hippo 2" or ghost participants). Otherwise assign color+animal
   * name and emit participant_joined.
   */
  async joinSession(
    sessionId: string,
    displayName?: string,
    existingParticipantId?: string,
    phoneNumber?: string,
    deviceId?: string,
  ) {
    const session = await this.prisma.customerSession.findUnique({
      where: { id: sessionId },
      select: { id: true, isActive: true },
    });
    if (!session || !session.isActive) {
      throw new NotFoundException('Session not found or no longer active');
    }

    const sessionScope = { customerSessionId: sessionId };

    if (existingParticipantId?.trim()) {
      const existing = await this.prisma.participant.findFirst({
        where: { id: existingParticipantId.trim(), ...sessionScope },
      });
      if (existing) {
        return this.formatJoinResponse(existing, sessionId);
      }
    }

    if (phoneNumber?.trim()) {
      const normalized = this.normalizePhoneNumber(phoneNumber.trim());
      const existing = await this.prisma.participant.findFirst({
        where: { ...sessionScope, phoneNumber: normalized },
      });
      if (existing) {
        return this.formatJoinResponse(existing, sessionId);
      }
    }

    if (deviceId?.trim()) {
      const existing = await this.prisma.participant.findFirst({
        where: { ...sessionScope, deviceId: deviceId.trim() },
      });
      if (existing) {
        return this.formatJoinResponse(existing, sessionId);
      }
    }

    const count = await this.prisma.participant.count({
      where: sessionScope,
    });
    const name =
      displayName?.trim() ||
      (count < GUEST_DISPLAY_NAMES.length
        ? GUEST_DISPLAY_NAMES[count]
        : `Guest ${count + 1}`);
    const participant = await this.prisma.participant.create({
      data: {
        customerSessionId: sessionId,
        displayName: name,
        isCreator: false,
        phoneNumber: phoneNumber?.trim() ? this.normalizePhoneNumber(phoneNumber.trim()) : null,
        deviceId: deviceId?.trim() || null,
      },
    });
    this.webSocketGateway.notifyParticipantJoined(sessionId, {
      id: participant.id,
      displayName: participant.displayName,
      isCreator: participant.isCreator,
    });
    return { participant, sessionId };
  }

  private formatJoinResponse(participant: { id: string; displayName: string; isCreator: boolean; customerSessionId: string }, sessionId: string) {
    return {
      participant: {
        id: participant.id,
        displayName: participant.displayName,
        isCreator: participant.isCreator,
        customerSessionId: participant.customerSessionId,
      },
      sessionId,
    };
  }

  async updateActivity(sessionId: string) {
    return this.prisma.customerSession.update({
      where: { id: sessionId },
      data: { lastActivity: new Date() },
    });
  }

  async endSession(sessionId: string) {
    const session = await this.prisma.customerSession.update({
      where: { id: sessionId },
      data: { isActive: false },
    });
    await this.webSocketGateway.notifySessionEnded(sessionId);
    return session;
  }

  async getActiveSessionsByTable(tableId: string) {
    return this.prisma.customerSession.findMany({
      where: {
        tableId,
        isActive: true,
      },
      include: {
        orders: {
          include: {
            items: {
              include: {
                menuItem: true,
              },
            },
          },
        },
      },
    });
  }

  async getActiveSessionByPhone(phoneNumber: string) {
    // Normalize phone number to handle both formats
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    
    // Find the most recent active session for this phone number
    const sessions = await this.prisma.customerSession.findMany({
      where: {
        phoneNumber: normalizedPhone,
        isActive: true,
      },
      orderBy: {
        lastActivity: 'desc',
      },
      take: 1,
      include: {
        table: true,
        orders: {
          include: {
            items: {
              include: {
                menuItem: true,
              },
            },
          },
        },
      },
    });

    return sessions.length > 0 ? sessions[0] : null;
  }

  private normalizePhoneNumber(phoneNumber: string): string {
    // Remove all spaces, dashes, and parentheses
    let cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Handle South African phone numbers
    if (cleaned.startsWith('0')) {
      // Convert 0XXXXXXXXX to +27XXXXXXXXX
      cleaned = '+27' + cleaned.substring(1);
    } else if (cleaned.startsWith('27') && !cleaned.startsWith('+27')) {
      // Convert 27XXXXXXXXX to +27XXXXXXXXX
      cleaned = '+' + cleaned;
    } else if (!cleaned.startsWith('+')) {
      // If it doesn't start with +, assume it's a local number and add +27
      cleaned = '+27' + cleaned;
    }
    
    return cleaned;
  }

  // Location validation
  async validateSessionLocation(
    sessionId: string, 
    currentLat: number, 
    currentLng: number
  ): Promise<boolean> {
    const session = await this.prisma.customerSession.findUnique({
      where: { id: sessionId },
      include: { company: true }
    });
    
    if (!session?.company.latitude || !session?.company.longitude) {
      return true; // Skip validation if location not set
    }
    
    const distance = this.calculateDistance(
      currentLat, currentLng,
      Number(session.company.latitude), 
      Number(session.company.longitude)
    );
    
    const maxDistance = session.company.locationRadius || 100; // meters
    return distance <= maxDistance;
  }

  // End previous sessions when scanning new QR code
  async endPreviousSessionsOnNewScan(phoneNumber: string, newCompanyId: string) {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

    const toEnd = await this.prisma.customerSession.findMany({
      where: {
        phoneNumber: normalizedPhone,
        isActive: true,
        companyId: { not: newCompanyId }
      },
      select: { id: true },
    });

    await this.prisma.customerSession.updateMany({
      where: {
        phoneNumber: normalizedPhone,
        isActive: true,
        companyId: { not: newCompanyId }
      },
      data: {
        isActive: false,
        sessionEnd: new Date(),
        expiryReason: 'NEW_SCAN'
      }
    });

    for (const { id } of toEnd) {
      await this.webSocketGateway.notifySessionEnded(id, 'NEW_SCAN');
    }
  }

  // End session when bill is paid
  async endSessionOnBillPayment(sessionId: string, paidBy: string) {
    // End session when waiter marks bill as paid
    await this.prisma.customerSession.update({
      where: { id: sessionId },
      data: {
        isActive: false,
        sessionEnd: new Date(),
        billPaidBy: paidBy,
        billPaidAt: new Date(),
        expiryReason: 'BILL_PAID'
      }
    });
    await this.webSocketGateway.notifySessionEnded(sessionId, 'BILL_PAID');

    // Also update all associated orders to mark them as completed
    await this.prisma.customerOrder.updateMany({
      where: {
        customerSessionId: sessionId,
        paymentStatus: 'PENDING'
      },
      data: {
        paymentStatus: 'PAID',
        status: 'COMPLETED'
      }
    });
  }

  /**
   * Expire sessions with no activity for the threshold period.
   * Uses lastActivity (not sessionStart) so guests on a long dinner (e.g. 3 hours)
   * are not kicked out while still eating—only sessions with no recent activity
   * (orders, menu views, etc.) are expired.
   */
  async checkAndExpireInactiveSessions() {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const toExpire = await this.prisma.customerSession.findMany({
      where: {
        isActive: true,
        lastActivity: { lt: twoHoursAgo },
      },
      select: { id: true },
    });

    const result = await this.prisma.customerSession.updateMany({
      where: {
        isActive: true,
        lastActivity: { lt: twoHoursAgo },
      },
      data: {
        isActive: false,
        sessionEnd: new Date(),
        expiryReason: 'INACTIVITY'
      }
    });

    for (const { id } of toExpire) {
      await this.webSocketGateway.notifySessionEnded(id, 'INACTIVITY');
    }

    console.log(`Expired ${result.count} inactive sessions`);
    return result.count;
  }

  // Calculate distance between two coordinates using Haversine formula
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }
}
