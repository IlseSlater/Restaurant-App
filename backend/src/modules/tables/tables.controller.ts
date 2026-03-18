import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TablesService } from './tables.service';

@ApiTags('Tables')
@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tables' })
  @ApiQuery({ name: 'companyId', required: false, description: 'Filter by company ID' })
  async getAllTables(@Query('companyId') companyId?: string) {
    return this.tablesService.getAllTables(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get table by ID' })
  async getTable(@Param('id') id: string) {
    return this.tablesService.getTable(id);
  }

  @Get('qr/:qrCode')
  @ApiOperation({ summary: 'Get table by QR code' })
  async getTableByQRCode(@Param('qrCode') qrCode: string) {
    return this.tablesService.getTableByQRCode(qrCode);
  }

  @Post()
  @ApiOperation({ summary: 'Create new table' })
  async createTable(@Body() createDto: { number: number; qrCode?: string; companyId?: string; status?: string }) {
    return this.tablesService.createTable(createDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update table' })
  async updateTable(@Param('id') id: string, @Body() updateDto: any) {
    return this.tablesService.updateTable(id, updateDto);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update table status' })
  async updateTableStatus(@Param('id') id: string, @Body() statusDto: { status: string }) {
    return this.tablesService.updateTableStatus(id, statusDto.status);
  }

  @Put(':id/assign')
  @ApiOperation({ summary: 'Assign waiter to table' })
  async assignWaiter(@Param('id') id: string, @Body() assignDto: { waiterId: string }) {
    return this.tablesService.assignWaiter(id, assignDto.waiterId);
  }

  @Post(':id/clear')
  @ApiOperation({ summary: 'Clear & close table: end active session and set table to AVAILABLE. Use ?force=true to clear even with pending/preparing items.' })
  @ApiQuery({ name: 'force', required: false, description: 'If true, clear table even when there are active items' })
  async clearTable(
    @Param('id') id: string,
    @Query('force') force?: string,
  ) {
    return this.tablesService.clearTable(id, force === 'true');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete table' })
  async deleteTable(@Param('id') id: string) {
    return this.tablesService.deleteTable(id);
  }

  @Get('qr-data/:companyId/:tableId')
  @ApiOperation({ summary: 'Generate QR code data for a specific table' })
  async generateQRData(
    @Param('companyId') companyId: string,
    @Param('tableId') tableId: string
  ) {
    return this.tablesService.generateQRData(companyId, tableId);
  }

  @Get('qr-data/:companyId')
  @ApiOperation({ summary: 'Generate QR code data for all tables in a company' })
  async generateAllQRData(@Param('companyId') companyId: string) {
    return this.tablesService.generateAllQRDataForCompany(companyId);
  }
}
