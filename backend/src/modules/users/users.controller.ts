import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiQuery({ name: 'companyId', required: false, description: 'Filter by company ID' })
  async getAllUsers(@Query('companyId') companyId?: string) {
    return this.usersService.getAllUsers(companyId);
  }

  @Get('waiters')
  @ApiOperation({ summary: 'Get all waiters' })
  @ApiQuery({ name: 'companyId', required: false, description: 'Filter by company ID' })
  async getWaiters(@Query('companyId') companyId?: string) {
    return this.usersService.getWaiters(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async getUser(@Param('id') id: string) {
    return this.usersService.getUser(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new user' })
  async createUser(@Body() createDto: { 
    email: string; 
    name: string; 
    role: string; 
    password?: string;
    phoneNumber?: string;
    companyId?: string;
    pin?: string; // PIN for staff login
  }) {
    return this.usersService.createUser(createDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  async updateUser(@Param('id') id: string, @Body() updateDto: any) {
    return this.usersService.updateUser(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  async deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}
