import { PrismaService } from '../prisma/prisma.service';
import { RestaurantWebSocketGateway } from '../websocket/websocket.gateway';
export declare class ItemClaimsService {
    private prisma;
    private webSocketGateway;
    constructor(prisma: PrismaService, webSocketGateway: RestaurantWebSocketGateway);
    getClaimsByOrderItem(orderItemId: string): Promise<{
        orderItemId: string;
        itemName: string;
        price: number;
        quantity: number;
        totalPrice: number;
        isShareable: boolean;
        maxClaimants: number;
        claims: {
            participantId: string;
            displayName: string;
            percentage: number;
            isPaid: boolean;
        }[];
        claimantCount: number;
        priceEach: number;
        sessionId: string;
    } | null>;
    claim(orderItemId: string, participantId: string): Promise<{
        orderItemId: string;
        itemName: string;
        price: number;
        quantity: number;
        totalPrice: number;
        isShareable: boolean;
        maxClaimants: number;
        claims: {
            participantId: string;
            displayName: string;
            percentage: number;
            isPaid: boolean;
        }[];
        claimantCount: number;
        priceEach: number;
        sessionId: string;
    } | null>;
    leave(orderItemId: string, participantId: string): Promise<{
        orderItemId: string;
        itemName: string;
        price: number;
        quantity: number;
        totalPrice: number;
        isShareable: boolean;
        maxClaimants: number;
        claims: {
            participantId: string;
            displayName: string;
            percentage: number;
            isPaid: boolean;
        }[];
        claimantCount: number;
        priceEach: number;
        sessionId: string;
    } | null>;
}
