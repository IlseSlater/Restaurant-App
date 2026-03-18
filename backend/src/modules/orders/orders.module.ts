import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { WebSocketModule } from '../websocket/websocket.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [WebSocketModule, PrismaModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
