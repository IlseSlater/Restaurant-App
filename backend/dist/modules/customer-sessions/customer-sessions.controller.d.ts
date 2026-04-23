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
                    price: import("@prisma/client/runtime/library").Decimal;
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
                price: import("@prisma/client/runtime/library").Decimal;
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
            total: import("@prisma/client/runtime/library").Decimal;
            customerSessionId: string;
            participantId: string | null;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            serviceFee: import("@prisma/client/runtime/library").Decimal;
            serviceFeePercentage: import("@prisma/client/runtime/library").Decimal;
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
    }>;
    endSession(id: string): Promise<{
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
            status: import(".prisma/client").$Enums.TableStatus;
            qrCode: string;
            waiterId: string | null;
        };
        participants: {
            id: string;
            createdAt: Date;
            customerSessionId: string;
            displayName: string;
            isCreator: boolean;
            phoneNumber: string | null;
            deviceId: string | null;
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
                    category: string;
                    description: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    companyId: string;
                    price: import("@prisma/client/runtime/library").Decimal;
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
                price: import("@prisma/client/runtime/library").Decimal;
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
            total: import("@prisma/client/runtime/library").Decimal;
            customerSessionId: string;
            participantId: string | null;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            serviceFee: import("@prisma/client/runtime/library").Decimal;
            serviceFeePercentage: import("@prisma/client/runtime/library").Decimal;
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
        scanLocation: import("@prisma/client/runtime/library").JsonValue | null;
        expectedLocation: import("@prisma/client/runtime/library").JsonValue | null;
        billPaidBy: string | null;
        billPaidAt: Date | null;
        expiryReason: string | null;
    })[]>;
    getSessionByPhone(phoneNumber: string): Promise<({
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
                    price: import("@prisma/client/runtime/library").Decimal;
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
                price: import("@prisma/client/runtime/library").Decimal;
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
            total: import("@prisma/client/runtime/library").Decimal;
            customerSessionId: string;
            participantId: string | null;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            serviceFee: import("@prisma/client/runtime/library").Decimal;
            serviceFeePercentage: import("@prisma/client/runtime/library").Decimal;
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
