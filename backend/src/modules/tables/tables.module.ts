import { Module } from '@nestjs/common';
import { TablesController } from './tables.controller';
import { TablesService } from './tables.service';
import { WebSocketModule } from '../websocket/websocket.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CustomerSessionsModule } from '../customer-sessions/customer-sessions.module';

@Module({
  imports: [WebSocketModule, PrismaModule, CustomerSessionsModule],
  controllers: [TablesController],
  providers: [TablesService],
})
export class TablesModule {}
