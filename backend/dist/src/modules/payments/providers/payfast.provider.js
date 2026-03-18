"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PayFastProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayFastProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto = require("crypto");
let PayFastProvider = PayFastProvider_1 = class PayFastProvider {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(PayFastProvider_1.name);
        this.merchantId = this.configService.get('PAYFAST_MERCHANT_ID') || '10000100';
        this.merchantKey = this.configService.get('PAYFAST_MERCHANT_KEY') || '46f0cd694581a';
        this.passphrase = this.configService.get('PAYFAST_PASSPHRASE') || 'jt7NOE43FZPn';
        this.sandbox = this.configService.get('NODE_ENV') !== 'production';
        this.baseUrl = this.sandbox ? 'https://sandbox.payfast.co.za' : 'https://www.payfast.co.za';
    }
    createPaymentForm(data) {
        const baseUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:4200';
        const paymentData = {
            merchant_id: this.merchantId,
            merchant_key: this.merchantKey,
            return_url: `${baseUrl}/payment/success`,
            cancel_url: `${baseUrl}/payment/cancel`,
            notify_url: `${this.configService.get('BACKEND_URL') || 'http://localhost:3000'}/api/payments/webhook/payfast`,
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
        paymentData.signature = this.generateSignature(paymentData);
        return paymentData;
    }
    generateSignature(data) {
        let paramString = '';
        const sortedKeys = Object.keys(data).sort();
        for (const key of sortedKeys) {
            if (key !== 'signature' && data[key] !== '' && data[key] !== null && data[key] !== undefined) {
                paramString += `${key}=${encodeURIComponent(data[key]).replace(/%20/g, '+')}&`;
            }
        }
        paramString = paramString.slice(0, -1);
        if (this.passphrase) {
            paramString += `&passphrase=${encodeURIComponent(this.passphrase)}`;
        }
        this.logger.debug(`PayFast signature string: ${paramString}`);
        return crypto.createHash('md5').update(paramString).digest('hex');
    }
    validateWebhookSignature(data) {
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
    async validateWebhookWithPayFast(data) {
        try {
            const validHosts = [
                'www.payfast.co.za',
                'sandbox.payfast.co.za',
                'w1w.payfast.co.za',
                'w2w.payfast.co.za'
            ];
            return this.validateWebhookSignature(data);
        }
        catch (error) {
            this.logger.error('Error validating PayFast webhook:', error);
            return false;
        }
    }
    getPaymentUrl() {
        return `${this.baseUrl}/eng/process`;
    }
    parsePaymentStatus(payfastStatus) {
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
    generatePaymentFormHtml(paymentData) {
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
};
exports.PayFastProvider = PayFastProvider;
exports.PayFastProvider = PayFastProvider = PayFastProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PayFastProvider);
//# sourceMappingURL=payfast.provider.js.map