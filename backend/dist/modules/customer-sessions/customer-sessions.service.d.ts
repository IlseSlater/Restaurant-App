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
        table: {
            number: number;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            qrCode: string;
            status: import(".prisma/client").$Enums.TableStatus;
            waiterId: string | null;
        };
        orders: ({
            items: ({
                menuItem: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    companyId: string;
                    price: Prisma.Decimal;
                    isShareable: boolean;
                    maxClaimants: number | null;
                    description: string | null;
                    category: string;
                    imageUrl: string | null;
                    isAvailable: boolean;
                    preparationTime: number | null;
                    isBundle: boolean;
                };
            } & {
                id: string;
                createdAt: Date;
                status: string;
                customerOrderId: string;
                menuItemId: string;
                quantity: number;
                specialInstructions: string | null;
                price: Prisma.Decimal;
                isShareable: boolean;
                maxClaimants: number;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            tableId: string;
            customerSessionId: string;
            status: string;
            participantId: string | null;
            subtotal: Prisma.Decimal;
            serviceFee: Prisma.Decimal;
            serviceFeePercentage: Prisma.Decimal;
            total: Prisma.Decimal;
            paymentStatus: string;
        })[];
        participants: {
            id: string;
            displayName: string;
            isCreator: boolean;
        }[];
    } & {
        id: string;
        isActive: boolean;
        companyId: string;
        tableId: string;
        customerName: string;
        phoneNumber: string | null;
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
        isActive: boolean;
        companyId: string;
        tableId: string;
        customerName: string;
        phoneNumber: string | null;
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
        isActive: boolean;
        companyId: string;
        tableId: string;
        customerName: string;
        phoneNumber: string | null;
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
    moveSessionToTable(sessionId: string, targetTableId: string, currentTableId?: string, companyIdHint?: string): Promise<({
        table: {
            number: number;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            qrCode: string;
            status: import(".prisma/client").$Enums.TableStatus;
            waiterId: string | null;
        };
        participants: {
            id: string;
            createdAt: Date;
            phoneNumber: string | null;
            customerSessionId: string;
            displayName: string;
            isCreator: boolean;
            deviceId: string | null;
        }[];
    } & {
        id: string;
        isActive: boolean;
        companyId: string;
        tableId: string;
        customerName: string;
        phoneNumber: string | null;
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
    getActiveSessionsByTable(tableId: string): Promise<({
        orders: ({
            items: ({
                menuItem: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    companyId: string;
                    price: Prisma.Decimal;
                    isShareable: boolean;
                    maxClaimants: number | null;
                    description: string | null;
                    category: string;
                    imageUrl: string | null;
                    isAvailable: boolean;
                    preparationTime: number | null;
                    isBundle: boolean;
                };
            } & {
                id: string;
                createdAt: Date;
                status: string;
                customerOrderId: string;
                menuItemId: string;
                quantity: number;
                specialInstructions: string | null;
                price: Prisma.Decimal;
                isShareable: boolean;
                maxClaimants: number;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            tableId: string;
            customerSessionId: string;
            status: string;
            participantId: string | null;
            subtotal: Prisma.Decimal;
            serviceFee: Prisma.Decimal;
            serviceFeePercentage: Prisma.Decimal;
            total: Prisma.Decimal;
            paymentStatus: string;
        })[];
    } & {
        id: string;
        isActive: boolean;
        companyId: string;
        tableId: string;
        customerName: string;
        phoneNumber: string | null;
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
        table: {
            number: number;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            qrCode: string;
            status: import(".prisma/client").$Enums.TableStatus;
            waiterId: string | null;
        };
        orders: ({
            items: ({
                menuItem: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    companyId: string;
                    price: Prisma.Decimal;
                    isShareable: boolean;
                    maxClaimants: number | null;
                    description: string | null;
                    category: string;
                    imageUrl: string | null;
                    isAvailable: boolean;
                    preparationTime: number | null;
                    isBundle: boolean;
                };
            } & {
                id: string;
                createdAt: Date;
                status: string;
                customerOrderId: string;
                menuItemId: string;
                quantity: number;
                specialInstructions: string | null;
                price: Prisma.Decimal;
                isShareable: boolean;
                maxClaimants: number;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            tableId: string;
            customerSessionId: string;
            status: string;
            participantId: string | null;
            subtotal: Prisma.Decimal;
            serviceFee: Prisma.Decimal;
            serviceFeePercentage: Prisma.Decimal;
            total: Prisma.Decimal;
            paymentStatus: string;
        })[];
    } & {
        id: string;
        isActive: boolean;
        companyId: string;
        tableId: string;
        customerName: string;
        phoneNumber: string | null;
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
