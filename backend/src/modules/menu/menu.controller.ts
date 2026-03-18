import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { MenuService } from './menu.service';

@ApiTags('Menu')
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  @ApiOperation({ summary: 'Get all menu items' })
  @ApiQuery({ name: 'companyId', required: false, description: 'Filter by company ID' })
  async getAllMenuItems(@Query('companyId') companyId?: string) {
    return this.menuService.getAllMenuItems(companyId);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get menu categories' })
  async getCategories() {
    return this.menuService.getCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get menu item by ID' })
  async getMenuItem(@Param('id') id: string) {
    return this.menuService.getMenuItem(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new menu item' })
  async createMenuItem(@Body() createDto: any) {
    return this.menuService.createMenuItem(createDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update menu item' })
  async updateMenuItem(@Param('id') id: string, @Body() updateDto: any) {
    return this.menuService.updateMenuItem(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete menu item' })
  async deleteMenuItem(@Param('id') id: string) {
    return this.menuService.deleteMenuItem(id);
  }
}
