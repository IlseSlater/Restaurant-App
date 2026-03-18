"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const auth_module_1 = require("./modules/auth/auth.module");
const companies_module_1 = require("./modules/companies/companies.module");
const tables_module_1 = require("./modules/tables/tables.module");
const menu_module_1 = require("./modules/menu/menu.module");
const orders_module_1 = require("./modules/orders/orders.module");
const users_module_1 = require("./modules/users/users.module");
const analytics_module_1 = require("./modules/analytics/analytics.module");
const prisma_module_1 = require("./modules/prisma/prisma.module");
const websocket_module_1 = require("./modules/websocket/websocket.module");
const customer_sessions_module_1 = require("./modules/customer-sessions/customer-sessions.module");
const customer_orders_module_1 = require("./modules/customer-orders/customer-orders.module");
const waiter_calls_module_1 = require("./modules/waiter-calls/waiter-calls.module");
const payments_module_1 = require("./modules/payments/payments.module");
const inventory_module_1 = require("./modules/inventory/inventory.module");
const item_claims_module_1 = require("./modules/item-claims/item-claims.module");
const modifiers_module_1 = require("./modules/modifiers/modifiers.module");
const specials_module_1 = require("./modules/specials/specials.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            companies_module_1.CompaniesModule,
            tables_module_1.TablesModule,
            menu_module_1.MenuModule,
            orders_module_1.OrdersModule,
            users_module_1.UsersModule,
            analytics_module_1.AnalyticsModule,
            websocket_module_1.WebSocketModule,
            customer_sessions_module_1.CustomerSessionsModule,
            customer_orders_module_1.CustomerOrdersModule,
            waiter_calls_module_1.WaiterCallsModule,
            payments_module_1.PaymentsModule,
            inventory_module_1.InventoryModule,
            item_claims_module_1.ItemClaimsModule,
            modifiers_module_1.ModifiersModule,
            specials_module_1.SpecialsModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map