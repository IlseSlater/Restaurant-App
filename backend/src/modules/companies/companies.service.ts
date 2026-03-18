import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async create(createCompanyDto: CreateCompanyDto) {
    try {
      return await this.prisma.company.create({
        data: {
          ...createCompanyDto,
          isActive: true, // Ensure new companies are active by default
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        const target = (e.meta?.target as string[] | undefined)?.[0] ?? 'field';
        throw new ConflictException(
          `A company with this ${target} already exists. Choose a different ${target}.`,
        );
      }
      // Database connection or other Prisma errors: return a clear JSON error so the frontend can show it
      console.error('Company create failed:', e);
      const msg = e instanceof Error ? e.message : 'Unknown error';
      throw new InternalServerErrorException(
        `Could not create company. Database may be down or data invalid. Details: ${msg}`,
      );
    }
  }

  async findAll() {
    return this.prisma.company.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.company.findUnique({
      where: { id },
      include: {
        tables: true,
        menuItems: true,
        users: true,
      },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.company.findUnique({
      where: { slug },
      include: {
        tables: true,
        menuItems: true,
        users: true,
      },
    });
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto) {
    return this.prisma.company.update({
      where: { id },
      data: updateCompanyDto,
    });
  }

  async remove(id: string) {
    // Hard delete the company and all associated data
    // Note: Prisma cascading deletes should handle related records
    return this.prisma.company.delete({
      where: { id },
    });
  }

  async getCompanyTables(companyId: string) {
    return this.prisma.table.findMany({
      where: { companyId },
      orderBy: { number: 'asc' },
      include: {
        waiter: true,
      },
    });
  }

  async getCompanyMenu(companyId: string) {
    return this.prisma.menuItem.findMany({
      where: { 
        companyId,
        isAvailable: true 
      },
      orderBy: { category: 'asc' },
    });
  }

  async getCompanyOrders(companyId: string) {
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

  async getCompanyUsers(companyId: string) {
    return this.prisma.user.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
