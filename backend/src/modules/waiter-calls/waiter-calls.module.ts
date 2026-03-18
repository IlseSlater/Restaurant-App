import { Module } from '@nestjs/common';
import { WaiterCallsController } from './waiter-calls.controller';
import { WaiterCallsService } from './waiter-calls.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [PrismaModule, WebSocketModule],
  controllers: [WaiterCallsController],
  providers: [WaiterCallsService],
  exports: [WaiterCallsService],
})
export class WaiterCallsModule {}
