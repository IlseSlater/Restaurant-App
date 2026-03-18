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
import { ModifiersService, CreateModifierGroupDto, UpdateModifierGroupDto, CreateModifierOptionDto, LinkModifierGroupDto, CreateBundleSlotDto } from './modifiers.service';

@ApiTags('Modifiers')
@Controller('modifiers')
export class ModifiersController {
  constructor(private readonly modifiersService: ModifiersService) {}

  @Get()
  @ApiOperation({ summary: 'Modifiers API health' })
  getModifiers() {
    return { ok: true, module: 'modifiers' };
  }

  @Post('groups')
  @ApiOperation({ summary: 'Create modifier group (with optional inline options)' })
  async createGroup(@Body() dto: CreateModifierGroupDto) {
    return this.modifiersService.createGroup(dto);
  }

  @Get('groups')
  @ApiOperation({ summary: 'List modifier groups for company' })
  @ApiQuery({ name: 'companyId', required: true })
  async findAllGroups(@Query('companyId') companyId: string) {
    return this.modifiersService.findAllGroups(companyId);
  }

  @Get('groups/:id')
  @ApiOperation({ summary: 'Get modifier group with options' })
  async findGroupById(@Param('id') id: string) {
    return this.modifiersService.findGroupById(id);
  }

  @Put('groups/:id')
  @ApiOperation({ summary: 'Update modifier group' })
  async updateGroup(@Param('id') id: string, @Body() dto: UpdateModifierGroupDto) {
    return this.modifiersService.updateGroup(id, dto);
  }

  @Delete('groups/:id')
  @ApiOperation({ summary: 'Delete modifier group' })
  async deleteGroup(@Param('id') id: string) {
    return this.modifiersService.deleteGroup(id);
  }

  @Post('groups/:groupId/options')
  @ApiOperation({ summary: 'Add option to modifier group' })
  async addOption(
    @Param('groupId') groupId: string,
    @Body() dto: CreateModifierOptionDto,
  ) {
    return this.modifiersService.addOption(groupId, dto);
  }

  @Put('options/:id')
  @ApiOperation({ summary: 'Update modifier option' })
  async updateOption(
    @Param('id') id: string,
    @Body() dto: Partial<CreateModifierOptionDto>,
  ) {
    return this.modifiersService.updateOption(id, dto);
  }

  @Delete('options/:id')
  @ApiOperation({ summary: 'Delete modifier option' })
  async deleteOption(@Param('id') id: string) {
    return this.modifiersService.deleteOption(id);
  }

  @Post('menu/:menuItemId/modifier-groups')
  @ApiOperation({ summary: 'Link modifier group to menu item' })
  async linkModifierGroup(
    @Param('menuItemId') menuItemId: string,
    @Body() dto: LinkModifierGroupDto,
  ) {
    return this.modifiersService.linkModifierGroupToMenuItem(menuItemId, dto);
  }

  @Delete('menu/:menuItemId/modifier-groups/:groupId')
  @ApiOperation({ summary: 'Unlink modifier group from menu item' })
  async unlinkModifierGroup(
    @Param('menuItemId') menuItemId: string,
    @Param('groupId') groupId: string,
  ) {
    return this.modifiersService.unlinkModifierGroupFromMenuItem(menuItemId, groupId);
  }

  @Get('menu/:menuItemId/configuration')
  @ApiOperation({ summary: 'Get full configuration for customer drawer (modifier groups + bundle slots)' })
  async getConfiguration(@Param('menuItemId') menuItemId: string) {
    return this.modifiersService.getConfiguration(menuItemId);
  }

  @Post('menu/:menuItemId/bundle-slots')
  @ApiOperation({ summary: 'Create bundle slot with allowed items' })
  async createBundleSlot(
    @Param('menuItemId') menuItemId: string,
    @Body() dto: CreateBundleSlotDto,
  ) {
    return this.modifiersService.createBundleSlot(menuItemId, dto);
  }

  @Put('bundles/slots/:slotId')
  @ApiOperation({ summary: 'Update bundle slot' })
  async updateBundleSlot(
    @Param('slotId') slotId: string,
    @Body() dto: Partial<CreateBundleSlotDto>,
  ) {
    return this.modifiersService.updateBundleSlot(slotId, dto);
  }

  @Delete('bundles/slots/:slotId')
  @ApiOperation({ summary: 'Delete bundle slot' })
  async deleteBundleSlot(@Param('slotId') slotId: string) {
    return this.modifiersService.deleteBundleSlot(slotId);
  }
}
