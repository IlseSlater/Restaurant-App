import { Module } from '@nestjs/common';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { WebSocketModule } from '../websocket/websocket.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [WebSocketModule, PrismaModule],
  controllers: [MenuController],
  providers: [MenuService],
})
export class MenuModule {}
