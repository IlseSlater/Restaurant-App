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
exports.CustomerSessionsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const websocket_gateway_1 = require("../websocket/websocket.gateway");
const GUEST_DISPLAY_NAMES = [
    'Blue Bear', 'Green Goat', 'Red Fox', 'Yellow Bee', 'Purple Cat',
    'Orange Owl', 'Teal Duck', 'Pink Swan', 'Coral Crab', 'Navy Wolf',
];
let CustomerSessionsService = class CustomerSessionsService {
    constructor(prisma, webSocketGateway) {
        this.prisma = prisma;
        this.webSocketGateway = webSocketGateway;
    }
    async createSession(data) {
        const normalizedData = {
            ...data,
            phoneNumber: data.phoneNumber ? this.normalizePhoneNumber(data.phoneNumber) : undefined,
        };
        let expectedLocation = null;
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
            return await this.prisma.$transaction(async (tx) => {
                const existing = await tx.customerSession.findFirst({
                    where: { tableId: data.tableId, isActive: true },
                });
                if (existing) {
                    throw new common_1.ConflictException('Table already has an active session. Join instead?');
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
            }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
        }
        catch (err) {
            if (err instanceof common_1.ConflictException)
                throw err;
            if (err && typeof err === 'object' && 'code' in err && err.code === 'P2034') {
                throw new common_1.ConflictException('Table already has an active session. Join instead?');
            }
            throw err;
        }
    }
    async getSession(sessionId) {
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
    async getPaymentStatus(sessionId) {
        const session = await this.prisma.customerSession.findUnique({
            where: { id: sessionId },
            select: { participants: { select: { id: true, displayName: true } } },
        });
        if (!session)
            return { participants: [] };
        const paidPayments = await this.prisma.payment.findMany({
            where: {
                status: 'PAID',
                metadata: { path: ['customerSessionId'], equals: sessionId },
            },
            include: { splits: { where: { status: 'PAID' }, select: { participantId: true, payerName: true } } },
        });
        const paidByMap = new Map();
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
    async getScanStatus(tableId, companyId) {
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
    async joinSession(sessionId, displayName, existingParticipantId, phoneNumber, deviceId) {
        const session = await this.prisma.customerSession.findUnique({
            where: { id: sessionId },
            select: { id: true, isActive: true },
        });
        if (!session || !session.isActive) {
            throw new common_1.NotFoundException('Session not found or no longer active');
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
        const name = displayName?.trim() ||
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
    formatJoinResponse(participant, sessionId) {
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
    async updateActivity(sessionId) {
        return this.prisma.customerSession.update({
            where: { id: sessionId },
            data: { lastActivity: new Date() },
        });
    }
    async endSession(sessionId) {
        const session = await this.prisma.customerSession.update({
            where: { id: sessionId },
            data: { isActive: false },
        });
        await this.webSocketGateway.notifySessionEnded(sessionId);
        return session;
    }
    async getActiveSessionsByTable(tableId) {
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
    async getActiveSessionByPhone(phoneNumber) {
        const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
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
    normalizePhoneNumber(phoneNumber) {
        let cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
        if (cleaned.startsWith('0')) {
            cleaned = '+27' + cleaned.substring(1);
        }
        else if (cleaned.startsWith('27') && !cleaned.startsWith('+27')) {
            cleaned = '+' + cleaned;
        }
        else if (!cleaned.startsWith('+')) {
            cleaned = '+27' + cleaned;
        }
        return cleaned;
    }
    async validateSessionLocation(sessionId, currentLat, currentLng) {
        const session = await this.prisma.customerSession.findUnique({
            where: { id: sessionId },
            include: { company: true }
        });
        if (!session?.company.latitude || !session?.company.longitude) {
            return true;
        }
        const distance = this.calculateDistance(currentLat, currentLng, Number(session.company.latitude), Number(session.company.longitude));
        const maxDistance = session.company.locationRadius || 100;
        return distance <= maxDistance;
    }
    async endPreviousSessionsOnNewScan(phoneNumber, newCompanyId) {
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
    async endSessionOnBillPayment(sessionId, paidBy) {
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
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3;
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
};
exports.CustomerSessionsService = CustomerSessionsService;
exports.CustomerSessionsService = CustomerSessionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        websocket_gateway_1.RestaurantWebSocketGateway])
], CustomerSessionsService);
//# sourceMappingURL=customer-sessions.service.js.map