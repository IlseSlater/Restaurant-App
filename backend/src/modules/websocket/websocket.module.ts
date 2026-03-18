import { Module } from '@nestjs/common';
import { RestaurantWebSocketGateway } from './websocket.gateway';

@Module({
  providers: [RestaurantWebSocketGateway],
  exports: [RestaurantWebSocketGateway],
})
export class WebSocketModule {}
