export type PaymentStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface Payment {
  id: string;
  companyId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  customerOrderId?: string;
  customerSessionId?: string;
  paidBy?: string;
  billPaidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentIntent {
  id: string;
  clientSecret?: string;
  amount: number;
  currency: string;
}

export interface BillPaymentRequest {
  customerOrderId: string;
  amount?: number;
}
