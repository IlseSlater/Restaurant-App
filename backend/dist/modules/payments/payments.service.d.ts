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
            description: string | null;
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            currency: string;
            status: import(".prisma/client").$Enums.PaymentStatus;
            orderId: string | null;
            customerOrderId: string | null;
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
            description: string | null;
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            currency: string;
            status: import(".prisma/client").$Enums.PaymentStatus;
            orderId: string | null;
            customerOrderId: string | null;
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
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.PaymentStatus;
        phoneNumber: string | null;
        customerSessionId: string | null;
        participantId: string | null;
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
            description: string | null;
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            currency: string;
            status: import(".prisma/client").$Enums.PaymentStatus;
            orderId: string | null;
            customerOrderId: string | null;
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
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.OrderStatus;
            tableId: string;
            customerId: string | null;
            total: import("@prisma/client/runtime/library").Decimal;
            notes: string | null;
        } | null;
        customerOrder: ({
            customerSession: {
                id: string;
                companyId: string;
                isActive: boolean;
                tableId: string;
                customerName: string;
                phoneNumber: string | null;
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
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
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
            email: string | null;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.PaymentStatus;
            phoneNumber: string | null;
            customerSessionId: string | null;
            participantId: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            paymentId: string;
            payerName: string | null;
        }[];
    } & {
        description: string | null;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        currency: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        orderId: string | null;
        customerOrderId: string | null;
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
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.OrderStatus;
            tableId: string;
            customerId: string | null;
            total: import("@prisma/client/runtime/library").Decimal;
            notes: string | null;
        } | null;
        customerOrder: ({
            customerSession: {
                id: string;
                companyId: string;
                isActive: boolean;
                tableId: string;
                customerName: string;
                phoneNumber: string | null;
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
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
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
            email: string | null;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.PaymentStatus;
            phoneNumber: string | null;
            customerSessionId: string | null;
            participantId: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            paymentId: string;
            payerName: string | null;
        }[];
    } & {
        description: string | null;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        currency: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        orderId: string | null;
        customerOrderId: string | null;
        provider: import(".prisma/client").$Enums.PaymentProvider;
        providerPaymentId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        paymentMethod: string | null;
        billReference: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
    updatePaymentSplit(splitId: string, status: PaymentStatus): Promise<{
        id: string;
        email: string | null;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.PaymentStatus;
        phoneNumber: string | null;
        customerSessionId: string | null;
        participantId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        paymentId: string;
        payerName: string | null;
    }>;
    cancelPayment(paymentId: string): Promise<{
        description: string | null;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        currency: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        orderId: string | null;
        customerOrderId: string | null;
        provider: import(".prisma/client").$Enums.PaymentProvider;
        providerPaymentId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        paymentMethod: string | null;
        billReference: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    private emitPaymentUpdate;
}
