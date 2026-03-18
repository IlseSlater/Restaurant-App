import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RestaurantWebSocketGateway } from '../websocket/websocket.gateway';
import { PayFastProvider } from './providers/payfast.provider';
import { CreatePaymentDto, PaymentSplitDto, PayFastWebhookDto, PaymentProvider, PaymentStatus, CheckoutDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private webSocketGateway: RestaurantWebSocketGateway,
    private payFastProvider: PayFastProvider
  ) {}

  /**
   * Create a payment intent
   */
  async createPaymentIntent(createPaymentDto: CreatePaymentDto) {
    const payment = await this.prisma.payment.create({
      data: {
        companyId: createPaymentDto.companyId,
        orderId: createPaymentDto.orderId,
        customerOrderId: createPaymentDto.customerOrderId,
        provider: createPaymentDto.provider,
        amount: createPaymentDto.amount,
        currency: createPaymentDto.currency || 'ZAR',
        status: PaymentStatus.PENDING,
        description: createPaymentDto.description,
        billReference: createPaymentDto.billReference,
        metadata: {
          createdBy: 'system',
          timestamp: new Date().toISOString()
        }
      }
    });

    // Create payment splits if provided
    if (createPaymentDto.splits && createPaymentDto.splits.length > 0) {
      await this.createPaymentSplits(payment.id, createPaymentDto.splits);
    }

    // Generate provider-specific payment data
    let providerData: { formData?: any; paymentUrl?: string; formHtml?: string } | null = null;
    if (createPaymentDto.provider === PaymentProvider.PAYFAST) {
      providerData = await this.createPayFastPayment(payment);
    }

    return {
      payment,
      providerData
    };
  }

  /**
   * Checkout: one person pays for self and/or others (husband/wife or full table).
   * Creates Payment with metadata (sessionId, payerParticipantId, payForParticipantIds), one PaymentSplit per covered participant for reporting.
   */
  async createCheckout(dto: CheckoutDto) {
    const payer = await this.prisma.participant.findUnique({
      where: { id: dto.payerParticipantId },
      include: { customerSession: { include: { table: true } } }
    });
    if (!payer?.customerSession) {
      throw new BadRequestException('Payer participant or session not found');
    }
    const sessionId = payer.customerSessionId;
    const companyId = payer.customerSession.companyId;

    const sessionParticipantIds = await this.prisma.participant.findMany({
      where: { customerSessionId: sessionId },
      select: { id: true }
    }).then(rows => rows.map(r => r.id));

    for (const id of dto.payForParticipantIds) {
      if (!sessionParticipantIds.includes(id)) {
        throw new BadRequestException(`Participant ${id} is not in this session`);
      }
    }

    const payment = await this.prisma.payment.create({
      data: {
        companyId,
        customerOrderId: null,
        orderId: null,
        provider: PaymentProvider.PAYFAST,
        amount: dto.amount,
        currency: 'ZAR',
        status: PaymentStatus.PENDING,
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
    const splits: PaymentSplitDto[] = dto.payForParticipantIds.map(pid => ({
      customerSessionId: sessionId,
      participantId: pid,
      payerName: payer.displayName,
      amount: Math.round(amountPerParticipant * 100) / 100
    }));
    await this.createPaymentSplits(payment.id, splits);

    const providerData = await this.createPayFastPayment(payment);
    return { payment, providerData };
  }

  /**
   * On successful session checkout: mark claims settled, mark covered orders as PAID, emit payment_settled to table.
   */
  private async handlePaymentSettled(payment: any, meta: { customerSessionId: string; payerParticipantId: string; payForParticipantIds: string[]; isFullTable?: boolean }) {
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
        status: PaymentStatus.PAID,
        metadata: { path: ['customerSessionId'], equals: customerSessionId }
      },
      select: { amount: true }
    });
    const paidSum = paidPayments.reduce((s, p) => s + Number(p.amount), 0);
    const remainingTableTotal = Math.max(0, Math.round((sessionTotal - paidSum) * 100) / 100);

    await this.prisma.paymentSplit.updateMany({
      where: { paymentId: payment.id },
      data: { status: PaymentStatus.PAID }
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

  /**
   * Create payment splits (optionally per participant for "pay for others" reporting).
   */
  async createPaymentSplits(paymentId: string, splits: PaymentSplitDto[]) {
    const splitPromises = splits.map(split =>
      this.prisma.paymentSplit.create({
        data: {
          paymentId,
          customerSessionId: split.customerSessionId,
          participantId: split.participantId,
          payerName: split.payerName,
          amount: split.amount,
          email: split.email,
          phoneNumber: split.phoneNumber,
          status: PaymentStatus.PENDING
        }
      })
    );

    return Promise.all(splitPromises);
  }

  /**
   * Create PayFast payment
   */
  private async createPayFastPayment(payment: any) {
    // Get customer info from order or from session (checkout "pay for others")
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
    } else {
      const meta = (payment.metadata as any) || {};
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

    // Update payment with provider payment ID
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

  /**
   * Handle PayFast webhook
   */
  async handlePayFastWebhook(webhookData: PayFastWebhookDto) {
    this.logger.log('Received PayFast webhook:', webhookData);

    // Validate webhook signature
    if (!this.payFastProvider.validateWebhookSignature(webhookData)) {
      throw new BadRequestException('Invalid webhook signature');
    }

    // Additional validation with PayFast servers
    const isValidWebhook = await this.payFastProvider.validateWebhookWithPayFast(webhookData);
    if (!isValidWebhook) {
      throw new BadRequestException('Webhook validation failed');
    }

    // Find payment by provider payment ID
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

    // Parse payment status
    const newStatus = this.payFastProvider.parsePaymentStatus(webhookData.payment_status);

    // Update payment status
    const updatedPayment = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus as PaymentStatus,
        metadata: JSON.parse(JSON.stringify({
          ...(typeof payment.metadata === 'object' && payment.metadata !== null ? payment.metadata : {}),
          webhook: webhookData,
          processedAt: new Date().toISOString()
        }))
      }
    });

    // Update associated orders if payment is successful
    if (newStatus === 'PAID') {
      await this.markOrdersAsPaid(payment);
      // Session checkout (pay for others / full table): mark claims settled and notify table
      const meta = (payment.metadata as any) || {};
      if (meta.customerSessionId && meta.payForParticipantIds?.length) {
        await this.handlePaymentSettled(updatedPayment, meta);
      }
    }

    // Emit WebSocket event for real-time updates
    this.emitPaymentUpdate(payment.companyId, updatedPayment);

    this.logger.log(`Payment ${payment.id} status updated to ${newStatus}`);
    
    return { success: true, payment: updatedPayment };
  }

  /**
   * Mark associated orders as paid
   */
  private async markOrdersAsPaid(payment: any) {
    const updates: Promise<unknown>[] = [];

    if (payment.orderId) {
      updates.push(
        this.prisma.order.update({
          where: { id: payment.orderId },
          data: { status: 'SERVED' }
        })
      );
    }

    if (payment.customerOrderId) {
      updates.push(
        this.prisma.customerOrder.update({
          where: { id: payment.customerOrderId },
          data: { 
            paymentStatus: 'PAID',
            status: 'COMPLETED'
          }
        })
      );
    }

    await Promise.all(updates);
  }

  /**
   * Get payment by ID
   */
  async getPayment(paymentId: string) {
    return this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        splits: true,
        customerOrder: { include: { customerSession: true } },
        order: true
      }
    });
  }

  /**
   * Get payments for a company
   */
  async getPaymentsByCompany(companyId: string, status?: PaymentStatus) {
    const where: any = { companyId };
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

  /**
   * Update payment split status
   */
  async updatePaymentSplit(splitId: string, status: PaymentStatus) {
    const split = await this.prisma.paymentSplit.update({
      where: { id: splitId },
      data: { status }
    });

    // Check if all splits are paid
    const payment = await this.prisma.payment.findUnique({
      where: { id: split.paymentId },
      include: { splits: true }
    });

    if (payment) {
      const allSplitsPaid = payment.splits.every((s: any) => s.status === PaymentStatus.PAID);
      const anySplitPaid = payment.splits.some((s: any) => s.status === PaymentStatus.PAID);

      let newPaymentStatus = payment.status;
      if (allSplitsPaid) {
        newPaymentStatus = PaymentStatus.PAID;
      } else if (anySplitPaid) {
        newPaymentStatus = PaymentStatus.PARTIALLY_PAID;
      }

      if (newPaymentStatus !== payment.status) {
        const updatedPayment = await this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: newPaymentStatus }
        });

        // Mark orders as paid if fully paid
        if (newPaymentStatus === PaymentStatus.PAID) {
          await this.markOrdersAsPaid(payment);
        }

        // Emit WebSocket update
        this.emitPaymentUpdate(payment.companyId, updatedPayment);
      }
    }

    return split;
  }

  /**
   * Cancel payment
   */
  async cancelPayment(paymentId: string) {
    const payment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.CANCELLED }
    });

    // Cancel all splits
    await this.prisma.paymentSplit.updateMany({
      where: { paymentId },
      data: { status: PaymentStatus.CANCELLED }
    });

    // Emit WebSocket update
    this.emitPaymentUpdate(payment.companyId, payment);

    return payment;
  }

  /**
   * Emit payment update via WebSocket
   */
  private emitPaymentUpdate(companyId: string, payment: any) {
    // Emit to company-specific admin room
    this.webSocketGateway.emitToCompany(companyId, 'admin', 'payment_status_updated', {
      paymentId: payment.id,
      status: payment.status,
      amount: payment.amount,
      timestamp: new Date()
    });

    // Emit to customer if it's a customer order
    if (payment.customerOrderId) {
      this.webSocketGateway.server
        .to(`customer-${payment.customerOrder?.customerSessionId}`)
        .emit('payment_status_updated', {
          paymentId: payment.id,
          status: payment.status,
          timestamp: new Date()
        });
    }

    // Emit analytics update
    this.webSocketGateway.emitToCompany(companyId, 'admin', 'analytics_update', {
      type: 'payment_status_changed',
      paymentId: payment.id,
      status: payment.status,
      amount: payment.amount,
      timestamp: new Date()
    });
  }
}
