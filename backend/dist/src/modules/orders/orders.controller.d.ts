import { OrdersService } from './orders.service';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    getAllOrders(companyId?: string): Promise<any[]>;
    getOrdersByTable(tableId: string): Promise<any[]>;
    getOrder(id: string): Promise<any>;
    createOrder(createDto: any): Promise<$Result.GetResult<import(".prisma/client").Prisma.$OrderPayload<ExtArgs>, T, "create">>;
    updateOrderStatus(id: string, statusDto: {
        status: string;
    }): Promise<$Result.GetResult<import(".prisma/client").Prisma.$OrderPayload<ExtArgs>, T, "update">>;
    updateKitchenOrderStatus(id: string, statusDto: {
        status: string;
    }): Promise<any>;
    updateBarOrderStatus(id: string, statusDto: {
        status: string;
    }): Promise<any>;
    updateOrderTotal(id: string, totalDto: {
        total: number;
    }): Promise<$Result.GetResult<import(".prisma/client").Prisma.$OrderPayload<ExtArgs>, T, "update">>;
    updateOrder(id: string, orderUpdate: any): Promise<any>;
    addItemsToOrder(id: string, itemsDto: {
        items: Array<{
            menuItemId: string;
            quantity: number;
            notes?: string;
        }>;
    }): Promise<any>;
    updateItemStatus(orderId: string, itemId: string, statusDto: {
        status: string;
    }): Promise<any>;
}
