import { OrdersService } from './orders.service';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    getAllOrders(companyId?: string): Promise<(({
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
            price: import("@prisma/client/runtime/library").Decimal;
            notes: string | null;
            orderId: string;
            menuItemId: string;
            quantity: number;
        })[];
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.OrderStatus;
        tableId: string;
        customerId: string | null;
        total: import("@prisma/client/runtime/library").Decimal;
        notes: string | null;
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
    getOrdersByTable(tableId: string): Promise<(({
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
            price: import("@prisma/client/runtime/library").Decimal;
            notes: string | null;
            orderId: string;
            menuItemId: string;
            quantity: number;
        })[];
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.OrderStatus;
        tableId: string;
        customerId: string | null;
        total: import("@prisma/client/runtime/library").Decimal;
        notes: string | null;
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
    getOrder(id: string): Promise<({
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
            price: import("@prisma/client/runtime/library").Decimal;
            notes: string | null;
            orderId: string;
            menuItemId: string;
            quantity: number;
        })[];
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.OrderStatus;
        tableId: string;
        customerId: string | null;
        total: import("@prisma/client/runtime/library").Decimal;
        notes: string | null;
    }) | null>;
    createOrder(createDto: any): Promise<{
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
            price: import("@prisma/client/runtime/library").Decimal;
            notes: string | null;
            orderId: string;
            menuItemId: string;
            quantity: number;
        })[];
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.OrderStatus;
        tableId: string;
        customerId: string | null;
        total: import("@prisma/client/runtime/library").Decimal;
        notes: string | null;
    }>;
    updateOrderStatus(id: string, statusDto: {
        status: string;
    }): Promise<any>;
    updateKitchenOrderStatus(id: string, statusDto: {
        status: string;
    }): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.OrderStatus;
        tableId: string;
        customerId: string | null;
        total: import("@prisma/client/runtime/library").Decimal;
        notes: string | null;
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
    updateBarOrderStatus(id: string, statusDto: {
        status: string;
    }): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.OrderStatus;
        tableId: string;
        customerId: string | null;
        total: import("@prisma/client/runtime/library").Decimal;
        notes: string | null;
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
    updateOrderTotal(id: string, totalDto: {
        total: number;
    }): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.OrderStatus;
        tableId: string;
        customerId: string | null;
        total: import("@prisma/client/runtime/library").Decimal;
        notes: string | null;
    }>;
    updateOrder(id: string, orderUpdate: any): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.OrderStatus;
        tableId: string;
        customerId: string | null;
        total: import("@prisma/client/runtime/library").Decimal;
        notes: string | null;
    } | {
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
    addItemsToOrder(id: string, itemsDto: {
        items: Array<{
            menuItemId: string;
            quantity: number;
            notes?: string;
        }>;
    }): Promise<{
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
            price: import("@prisma/client/runtime/library").Decimal;
            notes: string | null;
            orderId: string;
            menuItemId: string;
            quantity: number;
        })[];
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.OrderStatus;
        tableId: string;
        customerId: string | null;
        total: import("@prisma/client/runtime/library").Decimal;
        notes: string | null;
    }>;
    updateItemStatus(orderId: string, itemId: string, statusDto: {
        status: string;
    }): Promise<({
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
    }) | ({
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
            price: import("@prisma/client/runtime/library").Decimal;
            notes: string | null;
            orderId: string;
            menuItemId: string;
            quantity: number;
        })[];
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.OrderStatus;
        tableId: string;
        customerId: string | null;
        total: import("@prisma/client/runtime/library").Decimal;
        notes: string | null;
    })>;
}
