import { Module } from '@nestjs/common';
import { ItemClaimsController } from './item-claims.controller';
import { ItemClaimsService } from './item-claims.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [PrismaModule, WebSocketModule],
  controllers: [ItemClaimsController],
  providers: [ItemClaimsService],
  exports: [ItemClaimsService],
})
export class ItemClaimsModule {}
