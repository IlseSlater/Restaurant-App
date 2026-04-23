import { CustomerSessionsService } from './customer-sessions.service';
export declare class CustomerSessionsController {
    private readonly sessionService;
    constructor(sessionService: CustomerSessionsService);
    createSession(data: any): Promise<any>;
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
    joinSession(sessionId: string, body: {
        displayName?: string;
        participantId?: string;
        phoneNumber?: string;
        deviceId?: string;
    }): Promise<{
        participant: {
            id: string;
            displayName: string;
            isCreator: boolean;
            customerSessionId: string;
        };
        sessionId: string;
    }>;
    getSession(id: string): Promise<({
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
                    price: import("@prisma/client/runtime/library").Decimal;
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
                price: import("@prisma/client/runtime/library").Decimal;
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
            subtotal: import("@prisma/client/runtime/library").Decimal;
            serviceFee: import("@prisma/client/runtime/library").Decimal;
            serviceFeePercentage: import("@prisma/client/runtime/library").Decimal;
            total: import("@prisma/client/runtime/library").Decimal;
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
        scanLocation: import("@prisma/client/runtime/library").JsonValue | null;
        expectedLocation: import("@prisma/client/runtime/library").JsonValue | null;
        billPaidBy: string | null;
        billPaidAt: Date | null;
        expiryReason: string | null;
    }) | null>;
    getPaymentStatus(id: string): Promise<{
        participants: {
            participantId: string;
            displayName: string;
            paid: boolean;
            paidBy?: string;
        }[];
    }>;
    updateActivity(id: string): Promise<{
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
        scanLocation: import("@prisma/client/runtime/library").JsonValue | null;
        expectedLocation: import("@prisma/client/runtime/library").JsonValue | null;
        billPaidBy: string | null;
        billPaidAt: Date | null;
        expiryReason: string | null;
    }>;
    endSession(id: string): Promise<{
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
        scanLocation: import("@prisma/client/runtime/library").JsonValue | null;
        expectedLocation: import("@prisma/client/runtime/library").JsonValue | null;
        billPaidBy: string | null;
        billPaidAt: Date | null;
        expiryReason: string | null;
    }>;
    moveSessionToTable(sessionId: string, body: {
        tableId: string;
        currentTableId?: string;
        companyId?: string;
    }): Promise<({
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
        scanLocation: import("@prisma/client/runtime/library").JsonValue | null;
        expectedLocation: import("@prisma/client/runtime/library").JsonValue | null;
        billPaidBy: string | null;
        billPaidAt: Date | null;
        expiryReason: string | null;
    }) | null>;
    getSessionsByTable(tableId: string): Promise<({
        orders: ({
            items: ({
                menuItem: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    companyId: string;
                    price: import("@prisma/client/runtime/library").Decimal;
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
                price: import("@prisma/client/runtime/library").Decimal;
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
            subtotal: import("@prisma/client/runtime/library").Decimal;
            serviceFee: import("@prisma/client/runtime/library").Decimal;
            serviceFeePercentage: import("@prisma/client/runtime/library").Decimal;
            total: import("@prisma/client/runtime/library").Decimal;
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
        scanLocation: import("@prisma/client/runtime/library").JsonValue | null;
        expectedLocation: import("@prisma/client/runtime/library").JsonValue | null;
        billPaidBy: string | null;
        billPaidAt: Date | null;
        expiryReason: string | null;
    })[]>;
    getSessionByPhone(phoneNumber: string): Promise<({
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
                    price: import("@prisma/client/runtime/library").Decimal;
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
                price: import("@prisma/client/runtime/library").Decimal;
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
            subtotal: import("@prisma/client/runtime/library").Decimal;
            serviceFee: import("@prisma/client/runtime/library").Decimal;
            serviceFeePercentage: import("@prisma/client/runtime/library").Decimal;
            total: import("@prisma/client/runtime/library").Decimal;
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
        scanLocation: import("@prisma/client/runtime/library").JsonValue | null;
        expectedLocation: import("@prisma/client/runtime/library").JsonValue | null;
        billPaidBy: string | null;
        billPaidAt: Date | null;
        expiryReason: string | null;
    }) | null>;
    endSessionWithPayment(id: string, data: {
        paidBy: string;
    }): Promise<void>;
    endPreviousSessions(data: {
        phoneNumber: string;
        newCompanyId: string;
    }): Promise<void>;
    expireInactiveSessions(): Promise<number>;
    validateLocation(id: string, data: {
        lat: number;
        lng: number;
    }): Promise<boolean>;
}
