import { ItemClaimsService } from './item-claims.service';
export declare class ItemClaimsController {
    private readonly itemClaimsService;
    constructor(itemClaimsService: ItemClaimsService);
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
    claim(body: {
        orderItemId: string;
        participantId: string;
    }): Promise<{
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
    leave(body: {
        orderItemId: string;
        participantId: string;
    }): Promise<{
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
