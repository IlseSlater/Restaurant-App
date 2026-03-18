import { ItemClaimsService } from './item-claims.service';
export declare class ItemClaimsController {
    private readonly itemClaimsService;
    constructor(itemClaimsService: ItemClaimsService);
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
    claim(body: {
        orderItemId: string;
        participantId: string;
    }): Promise<{
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
    leave(body: {
        orderItemId: string;
        participantId: string;
    }): Promise<{
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
