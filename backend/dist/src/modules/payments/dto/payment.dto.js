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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayFastWebhookDto = exports.PayFastPaymentDto = exports.CheckoutDto = exports.PaymentSplitDto = exports.CreatePaymentDto = exports.PaymentStatus = exports.PaymentProvider = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var PaymentProvider;
(function (PaymentProvider) {
    PaymentProvider["PAYFAST"] = "PAYFAST";
    PaymentProvider["STRIPE"] = "STRIPE";
    PaymentProvider["MANUAL"] = "MANUAL";
})(PaymentProvider || (exports.PaymentProvider = PaymentProvider = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["AUTHORIZED"] = "AUTHORIZED";
    PaymentStatus["PAID"] = "PAID";
    PaymentStatus["PARTIALLY_PAID"] = "PARTIALLY_PAID";
    PaymentStatus["FAILED"] = "FAILED";
    PaymentStatus["CANCELLED"] = "CANCELLED";
    PaymentStatus["REFUNDED"] = "REFUNDED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
class CreatePaymentDto {
}
exports.CreatePaymentDto = CreatePaymentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePaymentDto.prototype, "companyId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePaymentDto.prototype, "orderId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePaymentDto.prototype, "customerOrderId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(PaymentProvider),
    __metadata("design:type", String)
], CreatePaymentDto.prototype, "provider", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreatePaymentDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePaymentDto.prototype, "currency", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePaymentDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePaymentDto.prototype, "billReference", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PaymentSplitDto),
    __metadata("design:type", Array)
], CreatePaymentDto.prototype, "splits", void 0);
class PaymentSplitDto {
}
exports.PaymentSplitDto = PaymentSplitDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PaymentSplitDto.prototype, "customerSessionId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PaymentSplitDto.prototype, "participantId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PaymentSplitDto.prototype, "payerName", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], PaymentSplitDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PaymentSplitDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PaymentSplitDto.prototype, "phoneNumber", void 0);
class CheckoutDto {
}
exports.CheckoutDto = CheckoutDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CheckoutDto.prototype, "payerParticipantId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CheckoutDto.prototype, "payForParticipantIds", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CheckoutDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CheckoutDto.prototype, "isFullTable", void 0);
class PayFastPaymentDto {
}
exports.PayFastPaymentDto = PayFastPaymentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PayFastPaymentDto.prototype, "merchant_id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PayFastPaymentDto.prototype, "merchant_key", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PayFastPaymentDto.prototype, "return_url", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PayFastPaymentDto.prototype, "cancel_url", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PayFastPaymentDto.prototype, "notify_url", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PayFastPaymentDto.prototype, "name_first", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PayFastPaymentDto.prototype, "name_last", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PayFastPaymentDto.prototype, "email_address", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PayFastPaymentDto.prototype, "m_payment_id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PayFastPaymentDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PayFastPaymentDto.prototype, "item_name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PayFastPaymentDto.prototype, "item_description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PayFastPaymentDto.prototype, "custom_str1", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PayFastPaymentDto.prototype, "custom_str2", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PayFastPaymentDto.prototype, "custom_str3", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PayFastPaymentDto.prototype, "signature", void 0);
class PayFastWebhookDto {
}
exports.PayFastWebhookDto = PayFastWebhookDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PayFastWebhookDto.prototype, "m_payment_id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PayFastWebhookDto.prototype, "pf_payment_id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PayFastWebhookDto.prototype, "payment_status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PayFastWebhookDto.prototype, "item_name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PayFastWebhookDto.prototype, "item_description", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PayFastWebhookDto.prototype, "amount_gross", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PayFastWebhookDto.prototype, "amount_fee", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PayFastWebhookDto.prototype, "amount_net", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PayFastWebhookDto.prototype, "custom_str1", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PayFastWebhookDto.prototype, "custom_str2", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PayFastWebhookDto.prototype, "custom_str3", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PayFastWebhookDto.prototype, "signature", void 0);
//# sourceMappingURL=payment.dto.js.map