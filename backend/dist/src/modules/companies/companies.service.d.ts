import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
export declare class CompaniesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createCompanyDto: CreateCompanyDto): Promise<$Result.GetResult<Prisma.$CompanyPayload<ExtArgs>, T, "create">>;
    findAll(): Promise<$Public.PrismaPromise<T>>;
    findOne(id: string): Promise<any>;
    findBySlug(slug: string): Promise<any>;
    update(id: string, updateCompanyDto: UpdateCompanyDto): Promise<$Result.GetResult<Prisma.$CompanyPayload<ExtArgs>, T, "update">>;
    remove(id: string): Promise<$Result.GetResult<Prisma.$CompanyPayload<ExtArgs>, T, "delete">>;
    getCompanyTables(companyId: string): Promise<$Public.PrismaPromise<T>>;
    getCompanyMenu(companyId: string): Promise<$Public.PrismaPromise<T>>;
    getCompanyOrders(companyId: string): Promise<$Public.PrismaPromise<T>>;
    getCompanyUsers(companyId: string): Promise<$Public.PrismaPromise<T>>;
}
