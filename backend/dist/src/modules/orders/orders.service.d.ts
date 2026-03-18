import { PrismaService } from '../prisma/prisma.service';
import { RestaurantWebSocketGateway } from '../websocket/websocket.gateway';
export declare class OrdersService {
    private prisma;
    private webSocketGateway;
    constructor(prisma: PrismaService, webSocketGateway: RestaurantWebSocketGateway);
    getAllOrders(companyId?: string): Promise<any[]>;
    getOrder(id: string): Promise<any>;
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
    }): Promise<$Result.GetResult<import(".prisma/client").Prisma.$OrderPayload<ExtArgs>, T, "create">>;
    updateOrderStatus(id: string, status: string): Promise<$Result.GetResult<import(".prisma/client").Prisma.$OrderPayload<ExtArgs>, T, "update">>;
    updateKitchenOrderStatus(id: string, status: string): Promise<any>;
    updateBarOrderStatus(id: string, status: string): Promise<any>;
    private calculateOverallOrderStatus;
    private calculateCategoryStatus;
    updateOrderTotal(id: string, newTotal: number): Promise<$Result.GetResult<import(".prisma/client").Prisma.$OrderPayload<ExtArgs>, T, "update">>;
    updateOrder(id: string, orderUpdate: any): Promise<any>;
    addItemsToOrder(orderId: string, newItems: Array<{
        menuItemId: string;
        quantity: number;
        notes?: string;
    }>): Promise<any>;
    updateItemStatus(orderId: string, itemId: string, status: string): Promise<any>;
    private categorizeOrderItems;
    private isDrinkCategory;
    private getMenuItemById;
    getOrdersByTable(tableId: string): Promise<any[]>;
    private updateCustomerOrderItemStatus;
    private updateCustomerOrderBarStatus;
    private updateCustomerOrderKitchenStatus;
    private isDrinkItem;
}
