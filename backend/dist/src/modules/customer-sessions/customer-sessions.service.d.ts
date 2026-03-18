import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RestaurantWebSocketGateway } from '../websocket/websocket.gateway';
export declare class CustomerSessionsService {
    private prisma;
    private webSocketGateway;
    constructor(prisma: PrismaService, webSocketGateway: RestaurantWebSocketGateway);
    createSession(data: {
        tableId: string;
        customerName: string;
        phoneNumber?: string;
        dietaryPreferences?: string[];
        allergies?: string[];
        companyId?: string;
        scanLocation?: {
            lat: number;
            lng: number;
        };
    }): Promise<$Utils.JsPromise<R>>;
    getSession(sessionId: string): Promise<any>;
    getPaymentStatus(sessionId: string): Promise<{
        participants: {
            participantId: string;
            displayName: string;
            paid: boolean;
            paidBy?: string;
        }[];
    }>;
    getScanStatus(tableId: string, companyId?: string): Promise<{
        hasActiveSession: boolean;
        tableId: any;
        tableNumber: any;
        companyId: any;
        sessionId?: undefined;
        participants?: undefined;
    } | {
        hasActiveSession: boolean;
        sessionId: any;
        tableId: any;
        tableNumber: any;
        companyId: any;
        participants: any;
    }>;
    joinSession(sessionId: string, displayName?: string, existingParticipantId?: string, phoneNumber?: string, deviceId?: string): Promise<{
        participant: $Result.GetResult<Prisma.$ParticipantPayload<ExtArgs>, T, "create">;
        sessionId: string;
    }>;
    private formatJoinResponse;
    updateActivity(sessionId: string): Promise<$Result.GetResult<Prisma.$CustomerSessionPayload<ExtArgs>, T, "update">>;
    endSession(sessionId: string): Promise<$Result.GetResult<Prisma.$CustomerSessionPayload<ExtArgs>, T, "update">>;
    getActiveSessionsByTable(tableId: string): Promise<$Public.PrismaPromise<T>>;
    getActiveSessionByPhone(phoneNumber: string): Promise<any>;
    private normalizePhoneNumber;
    validateSessionLocation(sessionId: string, currentLat: number, currentLng: number): Promise<boolean>;
    endPreviousSessionsOnNewScan(phoneNumber: string, newCompanyId: string): Promise<void>;
    endSessionOnBillPayment(sessionId: string, paidBy: string): Promise<void>;
    checkAndExpireInactiveSessions(): Promise<any>;
    private calculateDistance;
}
