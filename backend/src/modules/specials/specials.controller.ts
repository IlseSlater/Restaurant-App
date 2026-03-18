import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import {
  SpecialsService,
  CreateSpecialDto,
  UpdateSpecialDto,
  EvaluateSpecialsDto,
} from './specials.service';

@ApiTags('Specials')
@Controller('specials')
export class SpecialsController {
  constructor(private readonly specialsService: SpecialsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a special' })
  async create(@Body() dto: CreateSpecialDto) {
    return this.specialsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List specials for company' })
  @ApiQuery({ name: 'companyId', required: true })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  async findAll(
    @Query('companyId') companyId: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.specialsService.findAll(companyId, activeOnly === 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get special by id' })
  async findOne(@Param('id') id: string) {
    return this.specialsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update special' })
  async update(@Param('id') id: string, @Body() dto: UpdateSpecialDto) {
    return this.specialsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete special' })
  async remove(@Param('id') id: string) {
    return this.specialsService.remove(id);
  }

  @Post(':specialId/items')
  @ApiOperation({ summary: 'Add menu item to special' })
  async addItem(
    @Param('specialId') specialId: string,
    @Body() body: { menuItemId: string; isRequired?: boolean; sortOrder?: number },
  ) {
    return this.specialsService.addItem(
      specialId,
      body.menuItemId,
      body.isRequired ?? false,
      body.sortOrder ?? 0,
    );
  }

  @Delete(':specialId/items/:menuItemId')
  @ApiOperation({ summary: 'Remove menu item from special' })
  async removeItem(
    @Param('specialId') specialId: string,
    @Param('menuItemId') menuItemId: string,
  ) {
    return this.specialsService.removeItem(specialId, menuItemId);
  }

  @Post('evaluate')
  @ApiOperation({ summary: 'Evaluate cart against active specials' })
  async evaluate(@Body() dto: EvaluateSpecialsDto) {
    return this.specialsService.evaluateSpecials(dto);
  }
}
