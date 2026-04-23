import { PrismaService } from '../prisma/prisma.service';
import { RestaurantWebSocketGateway } from '../websocket/websocket.gateway';
export declare class WaiterCallsService {
    private prisma;
    private webSocketGateway;
    constructor(prisma: PrismaService, webSocketGateway: RestaurantWebSocketGateway);
    createCall(data: {
        tableId: string;
        customerSessionId: string;
        callType: string;
        message?: string;
        companyId?: string;
    }): Promise<{
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
        customerSession: {
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
            scanLocation: import("@prisma/client/runtime/library").JsonValue | null;
            expectedLocation: import("@prisma/client/runtime/library").JsonValue | null;
            billPaidBy: string | null;
            billPaidAt: Date | null;
            expiryReason: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        companyId: string;
        message: string | null;
        resolvedAt: Date | null;
        tableId: string;
        status: string;
        customerSessionId: string;
        callType: string;
        acknowledgedAt: Date | null;
        acknowledgedBy: string | null;
    }>;
    acknowledgeCall(callId: string, acknowledgedBy: string): Promise<{
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
        customerSession: {
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
            scanLocation: import("@prisma/client/runtime/library").JsonValue | null;
            expectedLocation: import("@prisma/client/runtime/library").JsonValue | null;
            billPaidBy: string | null;
            billPaidAt: Date | null;
            expiryReason: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        companyId: string;
        message: string | null;
        resolvedAt: Date | null;
        tableId: string;
        status: string;
        customerSessionId: string;
        callType: string;
        acknowledgedAt: Date | null;
        acknowledgedBy: string | null;
    }>;
    resolveCall(callId: string): Promise<{
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
        customerSession: {
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
            scanLocation: import("@prisma/client/runtime/library").JsonValue | null;
            expectedLocation: import("@prisma/client/runtime/library").JsonValue | null;
            billPaidBy: string | null;
            billPaidAt: Date | null;
            expiryReason: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        companyId: string;
        message: string | null;
        resolvedAt: Date | null;
        tableId: string;
        status: string;
        customerSessionId: string;
        callType: string;
        acknowledgedAt: Date | null;
        acknowledgedBy: string | null;
    }>;
    getCallsByTable(tableId: string): Promise<({
        customerSession: {
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
            scanLocation: import("@prisma/client/runtime/library").JsonValue | null;
            expectedLocation: import("@prisma/client/runtime/library").JsonValue | null;
            billPaidBy: string | null;
            billPaidAt: Date | null;
            expiryReason: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        companyId: string;
        message: string | null;
        resolvedAt: Date | null;
        tableId: string;
        status: string;
        customerSessionId: string;
        callType: string;
        acknowledgedAt: Date | null;
        acknowledgedBy: string | null;
    })[]>;
    getPendingCalls(companyId?: string, type?: string): Promise<({
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
        customerSession: {
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
            scanLocation: import("@prisma/client/runtime/library").JsonValue | null;
            expectedLocation: import("@prisma/client/runtime/library").JsonValue | null;
            billPaidBy: string | null;
            billPaidAt: Date | null;
            expiryReason: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        companyId: string;
        message: string | null;
        resolvedAt: Date | null;
        tableId: string;
        status: string;
        customerSessionId: string;
        callType: string;
        acknowledgedAt: Date | null;
        acknowledgedBy: string | null;
    })[]>;
}
