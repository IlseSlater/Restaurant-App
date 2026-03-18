import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { TablesModule } from './modules/tables/tables.module';
import { MenuModule } from './modules/menu/menu.module';
import { OrdersModule } from './modules/orders/orders.module';
import { UsersModule } from './modules/users/users.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { WebSocketModule } from './modules/websocket/websocket.module';
import { CustomerSessionsModule } from './modules/customer-sessions/customer-sessions.module';
import { CustomerOrdersModule } from './modules/customer-orders/customer-orders.module';
import { WaiterCallsModule } from './modules/waiter-calls/waiter-calls.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ItemClaimsModule } from './modules/item-claims/item-claims.module';
import { ModifiersModule } from './modules/modifiers/modifiers.module';
import { SpecialsModule } from './modules/specials/specials.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    CompaniesModule,
    TablesModule,
    MenuModule,
    OrdersModule,
    UsersModule,
    AnalyticsModule,
    WebSocketModule,
    CustomerSessionsModule,
    CustomerOrdersModule,
    WaiterCallsModule,
    PaymentsModule,
    InventoryModule,
    ItemClaimsModule,
    ModifiersModule,
    SpecialsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
