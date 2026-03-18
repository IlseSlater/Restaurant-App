import { PaymentsService } from './payments.service';
import { CreatePaymentDto, PayFastWebhookDto, PaymentStatus, PaymentSplitDto, CheckoutDto } from './dto/payment.dto';
import { PrismaService } from '../prisma/prisma.service';
export declare class PaymentsController {
    private readonly paymentsService;
    private readonly prisma;
    private readonly logger;
    constructor(paymentsService: PaymentsService, prisma: PrismaService);
    createPaymentIntent(createPaymentDto: CreatePaymentDto): Promise<{
        payment: $Result.GetResult<import(".prisma/client").Prisma.$PaymentPayload<ExtArgs>, T, "create">;
        providerData: {
            formData: import("./dto/payment.dto").PayFastPaymentDto;
            paymentUrl: string;
            formHtml: string;
        } | null;
    }>;
    checkout(dto: CheckoutDto): Promise<{
        payment: $Result.GetResult<import(".prisma/client").Prisma.$PaymentPayload<ExtArgs>, T, "create">;
        providerData: {
            formData: import("./dto/payment.dto").PayFastPaymentDto;
            paymentUrl: string;
            formHtml: string;
        };
    }>;
    getPayment(id: string): Promise<any>;
    getPaymentsByCompany(companyId: string, status?: PaymentStatus): Promise<$Public.PrismaPromise<T>>;
    updatePaymentSplit(splitId: string, body: {
        status: PaymentStatus;
    }): Promise<$Result.GetResult<import(".prisma/client").Prisma.$PaymentSplitPayload<ExtArgs>, T, "update">>;
    cancelPayment(id: string): Promise<$Result.GetResult<import(".prisma/client").Prisma.$PaymentPayload<ExtArgs>, T, "update">>;
    handlePayFastWebhook(webhookData: PayFastWebhookDto): Promise<{
        status: string;
        message?: undefined;
    } | {
        status: string;
        message: string | undefined;
    }>;
    createBillPayment(customerOrderId: string, body: {
        splits?: PaymentSplitDto[];
        payerName?: string;
        payerEmail?: string;
        tipPercentage?: number;
        tipAmount?: number;
    }): Promise<{
        payment: $Result.GetResult<import(".prisma/client").Prisma.$PaymentPayload<ExtArgs>, T, "create">;
        providerData: {
            formData: import("./dto/payment.dto").PayFastPaymentDto;
            paymentUrl: string;
            formHtml: string;
        } | null;
    }>;
    createSplitBillPayment(customerOrderId: string, body: {
        splits: Array<{
            payerName: string;
            amount: number;
            email?: string;
            phoneNumber?: string;
        }>;
    }): Promise<{
        splitPayments: {
            payment: $Result.GetResult<import(".prisma/client").Prisma.$PaymentPayload<ExtArgs>, T, "create">;
            providerData: {
                formData: import("./dto/payment.dto").PayFastPaymentDto;
                paymentUrl: string;
                formHtml: string;
            } | null;
        }[];
        totalAmount: number;
        splitCount: number;
    }>;
}
