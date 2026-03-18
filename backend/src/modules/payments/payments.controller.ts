import { Controller, Post, Get, Put, Param, Body, Query, HttpCode, HttpStatus, Logger, BadRequestException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, PayFastWebhookDto, PaymentStatus, PaymentSplitDto, PaymentProvider, CheckoutDto } from './dto/payment.dto';
import { PrismaService } from '../prisma/prisma.service';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly prisma: PrismaService
  ) {}

  /**
   * Create payment intent
   */
  @Post('intent')
  async createPaymentIntent(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.createPaymentIntent(createPaymentDto);
  }

  /**
   * Checkout: pay for self and/or others (e.g. husband/wife or full table).
   * Body: { payerParticipantId, payForParticipantIds, amount, isFullTable? }
   */
  @Post('checkout')
  async checkout(@Body() dto: CheckoutDto) {
    return this.paymentsService.createCheckout(dto);
  }

  /**
   * Get payment by ID
   */
  @Get(':id')
  async getPayment(@Param('id') id: string) {
    return this.paymentsService.getPayment(id);
  }

  /**
   * Get payments for a company
   */
  @Get('company/:companyId')
  async getPaymentsByCompany(
    @Param('companyId') companyId: string,
    @Query('status') status?: PaymentStatus
  ) {
    return this.paymentsService.getPaymentsByCompany(companyId, status);
  }

  /**
   * Update payment split status
   */
  @Put('splits/:splitId/status')
  async updatePaymentSplit(
    @Param('splitId') splitId: string,
    @Body() body: { status: PaymentStatus }
  ) {
    return this.paymentsService.updatePaymentSplit(splitId, body.status);
  }

  /**
   * Cancel payment
   */
  @Put(':id/cancel')
  async cancelPayment(@Param('id') id: string) {
    return this.paymentsService.cancelPayment(id);
  }

  /**
   * PayFast webhook endpoint
   */
  @Post('webhook/payfast')
  @HttpCode(HttpStatus.OK)
  async handlePayFastWebhook(@Body() webhookData: PayFastWebhookDto) {
    this.logger.log('Received PayFast webhook');
    
    try {
      const result = await this.paymentsService.handlePayFastWebhook(webhookData);
      
      if (result.success) {
        this.logger.log(`PayFast webhook processed successfully for payment: ${result.payment?.id}`);
        return { status: 'success' };
      } else {
        this.logger.warn(`PayFast webhook processing failed: ${result.message}`);
        return { status: 'error', message: result.message };
      }
    } catch (error) {
      this.logger.error('Error processing PayFast webhook:', error);
      throw error;
    }
  }

  /**
   * Create bill payment for customer order
   */
  @Post('bill/:customerOrderId')
  async createBillPayment(
    @Param('customerOrderId') customerOrderId: string,
    @Body() body: {
      splits?: PaymentSplitDto[];
      payerName?: string;
      payerEmail?: string;
      tipPercentage?: number;
      tipAmount?: number;
    }
  ) {
    // Get customer order details
    const customerOrder = await this.prisma.customerOrder.findUnique({
      where: { id: customerOrderId },
      include: {
        customerSession: true,
        table: true
      }
    });

    if (!customerOrder) {
      throw new BadRequestException('Customer order not found');
    }

    const subtotal = Number(customerOrder.subtotal);
    const amount =
      typeof body.tipAmount === 'number' && body.tipAmount >= 0
        ? subtotal + body.tipAmount
        : subtotal * (1 + (typeof body.tipPercentage === 'number' ? body.tipPercentage : 0) / 100);

    const createPaymentDto: CreatePaymentDto = {
      companyId: customerOrder.companyId,
      customerOrderId: customerOrder.id,
      provider: PaymentProvider.PAYFAST,
      amount: Math.round(amount * 100) / 100,
      currency: 'ZAR',
      description: `Bill payment for Table ${customerOrder.table?.number || 'Unknown'}`,
      billReference: `BILL-${customerOrder.id.slice(-8).toUpperCase()}`,
      splits: body.splits
    };

    return this.createPaymentIntent(createPaymentDto);
  }

  /**
   * Create split bill payment
   */
  @Post('bill/:customerOrderId/split')
  async createSplitBillPayment(
    @Param('customerOrderId') customerOrderId: string,
    @Body() body: {
      splits: Array<{
        payerName: string;
        amount: number;
        email?: string;
        phoneNumber?: string;
      }>;
    }
  ) {
    // Validate splits add up to order total
    const customerOrder = await this.prisma.customerOrder.findUnique({
      where: { id: customerOrderId }
    });

    if (!customerOrder) {
      throw new BadRequestException('Customer order not found');
    }

    const totalSplitAmount = body.splits.reduce((sum, split) => sum + split.amount, 0);
    const orderTotal = Number(customerOrder.total);

    if (Math.abs(totalSplitAmount - orderTotal) > 0.01) {
      throw new BadRequestException(
        `Split amounts (${totalSplitAmount}) do not match order total (${orderTotal})`
      );
    }

    // Create individual payments for each split
    const splitPayments: any[] = [];

    for (const split of body.splits) {
      const createPaymentDto: CreatePaymentDto = {
        companyId: customerOrder.companyId,
        customerOrderId: customerOrder.id,
        provider: PaymentProvider.PAYFAST,
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
}
