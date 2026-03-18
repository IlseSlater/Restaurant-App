import { IsString, IsNumber, IsOptional, IsEnum, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export enum PaymentProvider {
  PAYFAST = 'PAYFAST',
  STRIPE = 'STRIPE',
  MANUAL = 'MANUAL'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  AUTHORIZED = 'AUTHORIZED',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export class CreatePaymentDto {
  @IsString()
  companyId: string;

  @IsOptional()
  @IsString()
  orderId?: string;

  @IsOptional()
  @IsString()
  customerOrderId?: string;

  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  billReference?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentSplitDto)
  splits?: PaymentSplitDto[];
}

export class PaymentSplitDto {
  @IsOptional()
  @IsString()
  customerSessionId?: string;

  @IsOptional()
  @IsString()
  participantId?: string;

  @IsOptional()
  @IsString()
  payerName?: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;
}

/** Pay for self and/or others (e.g. husband pays for wife, or one person pays full table). */
export class CheckoutDto {
  @IsString()
  payerParticipantId: string;

  @IsArray()
  @IsString({ each: true })
  payForParticipantIds: string[];

  @IsNumber()
  amount: number;

  @IsOptional()
  isFullTable?: boolean;
}

export class PayFastPaymentDto {
  @IsString()
  merchant_id: string;

  @IsString()
  merchant_key: string;

  @IsString()
  return_url: string;

  @IsString()
  cancel_url: string;

  @IsString()
  notify_url: string;

  @IsString()
  name_first: string;

  @IsOptional()
  @IsString()
  name_last?: string;

  @IsOptional()
  @IsString()
  email_address?: string;

  @IsString()
  m_payment_id: string;

  @IsString()
  amount: string;

  @IsString()
  item_name: string;

  @IsOptional()
  @IsString()
  item_description?: string;

  @IsOptional()
  @IsString()
  custom_str1?: string;

  @IsOptional()
  @IsString()
  custom_str2?: string;

  @IsOptional()
  @IsString()
  custom_str3?: string;

  @IsString()
  signature: string;
}

export class PayFastWebhookDto {
  @IsString()
  m_payment_id: string;

  @IsString()
  pf_payment_id: string;

  @IsString()
  payment_status: string;

  @IsString()
  item_name: string;

  @IsOptional()
  @IsString()
  item_description?: string;

  @IsString()
  amount_gross: string;

  @IsString()
  amount_fee: string;

  @IsString()
  amount_net: string;

  @IsOptional()
  @IsString()
  custom_str1?: string;

  @IsOptional()
  @IsString()
  custom_str2?: string;

  @IsOptional()
  @IsString()
  custom_str3?: string;

  @IsString()
  signature: string;
}
