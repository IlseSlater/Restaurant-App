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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
let CompanyAuthGuard = class CompanyAuthGuard {
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            throw new common_1.ForbiddenException('Authentication required');
        }
        const companyId = request.params.companyGuid || request.params.companyId;
        if (user.role === 'SYSTEM_ADMIN') {
            return true;
        }
        if (!user.companyId) {
            throw new common_1.ForbiddenException('User not associated with any company');
        }
        if (user.companyId !== companyId) {
            throw new common_1.ForbiddenException('Access denied to this company');
        }
        return true;
    }
};
exports.CompanyAuthGuard = CompanyAuthGuard;
exports.CompanyAuthGuard = CompanyAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], CompanyAuthGuard);
//# sourceMappingURL=company-auth.guard.js.map