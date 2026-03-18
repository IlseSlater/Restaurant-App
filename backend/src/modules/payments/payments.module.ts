import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PayFastProvider } from './providers/payfast.provider';
import { PrismaModule } from '../prisma/prisma.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    WebSocketModule
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, PayFastProvider],
  exports: [PaymentsService, PayFastProvider],
})
export class PaymentsModule {}
