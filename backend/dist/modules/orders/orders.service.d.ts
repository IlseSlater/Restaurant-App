import { PrismaService } from '../prisma/prisma.service';
import { RestaurantWebSocketGateway } from '../websocket/websocket.gateway';
export declare class OrdersService {
    private prisma;
    private webSocketGateway;
    constructor(prisma: PrismaService, webSocketGateway: RestaurantWebSocketGateway);
    getAllOrders(companyId?: string): Promise<(({
        table: {
            number: number;
            id: string;
            companyId: string;
            status: import(".prisma/client").$Enums.TableStatus;
            createdAt: Date;
            updatedAt: Date;
            qrCode: string;
            waiterId: string | null;
        };
        items: ({
            menuItem: {
                id: string;
                companyId: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                price: import("@prisma/client/runtime/library").Decimal;
                description: string | null;
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
            notes: string | null;
            createdAt: Date;
            orderId: string;
            menuItemId: string;
            quantity: number;
            price: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        id: string;
        companyId: string;
        tableId: string;
        customerId: string | null;
        status: import(".prisma/client").$Enums.OrderStatus;
        total: import("@prisma/client/runtime/library").Decimal;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }) | {
        id: string;
        tableId: string;
        customerId: string;
        customerSessionId: string;
        customerName: string;
        participantId: string | null;
        participantDisplayName: string;
        status: string;
        total: unknown;
        notes: string;
        createdAt: Date;
        updatedAt: Date;
        table: unknown;
        items: {
            id: string;
            orderId: string;
            menuItemId: string;
            quantity: number;
            price: unknown;
            notes: string | null;
            status: string;
            createdAt: Date;
            menuItem: unknown;
            isShareable: boolean;
            claims: {
                participantId: any;
                percentage: any;
                displayName: any;
            }[];
            modifiers: {
                groupName: any;
                optionName: any;
                priceAdjustment: any;
            }[];
            bundleChoices: {
                slotName: any;
                chosenItemName: any;
            }[];
            formattedSummary: string;
        }[];
        isCustomerOrder: boolean;
    })[]>;
    getOrder(id: string): Promise<({
        items: ({
            menuItem: {
                id: string;
                companyId: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                price: import("@prisma/client/runtime/library").Decimal;
                description: string | null;
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
            notes: string | null;
            createdAt: Date;
            orderId: string;
            menuItemId: string;
            quantity: number;
            price: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        id: string;
        companyId: string;
        tableId: string;
        customerId: string | null;
        status: import(".prisma/client").$Enums.OrderStatus;
        total: import("@prisma/client/runtime/library").Decimal;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    createOrder(createDto: {
        tableId: string;
        companyId?: string;
        customerId?: string;
        items: Array<{
            menuItemId: string;
            quantity: number;
            notes?: string;
        }>;
        notes?: string;
    }): Promise<{
        items: ({
            menuItem: {
                id: string;
                companyId: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                price: import("@prisma/client/runtime/library").Decimal;
                description: string | null;
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
            notes: string | null;
            createdAt: Date;
            orderId: string;
            menuItemId: string;
            quantity: number;
            price: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        id: string;
        companyId: string;
        tableId: string;
        customerId: string | null;
        status: import(".prisma/client").$Enums.OrderStatus;
        total: import("@prisma/client/runtime/library").Decimal;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateOrderStatus(id: string, status: string): Promise<any>;
    updateKitchenOrderStatus(id: string, status: string): Promise<{
        id: string;
        companyId: string;
        tableId: string;
        customerId: string | null;
        status: import(".prisma/client").$Enums.OrderStatus;
        total: import("@prisma/client/runtime/library").Decimal;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    } | {
        id: string;
        tableId: string;
        status: string;
        items: {
            id: any;
            orderId: string;
            menuItemId: any;
            quantity: any;
            price: any;
            notes: any;
            status: any;
            menuItem: any;
        }[];
        isCustomerOrder: boolean;
    }>;
    updateBarOrderStatus(id: string, status: string): Promise<{
        id: string;
        companyId: string;
        tableId: string;
        customerId: string | null;
        status: import(".prisma/client").$Enums.OrderStatus;
        total: import("@prisma/client/runtime/library").Decimal;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    } | {
        id: string;
        tableId: string;
        status: string;
        items: {
            id: any;
            orderId: string;
            menuItemId: any;
            quantity: any;
            price: any;
            notes: any;
            status: any;
            menuItem: any;
        }[];
        isCustomerOrder: boolean;
    }>;
    private calculateOverallOrderStatus;
    private calculateCategoryStatus;
    updateOrderTotal(id: string, newTotal: number): Promise<{
        id: string;
        companyId: string;
        tableId: string;
        customerId: string | null;
        status: import(".prisma/client").$Enums.OrderStatus;
        total: import("@prisma/client/runtime/library").Decimal;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateOrder(id: string, orderUpdate: any): Promise<{
        id: string;
        companyId: string;
        tableId: string;
        customerId: string | null;
        status: import(".prisma/client").$Enums.OrderStatus;
        total: import("@prisma/client/runtime/library").Decimal;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    } | {
        id: string;
        companyId: string;
        tableId: string;
        status: string;
        total: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        updatedAt: Date;
        customerSessionId: string;
        participantId: string | null;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        serviceFee: import("@prisma/client/runtime/library").Decimal;
        serviceFeePercentage: import("@prisma/client/runtime/library").Decimal;
        paymentStatus: string;
    }>;
    addItemsToOrder(orderId: string, newItems: Array<{
        menuItemId: string;
        quantity: number;
        notes?: string;
    }>): Promise<{
        items: ({
            menuItem: {
                id: string;
                companyId: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                price: import("@prisma/client/runtime/library").Decimal;
                description: string | null;
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
            notes: string | null;
            createdAt: Date;
            orderId: string;
            menuItemId: string;
            quantity: number;
            price: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        id: string;
        companyId: string;
        tableId: string;
        customerId: string | null;
        status: import(".prisma/client").$Enums.OrderStatus;
        total: import("@prisma/client/runtime/library").Decimal;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateItemStatus(orderId: string, itemId: string, status: string): Promise<({
        items: ({
            menuItem: {
                id: string;
                companyId: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                price: import("@prisma/client/runtime/library").Decimal;
                description: string | null;
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
            status: string;
            createdAt: Date;
            menuItemId: string;
            quantity: number;
            price: import("@prisma/client/runtime/library").Decimal;
            isShareable: boolean;
            maxClaimants: number;
            customerOrderId: string;
            specialInstructions: string | null;
        })[];
    } & {
        id: string;
        companyId: string;
        tableId: string;
        status: string;
        total: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        updatedAt: Date;
        customerSessionId: string;
        participantId: string | null;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        serviceFee: import("@prisma/client/runtime/library").Decimal;
        serviceFeePercentage: import("@prisma/client/runtime/library").Decimal;
        paymentStatus: string;
    }) | ({
        items: ({
            menuItem: {
                id: string;
                companyId: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                price: import("@prisma/client/runtime/library").Decimal;
                description: string | null;
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
            notes: string | null;
            createdAt: Date;
            orderId: string;
            menuItemId: string;
            quantity: number;
            price: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        id: string;
        companyId: string;
        tableId: string;
        customerId: string | null;
        status: import(".prisma/client").$Enums.OrderStatus;
        total: import("@prisma/client/runtime/library").Decimal;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    })>;
    private categorizeOrderItems;
    private isDrinkCategory;
    private getMenuItemById;
    private resolveItemOrderedByName;
    getOrdersByTable(tableId: string): Promise<(({
        table: {
            number: number;
            id: string;
            companyId: string;
            status: import(".prisma/client").$Enums.TableStatus;
            createdAt: Date;
            updatedAt: Date;
            qrCode: string;
            waiterId: string | null;
        };
        items: ({
            menuItem: {
                id: string;
                companyId: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                price: import("@prisma/client/runtime/library").Decimal;
                description: string | null;
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
            notes: string | null;
            createdAt: Date;
            orderId: string;
            menuItemId: string;
            quantity: number;
            price: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        id: string;
        companyId: string;
        tableId: string;
        customerId: string | null;
        status: import(".prisma/client").$Enums.OrderStatus;
        total: import("@prisma/client/runtime/library").Decimal;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
    }) | {
        id: string;
        tableId: string;
        customerSessionId: string;
        customerName: string;
        participantDisplayName: string;
        status: string;
        total: unknown;
        createdAt: Date;
        updatedAt: Date;
        table: unknown;
        participantId: string | null;
        items: {
            id: string;
            orderId: string;
            menuItemId: string;
            quantity: number;
            price: unknown;
            notes: string | null;
            status: string;
            createdAt: Date;
            menuItem: unknown;
            orderedByName: string;
            modifiers: {
                groupName: any;
                optionName: any;
                priceAdjustment: any;
            }[];
            bundleChoices: {
                slotName: any;
                chosenItemName: any;
            }[];
            formattedSummary: string;
        }[];
    })[]>;
    private updateCustomerOrderItemStatus;
    private updateCustomerOrderBarStatus;
    private updateCustomerOrderKitchenStatus;
    private isDrinkItem;
}
