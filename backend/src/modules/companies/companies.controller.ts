import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyGuard } from '../auth/company.guard';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  create(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companiesService.create(createCompanyDto);
  }

  @Get()
  findAll() {
    return this.companiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.companiesService.findBySlug(slug);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto) {
    return this.companiesService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.companiesService.remove(id);
  }

  // Company-scoped endpoints
  @Get(':companyId/tables')
  @UseGuards(CompanyGuard)
  getCompanyTables(@Param('companyId') companyId: string) {
    return this.companiesService.getCompanyTables(companyId);
  }

  @Get(':companyId/menu')
  @UseGuards(CompanyGuard)
  getCompanyMenu(@Param('companyId') companyId: string) {
    return this.companiesService.getCompanyMenu(companyId);
  }

  @Get(':companyId/orders')
  @UseGuards(CompanyGuard)
  getCompanyOrders(@Param('companyId') companyId: string) {
    return this.companiesService.getCompanyOrders(companyId);
  }

  @Get(':companyId/users')
  @UseGuards(CompanyGuard)
  getCompanyUsers(@Param('companyId') companyId: string) {
    return this.companiesService.getCompanyUsers(companyId);
  }

  @Post(':companyId/qr-codes/generate')
  @UseGuards(CompanyGuard)
  generateQRCodes(@Param('companyId') companyId: string, @Body() data: any) {
    // TODO: Implement QR code generation
    return { message: 'QR code generation not implemented yet', companyId, data };
  }
}
