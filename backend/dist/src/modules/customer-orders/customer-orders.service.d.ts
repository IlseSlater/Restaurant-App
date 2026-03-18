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
        }>;
        serviceFeePercentage: number;
    }): Promise<$Result.GetResult<import(".prisma/client").Prisma.$CustomerOrderPayload<ExtArgs>, T, "create">>;
    private categorizeOrderItems;
    getOrdersBySession(sessionId: string): Promise<any>;
    getOrder(orderId: string): Promise<any>;
    updateOrderStatus(orderId: string, status: string): Promise<$Result.GetResult<import(".prisma/client").Prisma.$CustomerOrderPayload<ExtArgs>, T, "update">>;
    updateItemStatus(orderId: string, itemId: string, status: string): Promise<any>;
    private deriveOrderStatusFromItems;
}
