import { PaymentsService } from './payments.service';
import { CreatePaymentDto, PayFastWebhookDto, PaymentStatus, PaymentSplitDto, CheckoutDto } from './dto/payment.dto';
import { PrismaService } from '../prisma/prisma.service';
export declare class PaymentsController {
    private readonly paymentsService;
    private readonly prisma;
    private readonly logger;
    constructor(paymentsService: PaymentsService, prisma: PrismaService);
    createPaymentIntent(createPaymentDto: CreatePaymentDto): Promise<{
        payment: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            status: import(".prisma/client").$Enums.PaymentStatus;
            orderId: string | null;
            customerOrderId: string | null;
            currency: string;
            provider: import(".prisma/client").$Enums.PaymentProvider;
            providerPaymentId: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            paymentMethod: string | null;
            billReference: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
        };
        providerData: {
            formData?: any;
            paymentUrl?: string;
            formHtml?: string;
        } | null;
    }>;
    checkout(dto: CheckoutDto): Promise<{
        payment: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            status: import(".prisma/client").$Enums.PaymentStatus;
            orderId: string | null;
            customerOrderId: string | null;
            currency: string;
            provider: import(".prisma/client").$Enums.PaymentProvider;
            providerPaymentId: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            paymentMethod: string | null;
            billReference: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
        };
        providerData: {
            formData: import("./dto/payment.dto").PayFastPaymentDto;
            paymentUrl: string;
            formHtml: string;
        };
    }>;
    getPayment(id: string): Promise<({
        order: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            notes: string | null;
            status: import(".prisma/client").$Enums.OrderStatus;
            tableId: string;
            customerId: string | null;
            total: import("@prisma/client/runtime/library").Decimal;
        } | null;
        customerOrder: ({
            customerSession: {
                id: string;
                companyId: string;
                isActive: boolean;
                tableId: string;
                phoneNumber: string | null;
                customerName: string;
                dietaryPreferences: string[];
                allergies: string[];
                sessionStart: Date;
                sessionEnd: Date | null;
                lastActivity: Date;
                scanLocation: import("@prisma/client/runtime/library").JsonValue | null;
                expectedLocation: import("@prisma/client/runtime/library").JsonValue | null;
                billPaidBy: string | null;
                billPaidAt: Date | null;
                expiryReason: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            status: string;
            tableId: string;
            total: import("@prisma/client/runtime/library").Decimal;
            customerSessionId: string;
            participantId: string | null;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            serviceFee: import("@prisma/client/runtime/library").Decimal;
            serviceFeePercentage: import("@prisma/client/runtime/library").Decimal;
            paymentStatus: string;
        }) | null;
        splits: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string | null;
            status: import(".prisma/client").$Enums.PaymentStatus;
            customerSessionId: string | null;
            participantId: string | null;
            phoneNumber: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            paymentId: string;
            payerName: string | null;
        }[];
    } & {
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        orderId: string | null;
        customerOrderId: string | null;
        currency: string;
        provider: import(".prisma/client").$Enums.PaymentProvider;
        providerPaymentId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        paymentMethod: string | null;
        billReference: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }) | null>;
    getPaymentsByCompany(companyId: string, status?: PaymentStatus): Promise<({
        order: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            notes: string | null;
            status: import(".prisma/client").$Enums.OrderStatus;
            tableId: string;
            customerId: string | null;
            total: import("@prisma/client/runtime/library").Decimal;
        } | null;
        customerOrder: ({
            customerSession: {
                id: string;
                companyId: string;
                isActive: boolean;
                tableId: string;
                phoneNumber: string | null;
                customerName: string;
                dietaryPreferences: string[];
                allergies: string[];
                sessionStart: Date;
                sessionEnd: Date | null;
                lastActivity: Date;
                scanLocation: import("@prisma/client/runtime/library").JsonValue | null;
                expectedLocation: import("@prisma/client/runtime/library").JsonValue | null;
                billPaidBy: string | null;
                billPaidAt: Date | null;
                expiryReason: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            status: string;
            tableId: string;
            total: import("@prisma/client/runtime/library").Decimal;
            customerSessionId: string;
            participantId: string | null;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            serviceFee: import("@prisma/client/runtime/library").Decimal;
            serviceFeePercentage: import("@prisma/client/runtime/library").Decimal;
            paymentStatus: string;
        }) | null;
        splits: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string | null;
            status: import(".prisma/client").$Enums.PaymentStatus;
            customerSessionId: string | null;
            participantId: string | null;
            phoneNumber: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            paymentId: string;
            payerName: string | null;
        }[];
    } & {
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        orderId: string | null;
        customerOrderId: string | null;
        currency: string;
        provider: import(".prisma/client").$Enums.PaymentProvider;
        providerPaymentId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        paymentMethod: string | null;
        billReference: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
    updatePaymentSplit(splitId: string, body: {
        status: PaymentStatus;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string | null;
        status: import(".prisma/client").$Enums.PaymentStatus;
        customerSessionId: string | null;
        participantId: string | null;
        phoneNumber: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        paymentId: string;
        payerName: string | null;
    }>;
    cancelPayment(id: string): Promise<{
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        orderId: string | null;
        customerOrderId: string | null;
        currency: string;
        provider: import(".prisma/client").$Enums.PaymentProvider;
        providerPaymentId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        paymentMethod: string | null;
        billReference: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
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
        payment: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            status: import(".prisma/client").$Enums.PaymentStatus;
            orderId: string | null;
            customerOrderId: string | null;
            currency: string;
            provider: import(".prisma/client").$Enums.PaymentProvider;
            providerPaymentId: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            paymentMethod: string | null;
            billReference: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
        };
        providerData: {
            formData?: any;
            paymentUrl?: string;
            formHtml?: string;
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
        splitPayments: any[];
        totalAmount: number;
        splitCount: number;
    }>;
}
