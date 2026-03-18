import { Module } from '@nestjs/common';
import { CustomerOrdersController } from './customer-orders.controller';
import { CustomerOrdersService } from './customer-orders.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WebSocketModule } from '../websocket/websocket.module';
import { CustomerSessionsModule } from '../customer-sessions/customer-sessions.module';

@Module({
  imports: [PrismaModule, WebSocketModule, CustomerSessionsModule],
  controllers: [CustomerOrdersController],
  providers: [CustomerOrdersService],
  exports: [CustomerOrdersService],
})
export class CustomerOrdersModule {}
