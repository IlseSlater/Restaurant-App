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
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const websocket_gateway_1 = require("../websocket/websocket.gateway");
const payfast_provider_1 = require("./providers/payfast.provider");
const payment_dto_1 = require("./dto/payment.dto");
let PaymentsService = PaymentsService_1 = class PaymentsService {
    constructor(prisma, webSocketGateway, payFastProvider) {
        this.prisma = prisma;
        this.webSocketGateway = webSocketGateway;
        this.payFastProvider = payFastProvider;
        this.logger = new common_1.Logger(PaymentsService_1.name);
    }
    async createPaymentIntent(createPaymentDto) {
        const payment = await this.prisma.payment.create({
            data: {
                companyId: createPaymentDto.companyId,
                orderId: createPaymentDto.orderId,
                customerOrderId: createPaymentDto.customerOrderId,
                provider: createPaymentDto.provider,
                amount: createPaymentDto.amount,
                currency: createPaymentDto.currency || 'ZAR',
                status: payment_dto_1.PaymentStatus.PENDING,
                description: createPaymentDto.description,
                billReference: createPaymentDto.billReference,
                metadata: {
                    createdBy: 'system',
                    timestamp: new Date().toISOString()
                }
            }
        });
        if (createPaymentDto.splits && createPaymentDto.splits.length > 0) {
            await this.createPaymentSplits(payment.id, createPaymentDto.splits);
        }
        let providerData = null;
        if (createPaymentDto.provider === payment_dto_1.PaymentProvider.PAYFAST) {
            providerData = await this.createPayFastPayment(payment);
        }
        return {
            payment,
            providerData
        };
    }
    async createCheckout(dto) {
        const payer = await this.prisma.participant.findUnique({
            where: { id: dto.payerParticipantId },
            include: { customerSession: { include: { table: true } } }
        });
        if (!payer?.customerSession) {
            throw new common_1.BadRequestException('Payer participant or session not found');
        }
        const sessionId = payer.customerSessionId;
        const companyId = payer.customerSession.companyId;
        const sessionParticipantIds = await this.prisma.participant.findMany({
            where: { customerSessionId: sessionId },
            select: { id: true }
        }).then(rows => rows.map(r => r.id));
        for (const id of dto.payForParticipantIds) {
            if (!sessionParticipantIds.includes(id)) {
                throw new common_1.BadRequestException(`Participant ${id} is not in this session`);
            }
        }
        const payment = await this.prisma.payment.create({
            data: {
                companyId,
                customerOrderId: null,
                orderId: null,
                provider: payment_dto_1.PaymentProvider.PAYFAST,
                amount: dto.amount,
                currency: 'ZAR',
                status: payment_dto_1.PaymentStatus.PENDING,
                description: `Table ${payer.customerSession.table?.number ?? '?'} – pay for ${dto.payForParticipantIds.length} participant(s)`,
                billReference: `CHECKOUT-${sessionId.slice(-8).toUpperCase()}`,
                metadata: {
                    customerSessionId: sessionId,
                    payerParticipantId: dto.payerParticipantId,
                    payForParticipantIds: dto.payForParticipantIds,
                    isFullTable: !!dto.isFullTable
                }
            }
        });
        const amountPerParticipant = dto.amount / dto.payForParticipantIds.length;
        const splits = dto.payForParticipantIds.map(pid => ({
            customerSessionId: sessionId,
            participantId: pid,
            payerName: payer.displayName,
            amount: Math.round(amountPerParticipant * 100) / 100
        }));
        await this.createPaymentSplits(payment.id, splits);
        const providerData = await this.createPayFastPayment(payment);
        return { payment, providerData };
    }
    async handlePaymentSettled(payment, meta) {
        const { customerSessionId, payerParticipantId, payForParticipantIds } = meta;
        await this.prisma.itemClaim.updateMany({
            where: { participantId: { in: payForParticipantIds } },
            data: { isPaid: true }
        });
        await this.prisma.customerOrder.updateMany({
            where: {
                customerSessionId,
                participantId: { in: payForParticipantIds }
            },
            data: { paymentStatus: 'PAID', status: 'COMPLETED' }
        });
        const payer = await this.prisma.participant.findUnique({
            where: { id: payerParticipantId },
            select: { displayName: true }
        });
        const payerDisplayName = payer?.displayName ?? 'Someone';
        const sessionOrders = await this.prisma.customerOrder.findMany({
            where: { customerSessionId },
            select: { total: true }
        });
        const sessionTotal = sessionOrders.reduce((sum, o) => sum + Number(o.total), 0);
        const paidPayments = await this.prisma.payment.findMany({
            where: {
                status: payment_dto_1.PaymentStatus.PAID,
                metadata: { path: ['customerSessionId'], equals: customerSessionId }
            },
            select: { amount: true }
        });
        const paidSum = paidPayments.reduce((s, p) => s + Number(p.amount), 0);
        const remainingTableTotal = Math.max(0, Math.round((sessionTotal - paidSum) * 100) / 100);
        await this.prisma.paymentSplit.updateMany({
            where: { paymentId: payment.id },
            data: { status: payment_dto_1.PaymentStatus.PAID }
        });
        this.webSocketGateway.server
            .to(`customer-${customerSessionId}`)
            .emit('payment_settled', {
            type: 'PAYMENT_SETTLED',
            payerDisplayName,
            payerParticipantId,
            coveredParticipantIds: payForParticipantIds,
            remainingTableTotal,
            timestamp: new Date().toISOString()
        });
        const session = await this.prisma.customerSession.findUnique({ where: { id: customerSessionId }, select: { companyId: true } });
        if (session?.companyId) {
            this.webSocketGateway.emitToCompany(session.companyId, 'waiters', 'payment_status_updated', {
                customerSessionId,
                remainingTableTotal,
                timestamp: new Date().toISOString()
            });
        }
        this.logger.log(`Emitted payment_settled to customer-${customerSessionId}, remaining=${remainingTableTotal}`);
    }
    async createPaymentSplits(paymentId, splits) {
        const splitPromises = splits.map(split => this.prisma.paymentSplit.create({
            data: {
                paymentId,
                customerSessionId: split.customerSessionId,
                participantId: split.participantId,
                payerName: split.payerName,
                amount: split.amount,
                email: split.email,
                phoneNumber: split.phoneNumber,
                status: payment_dto_1.PaymentStatus.PENDING
            }
        }));
        return Promise.all(splitPromises);
    }
    async createPayFastPayment(payment) {
        let customerName = 'Customer';
        let customerEmail = '';
        if (payment.customerOrderId) {
            const customerOrder = await this.prisma.customerOrder.findUnique({
                where: { id: payment.customerOrderId },
                include: { customerSession: true }
            });
            if (customerOrder?.customerSession) {
                customerName = customerOrder.customerSession.customerName;
                customerEmail = customerOrder.customerSession.phoneNumber
                    ? `${customerOrder.customerSession.phoneNumber.replace(/[^0-9]/g, '')}@temp.payfast.co.za`
                    : 'customer@restaurant.com';
            }
        }
        else {
            const meta = payment.metadata || {};
            if (meta.customerSessionId) {
                const session = await this.prisma.customerSession.findUnique({
                    where: { id: meta.customerSessionId },
                    include: { participants: { where: { id: meta.payerParticipantId }, take: 1 } }
                });
                if (session) {
                    customerName = session.participants?.[0]?.displayName ?? session.customerName;
                    customerEmail = session.phoneNumber
                        ? `${session.phoneNumber.replace(/[^0-9]/g, '')}@temp.payfast.co.za`
                        : 'customer@restaurant.com';
                }
            }
        }
        const paymentFormData = this.payFastProvider.createPaymentForm({
            paymentId: payment.id,
            amount: Number(payment.amount),
            customerName,
            customerEmail,
            description: payment.description || 'Restaurant Bill Payment',
            customData: {
                companyId: payment.companyId,
                orderId: payment.orderId || payment.customerOrderId
            }
        });
        await this.prisma.payment.update({
            where: { id: payment.id },
            data: {
                providerPaymentId: paymentFormData.m_payment_id,
                metadata: {
                    ...payment.metadata,
                    payfast: paymentFormData
                }
            }
        });
        return {
            formData: paymentFormData,
            paymentUrl: this.payFastProvider.getPaymentUrl(),
            formHtml: this.payFastProvider.generatePaymentFormHtml(paymentFormData)
        };
    }
    async handlePayFastWebhook(webhookData) {
        this.logger.log('Received PayFast webhook:', webhookData);
        if (!this.payFastProvider.validateWebhookSignature(webhookData)) {
            throw new common_1.BadRequestException('Invalid webhook signature');
        }
        const isValidWebhook = await this.payFastProvider.validateWebhookWithPayFast(webhookData);
        if (!isValidWebhook) {
            throw new common_1.BadRequestException('Webhook validation failed');
        }
        const payment = await this.prisma.payment.findFirst({
            where: { providerPaymentId: webhookData.m_payment_id },
            include: {
                splits: true,
                customerOrder: { include: { customerSession: true } },
                order: true
            }
        });
        if (!payment) {
            this.logger.warn(`Payment not found for PayFast payment ID: ${webhookData.m_payment_id}`);
            return { success: false, message: 'Payment not found' };
        }
        const newStatus = this.payFastProvider.parsePaymentStatus(webhookData.payment_status);
        const updatedPayment = await this.prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: newStatus,
                metadata: JSON.parse(JSON.stringify({
                    ...(typeof payment.metadata === 'object' && payment.metadata !== null ? payment.metadata : {}),
                    webhook: webhookData,
                    processedAt: new Date().toISOString()
                }))
            }
        });
        if (newStatus === 'PAID') {
            await this.markOrdersAsPaid(payment);
            const meta = payment.metadata || {};
            if (meta.customerSessionId && meta.payForParticipantIds?.length) {
                await this.handlePaymentSettled(updatedPayment, meta);
            }
        }
        this.emitPaymentUpdate(payment.companyId, updatedPayment);
        this.logger.log(`Payment ${payment.id} status updated to ${newStatus}`);
        return { success: true, payment: updatedPayment };
    }
    async markOrdersAsPaid(payment) {
        const updates = [];
        if (payment.orderId) {
            updates.push(this.prisma.order.update({
                where: { id: payment.orderId },
                data: { status: 'SERVED' }
            }));
        }
        if (payment.customerOrderId) {
            updates.push(this.prisma.customerOrder.update({
                where: { id: payment.customerOrderId },
                data: {
                    paymentStatus: 'PAID',
                    status: 'COMPLETED'
                }
            }));
        }
        await Promise.all(updates);
    }
    async getPayment(paymentId) {
        return this.prisma.payment.findUnique({
            where: { id: paymentId },
            include: {
                splits: true,
                customerOrder: { include: { customerSession: true } },
                order: true
            }
        });
    }
    async getPaymentsByCompany(companyId, status) {
        const where = { companyId };
        if (status) {
            where.status = status;
        }
        return this.prisma.payment.findMany({
            where,
            include: {
                splits: true,
                customerOrder: { include: { customerSession: true } },
                order: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    async updatePaymentSplit(splitId, status) {
        const split = await this.prisma.paymentSplit.update({
            where: { id: splitId },
            data: { status }
        });
        const payment = await this.prisma.payment.findUnique({
            where: { id: split.paymentId },
            include: { splits: true }
        });
        if (payment) {
            const allSplitsPaid = payment.splits.every((s) => s.status === payment_dto_1.PaymentStatus.PAID);
            const anySplitPaid = payment.splits.some((s) => s.status === payment_dto_1.PaymentStatus.PAID);
            let newPaymentStatus = payment.status;
            if (allSplitsPaid) {
                newPaymentStatus = payment_dto_1.PaymentStatus.PAID;
            }
            else if (anySplitPaid) {
                newPaymentStatus = payment_dto_1.PaymentStatus.PARTIALLY_PAID;
            }
            if (newPaymentStatus !== payment.status) {
                const updatedPayment = await this.prisma.payment.update({
                    where: { id: payment.id },
                    data: { status: newPaymentStatus }
                });
                if (newPaymentStatus === payment_dto_1.PaymentStatus.PAID) {
                    await this.markOrdersAsPaid(payment);
                }
                this.emitPaymentUpdate(payment.companyId, updatedPayment);
            }
        }
        return split;
    }
    async cancelPayment(paymentId) {
        const payment = await this.prisma.payment.update({
            where: { id: paymentId },
            data: { status: payment_dto_1.PaymentStatus.CANCELLED }
        });
        await this.prisma.paymentSplit.updateMany({
            where: { paymentId },
            data: { status: payment_dto_1.PaymentStatus.CANCELLED }
        });
        this.emitPaymentUpdate(payment.companyId, payment);
        return payment;
    }
    emitPaymentUpdate(companyId, payment) {
        this.webSocketGateway.emitToCompany(companyId, 'admin', 'payment_status_updated', {
            paymentId: payment.id,
            status: payment.status,
            amount: payment.amount,
            timestamp: new Date()
        });
        if (payment.customerOrderId) {
            this.webSocketGateway.server
                .to(`customer-${payment.customerOrder?.customerSessionId}`)
                .emit('payment_status_updated', {
                paymentId: payment.id,
                status: payment.status,
                timestamp: new Date()
            });
        }
        this.webSocketGateway.emitToCompany(companyId, 'admin', 'analytics_update', {
            type: 'payment_status_changed',
            paymentId: payment.id,
            status: payment.status,
            amount: payment.amount,
            timestamp: new Date()
        });
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        websocket_gateway_1.RestaurantWebSocketGateway,
        payfast_provider_1.PayFastProvider])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map