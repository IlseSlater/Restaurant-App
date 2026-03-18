export declare enum PaymentProvider {
    PAYFAST = "PAYFAST",
    STRIPE = "STRIPE",
    MANUAL = "MANUAL"
}
export declare enum PaymentStatus {
    PENDING = "PENDING",
    AUTHORIZED = "AUTHORIZED",
    PAID = "PAID",
    PARTIALLY_PAID = "PARTIALLY_PAID",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED",
    REFUNDED = "REFUNDED"
}
export declare class CreatePaymentDto {
    companyId: string;
    orderId?: string;
    customerOrderId?: string;
    provider: PaymentProvider;
    amount: number;
    currency?: string;
    description?: string;
    billReference?: string;
    splits?: PaymentSplitDto[];
}
export declare class PaymentSplitDto {
    customerSessionId?: string;
    participantId?: string;
    payerName?: string;
    amount: number;
    email?: string;
    phoneNumber?: string;
}
export declare class CheckoutDto {
    payerParticipantId: string;
    payForParticipantIds: string[];
    amount: number;
    isFullTable?: boolean;
}
export declare class PayFastPaymentDto {
    merchant_id: string;
    merchant_key: string;
    return_url: string;
    cancel_url: string;
    notify_url: string;
    name_first: string;
    name_last?: string;
    email_address?: string;
    m_payment_id: string;
    amount: string;
    item_name: string;
    item_description?: string;
    custom_str1?: string;
    custom_str2?: string;
    custom_str3?: string;
    signature: string;
}
export declare class PayFastWebhookDto {
    m_payment_id: string;
    pf_payment_id: string;
    payment_status: string;
    item_name: string;
    item_description?: string;
    amount_gross: string;
    amount_fee: string;
    amount_net: string;
    custom_str1?: string;
    custom_str2?: string;
    custom_str3?: string;
    signature: string;
}
