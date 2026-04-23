import { CustomerOrdersService } from './customer-orders.service';
export declare class CustomerOrdersController {
    private readonly orderService;
    constructor(orderService: CustomerOrdersService);
    createOrder(data: any): Promise<any>;
    getOrdersBySession(sessionId: string): Promise<{
        status: string;
        participant: {
            id: string;
            displayName: string;
        } | null;
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
            modifiers: {
                id: string;
                createdAt: Date;
                customerOrderItemId: string;
                modifierOptionId: string;
                modifierGroupName: string;
                optionName: string;
                priceAdjustment: import("@prisma/client/runtime/library").Decimal;
                bundleChoiceId: string | null;
            }[];
            bundleChoices: ({
                bundleSlot: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    menuItemId: string;
                    description: string | null;
                    isRequired: boolean;
                    sortOrder: number;
                };
            } & {
                id: string;
                createdAt: Date;
                customerOrderItemId: string;
                bundleSlotId: string;
                chosenMenuItemId: string;
                chosenItemName: string;
            })[];
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
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        tableId: string;
        customerSessionId: string;
        participantId: string | null;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        serviceFee: import("@prisma/client/runtime/library").Decimal;
        serviceFeePercentage: import("@prisma/client/runtime/library").Decimal;
        total: import("@prisma/client/runtime/library").Decimal;
        paymentStatus: string;
    }[]>;
    getOrder(id: string): Promise<{
        status: string;
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
        customerSession: {
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
        };
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
            modifiers: {
                id: string;
                createdAt: Date;
                customerOrderItemId: string;
                modifierOptionId: string;
                modifierGroupName: string;
                optionName: string;
                priceAdjustment: import("@prisma/client/runtime/library").Decimal;
                bundleChoiceId: string | null;
            }[];
            bundleChoices: ({
                bundleSlot: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    menuItemId: string;
                    description: string | null;
                    isRequired: boolean;
                    sortOrder: number;
                };
            } & {
                id: string;
                createdAt: Date;
                customerOrderItemId: string;
                bundleSlotId: string;
                chosenMenuItemId: string;
                chosenItemName: string;
            })[];
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
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        tableId: string;
        customerSessionId: string;
        participantId: string | null;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        serviceFee: import("@prisma/client/runtime/library").Decimal;
        serviceFeePercentage: import("@prisma/client/runtime/library").Decimal;
        total: import("@prisma/client/runtime/library").Decimal;
        paymentStatus: string;
    } | null>;
    updateOrderStatus(id: string, data: {
        status: string;
    }): Promise<{
        customerSession: {
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
        };
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
    }>;
    updateBarOrderStatus(id: string, data: {
        status: string;
    }): Promise<{
        customerSession: {
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
        };
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
    }>;
    updateKitchenOrderStatus(id: string, data: {
        status: string;
    }): Promise<{
        customerSession: {
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
        };
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
    }>;
    updateItemStatus(orderId: string, itemId: string, data: {
        status: string;
    }): Promise<{
        customerSession: {
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
        };
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
    }>;
}
