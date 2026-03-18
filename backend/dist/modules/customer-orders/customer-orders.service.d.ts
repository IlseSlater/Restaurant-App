import { PrismaService } from '../prisma/prisma.service';
import { RestaurantWebSocketGateway } from '../websocket/websocket.gateway';
import { CustomerSessionsService } from '../customer-sessions/customer-sessions.service';
export declare class CustomerOrdersService {
    private prisma;
    private webSocketGateway;
    private customerSessionsService;
    constructor(prisma: PrismaService, webSocketGateway: RestaurantWebSocketGateway, customerSessionsService: CustomerSessionsService);
    createOrder(data: {
        customerSessionId: string;
        tableId: string;
        participantId?: string | null;
        items: Array<{
            menuItemId: string;
            quantity: number;
            specialInstructions?: string;
            price: number;
            isSpecial?: boolean;
            specialId?: string;
            specialName?: string;
            selectedModifiers?: Array<{
                modifierOptionId: string;
                modifierGroupName: string;
                optionName: string;
                priceAdjustment: number;
            }>;
            bundleChoices?: Array<{
                bundleSlotId: string;
                chosenMenuItemId: string;
                chosenItemName: string;
                modifiers?: Array<{
                    modifierOptionId: string;
                    modifierGroupName: string;
                    optionName: string;
                    priceAdjustment: number;
                }>;
            }>;
        }>;
        serviceFeePercentage: number;
    }): Promise<any>;
    private categorizeOrderItems;
    getOrdersBySession(sessionId: string): Promise<{
        status: string;
        participant: {
            id: string;
            displayName: string;
        } | null;
        items: ({
            menuItem: {
                description: string | null;
                id: string;
                companyId: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                price: import("@prisma/client/runtime/library").Decimal;
                category: string;
                imageUrl: string | null;
                isAvailable: boolean;
                preparationTime: number | null;
                isShareable: boolean;
                maxClaimants: number | null;
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
                    description: string | null;
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    menuItemId: string;
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
            price: import("@prisma/client/runtime/library").Decimal;
            isShareable: boolean;
            maxClaimants: number;
            menuItemId: string;
            quantity: number;
            customerOrderId: string;
            specialInstructions: string | null;
        })[];
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        tableId: string;
        total: import("@prisma/client/runtime/library").Decimal;
        customerSessionId: string;
        participantId: string | null;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        serviceFee: import("@prisma/client/runtime/library").Decimal;
        serviceFeePercentage: import("@prisma/client/runtime/library").Decimal;
        paymentStatus: string;
    }[]>;
    getOrder(orderId: string): Promise<{
        status: string;
        table: {
            number: number;
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            qrCode: string;
            status: import(".prisma/client").$Enums.TableStatus;
            waiterId: string | null;
        };
        customerSession: {
            id: string;
            companyId: string;
            isActive: boolean;
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
                description: string | null;
                id: string;
                companyId: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                price: import("@prisma/client/runtime/library").Decimal;
                category: string;
                imageUrl: string | null;
                isAvailable: boolean;
                preparationTime: number | null;
                isShareable: boolean;
                maxClaimants: number | null;
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
                    description: string | null;
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    menuItemId: string;
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
            price: import("@prisma/client/runtime/library").Decimal;
            isShareable: boolean;
            maxClaimants: number;
            menuItemId: string;
            quantity: number;
            customerOrderId: string;
            specialInstructions: string | null;
        })[];
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        tableId: string;
        total: import("@prisma/client/runtime/library").Decimal;
        customerSessionId: string;
        participantId: string | null;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        serviceFee: import("@prisma/client/runtime/library").Decimal;
        serviceFeePercentage: import("@prisma/client/runtime/library").Decimal;
        paymentStatus: string;
    } | null>;
    updateOrderStatus(orderId: string, status: string): Promise<{
        customerSession: {
            id: string;
            companyId: string;
            isActive: boolean;
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
                description: string | null;
                id: string;
                companyId: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                price: import("@prisma/client/runtime/library").Decimal;
                category: string;
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
            status: string;
            price: import("@prisma/client/runtime/library").Decimal;
            isShareable: boolean;
            maxClaimants: number;
            menuItemId: string;
            quantity: number;
            customerOrderId: string;
            specialInstructions: string | null;
        })[];
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        tableId: string;
        total: import("@prisma/client/runtime/library").Decimal;
        customerSessionId: string;
        participantId: string | null;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        serviceFee: import("@prisma/client/runtime/library").Decimal;
        serviceFeePercentage: import("@prisma/client/runtime/library").Decimal;
        paymentStatus: string;
    }>;
    updateItemStatus(orderId: string, itemId: string, status: string): Promise<{
        customerSession: {
            id: string;
            companyId: string;
            isActive: boolean;
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
                description: string | null;
                id: string;
                companyId: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                price: import("@prisma/client/runtime/library").Decimal;
                category: string;
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
            status: string;
            price: import("@prisma/client/runtime/library").Decimal;
            isShareable: boolean;
            maxClaimants: number;
            menuItemId: string;
            quantity: number;
            customerOrderId: string;
            specialInstructions: string | null;
        })[];
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        tableId: string;
        total: import("@prisma/client/runtime/library").Decimal;
        customerSessionId: string;
        participantId: string | null;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        serviceFee: import("@prisma/client/runtime/library").Decimal;
        serviceFeePercentage: import("@prisma/client/runtime/library").Decimal;
        paymentStatus: string;
    }>;
    private deriveOrderStatusFromItems;
}
