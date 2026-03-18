"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerSessionsModule = void 0;
const common_1 = require("@nestjs/common");
const customer_sessions_controller_1 = require("./customer-sessions.controller");
const customer_sessions_service_1 = require("./customer-sessions.service");
const prisma_module_1 = require("../prisma/prisma.module");
const websocket_module_1 = require("../websocket/websocket.module");
let CustomerSessionsModule = class CustomerSessionsModule {
};
exports.CustomerSessionsModule = CustomerSessionsModule;
exports.CustomerSessionsModule = CustomerSessionsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, websocket_module_1.WebSocketModule],
        controllers: [customer_sessions_controller_1.CustomerSessionsController],
        providers: [customer_sessions_service_1.CustomerSessionsService],
        exports: [customer_sessions_service_1.CustomerSessionsService],
    })
], CustomerSessionsModule);
//# sourceMappingURL=customer-sessions.module.js.map