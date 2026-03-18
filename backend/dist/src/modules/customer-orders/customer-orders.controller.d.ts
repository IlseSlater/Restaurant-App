import { CustomerOrdersService } from './customer-orders.service';
export declare class CustomerOrdersController {
    private readonly orderService;
    constructor(orderService: CustomerOrdersService);
    createOrder(data: any): Promise<$Result.GetResult<import(".prisma/client").Prisma.$CustomerOrderPayload<ExtArgs>, T, "create">>;
    getOrdersBySession(sessionId: string): Promise<any>;
    getOrder(id: string): Promise<any>;
    updateOrderStatus(id: string, data: {
        status: string;
    }): Promise<$Result.GetResult<import(".prisma/client").Prisma.$CustomerOrderPayload<ExtArgs>, T, "update">>;
    updateBarOrderStatus(id: string, data: {
        status: string;
    }): Promise<$Result.GetResult<import(".prisma/client").Prisma.$CustomerOrderPayload<ExtArgs>, T, "update">>;
    updateKitchenOrderStatus(id: string, data: {
        status: string;
    }): Promise<$Result.GetResult<import(".prisma/client").Prisma.$CustomerOrderPayload<ExtArgs>, T, "update">>;
    updateItemStatus(orderId: string, itemId: string, data: {
        status: string;
    }): Promise<any>;
}
