import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WebSocketModule } from '../websocket/websocket.module';
import { ModifiersController } from './modifiers.controller';
import { ModifiersService } from './modifiers.service';

@Module({
  imports: [PrismaModule, WebSocketModule],
  controllers: [ModifiersController],
  providers: [ModifiersService],
  exports: [ModifiersService],
})
export class ModifiersModule {}
