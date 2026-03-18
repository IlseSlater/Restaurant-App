"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaiterCallsController = void 0;
const common_1 = require("@nestjs/common");
const waiter_calls_service_1 = require("./waiter-calls.service");
let WaiterCallsController = class WaiterCallsController {
    constructor(callService) {
        this.callService = callService;
    }
    createCall(data) {
        return this.callService.createCall(data);
    }
    acknowledgeCall(id, data) {
        return this.callService.acknowledgeCall(id, data.acknowledgedBy);
    }
    resolveCall(id) {
        return this.callService.resolveCall(id);
    }
    getCallsByTable(tableId) {
        return this.callService.getCallsByTable(tableId);
    }
    getPendingCalls(companyId, type) {
        return this.callService.getPendingCalls(companyId, type);
    }
};
exports.WaiterCallsController = WaiterCallsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WaiterCallsController.prototype, "createCall", null);
__decorate([
    (0, common_1.Put)(':id/acknowledge'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], WaiterCallsController.prototype, "acknowledgeCall", null);
__decorate([
    (0, common_1.Put)(':id/resolve'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WaiterCallsController.prototype, "resolveCall", null);
__decorate([
    (0, common_1.Get)('table/:tableId'),
    __param(0, (0, common_1.Param)('tableId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WaiterCallsController.prototype, "getCallsByTable", null);
__decorate([
    (0, common_1.Get)('pending'),
    __param(0, (0, common_1.Query)('companyId')),
    __param(1, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], WaiterCallsController.prototype, "getPendingCalls", null);
exports.WaiterCallsController = WaiterCallsController = __decorate([
    (0, common_1.Controller)('waiter-calls'),
    __metadata("design:paramtypes", [waiter_calls_service_1.WaiterCallsService])
], WaiterCallsController);
//# sourceMappingURL=waiter-calls.controller.js.map