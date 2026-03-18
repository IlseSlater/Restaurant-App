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
const PRISMA_USER_ROLES = [
    'CUSTOMER', 'WAITER', 'KITCHEN_STAFF', 'BAR_STAFF', 'MANAGER', 'ADMIN', 'SYSTEM_ADMIN',
];
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
        const role = String(createDto.role).toUpperCase();
        if (!PRISMA_USER_ROLES.includes(role)) {
            throw new Error(`Invalid role "${createDto.role}". Allowed: ${PRISMA_USER_ROLES.join(', ')}`);
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
                role: role,
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
        const dbData = {};
        if (updateDto.name !== undefined)
            dbData.name = updateDto.name;
        if (updateDto.email !== undefined)
            dbData.email = updateDto.email;
        if (updateDto.companyId !== undefined)
            dbData.companyId = updateDto.companyId;
        if (updateDto.isActive !== undefined)
            dbData.isActive = Boolean(updateDto.isActive);
        if (updateDto.lastLogin !== undefined)
            dbData.lastLogin = updateDto.lastLogin;
        if (updateDto.phoneNumber !== undefined)
            dbData.phone = updateDto.phoneNumber;
        else if (updateDto.phone !== undefined)
            dbData.phone = updateDto.phone;
        if (updateDto.role !== undefined) {
            const role = String(updateDto.role).toUpperCase();
            if (!PRISMA_USER_ROLES.includes(role)) {
                throw new Error(`Invalid role "${updateDto.role}". Allowed: ${PRISMA_USER_ROLES.join(', ')}`);
            }
            dbData.role = role;
        }
        if (updateDto.password !== undefined && updateDto.password !== '') {
            dbData.password = await bcrypt.hash(updateDto.password, 10);
        }
        if (updateDto.pin !== undefined && updateDto.pin !== '') {
            dbData.pin = await bcrypt.hash(updateDto.pin, 10);
        }
        const user = await this.prisma.user.update({
            where: { id },
            data: dbData,
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