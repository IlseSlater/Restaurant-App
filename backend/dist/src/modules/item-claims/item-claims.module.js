"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemClaimsModule = void 0;
const common_1 = require("@nestjs/common");
const item_claims_controller_1 = require("./item-claims.controller");
const item_claims_service_1 = require("./item-claims.service");
const prisma_module_1 = require("../prisma/prisma.module");
const websocket_module_1 = require("../websocket/websocket.module");
let ItemClaimsModule = class ItemClaimsModule {
};
exports.ItemClaimsModule = ItemClaimsModule;
exports.ItemClaimsModule = ItemClaimsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, websocket_module_1.WebSocketModule],
        controllers: [item_claims_controller_1.ItemClaimsController],
        providers: [item_claims_service_1.ItemClaimsService],
        exports: [item_claims_service_1.ItemClaimsService],
    })
], ItemClaimsModule);
//# sourceMappingURL=item-claims.module.js.map