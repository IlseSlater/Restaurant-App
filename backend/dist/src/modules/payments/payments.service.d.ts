import { PrismaService } from '../prisma/prisma.service';
import { RestaurantWebSocketGateway } from '../websocket/websocket.gateway';
import { PayFastProvider } from './providers/payfast.provider';
import { CreatePaymentDto, PaymentSplitDto, PayFastWebhookDto, PaymentStatus, CheckoutDto } from './dto/payment.dto';
export declare class PaymentsService {
    private prisma;
    private webSocketGateway;
    private payFastProvider;
    private readonly logger;
    constructor(prisma: PrismaService, webSocketGateway: RestaurantWebSocketGateway, payFastProvider: PayFastProvider);
    createPaymentIntent(createPaymentDto: CreatePaymentDto): Promise<{
        payment: $Result.GetResult<import(".prisma/client").Prisma.$PaymentPayload<ExtArgs>, T, "create">;
        providerData: {
            formData: import("./dto/payment.dto").PayFastPaymentDto;
            paymentUrl: string;
            formHtml: string;
        } | null;
    }>;
    createCheckout(dto: CheckoutDto): Promise<{
        payment: $Result.GetResult<import(".prisma/client").Prisma.$PaymentPayload<ExtArgs>, T, "create">;
        providerData: {
            formData: import("./dto/payment.dto").PayFastPaymentDto;
            paymentUrl: string;
            formHtml: string;
        };
    }>;
    private handlePaymentSettled;
    createPaymentSplits(paymentId: string, splits: PaymentSplitDto[]): Promise<any>;
    private createPayFastPayment;
    handlePayFastWebhook(webhookData: PayFastWebhookDto): Promise<{
        success: boolean;
        message: string;
        payment?: undefined;
    } | {
        success: boolean;
        payment: $Result.GetResult<import(".prisma/client").Prisma.$PaymentPayload<ExtArgs>, T, "update">;
        message?: undefined;
    }>;
    private markOrdersAsPaid;
    getPayment(paymentId: string): Promise<any>;
    getPaymentsByCompany(companyId: string, status?: PaymentStatus): Promise<$Public.PrismaPromise<T>>;
    updatePaymentSplit(splitId: string, status: PaymentStatus): Promise<$Result.GetResult<import(".prisma/client").Prisma.$PaymentSplitPayload<ExtArgs>, T, "update">>;
    cancelPayment(paymentId: string): Promise<$Result.GetResult<import(".prisma/client").Prisma.$PaymentPayload<ExtArgs>, T, "update">>;
    private emitPaymentUpdate;
}
