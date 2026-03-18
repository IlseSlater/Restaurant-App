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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = require("bcryptjs");
let AuthService = class AuthService {
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async loginWithPin(companyId, name, pin) {
        const trimmedName = (name ?? '').trim();
        console.log('🔍 PIN Login Debug:', { companyId, name: trimmedName || '(any)', pin: pin ? '***' : '' });
        if (!companyId || !pin) {
            throw new common_1.UnauthorizedException('Company and PIN are required');
        }
        const where = {
            companyId,
            isActive: true,
            pin: { not: null },
        };
        if (trimmedName) {
            where.name = trimmedName;
        }
        const user = await this.prisma.user.findFirst({
            where,
            include: { company: true },
        });
        console.log('🔍 User found:', user ? { id: user.id, name: user.name, companyId: user.companyId, hasPin: !!user.pin } : 'No user found');
        if (!user) {
            const allUsersInCompany = await this.prisma.user.findMany({
                where: { companyId, isActive: true },
                select: { id: true, name: true, role: true, pin: true },
            });
            console.log('🔍 All users in company:', allUsersInCompany);
            throw new common_1.UnauthorizedException('Invalid name or PIN');
        }
        console.log('🔍 PIN comparison:', { hasStoredPin: !!user.pin });
        if (!user.pin) {
            throw new common_1.UnauthorizedException('Invalid name or PIN');
        }
        let pinValid;
        try {
            pinValid = await bcrypt.compare(pin, user.pin);
        }
        catch (e) {
            console.error('PIN compare error:', e);
            throw new common_1.UnauthorizedException('Invalid name or PIN');
        }
        if (pinValid) {
            console.log('✅ PIN match successful');
            await this.prisma.user.update({
                where: { id: user.id },
                data: { lastLogin: new Date() }
            });
            return {
                access_token: this.generateToken(user),
                user: this.sanitizeUser(user)
            };
        }
        console.log('❌ PIN comparison failed');
        throw new common_1.UnauthorizedException('Invalid name or PIN');
    }
    async login(email, password) {
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: { company: true }
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('User account is inactive');
        }
        if (!user.password) {
            throw new common_1.UnauthorizedException('Password not set. Please use PIN login.');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });
        return {
            access_token: this.generateToken(user),
            user: this.sanitizeUser(user)
        };
    }
    async register(registerDto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: registerDto.email }
        });
        if (existingUser) {
            throw new common_1.BadRequestException('User with this email already exists');
        }
        const user = await this.prisma.user.create({
            data: {
                email: registerDto.email,
                name: registerDto.name,
                phone: registerDto.phoneNumber,
                role: 'CUSTOMER',
            },
        });
        return {
            access_token: this.generateToken(user),
            user: this.sanitizeUser(user)
        };
    }
    async createStaffMember(createDto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: createDto.email }
        });
        if (existingUser) {
            throw new common_1.BadRequestException('User with this email already exists');
        }
        const duplicateUser = await this.prisma.user.findFirst({
            where: {
                companyId: createDto.companyId,
                name: createDto.name.trim(),
                isActive: true
            }
        });
        if (duplicateUser) {
            throw new common_1.BadRequestException('A staff member with this name already exists in this company');
        }
        const hashedPin = await bcrypt.hash(createDto.pin, 10);
        console.log('🔧 Creating staff member:', {
            name: createDto.name.trim(),
            companyId: createDto.companyId,
            role: createDto.role,
            pinProvided: !!createDto.pin,
            pinLength: createDto.pin?.length,
            pinHashed: !!hashedPin
        });
        const data = {
            companyId: createDto.companyId,
            email: createDto.email,
            name: createDto.name.trim(),
            phone: createDto.phoneNumber,
            role: createDto.role,
            pin: hashedPin,
        };
        if (createDto.password) {
            data.password = await bcrypt.hash(createDto.password, 10);
        }
        console.log('🔧 User data to create:', {
            name: data.name,
            companyId: data.companyId,
            role: data.role,
            hasPin: !!data.pin,
            pinLength: data.pin?.length
        });
        const user = await this.prisma.user.create({
            data,
            include: { company: true }
        });
        console.log('✅ User created successfully:', {
            id: user.id,
            name: user.name,
            companyId: user.companyId,
            hasPin: !!user.pin,
            pinLength: user.pin?.length
        });
        return this.sanitizeUser(user);
    }
    async getProfile(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: { company: true },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        return user;
    }
    generateToken(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            companyId: user.companyId
        };
        return this.jwtService.sign(payload);
    }
    sanitizeUser(user) {
        const { password, pin, phone, ...sanitized } = user;
        return {
            ...sanitized,
            phoneNumber: phone
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map