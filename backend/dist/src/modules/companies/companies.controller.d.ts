import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
export declare class CompaniesController {
    private readonly companiesService;
    constructor(companiesService: CompaniesService);
    create(createCompanyDto: CreateCompanyDto): Promise<$Result.GetResult<import(".prisma/client").Prisma.$CompanyPayload<ExtArgs>, T, "create">>;
    findAll(): Promise<$Public.PrismaPromise<T>>;
    findOne(id: string): Promise<any>;
    findBySlug(slug: string): Promise<any>;
    update(id: string, updateCompanyDto: UpdateCompanyDto): Promise<$Result.GetResult<import(".prisma/client").Prisma.$CompanyPayload<ExtArgs>, T, "update">>;
    remove(id: string): Promise<$Result.GetResult<import(".prisma/client").Prisma.$CompanyPayload<ExtArgs>, T, "delete">>;
    getCompanyTables(companyId: string): Promise<$Public.PrismaPromise<T>>;
    getCompanyMenu(companyId: string): Promise<$Public.PrismaPromise<T>>;
    getCompanyOrders(companyId: string): Promise<$Public.PrismaPromise<T>>;
    getCompanyUsers(companyId: string): Promise<$Public.PrismaPromise<T>>;
    generateQRCodes(companyId: string, data: any): {
        message: string;
        companyId: string;
        data: any;
    };
}
