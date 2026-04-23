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
    createCheckout(dto: CheckoutDto): Promise<{
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
    private handlePaymentSettled;
    createPaymentSplits(paymentId: string, splits: PaymentSplitDto[]): Promise<{
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
    }[]>;
    private createPayFastPayment;
    handlePayFastWebhook(webhookData: PayFastWebhookDto): Promise<{
        success: boolean;
        message: string;
        payment?: undefined;
    } | {
        success: boolean;
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
        message?: undefined;
    }>;
    private markOrdersAsPaid;
    getPayment(paymentId: string): Promise<({
        order: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            notes: string | null;
            tableId: string;
            customerId: string | null;
            status: import(".prisma/client").$Enums.OrderStatus;
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
            tableId: string;
            status: string;
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
            tableId: string;
            customerId: string | null;
            status: import(".prisma/client").$Enums.OrderStatus;
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
            tableId: string;
            status: string;
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
    updatePaymentSplit(splitId: string, status: PaymentStatus): Promise<{
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
    cancelPayment(paymentId: string): Promise<{
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
    private emitPaymentUpdate;
}
