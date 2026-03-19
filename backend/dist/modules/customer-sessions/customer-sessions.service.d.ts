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
    }): Promise<any>;
    getSession(sessionId: string): Promise<({
        orders: ({
            items: ({
                menuItem: {
                    id: string;
                    name: string;
                    category: string;
                    description: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    companyId: string;
                    price: Prisma.Decimal;
                    imageUrl: string | null;
                    isAvailable: boolean;
                    preparationTime: number | null;
                    isShareable: boolean;
                    maxClaimants: number | null;
                    isBundle: boolean;
                };
            } & {
                id: string;
                createdAt: Date;
                quantity: number;
                status: string;
                menuItemId: string;
                price: Prisma.Decimal;
                isShareable: boolean;
                maxClaimants: number;
                customerOrderId: string;
                specialInstructions: string | null;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            tableId: string;
            status: string;
            total: Prisma.Decimal;
            customerSessionId: string;
            participantId: string | null;
            subtotal: Prisma.Decimal;
            serviceFee: Prisma.Decimal;
            serviceFeePercentage: Prisma.Decimal;
            paymentStatus: string;
        })[];
        table: {
            number: number;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            status: import(".prisma/client").$Enums.TableStatus;
            qrCode: string;
            waiterId: string | null;
        };
        participants: {
            id: string;
            displayName: string;
            isCreator: boolean;
        }[];
    } & {
        id: string;
        companyId: string;
        isActive: boolean;
        tableId: string;
        phoneNumber: string | null;
        customerName: string;
        dietaryPreferences: string[];
        allergies: string[];
        sessionStart: Date;
        sessionEnd: Date | null;
        lastActivity: Date;
        scanLocation: Prisma.JsonValue | null;
        expectedLocation: Prisma.JsonValue | null;
        billPaidBy: string | null;
        billPaidAt: Date | null;
        expiryReason: string | null;
    }) | null>;
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
        tableId: string;
        tableNumber: number;
        companyId: string | null;
        sessionId?: undefined;
        participants?: undefined;
    } | {
        hasActiveSession: boolean;
        sessionId: string;
        tableId: string;
        tableNumber: number;
        companyId: string;
        participants: {
            id: string;
            displayName: string;
            isCreator: boolean;
        }[];
    }>;
    joinSession(sessionId: string, displayName?: string, existingParticipantId?: string, phoneNumber?: string, deviceId?: string): Promise<{
        participant: {
            id: string;
            displayName: string;
            isCreator: boolean;
            customerSessionId: string;
        };
        sessionId: string;
    }>;
    private formatJoinResponse;
    updateActivity(sessionId: string): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        tableId: string;
        phoneNumber: string | null;
        customerName: string;
        dietaryPreferences: string[];
        allergies: string[];
        sessionStart: Date;
        sessionEnd: Date | null;
        lastActivity: Date;
        scanLocation: Prisma.JsonValue | null;
        expectedLocation: Prisma.JsonValue | null;
        billPaidBy: string | null;
        billPaidAt: Date | null;
        expiryReason: string | null;
    }>;
    endSession(sessionId: string): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        tableId: string;
        phoneNumber: string | null;
        customerName: string;
        dietaryPreferences: string[];
        allergies: string[];
        sessionStart: Date;
        sessionEnd: Date | null;
        lastActivity: Date;
        scanLocation: Prisma.JsonValue | null;
        expectedLocation: Prisma.JsonValue | null;
        billPaidBy: string | null;
        billPaidAt: Date | null;
        expiryReason: string | null;
    }>;
    getActiveSessionsByTable(tableId: string): Promise<({
        orders: ({
            items: ({
                menuItem: {
                    id: string;
                    name: string;
                    category: string;
                    description: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    companyId: string;
                    price: Prisma.Decimal;
                    imageUrl: string | null;
                    isAvailable: boolean;
                    preparationTime: number | null;
                    isShareable: boolean;
                    maxClaimants: number | null;
                    isBundle: boolean;
                };
            } & {
                id: string;
                createdAt: Date;
                quantity: number;
                status: string;
                menuItemId: string;
                price: Prisma.Decimal;
                isShareable: boolean;
                maxClaimants: number;
                customerOrderId: string;
                specialInstructions: string | null;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            tableId: string;
            status: string;
            total: Prisma.Decimal;
            customerSessionId: string;
            participantId: string | null;
            subtotal: Prisma.Decimal;
            serviceFee: Prisma.Decimal;
            serviceFeePercentage: Prisma.Decimal;
            paymentStatus: string;
        })[];
    } & {
        id: string;
        companyId: string;
        isActive: boolean;
        tableId: string;
        phoneNumber: string | null;
        customerName: string;
        dietaryPreferences: string[];
        allergies: string[];
        sessionStart: Date;
        sessionEnd: Date | null;
        lastActivity: Date;
        scanLocation: Prisma.JsonValue | null;
        expectedLocation: Prisma.JsonValue | null;
        billPaidBy: string | null;
        billPaidAt: Date | null;
        expiryReason: string | null;
    })[]>;
    getActiveSessionByPhone(phoneNumber: string): Promise<({
        orders: ({
            items: ({
                menuItem: {
                    id: string;
                    name: string;
                    category: string;
                    description: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    companyId: string;
                    price: Prisma.Decimal;
                    imageUrl: string | null;
                    isAvailable: boolean;
                    preparationTime: number | null;
                    isShareable: boolean;
                    maxClaimants: number | null;
                    isBundle: boolean;
                };
            } & {
                id: string;
                createdAt: Date;
                quantity: number;
                status: string;
                menuItemId: string;
                price: Prisma.Decimal;
                isShareable: boolean;
                maxClaimants: number;
                customerOrderId: string;
                specialInstructions: string | null;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            tableId: string;
            status: string;
            total: Prisma.Decimal;
            customerSessionId: string;
            participantId: string | null;
            subtotal: Prisma.Decimal;
            serviceFee: Prisma.Decimal;
            serviceFeePercentage: Prisma.Decimal;
            paymentStatus: string;
        })[];
        table: {
            number: number;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            status: import(".prisma/client").$Enums.TableStatus;
            qrCode: string;
            waiterId: string | null;
        };
    } & {
        id: string;
        companyId: string;
        isActive: boolean;
        tableId: string;
        phoneNumber: string | null;
        customerName: string;
        dietaryPreferences: string[];
        allergies: string[];
        sessionStart: Date;
        sessionEnd: Date | null;
        lastActivity: Date;
        scanLocation: Prisma.JsonValue | null;
        expectedLocation: Prisma.JsonValue | null;
        billPaidBy: string | null;
        billPaidAt: Date | null;
        expiryReason: string | null;
    }) | null>;
    private normalizePhoneNumber;
    validateSessionLocation(sessionId: string, currentLat: number, currentLng: number): Promise<boolean>;
    endPreviousSessionsOnNewScan(phoneNumber: string, newCompanyId: string): Promise<void>;
    endSessionOnBillPayment(sessionId: string, paidBy: string): Promise<void>;
    checkAndExpireInactiveSessions(): Promise<number>;
    private calculateDistance;
}
