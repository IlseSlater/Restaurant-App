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
exports.CustomerSessionsController = void 0;
const common_1 = require("@nestjs/common");
const customer_sessions_service_1 = require("./customer-sessions.service");
let CustomerSessionsController = class CustomerSessionsController {
    constructor(sessionService) {
        this.sessionService = sessionService;
    }
    createSession(data) {
        return this.sessionService.createSession(data);
    }
    getScanStatus(tableId, companyId) {
        return this.sessionService.getScanStatus(tableId, companyId);
    }
    joinSession(sessionId, body) {
        return this.sessionService.joinSession(sessionId, body?.displayName, body?.participantId, body?.phoneNumber, body?.deviceId);
    }
    getSession(id) {
        return this.sessionService.getSession(id);
    }
    getPaymentStatus(id) {
        return this.sessionService.getPaymentStatus(id);
    }
    updateActivity(id) {
        return this.sessionService.updateActivity(id);
    }
    endSession(id) {
        return this.sessionService.endSession(id);
    }
    getSessionsByTable(tableId) {
        return this.sessionService.getActiveSessionsByTable(tableId);
    }
    getSessionByPhone(phoneNumber) {
        return this.sessionService.getActiveSessionByPhone(phoneNumber);
    }
    endSessionWithPayment(id, data) {
        return this.sessionService.endSessionOnBillPayment(id, data.paidBy);
    }
    endPreviousSessions(data) {
        return this.sessionService.endPreviousSessionsOnNewScan(data.phoneNumber, data.newCompanyId);
    }
    expireInactiveSessions() {
        return this.sessionService.checkAndExpireInactiveSessions();
    }
    validateLocation(id, data) {
        return this.sessionService.validateSessionLocation(id, data.lat, data.lng);
    }
};
exports.CustomerSessionsController = CustomerSessionsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CustomerSessionsController.prototype, "createSession", null);
__decorate([
    (0, common_1.Get)('table/:tableId/scan-status'),
    __param(0, (0, common_1.Param)('tableId')),
    __param(1, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], CustomerSessionsController.prototype, "getScanStatus", null);
__decorate([
    (0, common_1.Post)(':id/join'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CustomerSessionsController.prototype, "joinSession", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CustomerSessionsController.prototype, "getSession", null);
__decorate([
    (0, common_1.Get)(':id/payment-status'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CustomerSessionsController.prototype, "getPaymentStatus", null);
__decorate([
    (0, common_1.Put)(':id/activity'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CustomerSessionsController.prototype, "updateActivity", null);
__decorate([
    (0, common_1.Put)(':id/end'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CustomerSessionsController.prototype, "endSession", null);
__decorate([
    (0, common_1.Get)('table/:tableId'),
    __param(0, (0, common_1.Param)('tableId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CustomerSessionsController.prototype, "getSessionsByTable", null);
__decorate([
    (0, common_1.Get)('phone/:phoneNumber'),
    __param(0, (0, common_1.Param)('phoneNumber')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CustomerSessionsController.prototype, "getSessionByPhone", null);
__decorate([
    (0, common_1.Post)(':id/end-with-payment'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CustomerSessionsController.prototype, "endSessionWithPayment", null);
__decorate([
    (0, common_1.Post)('end-previous'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], CustomerSessionsController.prototype, "endPreviousSessions", null);
__decorate([
    (0, common_1.Post)('expire-inactive'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CustomerSessionsController.prototype, "expireInactiveSessions", null);
__decorate([
    (0, common_1.Post)(':id/validate-location'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CustomerSessionsController.prototype, "validateLocation", null);
exports.CustomerSessionsController = CustomerSessionsController = __decorate([
    (0, common_1.Controller)('customer-sessions'),
    __metadata("design:paramtypes", [customer_sessions_service_1.CustomerSessionsService])
], CustomerSessionsController);
//# sourceMappingURL=customer-sessions.controller.js.map