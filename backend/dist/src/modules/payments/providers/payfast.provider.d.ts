import { ConfigService } from '@nestjs/config';
import { PayFastPaymentDto, PayFastWebhookDto } from '../dto/payment.dto';
export declare class PayFastProvider {
    private configService;
    private readonly logger;
    private readonly merchantId;
    private readonly merchantKey;
    private readonly passphrase;
    private readonly sandbox;
    private readonly baseUrl;
    constructor(configService: ConfigService);
    createPaymentForm(data: {
        paymentId: string;
        amount: number;
        customerName: string;
        customerEmail?: string;
        description: string;
        customData?: {
            [key: string]: string;
        };
    }): PayFastPaymentDto;
    private generateSignature;
    validateWebhookSignature(data: PayFastWebhookDto): boolean;
    validateWebhookWithPayFast(data: PayFastWebhookDto): Promise<boolean>;
    getPaymentUrl(): string;
    parsePaymentStatus(payfastStatus: string): string;
    generatePaymentFormHtml(paymentData: PayFastPaymentDto): string;
}
