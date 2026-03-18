import { PrismaService } from '../prisma/prisma.service';
import { RestaurantWebSocketGateway } from '../websocket/websocket.gateway';
export declare class ItemClaimsService {
    private prisma;
    private webSocketGateway;
    constructor(prisma: PrismaService, webSocketGateway: RestaurantWebSocketGateway);
    getClaimsByOrderItem(orderItemId: string): Promise<{
        orderItemId: any;
        itemName: any;
        price: number;
        quantity: any;
        totalPrice: number;
        isShareable: any;
        maxClaimants: any;
        claims: any;
        claimantCount: any;
        priceEach: number;
        sessionId: any;
    } | null>;
    claim(orderItemId: string, participantId: string): Promise<{
        orderItemId: any;
        itemName: any;
        price: number;
        quantity: any;
        totalPrice: number;
        isShareable: any;
        maxClaimants: any;
        claims: any;
        claimantCount: any;
        priceEach: number;
        sessionId: any;
    } | null>;
    leave(orderItemId: string, participantId: string): Promise<{
        orderItemId: any;
        itemName: any;
        price: number;
        quantity: any;
        totalPrice: number;
        isShareable: any;
        maxClaimants: any;
        claims: any;
        claimantCount: any;
        priceEach: number;
        sessionId: any;
    } | null>;
}
