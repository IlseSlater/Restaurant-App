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
exports.ItemClaimsController = void 0;
const common_1 = require("@nestjs/common");
const item_claims_service_1 = require("./item-claims.service");
let ItemClaimsController = class ItemClaimsController {
    constructor(itemClaimsService) {
        this.itemClaimsService = itemClaimsService;
    }
    getClaimsByOrderItem(orderItemId) {
        return this.itemClaimsService.getClaimsByOrderItem(orderItemId);
    }
    claim(body) {
        return this.itemClaimsService.claim(body.orderItemId, body.participantId);
    }
    leave(body) {
        return this.itemClaimsService.leave(body.orderItemId, body.participantId);
    }
};
exports.ItemClaimsController = ItemClaimsController;
__decorate([
    (0, common_1.Get)('order-item/:orderItemId'),
    __param(0, (0, common_1.Param)('orderItemId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ItemClaimsController.prototype, "getClaimsByOrderItem", null);
__decorate([
    (0, common_1.Post)('claim'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ItemClaimsController.prototype, "claim", null);
__decorate([
    (0, common_1.Post)('leave'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ItemClaimsController.prototype, "leave", null);
exports.ItemClaimsController = ItemClaimsController = __decorate([
    (0, common_1.Controller)('item-claims'),
    __metadata("design:paramtypes", [item_claims_service_1.ItemClaimsService])
], ItemClaimsController);
//# sourceMappingURL=item-claims.controller.js.map