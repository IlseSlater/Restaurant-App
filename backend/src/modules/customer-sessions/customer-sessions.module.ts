import { Module } from '@nestjs/common';
import { CustomerSessionsController } from './customer-sessions.controller';
import { CustomerSessionsService } from './customer-sessions.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [PrismaModule, WebSocketModule],
  controllers: [CustomerSessionsController],
  providers: [CustomerSessionsService],
  exports: [CustomerSessionsService],
})
export class CustomerSessionsModule {}
