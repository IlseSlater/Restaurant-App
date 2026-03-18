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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PaymentsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const payments_service_1 = require("./payments.service");
const payment_dto_1 = require("./dto/payment.dto");
const prisma_service_1 = require("../prisma/prisma.service");
let PaymentsController = PaymentsController_1 = class PaymentsController {
    constructor(paymentsService, prisma) {
        this.paymentsService = paymentsService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(PaymentsController_1.name);
    }
    async createPaymentIntent(createPaymentDto) {
        return this.paymentsService.createPaymentIntent(createPaymentDto);
    }
    async checkout(dto) {
        return this.paymentsService.createCheckout(dto);
    }
    async getPayment(id) {
        return this.paymentsService.getPayment(id);
    }
    async getPaymentsByCompany(companyId, status) {
        return this.paymentsService.getPaymentsByCompany(companyId, status);
    }
    async updatePaymentSplit(splitId, body) {
        return this.paymentsService.updatePaymentSplit(splitId, body.status);
    }
    async cancelPayment(id) {
        return this.paymentsService.cancelPayment(id);
    }
    async handlePayFastWebhook(webhookData) {
        this.logger.log('Received PayFast webhook');
        try {
            const result = await this.paymentsService.handlePayFastWebhook(webhookData);
            if (result.success) {
                this.logger.log(`PayFast webhook processed successfully for payment: ${result.payment?.id}`);
                return { status: 'success' };
            }
            else {
                this.logger.warn(`PayFast webhook processing failed: ${result.message}`);
                return { status: 'error', message: result.message };
            }
        }
        catch (error) {
            this.logger.error('Error processing PayFast webhook:', error);
            throw error;
        }
    }
    async createBillPayment(customerOrderId, body) {
        const customerOrder = await this.prisma.customerOrder.findUnique({
            where: { id: customerOrderId },
            include: {
                customerSession: true,
                table: true
            }
        });
        if (!customerOrder) {
            throw new common_1.BadRequestException('Customer order not found');
        }
        const subtotal = Number(customerOrder.subtotal);
        const amount = typeof body.tipAmount === 'number' && body.tipAmount >= 0
            ? subtotal + body.tipAmount
            : subtotal * (1 + (typeof body.tipPercentage === 'number' ? body.tipPercentage : 0) / 100);
        const createPaymentDto = {
            companyId: customerOrder.companyId,
            customerOrderId: customerOrder.id,
            provider: payment_dto_1.PaymentProvider.PAYFAST,
            amount: Math.round(amount * 100) / 100,
            currency: 'ZAR',
            description: `Bill payment for Table ${customerOrder.table?.number || 'Unknown'}`,
            billReference: `BILL-${customerOrder.id.slice(-8).toUpperCase()}`,
            splits: body.splits
        };
        return this.createPaymentIntent(createPaymentDto);
    }
    async createSplitBillPayment(customerOrderId, body) {
        const customerOrder = await this.prisma.customerOrder.findUnique({
            where: { id: customerOrderId }
        });
        if (!customerOrder) {
            throw new common_1.BadRequestException('Customer order not found');
        }
        const totalSplitAmount = body.splits.reduce((sum, split) => sum + split.amount, 0);
        const orderTotal = Number(customerOrder.total);
        if (Math.abs(totalSplitAmount - orderTotal) > 0.01) {
            throw new common_1.BadRequestException(`Split amounts (${totalSplitAmount}) do not match order total (${orderTotal})`);
        }
        const splitPayments = [];
        for (const split of body.splits) {
            const createPaymentDto = {
                companyId: customerOrder.companyId,
                customerOrderId: customerOrder.id,
                provider: payment_dto_1.PaymentProvider.PAYFAST,
                amount: split.amount,
                currency: 'ZAR',
                description: `Split payment for ${split.payerName}`,
                billReference: `SPLIT-${customerOrder.id.slice(-8).toUpperCase()}-${split.payerName.slice(0, 3).toUpperCase()}`,
                splits: [{
                        payerName: split.payerName,
                        amount: split.amount,
                        email: split.email,
                        phoneNumber: split.phoneNumber
                    }]
            };
            const payment = await this.createPaymentIntent(createPaymentDto);
            splitPayments.push(payment);
        }
        return {
            splitPayments,
            totalAmount: orderTotal,
            splitCount: body.splits.length
        };
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Post)('intent'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [payment_dto_1.CreatePaymentDto]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "createPaymentIntent", null);
__decorate([
    (0, common_1.Post)('checkout'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [payment_dto_1.CheckoutDto]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "checkout", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getPayment", null);
__decorate([
    (0, common_1.Get)('company/:companyId'),
    __param(0, (0, common_1.Param)('companyId')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getPaymentsByCompany", null);
__decorate([
    (0, common_1.Put)('splits/:splitId/status'),
    __param(0, (0, common_1.Param)('splitId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "updatePaymentSplit", null);
__decorate([
    (0, common_1.Put)(':id/cancel'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "cancelPayment", null);
__decorate([
    (0, common_1.Post)('webhook/payfast'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [payment_dto_1.PayFastWebhookDto]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "handlePayFastWebhook", null);
__decorate([
    (0, common_1.Post)('bill/:customerOrderId'),
    __param(0, (0, common_1.Param)('customerOrderId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "createBillPayment", null);
__decorate([
    (0, common_1.Post)('bill/:customerOrderId/split'),
    __param(0, (0, common_1.Param)('customerOrderId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "createSplitBillPayment", null);
exports.PaymentsController = PaymentsController = PaymentsController_1 = __decorate([
    (0, common_1.Controller)('payments'),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService,
        prisma_service_1.PrismaService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map