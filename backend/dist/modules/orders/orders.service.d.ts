import { PrismaService } from '../prisma/prisma.service';
import { RestaurantWebSocketGateway } from '../websocket/websocket.gateway';
export declare class OrdersService {
    private prisma;
    private webSocketGateway;
    constructor(prisma: PrismaService, webSocketGateway: RestaurantWebSocketGateway);
    getAllOrders(companyId?: string): Promise<(({
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
            notes: string | null;
            quantity: number;
            orderId: string;
            menuItemId: string;
            price: import("@prisma/client/runtime/library").Decimal;
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
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        notes: string | null;
        tableId: string;
        customerId: string | null;
        status: import(".prisma/client").$Enums.OrderStatus;
        total: import("@prisma/client/runtime/library").Decimal;
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
            notes: string | null;
            quantity: number;
            orderId: string;
            menuItemId: string;
            price: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        notes: string | null;
        tableId: string;
        customerId: string | null;
        status: import(".prisma/client").$Enums.OrderStatus;
        total: import("@prisma/client/runtime/library").Decimal;
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
            notes: string | null;
            quantity: number;
            orderId: string;
            menuItemId: string;
            price: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        notes: string | null;
        tableId: string;
        customerId: string | null;
        status: import(".prisma/client").$Enums.OrderStatus;
        total: import("@prisma/client/runtime/library").Decimal;
    }>;
    updateOrderStatus(id: string, status: string): Promise<any>;
    updateKitchenOrderStatus(id: string, status: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        notes: string | null;
        tableId: string;
        customerId: string | null;
        status: import(".prisma/client").$Enums.OrderStatus;
        total: import("@prisma/client/runtime/library").Decimal;
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
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        notes: string | null;
        tableId: string;
        customerId: string | null;
        status: import(".prisma/client").$Enums.OrderStatus;
        total: import("@prisma/client/runtime/library").Decimal;
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
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        notes: string | null;
        tableId: string;
        customerId: string | null;
        status: import(".prisma/client").$Enums.OrderStatus;
        total: import("@prisma/client/runtime/library").Decimal;
    }>;
    updateOrder(id: string, orderUpdate: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        notes: string | null;
        tableId: string;
        customerId: string | null;
        status: import(".prisma/client").$Enums.OrderStatus;
        total: import("@prisma/client/runtime/library").Decimal;
    } | {
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
    }>;
    addItemsToOrder(orderId: string, newItems: Array<{
        menuItemId: string;
        quantity: number;
        notes?: string;
    }>): Promise<{
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
            notes: string | null;
            quantity: number;
            orderId: string;
            menuItemId: string;
            price: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        notes: string | null;
        tableId: string;
        customerId: string | null;
        status: import(".prisma/client").$Enums.OrderStatus;
        total: import("@prisma/client/runtime/library").Decimal;
    }>;
    updateItemStatus(orderId: string, itemId: string, status: string): Promise<({
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
    }) | ({
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
            notes: string | null;
            quantity: number;
            orderId: string;
            menuItemId: string;
            price: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        notes: string | null;
        tableId: string;
        customerId: string | null;
        status: import(".prisma/client").$Enums.OrderStatus;
        total: import("@prisma/client/runtime/library").Decimal;
    })>;
    private categorizeOrderItems;
    private isDrinkCategory;
    private getMenuItemById;
    getOrdersByTable(tableId: string): Promise<(({
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
            notes: string | null;
            quantity: number;
            orderId: string;
            menuItemId: string;
            price: import("@prisma/client/runtime/library").Decimal;
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
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        notes: string | null;
        tableId: string;
        customerId: string | null;
        status: import(".prisma/client").$Enums.OrderStatus;
        total: import("@prisma/client/runtime/library").Decimal;
    }) | {
        id: string;
        tableId: string;
        customerSessionId: string;
        status: string;
        total: unknown;
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
