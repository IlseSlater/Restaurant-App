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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = require("bcrypt");
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAllUsers(companyId) {
        const whereClause = companyId ? { companyId } : {};
        const users = await this.prisma.user.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' }
        });
        return users.map(user => this.transformUser(user));
    }
    async getWaiters(companyId) {
        const whereClause = {
            role: 'WAITER',
            ...(companyId ? { companyId } : {})
        };
        const waiters = await this.prisma.user.findMany({
            where: whereClause,
            orderBy: { name: 'asc' }
        });
        return waiters.map(user => this.transformUser(user));
    }
    async getUser(id) {
        const user = await this.prisma.user.findUnique({
            where: { id }
        });
        return user ? this.transformUser(user) : null;
    }
    async createUser(createDto) {
        const allowedRoles = [
            'WAITER', 'ADMIN', 'BARTENDER', 'CHEF', 'SOUS_CHEF', 'KITCHEN_STAFF',
            'HOST', 'MANAGER', 'ASSISTANT_MANAGER', 'CASHIER', 'BUSSER',
            'FOOD_RUNNER', 'BARISTA', 'SECURITY', 'CLEANER', 'MAINTENANCE'
        ];
        if (!allowedRoles.includes(createDto.role)) {
            throw new Error(`Invalid role. Allowed roles are: ${allowedRoles.join(', ')}`);
        }
        let hashedPin = null;
        if (createDto.pin) {
            hashedPin = await bcrypt.hash(createDto.pin, 10);
        }
        let hashedPassword = null;
        if (createDto.password) {
            hashedPassword = await bcrypt.hash(createDto.password, 10);
        }
        else {
            hashedPassword = await bcrypt.hash('default123', 10);
        }
        const user = await this.prisma.user.create({
            data: {
                email: createDto.email,
                name: createDto.name,
                role: createDto.role,
                password: hashedPassword,
                phone: createDto.phoneNumber || '',
                companyId: createDto.companyId,
                pin: hashedPin,
                isActive: true
            }
        });
        return this.transformUser(user);
    }
    async updateUser(id, updateDto) {
        if (updateDto.role) {
            const allowedRoles = [
                'WAITER', 'ADMIN', 'BARTENDER', 'CHEF', 'SOUS_CHEF', 'KITCHEN_STAFF',
                'HOST', 'MANAGER', 'ASSISTANT_MANAGER', 'CASHIER', 'BUSSER',
                'FOOD_RUNNER', 'BARISTA', 'SECURITY', 'CLEANER', 'MAINTENANCE'
            ];
            if (!allowedRoles.includes(updateDto.role)) {
                throw new Error(`Invalid role. Allowed roles are: ${allowedRoles.join(', ')}`);
            }
        }
        const dbData = { ...updateDto };
        if (dbData.phoneNumber !== undefined) {
            dbData.phone = dbData.phoneNumber;
            delete dbData.phoneNumber;
        }
        const user = await this.prisma.user.update({
            where: { id },
            data: dbData
        });
        return this.transformUser(user);
    }
    async deleteUser(id) {
        return this.prisma.user.delete({
            where: { id }
        });
    }
    transformUser(user) {
        const { password, pin, phone, ...sanitized } = user;
        return {
            ...sanitized,
            phoneNumber: phone
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map