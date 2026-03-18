import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PayFastPaymentDto, PayFastWebhookDto } from '../dto/payment.dto';

@Injectable()
export class PayFastProvider {
  private readonly logger = new Logger(PayFastProvider.name);
  private readonly merchantId: string;
  private readonly merchantKey: string;
  private readonly passphrase: string;
  private readonly sandbox: boolean;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.merchantId = this.configService.get<string>('PAYFAST_MERCHANT_ID') || '10000100';
    this.merchantKey = this.configService.get<string>('PAYFAST_MERCHANT_KEY') || '46f0cd694581a';
    this.passphrase = this.configService.get<string>('PAYFAST_PASSPHRASE') || 'jt7NOE43FZPn';
    this.sandbox = this.configService.get<string>('NODE_ENV') !== 'production';
    this.baseUrl = this.sandbox ? 'https://sandbox.payfast.co.za' : 'https://www.payfast.co.za';
  }

  /**
   * Create PayFast payment form data
   */
  createPaymentForm(data: {
    paymentId: string;
    amount: number;
    customerName: string;
    customerEmail?: string;
    description: string;
    customData?: { [key: string]: string };
  }): PayFastPaymentDto {
    const baseUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4200';
    
    const paymentData = {
      merchant_id: this.merchantId,
      merchant_key: this.merchantKey,
      return_url: `${baseUrl}/payment/success`,
      cancel_url: `${baseUrl}/payment/cancel`,
      notify_url: `${this.configService.get<string>('BACKEND_URL') || 'http://localhost:3000'}/api/payments/webhook/payfast`,
      name_first: data.customerName.split(' ')[0] || data.customerName,
      name_last: data.customerName.split(' ').slice(1).join(' ') || '',
      email_address: data.customerEmail || '',
      m_payment_id: data.paymentId,
      amount: data.amount.toFixed(2),
      item_name: data.description,
      item_description: data.description,
      custom_str1: data.customData?.companyId || '',
      custom_str2: data.customData?.orderId || '',
      custom_str3: data.customData?.splitId || '',
      signature: ''
    };

    // Generate signature
    paymentData.signature = this.generateSignature(paymentData);

    return paymentData;
  }

  /**
   * Generate PayFast signature
   */
  private generateSignature(data: any): string {
    // Create parameter string
    let paramString = '';
    const sortedKeys = Object.keys(data).sort();
    
    for (const key of sortedKeys) {
      if (key !== 'signature' && data[key] !== '' && data[key] !== null && data[key] !== undefined) {
        paramString += `${key}=${encodeURIComponent(data[key]).replace(/%20/g, '+')}&`;
      }
    }
    
    // Remove trailing &
    paramString = paramString.slice(0, -1);
    
    // Add passphrase if provided
    if (this.passphrase) {
      paramString += `&passphrase=${encodeURIComponent(this.passphrase)}`;
    }

    this.logger.debug(`PayFast signature string: ${paramString}`);
    
    // Generate MD5 hash
    return crypto.createHash('md5').update(paramString).digest('hex');
  }

  /**
   * Validate PayFast webhook signature
   */
  validateWebhookSignature(data: PayFastWebhookDto): boolean {
    const receivedSignature = data.signature;
    const calculatedSignature = this.generateSignature({
      ...data,
      signature: undefined
    });

    const isValid = receivedSignature === calculatedSignature;
    
    if (!isValid) {
      this.logger.warn(`PayFast webhook signature validation failed. Received: ${receivedSignature}, Calculated: ${calculatedSignature}`);
    }

    return isValid;
  }

  /**
   * Validate PayFast webhook by checking with PayFast servers
   */
  async validateWebhookWithPayFast(data: PayFastWebhookDto): Promise<boolean> {
    try {
      const validHosts = [
        'www.payfast.co.za',
        'sandbox.payfast.co.za',
        'w1w.payfast.co.za',
        'w2w.payfast.co.za'
      ];

      // In a real implementation, you would check the request IP
      // For now, we'll just validate the signature
      return this.validateWebhookSignature(data);
    } catch (error) {
      this.logger.error('Error validating PayFast webhook:', error);
      return false;
    }
  }

  /**
   * Get PayFast payment URL
   */
  getPaymentUrl(): string {
    return `${this.baseUrl}/eng/process`;
  }

  /**
   * Parse PayFast payment status
   */
  parsePaymentStatus(payfastStatus: string): string {
    switch (payfastStatus.toLowerCase()) {
      case 'complete':
        return 'PAID';
      case 'cancelled':
        return 'CANCELLED';
      case 'failed':
        return 'FAILED';
      default:
        return 'PENDING';
    }
  }

  /**
   * Create payment form HTML for frontend
   */
  generatePaymentFormHtml(paymentData: PayFastPaymentDto): string {
    const formFields = Object.entries(paymentData)
      .map(([key, value]) => `<input type="hidden" name="${key}" value="${value}">`)
      .join('\n');

    return `
      <form action="${this.getPaymentUrl()}" method="post" id="payfast-form">
        ${formFields}
        <button type="submit">Pay with PayFast</button>
      </form>
      <script>
        // Auto-submit form
        document.getElementById('payfast-form').submit();
      </script>
    `;
  }
}
