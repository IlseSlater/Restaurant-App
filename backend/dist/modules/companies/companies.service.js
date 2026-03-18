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
exports.CompaniesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let CompaniesService = class CompaniesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createCompanyDto) {
        try {
            return await this.prisma.company.create({
                data: {
                    ...createCompanyDto,
                    isActive: true,
                },
            });
        }
        catch (e) {
            if (e instanceof client_1.Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
                const target = e.meta?.target?.[0] ?? 'field';
                throw new common_1.ConflictException(`A company with this ${target} already exists. Choose a different ${target}.`);
            }
            console.error('Company create failed:', e);
            const msg = e instanceof Error ? e.message : 'Unknown error';
            throw new common_1.InternalServerErrorException(`Could not create company. Database may be down or data invalid. Details: ${msg}`);
        }
    }
    async findAll() {
        return this.prisma.company.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        return this.prisma.company.findUnique({
            where: { id },
            include: {
                tables: true,
                menuItems: true,
                users: true,
            },
        });
    }
    async findBySlug(slug) {
        return this.prisma.company.findUnique({
            where: { slug },
            include: {
                tables: true,
                menuItems: true,
                users: true,
            },
        });
    }
    async update(id, updateCompanyDto) {
        return this.prisma.company.update({
            where: { id },
            data: updateCompanyDto,
        });
    }
    async remove(id) {
        return this.prisma.company.delete({
            where: { id },
        });
    }
    async getCompanyTables(companyId) {
        return this.prisma.table.findMany({
            where: { companyId },
            orderBy: { number: 'asc' },
            include: {
                waiter: true,
            },
        });
    }
    async getCompanyMenu(companyId) {
        return this.prisma.menuItem.findMany({
            where: {
                companyId,
                isAvailable: true
            },
            orderBy: { category: 'asc' },
        });
    }
    async getCompanyOrders(companyId) {
        return this.prisma.order.findMany({
            where: { companyId },
            include: {
                table: true,
                customer: true,
                items: {
                    include: {
                        menuItem: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getCompanyUsers(companyId) {
        return this.prisma.user.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.CompaniesService = CompaniesService;
exports.CompaniesService = CompaniesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CompaniesService);
//# sourceMappingURL=companies.service.js.map