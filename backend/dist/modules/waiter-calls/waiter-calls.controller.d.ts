import { WaiterCallsService } from './waiter-calls.service';
export declare class WaiterCallsController {
    private readonly callService;
    constructor(callService: WaiterCallsService);
    createCall(data: any): Promise<{
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
        status: string;
        tableId: string;
        customerSessionId: string;
        callType: string;
        acknowledgedAt: Date | null;
        acknowledgedBy: string | null;
    }>;
    acknowledgeCall(id: string, data: {
        acknowledgedBy: string;
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
        status: string;
        tableId: string;
        customerSessionId: string;
        callType: string;
        acknowledgedAt: Date | null;
        acknowledgedBy: string | null;
    }>;
    resolveCall(id: string): Promise<{
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
        status: string;
        tableId: string;
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
        status: string;
        tableId: string;
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
        status: string;
        tableId: string;
        customerSessionId: string;
        callType: string;
        acknowledgedAt: Date | null;
        acknowledgedBy: string | null;
    })[]>;
}
