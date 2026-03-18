"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModifiersModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../prisma/prisma.module");
const websocket_module_1 = require("../websocket/websocket.module");
const modifiers_controller_1 = require("./modifiers.controller");
const modifiers_service_1 = require("./modifiers.service");
let ModifiersModule = class ModifiersModule {
};
exports.ModifiersModule = ModifiersModule;
exports.ModifiersModule = ModifiersModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, websocket_module_1.WebSocketModule],
        controllers: [modifiers_controller_1.ModifiersController],
        providers: [modifiers_service_1.ModifiersService],
        exports: [modifiers_service_1.ModifiersService],
    })
], ModifiersModule);
//# sourceMappingURL=modifiers.module.js.map